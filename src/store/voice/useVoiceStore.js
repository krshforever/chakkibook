/**
 * Voice orchestrator.
 *
 * Owns the lifetime of everything that makes hands-free operation work, and
 * exposes it as a plain Zustand store so any component can subscribe to
 * `status` without knowing that a WebSocket, an AudioWorklet and a tool
 * executor are involved.
 *
 * Engine choice is a runtime decision, not a build-time one:
 *
 *   - A Gemini key or an ephemeral token present  → duplex neural audio.
 *   - Neither                                    → on-device Web Speech engine.
 *
 * The key is read from `localStorage`, deliberately *not* from
 * `import.meta.env`. The production esbuild config stubs `import.meta.env` to
 * `{}`, so a key in a `.env` would not reach a shipped APK anyway — but more
 * importantly, bundling a Gemini key into an APK means it is extractable by
 * anyone who installs it. The supported production path is the ephemeral-token
 * endpoint in `server.js`, which issues short-lived, config-locked tokens.
 */

import { create } from 'zustand';
import { useStore as useLedgerStore } from '../useStore';
import { GeminiLiveClient, buildSystemInstruction, LiveClientError } from '../../services/live/geminiLive';
import { LocalVoiceEngine } from '../../services/live/localFallback';
import { MicCapture } from '../../services/live/audioInput';
import { PcmPlayer } from '../../services/live/audioOutput';
import { createToolExecutor } from '../../services/live/tools';
import { parseCommand } from '../../services/live/interpreter';

const KEY_STORAGE = 'chakkibook_gemini_key';
const TOKEN_STORAGE = 'chakkibook_gemini_token';
const HANDLE_STORAGE = 'chakkibook_live_resume_handle';

// Module singletons — never React state. These are imperative resources with
// their own lifetimes, and putting them in a store invites stale-closure bugs.
let engine = null;
let mic = null;
let player = null;
let executor = null;
let unsubs = [];
let navigateRef = null;

const STATUS_MAP = {
  gemini: { idle: 'idle', connecting: 'connecting', ready: 'ready', listening: 'listening', thinking: 'thinking', speaking: 'speaking', reconnecting: 'connecting', error: 'error' },
  local: { idle: 'idle', ready: 'ready', listening: 'listening', thinking: 'thinking', speaking: 'speaking', error: 'error' }
};

function readKey() {
  try {
    return (typeof localStorage !== 'undefined' && localStorage.getItem(KEY_STORAGE)) || null;
  } catch (_) { return null; }
}
function readToken() {
  try {
    return (typeof localStorage !== 'undefined' && localStorage.getItem(TOKEN_STORAGE)) || null;
  } catch (_) { return null; }
}
function readHandle() {
  try {
    return (typeof localStorage !== 'undefined' && localStorage.getItem(HANDLE_STORAGE)) || null;
  } catch (_) { return null; }
}

export function setVoiceCredentials({ key, token }) {
  try {
    if (key != null) localStorage.setItem(KEY_STORAGE, key);
    if (token != null) localStorage.setItem(TOKEN_STORAGE, token);
  } catch (_) { /* private mode */ }
}

export function clearVoiceCredentials() {
  try {
    localStorage.removeItem(KEY_STORAGE);
    localStorage.removeItem(TOKEN_STORAGE);
    localStorage.removeItem(HANDLE_STORAGE);
  } catch (_) { /* ignore */ }
}

export const useVoiceStore = create((set, get) => ({
  status: 'idle',
  engineKind: null,
  /** True when the browser can do speech at all — drives the "type instead" hint. */
  speechSupported: true,
  transcript: [],
  pendingConfirmation: null,
  lastAction: null,
  error: null,
  handsFree: true,
  /** Set while a money write is waiting for the operator to say haan/nahi. */
  awaitingConfirm: false,

  init(onNavigate) {
    navigateRef = onNavigate || null;
    if (typeof window !== 'undefined' && !window.speechSynthesis && !window.webkitSpeechRecognition) {
      set({ speechSupported: false });
    }
  },

  /** Live RMS, 0..1. Read via rAF by the orb — never stored as React state. */
  getLevel() {
    return mic ? mic.level : 0;
  },

  async start() {
    if (engine) return;
    get()._clearError();

    // The typed and quick-action paths must work without a voice session, so
    // the executor is created on first need, not only here.
    get()._ensureExecutor();

    const ledger = useLedgerStore.getState();
    const key = readKey();
    const token = readToken();
    const kind = key || token ? 'gemini' : 'local';

    set({ engineKind: kind, status: kind === 'gemini' ? 'connecting' : 'ready' });

    if (kind === 'gemini') {
      await get()._startGemini(key, token);
    } else {
      await get()._startLocal();
    }
  },

  /**
   * Create the tool executor on first use. Idempotent.
   *
   * This exists because the typed and quick-action paths in the UI call
   * `submitText()` before any voice session has been started — and they do it
   * on purpose, because "voice never being the only way in" only holds if the
   * non-voice paths actually work. Creating the executor lazily here means a
   * tap on "Aaj ki Kamai" does real work without touching the mic.
   */
  _ensureExecutor() {
    if (!executor) {
      executor = createToolExecutor({
        useStore: useLedgerStore,
        onNavigate: (screen) => {
          if (navigateRef) navigateRef(screen);
        }
      });
    }
    return executor;
  },

  async _startGemini(key, token) {
    const ledger = useLedgerStore.getState();
    const instruction = buildSystemInstruction({
      shopName: ledger.shop && ledger.shop.name,
      mode: ledger.activeMode,
      language: ledger.language
    });

    const client = new GeminiLiveClient({
      model: 'gemini-3.8-live',
      apiKey: key,
      authToken: token,
      systemInstruction: instruction,
      tools: executor.declarations,
      voice: 'Kore'
    });
    engine = client;
    mic = new MicCapture();
    player = new PcmPlayer({ sampleRate: 24000 });

    unsubs.forEach((u) => u());
    unsubs = [];

    unsubs.push(client.on('state', (s) => set({ status: STATUS_MAP.gemini[s] || s })));

    unsubs.push(client.on('ready', () => {
      // Seed the shop's state so the model "remembers" it. There is no
      // cross-session memory in the Live API — this is how it is done: replay
      // a summary as seed history that produces no model turn.
      const ctx = get()._contextSummary();
      client.seedContext(
        'Context about this shop. Acknowledge with one short sentence, then wait for the operator.\n' + ctx
      );
    }));

    unsubs.push(client.on('audio', ({ data }) => {
      const bytes = base64ToInt16(data);
      if (player) player.enqueue(bytes);
    }));

    unsubs.push(client.on('interrupted', () => {
      if (player) player.clear();
      set({ status: 'listening' });
    }));

    unsubs.push(client.on('userTranscript', ({ text, final }) => {
      get()._appendTranscript('user', text, final);
      if (final) set({ status: 'thinking' });
    }));

    unsubs.push(client.on('agentTranscript', ({ text, final }) => {
      get()._appendTranscript('agent', text, final);
    }));

    unsubs.push(client.on('agentText', ({ text }) => {
      get()._appendTranscript('agent', text, true);
    }));

    unsubs.push(client.on('turnComplete', () => set({ status: 'ready' })));

    unsubs.push(client.on('toolCall', (call) => get()._runTools(call, client)));

    unsubs.push(client.on('resumption', ({ handle }) => {
      try { if (handle) localStorage.setItem(HANDLE_STORAGE, handle); } catch (_) { /* ignore */ }
    }));

    unsubs.push(client.on('error', (err) => {
      get()._fail(err);
      get().teardown();
    }));

    try {
      await mic.start((pcm) => {
        if (client && engine === client) client.sendAudioChunk(pcm);
      });
    } catch (err) {
      if (err && err.message === 'MIC_UNSUPPORTED') {
        get()._fail(new Error('MIC_UNSUPPORTED'));
      } else {
        get()._fail(new Error('MIC_DENIED'));
      }
      get().teardown();
      return;
    }

    try {
      await player.start();
    } catch (_) { /* playback optional; transcripts still work */ }

    await client.connect();
  },

  async _startLocal() {
    const local = new LocalVoiceEngine({
      language: useLedgerStore.getState().language,
      context: () => get()._contextSummary()
    });
    engine = local;

    unsubs.forEach((u) => u());
    unsubs = [];

    unsubs.push(local.on('state', (s) => set({ status: STATUS_MAP.local[s] || s })));
    unsubs.push(local.on('userTranscript', ({ text, final }) => get()._appendTranscript('user', text, final)));
    unsubs.push(local.on('agentText', ({ text }) => get()._appendTranscript('agent', text, true)));
    unsubs.push(local.on('agentTranscript', ({ text }) => get()._appendTranscript('agent', text, true)));
    unsubs.push(local.on('toolCall', (call) => get()._runTools(call, local)));
    unsubs.push(local.on('turnComplete', () => set({ status: 'ready' })));
    unsubs.push(local.on('error', (err) => {
      get()._fail(err);
      get().teardown();
    }));

    await local.start();
  },

  // -- tool plumbing -------------------------------------------------------

  async _runTools(call, client) {
    const calls = (call && call.functionCalls) || [];
    for (const fnCall of calls) {
      const { id, name, args } = fnCall;
      const result = await executor.execute(name, args || {});
      get()._recordAction(name, args, result);

      if (result.code === 'AWAITING_CONFIRMATION') {
        set({ pendingConfirmation: result.confirmation, awaitingConfirm: true });
      }

      // The Live API requires an id-matched response; without it the session
      // stalls and the agent goes silent mid-conversation.
      client.sendToolResponse(id, name, result, result.code === 'AWAITING_CONFIRMATION' ? 'INTERRUPT' : 'WHEN_IDLE');
    }
  },

  _recordAction(name, args, result) {
    set({ lastAction: { name, args, result, ts: Date.now() } });
  },

  _contextSummary() {
    const s = useLedgerStore.getState();
    const customers = (s.customers || []).slice(0, 40);
    const dues = customers.filter((c) => Number(c.balance) > 0)
      .map((c) => `${c.name} (${c.village || 'unknown'}): Rs ${Number(c.balance)}`)
      .join('; ');
    const pending = (s.boris || []).filter((b) => b.status === 'pending').length;
    const mode = s.activeMode;
    const shop = s.shop || {};
    return [
      `Shop: ${shop.name || 'mill'}, owner ${shop.ownerName || ''}.`,
      `Mode: ${mode}. Pending boris: ${pending}.`,
      dues ? `Outstanding dues — ${dues}` : 'No outstanding dues.',
      `Grain rates per kg: ${JSON.stringify((shop.chakkiRates && shop.chakkiRates.grainRates) || {})}`,
      `Spellar pressing rate per kg: ${(shop.spellarRates && shop.spellarRates.pirai) || 12}`
    ].join('\n');
  },

  _appendTranscript(role, text, final) {
    if (!text) return;
    set((state) => {
      const list = [...state.transcript];
      const last = list[list.length - 1];
      if (last && last.role === role && !last.final) {
        list[list.length - 1] = { ...last, text: last.text + text, final: Boolean(final), ts: Date.now() };
      } else {
        list.push({ id: `${role}_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`, role, text, final: Boolean(final), ts: Date.now() });
      }
      return { transcript: list.slice(-40) };
    });
  },

  _fail(err) {
    const code = err && err.code ? err.code : (err && err.message) || 'UNKNOWN';
    const friendly = {
      MIC_DENIED: 'Mic ki permission chahiye. Settings mein mic allow karein.',
      MIC_UNSUPPORTED: 'Is device pe mic support nahi hai.',
      AUTH: 'Gemini key galat ya expire ho gayi.',
      NO_CREDENTIALS: 'Gemini key set nahi hai.',
      SPEECH_UNSUPPORTED: 'Is browser mein voice support nahi hai. Type karke bhejein.'
    }[code] || 'Voice band ho gaya. Dobara koshish karein.';
    set({ status: 'error', error: friendly });
  },

  _clearError() { set({ error: null }); },

  clearTranscript() { set({ transcript: [] }); },

  /** Operator tapped the orb: interrupt whatever is happening and listen. */
  interrupt() {
    if (player) player.clear();
    if (engine && engine.interrupt) engine.interrupt();
    set({ status: 'ready' });
  },

  setHandsFree(on) { set({ handsFree: Boolean(on) }); },

  /** Typed fallback — for a dead mic, or an operator who prefers typing. */
  async submitText(text) {
    const raw = String(text || '').trim();
    if (!raw) return;
    const exec = get()._ensureExecutor();
    get()._clearError();
    get()._appendTranscript('user', raw, true);
    set({ status: 'thinking' });

    if (engine instanceof GeminiLiveClient) {
      // Let the model do the language work; it already holds the tool schemas.
      engine.sendText(raw);
      set({ status: 'listening' });
      return;
    }

    // Local engine: same deterministic interpreter the voice path uses.
    const ledger = useLedgerStore.getState();
    const parsed = parseCommand(raw, {
      customers: ledger.customers || [],
      activeMode: ledger.activeMode
    });
    if (parsed.intent === 'unknown' || parsed.intent === 'none') {
      get()._appendTranscript('agent', 'Samajh nahi aaya. "Nayi entry", "jama", ya "bakaya" try karein.', true);
      set({ status: 'ready' });
      return;
    }
    const toolName = intentToToolName(parsed.intent);
    const result = await exec.execute(toolName, parsed.args);
    get()._recordAction(toolName, parsed.args, result);
    if (result.code === 'AWAITING_CONFIRMATION') {
      set({ pendingConfirmation: result.confirmation, awaitingConfirm: true });
    }
    get()._appendTranscript('agent', result.spoken || 'Ho gaya.', true);
    set({ status: 'ready' });
  },

  /** Confirm the money action waiting for approval. */
  async confirmPending() {
    const exec = get()._ensureExecutor();
    const result = await exec.execute('confirm_pending', {});
    get()._recordAction('confirm_pending', {}, result);
    set({ pendingConfirmation: null, awaitingConfirm: false });
    if (engine && engine.sendToolResponse) {
      engine.sendToolResponse(`confirm_${Date.now()}`, 'confirm_pending', result);
    } else {
      get()._appendTranscript('agent', result.spoken || 'Ho gaya.', true);
    }
    set({ status: 'ready' });
  },

  async cancelPending() {
    const exec = get()._ensureExecutor();
    const result = await exec.execute('cancel_pending', {});
    set({ pendingConfirmation: null, awaitingConfirm: false });
    if (engine && engine.sendToolResponse) {
      engine.sendToolResponse(`cancel_${Date.now()}`, 'cancel_pending', result);
    } else {
      get()._appendTranscript('agent', result.spoken || 'Rehne diya.', true);
    }
    set({ status: 'ready' });
  },

  /** Release the mic and the socket. Idempotent. */
  async stop() {
    if (engine) { try { engine.close(); } catch (_) { /* ignore */ } engine = null; }
    if (mic) { mic.stop(); mic = null; }
    if (player) { await player.stop(); player = null; }
    unsubs.forEach((u) => { try { u(); } catch (_) { /* ignore */ } });
    unsubs = [];
    set({ status: 'idle', engineKind: null, pendingConfirmation: null, awaitingConfirm: false });
  },

  teardown() {
    executor = null;
    if (engine) { try { engine.close(); } catch (_) { /* ignore */ } engine = null; }
    if (mic) { mic.stop(); mic = null; }
    if (player) player = null;
    unsubs.forEach((u) => { try { u(); } catch (_) { /* ignore */ } });
    unsubs = [];
  }
}));

function base64ToInt16(b64) {
  if (!b64) return new Int16Array(0);
  let binary;
  if (typeof atob === 'function') binary = atob(b64);
  else binary = Buffer.from(b64, 'base64').toString('binary');
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return new Int16Array(bytes.buffer);
}

function intentToToolName(intent) {
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

export default useVoiceStore;
