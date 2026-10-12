/**
 * On-device voice engine — the zero-cost, zero-network path.
 *
 * Uses the browser's own Web Speech API (recognition) and speechSynthesis
 * (speech), plus the deterministic interpreter above. It deliberately exposes
 * the *same* event contract as `GeminiLiveClient`, so the orchestrator and the
 * UI do not know or care which engine is live. Swap engines, everything else
 * stays.
 *
 * Why this is worth building rather than stubbing:
 *  - The app is hands-free today, with no key, no billing, no latency spikes.
 *  - It is the offline fallback when the shop's 4G drops mid-shift.
 *  - It is the honest floor: a small phone in a noisy room must still work
 *    before anyone talks about duplex neural audio.
 *
 * Known limits, stated plainly: recognition quality on Web Speech is far below
 * Gemini's native audio, it is Chrome/Android-only, no barge-in during
 * speechSynthesis playback, and Hinglish accuracy is uneven. Gemini Live is
 * the target; this is the floor under it.
 */

const SpeechRecognition = typeof window !== 'undefined'
  ? (window.SpeechRecognition || window.webkitSpeechRecognition)
  : null;

const isSpeechAvailable = () => Boolean(SpeechRecognition) && typeof window !== 'undefined'
  && Boolean(window.speechSynthesis);

export class LocalVoiceEngine {
  constructor({ language = 'hinglish', context } = {}) {
    this.language = language;
    this.getContext = context || (() => ({}));
    this.handlers = new Map();
    this.recognition = null;
    this.state = 'idle';
    this.running = false;
    this._speaking = false;
    this._counter = 0;
    this._pending = null;
    this._restartTimer = null;
  }

  on(evt, fn) {
    if (!this.handlers.has(evt)) this.handlers.set(evt, new Set());
    this.handlers.get(evt).add(fn);
    return () => this.handlers.get(evt).delete(fn);
  }

  emit(evt, payload) {
    const set = this.handlers.get(evt);
    if (set) set.forEach((fn) => { try { fn(payload); } catch (e) { console.error(`[local:${evt}]`, e); } });
  }

  _setState(s) {
    if (this.state !== s) {
      this.state = s;
      this.emit('state', s);
    }
  }

  static isSupported() {
    return isSpeechAvailable();
  }

  /** BC-47 hint for the recognition engine. */
  _lang() {
    if (this.language === 'hi') return 'hi-IN';
    if (this.language === 'en') return 'en-IN';
    // Hinglish: Indian English with Hindi in the grammar. Both are needed;
    // 'hi-IN' alone catastrophically fails on Roman-script input.
    return 'en-IN';
  }

  async start() {
    if (this.running) return;
    if (!isSpeechAvailable()) {
      this._setState('error');
      this.emit('error', new Error('SPEECH_UNSUPPORTED'));
      return;
    }
    this.running = true;
    this._buildRecognition();
    this._setState('ready');
    this._listen();
  }

  _buildRecognition() {
    const rec = new SpeechRecognition();
    rec.lang = this._lang();
    rec.continuous = true;
    rec.interimResults = true;
    // Never stop on a pause — a mill owner thinking mid-sentence should not
    // have the mic drop out on them.
    rec.maxAlternatives = 1;

    rec.onresult = (event) => {
      let interim = '';
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const res = event.results[i];
        const text = res[0].transcript;
        if (res.isFinal) {
          this._handleUtterance(text);
        } else {
          interim += text;
        }
      }
      if (interim) {
        this._setState('listening');
        this.emit('userTranscript', { text: interim, final: false });
      }
    };

    rec.onerror = (event) => {
      if (event.error === 'no-speech' || event.error === 'aborted') return;
      if (event.error === 'not-allowed' || event.error === 'service-not-allowed') {
        this._setState('error');
        this.emit('error', new Error('MIC_PERMISSION_DENIED'));
        this.stop();
        return;
      }
      if (event.error === 'network') {
        // Web Speech is a network service in Chrome. Fail loudly but keep the
        // local intent path usable for typed input in the UI.
        this.emit('log', { level: 'warn', msg: 'speech recognition network error' });
        return;
      }
      this.emit('log', { level: 'warn', msg: `speech error: ${event.error}` });
    };

    rec.onend = () => {
      // Chrome ends the stream on its own; restart unless we asked it to stop.
      if (this.running && !this._speaking) {
        clearTimeout(this._restartTimer);
        this._restartTimer = setTimeout(() => {
          if (this.running && !this._speaking) this._listen();
        }, 300);
      }
    };

    this.recognition = rec;
  }

  _listen() {
    if (!this.recognition || !this.running) return;
    try {
      this.recognition.start();
      this._setState('listening');
    } catch (_) {
      // Already started — harmless race with the auto-restart.
    }
  }

  _stopListening() {
    if (!this.recognition) return;
    try { this.recognition.stop(); } catch (_) { /* ignore */ }
  }

  _handleUtterance(text) {
    const clean = String(text || '').trim();
    if (!clean) return;
    this._setState('thinking');
    this.emit('userTranscript', { text: clean, final: true });

    const ctx = this.getContext() || {};
    const parsed = parseCommand(clean, ctx);

    if (parsed.intent === 'help') {
      this._reply('Bolo: pisai ka entry, jama rupaye, bakaya kitna hai, aaj ki kamai, ya naya grahak. Main sab kar dunga.');
      return;
    }
    if (parsed.intent === 'unknown' || parsed.intent === 'none') {
      this._reply('Samajh nahi aaya. Thoda dheere boliye — kiska naam, kitne kilo, kitne rupaye?');
      return;
    }
    if (parsed.confidence === 'low') {
      const prompts = (parsed.missing || []).map((k) => MISSING_PROMPTS[k]).filter(Boolean);
      this._reply(prompts.join(' '));
      return;
    }

    // Hand the call to the orchestrator exactly like the Gemini path.
    const id = `local_${++this._counter}`;
    this._pending = { id, name: intentToTool(parsed.intent), args: parsed.args };
    this.emit('toolCall', { functionCalls: [this._pending] });
  }

  /** Called by the orchestrator after it runs the tool. */
  sendToolResponse(id, name, response) {
    const spoken = response && response.spoken ? response.spoken
      : response && response.ok === false
        ? (response.spoken || 'Kuch galat ho gaya, phir se koshish karein.')
        : 'Ho gaya.';
    this._reply(spoken);
  }

  _reply(text) {
    this._speaking = true;
    this._stopListening();
    this._setState('speaking');
    this.emit('agentText', { text });
    this.emit('agentTranscript', { text, final: true });

    if (!('speechSynthesis' in window)) {
      this._finishTurn();
      return;
    }
    try {
      window.speechSynthesis.cancel();
      const utter = new SpeechSynthesisUtterance(text);
      utter.lang = this._lang();
      utter.rate = 0.95;
      utter.pitch = 1;
      // Prefer a real Hindi voice if the device has one; Hinglish read by an
      // Indian English voice sounds far more natural than a default robotic
      // en-US one.
      const voices = window.speechSynthesis.getVoices();
      const preferred = voices.find((v) => /hi[-_]IN/i.test(v.lang))
        || voices.find((v) => /en[-_]IN/i.test(v.lang))
        || null;
      if (preferred) utter.voice = preferred;

      utter.onend = () => this._finishTurn();
      utter.onerror = () => this._finishTurn();
      window.speechSynthesis.speak(utter);

      // Safety net: some Android WebViews never fire onend, which would leave
      // the engine stuck in 'speaking' with the mic dead.
      const ms = Math.min(20000, 1500 + text.length * 70);
      setTimeout(() => { if (this._speaking) this._finishTurn(); }, ms);
    } catch (_) {
      this._finishTurn();
    }
  }

  _finishTurn() {
    this._speaking = false;
    this._pending = null;
    if (!this.running) {
      this._setState('idle');
      return;
    }
    this._setState('ready');
    this.emit('turnComplete', {});
    this._listen();
  }

  /** Barge-in: cut the TTS off mid-word. */
  interrupt() {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    this._finishTurn();
  }

  sendAudioChunk() { /* mic is owned by Web Speech internally */ }
  endAudioStream() { /* no-op */ }

  stop() {
    this.running = false;
    clearTimeout(this._restartTimer);
    if (this.recognition) {
      this.recognition.onend = null;
      this.recognition.onerror = null;
      this.recognition.onresult = null;
      try { this.recognition.stop(); } catch (_) { /* ignore */ }
      try { this.recognition.abort(); } catch (_) { /* ignore */ }
      this.recognition = null;
    }
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    this._setState('idle');
  }

  close() { this.stop(); }
}

// ---------------------------------------------------------------------------

function intentToTool(intent) {
  switch (intent) {
    case 'pisai': return 'record_pisai';
    case 'pirai': return 'record_pirai';
    case 'payment': return 'record_payment';
    case 'advance': return 'record_advance_loan';
    case 'new_customer': return 'add_customer';
    case 'summary': return 'get_today_summary';
    case 'dues': return 'get_dues';
    case 'queue': return 'get_pending_queue';
    case 'done': return 'mark_bori_done';
    case 'ledger': return 'get_customer_ledger';
    case 'expense': return 'add_expense';
    case 'set_mode': return 'set_mill_mode';
    case 'navigate': return 'open_screen';
    case 'confirm': return 'confirm_pending';
    case 'cancel': return 'cancel_pending';
    default: return 'get_today_summary';
  }
}

import { parseCommand, MISSING_PROMPTS } from './interpreter';
