/**
 * Gemini Live API client (BidiGenerateContent over WebSocket).
 *
 * Design notes that are not obvious from the docs:
 *
 * - **Hand-rolled WebSocket, not `@google/genai`.** The official SDK's `live`
 *   module is still marked `@experimental` in source, and its browser path
 *   really wants you to go through ephemeral tokens anyway. Against a Preview
 *   API, a ~300-line client we control is lower-risk than importing internals
 *   that can move. The wire format below matches
 *   ai.google.dev/api/live.
 *
 * - **Two auth paths.** With a raw API key we hit `...BidiGenerateContent?key=`.
 *   With an ephemeral token (the production path, so the key never ships in the
 *   APK) we hit `...BidiGenerateContentConstrained?access_token=`, which also
 *   lets Google enforce the locked model + config server-side.
 *
 * - **Tool calls are ours to answer.** The Live API does not auto-execute
 *   functions the way generateContent does. Every `toolCall` must be answered
 *   with a matching `toolResponse.id` or the SDK throws.
 *
 * - **History is retained as raw audio tokens** (~25 tokens/sec), and every
 *   turn re-bills the whole context window. That is why context window
 *   compression is on by default here, and why the caller is expected to close
 *   the socket when idle rather than leaving the mic open all shift.
 */

const HOST = 'generativelanguage.googleapis.com';

export class LiveClientError extends Error {
  constructor(code, message) {
    super(message);
    this.name = 'LiveClientError';
    this.code = code;
  }
}

class Emitter {
  constructor() { this._h = new Map(); }
  on(evt, fn) {
    if (!this._h.has(evt)) this._h.set(evt, new Set());
    this._h.get(evt).add(fn);
    return () => this._h.get(evt).delete(fn);
  }
  emit(evt, payload) {
    const set = this._h.get(evt);
    if (set) set.forEach((fn) => { try { fn(payload); } catch (e) { console.error(`[live:${evt}]`, e); } });
  }
}

/** Default system instruction: persona + the guardrails that keep it honest. */
export function buildSystemInstruction({ shopName, mode, language = 'hinglish' }) {
  const lang = language === 'hi'
    ? 'Pure Devanagari Hindi (शुद्ध हिंदी)'
    : language === 'en'
      ? 'Formal English'
      : 'Hinglish — conversational Roman-script Hindi mixed with English, the way a mill owner in a village actually speaks';

  return `You are ChakkiBot, the voice co-pilot inside Chakkibook. The user is ${shopName ? `the owner of "${shopName}"` : 'a mill owner'} running an Atta Chakki (flour mill) and Spellar (mustard oil expeller) in rural India. Current mill mode: ${mode === 'spellar' ? 'Spellar (oil pressing)' : 'Chakki (grinding)'}.

LANGUAGE
Reply in ${lang}. Match the user's language. If they speak a regional language you understand, reply in that same language.

HOW YOU TALK
- Speak like a trusted neighbour, not a software product. Short. One to three sentences.
- NEVER use emojis, markdown, bullet points, or formatting. This text is read aloud by a text-to-speech voice.
- No greetings after the first turn. No "Is there anything else I can help with?"
- Never read out an ID, a database field, or a JSON blob.

MONEY AND NAMES — THIS IS THE PART THAT MATTERS
- You may NEVER state a rupee amount, a customer balance, a weight, or a total that did not come back verbatim from a tool result. There is no exception. If a tool failed, say the tool failed.
- When a tool result contains a "spoken" field, read that field's wording back to the user as closely as you can. It is the source of truth.
- Before you finish a money-changing action (money in, money out), state the customer name and the rupee amount back to the user so they can correct you. Then stop and let them confirm.
- If a tool says the customer was not found, ask for the name again. Do not guess which customer was meant.
- Amounts in India: lakh = 100000, crore = 10000000, hazar/thousand = 1000, mann = 40 kg.

WHAT YOU DO
You run the entire shop by voice: grinding entries (pisai), pressing entries (pirai), payments received (jama), credit given (udhar), new customers, dues, daily totals, pending boris, expenses, stock questions. Use your tools. Do not describe what you would do — do it, then tell the user what happened in one sentence.

WHEN YOU CANNOT HEAR
The shop is noisy. If a request is unclear, say so in one short sentence and ask them to repeat just the missing piece — usually the amount or the name. Do not chain multiple questions.`;
}

export class GeminiLiveClient {
  constructor(options = {}) {
    this.opts = {
      model: 'gemini-3.8-live',
      apiKey: null,
      authToken: null,
      systemInstruction: '',
      tools: [],
      voice: 'Kore',
      temperature: 0.7,
      autoReconnect: true,
      ...options
    };
    this.emitter = new Emitter();
    this.ws = null;
    this.state = 'idle';
    this.resumptionHandle = null;
    this.reconnectAttempts = 0;
    this.closedByUser = false;
    this._setupDone = false;
  }

  on(evt, fn) { return this.emitter.on(evt, fn); }

  _setState(s) {
    if (this.state !== s) {
      this.state = s;
      this.emitter.emit('state', s);
    }
  }

  _url() {
    if (this.opts.authToken) {
      return `wss://${HOST}/ws/google.ai.generativelanguage.v1beta.GenerativeService.BidiGenerateContentConstrained?access_token=${encodeURIComponent(this.opts.authToken)}`;
    }
    if (this.opts.apiKey) {
      return `wss://${HOST}/ws/google.ai.generativelanguage.v1beta.GenerativeService.BidiGenerateContent?key=${encodeURIComponent(this.opts.apiKey)}`;
    }
    throw new LiveClientError('NO_CREDENTIALS', 'Gemini Live needs either an API key or an ephemeral token.');
  }

  _setupMessage() {
    const setup = {
      model: `models/${this.opts.model}`,
      generationConfig: {
        responseModalities: ['AUDIO'],
        temperature: this.opts.temperature,
        speechConfig: {
          voiceConfig: { prebuiltVoiceConfig: { voiceName: this.opts.voice } }
        }
      },
      systemInstruction: {
        parts: [{ text: this.opts.systemInstruction }],
        role: 'system'
      },
      realtimeInputConfig: {
        automaticActivityDetection: {
          disabled: false,
          // HIGH start / LOW end: catches a quiet "haan" over the mill noise
          // without cutting the operator off mid-sentence.
          startOfSpeechSensitivity: 'START_SENSITIVITY_HIGH',
          endOfSpeechSensitivity: 'END_SENSITIVITY_LOW',
          // Padding stops the first syllable of "Ramesh" from being clipped.
          prefixPaddingMs: 200,
          silenceDurationMs: 700
        },
        activityHandling: 'START_OF_ACTIVITY_INTERRUPTS'
      },
      // Both transcriptions on: inputTranscription lets the UI show the user
      // "what I heard" — essential when they may not be able to read it and
      // need to know whether to repeat themselves.
      inputAudioTranscription: {},
      outputAudioTranscription: {},
      sessionResumption: this.resumptionHandle ? { handle: this.resumptionHandle } : {},
      contextWindowCompression: {
        slidingWindow: {},
        triggerTokens: 45000
      }
    };

    if (this.opts.tools && this.opts.tools.length > 0) {
      setup.tools = [{ functionDeclarations: this.opts.tools }];
    }
    return { setup };
  }

  async connect() {
    this.closedByUser = false;
    this._setupDone = false;
    this._openSocket();
  }

  _openSocket() {
    this._setState('connecting');
    let ws;
    try {
      ws = new WebSocket(this._url());
    } catch (err) {
      this._setState('error');
      this.emitter.emit('error', err);
      return;
    }
    this.ws = ws;

    ws.onopen = () => {
      this.reconnectAttempts = 0;
      ws.send(JSON.stringify(this._setupMessage()));
    };

    ws.onmessage = (event) => this._handleMessage(event.data);

    ws.onerror = () => {
      // A bare onerror carries no detail on the browser API; the close code in
      // onclose is what actually tells us what happened.
      this.emitter.emit('log', { level: 'warn', msg: 'websocket error' });
    };

    ws.onclose = (event) => {
      this._setupDone = false;
      this.emitter.emit('close', { code: event.code, reason: event.reason });

      if (this.closedByUser) {
        this._setState('idle');
        return;
      }
      // 1008 = policy violation, which is how the API reports a bad key or an
      // expired/invalid token. Retrying that will not help.
      if (event.code === 1008) {
        this._setState('error');
        this.emitter.emit('error', new LiveClientError('AUTH', event.reason || 'Authentication rejected.'));
        return;
      }
      if (this.opts.autoReconnect && this.reconnectAttempts < 5) {
        this.reconnectAttempts += 1;
        const backoff = Math.min(8000, 500 * 2 ** this.reconnectAttempts);
        this.emitter.emit('log', { level: 'info', msg: `reconnecting in ${backoff}ms (attempt ${this.reconnectAttempts})` });
        this._setState('reconnecting');
        this._timer = setTimeout(() => this._openSocket(), backoff);
      } else {
        this._setState('error');
        this.emitter.emit('error', new LiveClientError('CLOSED', event.reason || 'Connection lost.'));
      }
    };
  }

  async _handleMessage(raw) {
    if (typeof raw === 'string') {
      let msg;
      try { msg = JSON.parse(raw); } catch { return; }

      if (msg.setupComplete) {
        this._setupDone = true;
        this._setState('ready');
        this.emitter.emit('ready', {});
        return;
      }

      if (msg.goAway) {
        // Server is about to drop us. Reconnect now while we still have the
        // handle rather than waiting for the socket to die.
        const timeLeft = msg.goAway.timeLeft || '10s';
        this.emitter.emit('log', { level: 'warn', msg: `server goAway, ${timeLeft} remaining` });
        if (!this._timer) {
          this._timer = setTimeout(() => {
            this._timer = null;
            this.closedByUser = true;
            if (this.ws) this.ws.close();
            this.closedByUser = false;
            this._openSocket();
          }, Math.max(500, this._parseTimeLeft(timeLeft) - 1500));
        }
        return;
      }

      if (msg.sessionResumptionUpdate) {
        this.resumptionHandle = msg.sessionResumptionUpdate.newHandle || null;
        this.emitter.emit('resumption', { handle: this.resumptionHandle, resumable: msg.sessionResumptionUpdate.resumable });
        return;
      }

      if (msg.toolCall) {
        this.emitter.emit('toolCall', msg.toolCall);
        return;
      }

      if (msg.usageMetadata) {
        this.emitter.emit('usage', msg.usageMetadata);
        return;
      }

      if (msg.serverContent) {
        const sc = msg.serverContent;

        if (sc.interrupted) {
          // Non-negotiable: drop the playback queue or the agent talks over
          // the operator. The orchestrator owns the actual player.
          this.emitter.emit('interrupted', {});
        }

        if (sc.inputTranscription) {
          const t = sc.inputTranscription.text || '';
          this.emitter.emit('userTranscript', { text: t, final: Boolean(sc.inputTranscription.finished) });
        }
        if (sc.outputTranscription) {
          this.emitter.emit('agentTranscript', { text: sc.outputTranscription.text || '', final: Boolean(sc.outputTranscription.finished) });
        }

        const parts = (sc.modelTurn && sc.modelTurn.parts) || [];
        for (const part of parts) {
          if (part.inlineData && part.inlineData.data) {
            this._setState('speaking');
            this.emitter.emit('audio', { data: part.inlineData.data, mimeType: part.inlineData.mimeType });
          } else if (part.text) {
            this.emitter.emit('agentText', { text: part.text });
          }
        }

        if (sc.turnComplete) {
          this._setState('ready');
          this.emitter.emit('turnComplete', {});
        }
        return;
      }
      return;
    }

    // Binary frame — some deployments send raw audio without a JSON envelope.
    this._setState('speaking');
    this.emitter.emit('audio', { data: raw, mimeType: 'audio/pcm;rate=24000' });
  }

  _parseTimeLeft(s) {
    const m = /^([\d.]+)s/.exec(String(s));
    return m ? Number(m[1]) * 1000 : 10000;
  }

  // -- outbound ------------------------------------------------------------

  /** Send one 32 ms PCM16 chunk (Int16Array) from MicCapture. */
  sendAudioChunk(pcm16) {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN || !this._setupDone) return;
    this.ws.send(JSON.stringify({
      realtimeInput: {
        audio: {
          data: pcm16ToBase64(pcm16),
          mimeType: 'audio/pcm;rate=16000'
        }
      }
    }));
  }

  /** Flush server-side buffered audio when the operator stops talking. */
  endAudioStream() {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) return;
    this.ws.send(JSON.stringify({ realtimeInput: { audioStreamEnd: true } }));
  }

  /** Hard stop of the current response. Also the manual barge-in switch. */
  interrupt() {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) return;
    this.ws.send(JSON.stringify({ clientContent: { turnComplete: true } }));
  }

  /**
   * Send a typed turn. Used by the keyboard fallback when the operator would
   * rather type, or when the mic is unavailable. On `gemini-3.8-live`,
   * `turnComplete: true` also acts as the interrupt, so this cancels an
   * in-flight response first — which is the desired behaviour for a new
   * request.
   */
  sendText(text) {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN || !this._setupDone) return;
    this.ws.send(JSON.stringify({
      clientContent: {
        turns: [{ role: 'user', parts: [{ text: String(text) }] }],
        turnComplete: true
      }
    }));
  }

  /**
   * Answer a tool call. `scheduling` maps to the FunctionResponse hint:
   * `WHEN_IDLE` waits for a natural pause before the model speaks the result.
   */
  sendToolResponse(id, name, response, scheduling = 'WHEN_IDLE') {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) return;
    this.ws.send(JSON.stringify({
      toolResponse: {
        functionResponses: [{ id, name, response, scheduling }]
      }
    }));
  }

  /** Inject context without triggering a model turn (session memory). */
  seedContext(text) {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN || !this._setupDone) return;
    this.ws.send(JSON.stringify({
      clientContent: {
        turns: [{ role: 'user', parts: [{ text }] }],
        turnComplete: true
      }
    }));
  }

  close() {
    this.closedByUser = true;
    if (this._timer) { clearTimeout(this._timer); this._timer = null; }
    if (this.ws) {
      try { this.ws.close(); } catch (_) { /* already closing */ }
      this.ws = null;
    }
    this._setState('idle');
  }
}

// Imported lazily to keep this module free of a hard AudioWorklet dependency
// in non-browser environments (the smoke test imports this file in Node).
import { pcm16ToBase64 } from './audioInput';
