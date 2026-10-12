import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Mic, Send, Check, X, Undo2, Wifi, WifiOff, Keyboard, ChevronRight, Sparkles } from 'lucide-react';
import VoiceOrb from './VoiceOrb';
import { useVoiceStore, setVoiceCredentials, clearVoiceCredentials } from '../../store/voice/useVoiceStore';
import { useStore as useLedgerStore } from '../../store/useStore';
import { formatINR } from '../../services/live/tools';

/**
 * Voice-first command deck.
 *
 * This screen is the app's front door. Ordering of everything below is
 * deliberate:
 *
 *   1. The orb. One enormous target, always in the same place.
 *   2. What it heard, then what it did. Read-back is the only way someone who
 *      cannot read a ledger can catch a mistake — so the heard text is shown
 *      as prose, not as a chat bubble history.
 *   3. Confirm / reject, when money is on the line.
 *   4. Tap-based equivalents of the common commands, so voice is never the
 *      only way in. Speech recognition will fail; the shop must not.
 *   5. A typed box, last.
 */

const QUICK_ACTIONS = [
  { label: 'Nayi Pisai', say: 'Nayi pisai entry karo', tone: 'brand' },
  { label: 'Bakaya Kitna', say: 'Bakaya kitna hai', tone: 'quiet' },
  { label: 'Aaj ki Kamai', say: 'Aaj ki kamai batao', tone: 'quiet' },
  { label: 'Pending Bori', say: 'Kya pending hai', tone: 'quiet' }
];

export default function VoiceScreen({ onNavigate }) {
  const status = useVoiceStore((s) => s.status);
  const transcript = useVoiceStore((s) => s.transcript);
  const pending = useVoiceStore((s) => s.pendingConfirmation);
  const engineKind = useVoiceStore((s) => s.engineKind);
  const error = useVoiceStore((s) => s.error);
  const handsFree = useVoiceStore((s) => s.handsFree);
  const lastAction = useVoiceStore((s) => s.lastAction);
  const submitText = useVoiceStore((s) => s.submitText);
  const confirmPending = useVoiceStore((s) => s.confirmPending);
  const cancelPending = useVoiceStore((s) => s.cancelPending);
  const clearTranscript = useVoiceStore((s) => s.clearTranscript);
  const init = useVoiceStore((s) => s.init);
  const stop = useVoiceStore((s) => s.stop);

  const [typed, setTyped] = useState('');
  const [showTyped, setShowTyped] = useState(false);
  const [keyOpen, setKeyOpen] = useState(false);
  const [keyDraft, setKeyDraft] = useState('');
  const inputRef = useRef(null);

  useEffect(() => { init(onNavigate); }, [init, onNavigate]);

  // Leaving the screen must release the mic. Leaving a mic open on a mobile
  // APK drains the battery and shows a privacy-critical indicator forever.
  useEffect(() => () => { stop(); }, [stop]);

  // Latest exchange only. A scrolling chat log is noise on a 5-inch screen.
  const lastUser = useMemo(() => [...transcript].reverse().find((t) => t.role === 'user' && t.final), [transcript]);
  const lastAgent = useMemo(() => [...transcript].reverse().find((t) => t.role === 'agent' && t.final), [transcript]);

  const handleQuick = (say) => submitText(say);

  const saveKey = () => {
    setVoiceCredentials({ key: keyDraft.trim() || null });
    setKeyOpen(false);
    setKeyDraft('');
  };

  return (
    <div className="cb-voice-deck">
      {/* Engine indicator — honest about which brain is running */}
      <div className="cb-voice-topbar">
        <span className={`cb-engine-chip ${engineKind === 'gemini' ? 'is-gemini' : 'is-local'}`}>
          {engineKind === 'gemini' ? <Sparkles size={12} /> : <WifiOff size={12} />}
          {engineKind === 'gemini' ? 'Gemini Live' : engineKind === 'local' ? 'On-device' : 'Ready'}
        </span>
        <div style={{ display: 'flex', gap: '0.375rem' }}>
          <button type="button" className="cb-voice-ghost" onClick={() => setShowTyped((v) => !v)} aria-label="Type instead">
            <Keyboard size={16} />
          </button>
          <button type="button" className="cb-voice-ghost" onClick={() => setKeyOpen((v) => !v)} aria-label="Voice settings">
            <Wifi size={16} />
          </button>
        </div>
      </div>

      {keyOpen && (
        <div className="cb-voice-keypanel">
          <p style={{ fontSize: '12px', color: 'hsl(var(--ink-2))', lineHeight: 1.5, marginBottom: '0.625rem' }}>
            <strong>Gemini Live model:</strong> <code style={{ fontSize: '11px' }}>gemini-3.8-live</code>
            <br />
            Full duplex voice, barge-in, tool calls, 2-hour session resumption.
            Leave blank to stay on the on-device engine (free, offline, no account).
          </p>
          <input
            className="form-input"
            type="password"
            placeholder="Gemini API key"
            value={keyDraft}
            onChange={(e) => setKeyDraft(e.target.value)}
            style={{ marginBottom: '0.5rem' }}
          />
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button type="button" className="big-btn" style={{ minHeight: '44px', fontSize: '14px' }} onClick={saveKey}>Save</button>
            <button
              type="button"
              className="btn-quiet"
              style={{ minHeight: '44px', fontSize: '14px' }}
              onClick={() => { clearVoiceCredentials(); setKeyDraft(''); }}
            >
              Clear
            </button>
          </div>
        </div>
      )}

      {/* 1. THE ORB */}
      <div className="cb-voice-stage">
        <VoiceOrb />
        <p className="cb-voice-status" aria-live="polite">
          {error ? error : statusLabel(status)}
        </p>
      </div>

      {/* 2. READ-BACK */}
      {(lastUser || lastAgent) && (
        <div className="cb-readback">
          {lastUser && (
            <div className="cb-readback-row">
              <span className="cb-readback-who">Aapne kaha</span>
              <p className="cb-readback-text">{lastUser.text}</p>
            </div>
          )}
          {lastAgent && (
            <div className="cb-readback-row is-agent">
              <span className="cb-readback-who">ChakkiBot ne kaha</span>
              <p className="cb-readback-text">{lastAgent.text}</p>
            </div>
          )}
          <button type="button" className="cb-voice-ghost is-wide" onClick={clearTranscript}>
            <Undo2 size={14} /> Saaf karein
          </button>
        </div>
      )}

      {/* 3. MONEY CONFIRMATION */}
      {pending && (
        <div className="cb-confirm" role="alertdialog" aria-label="Confirm the amount">
          <p className="cb-confirm-amount">{pending.customer}</p>
          <p className="cb-confirm-figure">{formatINR(pending.amount)}</p>
          <p className="cb-confirm-q">Sahi hai? "Haan" boliye ya button dabayein.</p>
          <div className="cb-confirm-actions">
            <button
              type="button"
              className="cb-confirm-btn is-yes"
              onClick={confirmPending}
            >
              <Check size={26} strokeWidth={3} />
              <span>Haan</span>
            </button>
            <button
              type="button"
              className="cb-confirm-btn is-no"
              onClick={cancelPending}
            >
              <X size={26} strokeWidth={3} />
              <span>Nahi</span>
            </button>
          </div>
        </div>
      )}

      {/* 4. TAP EQUIVALENTS — voice must never be the only way in */}
      <div className="cb-quick-row" role="group" aria-label="Quick commands">
        {QUICK_ACTIONS.map((a) => (
          <button
            key={a.label}
            type="button"
            className={a.tone === 'brand' ? 'big-btn' : 'btn-quiet'}
            style={{ minHeight: '54px', fontSize: '14px', flexDirection: 'column', gap: '2px' }}
            onClick={() => handleQuick(a.say)}
          >
            <span>{a.label}</span>
            <span style={{ fontSize: '10px', fontWeight: 600, opacity: 0.7 }}>"{a.say}"</span>
          </button>
        ))}
      </div>

      {/* 5. TYPED FALLBACK */}
      {showTyped && (
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <input
            ref={inputRef}
            className="form-input"
            placeholder="Likh ke bhejein..."
            value={typed}
            onChange={(e) => setTyped(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') { submitText(typed); setTyped(''); } }}
            autoFocus
          />
          <button
            type="button"
            className="big-btn"
            style={{ width: '52px', minWidth: '52px', padding: 0 }}
            onClick={() => { submitText(typed); setTyped(''); }}
            aria-label="Send"
          >
            <Send size={20} />
          </button>
        </div>
      )}

      {/* Link through to the ledger, for when the touch UI is genuinely better */}
      <button type="button" className="cb-voice-jump" onClick={() => onNavigate && onNavigate('khata')}>
        Khata kholein <ChevronRight size={16} />
      </button>

      {handsFree && (
        <p className="cb-voice-hint">
          Mic khula rehta hai. Aap kabhi bich mein boliye — bot ruk jaayega.
        </p>
      )}
    </div>
  );
}

function statusLabel(status) {
  switch (status) {
    case 'connecting': return 'Jod raha hoon...';
    case 'listening': return 'Sun raha hoon — boliye';
    case 'thinking': return 'Soch raha hoon...';
    case 'speaking': return 'Bata raha hoon...';
    case 'error': return 'Dobara koshish karein';
    default: return 'Bolo — main kaam kar dunga';
  }
}
