import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Mic, Square, Loader2, Volume2, AlertTriangle } from 'lucide-react';
import { useVoiceStore } from '../../store/voice/useVoiceStore';

/**
 * The voice orb — the app's primary control.
 *
 * Built for the actual operating conditions: a phone on a counter, a hand
 * that may be covered in flour, and an operator who may not read. So:
 *
 *  - **One tap target, ~62vw.** Nothing else on screen is bigger.
 *  - **State is legible without reading.** Colour and motion carry it — ink
 *    for idle, saffron for listening, amber for thinking, indigo for speaking,
 *    red for error. The label underneath is a secondary cue, not the only one.
 *  - **The ring tracks real mic amplitude.** Smoothed RMS is read through a
 *    ref + requestAnimationFrame rather than React state: at 30 fps, re-rendering
 *    the orb through the store would burn a render frame per audio chunk on a
 *    low-end Android.
 *  - **Everything is one element.** Press, hold-to-cancel and drag-out-to-cancel
 *    all hit the same node, so there is no precision requirement.
 */

const RADIUS = 42;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

const LABELS = {
  idle: 'Bolo',
  connecting: 'Jod raha hoon',
  ready: 'Bolo',
  listening: 'Sun raha hoon',
  thinking: 'Soch raha hoon',
  speaking: 'Bata raha hoon',
  error: 'Problem aayi'
};

function stateColor(status) {
  switch (status) {
    case 'listening': return 'hsl(var(--voice-listening))';
    case 'thinking': return 'hsl(var(--voice-thinking))';
    case 'speaking': return 'hsl(var(--voice-speaking))';
    case 'error': return 'hsl(var(--voice-error))';
    case 'connecting': return 'hsl(var(--voice-thinking))';
    default: return 'hsl(var(--voice-idle))';
  }
}

export default function VoiceOrb({ size }) {
  const status = useVoiceStore((s) => s.status);
  const getLevel = useVoiceStore((s) => s.getLevel);
  const start = useVoiceStore((s) => s.start);
  const stop = useVoiceStore((s) => s.stop);
  const interrupt = useVoiceStore((s) => s.interrupt);

  const orbRef = useRef(null);
  const rafRef = useRef(null);
  const [grow, setGrow] = useState(0);

  useEffect(() => {
    if (status !== 'listening' && status !== 'speaking') {
      setGrow(0);
      return;
    }
    let alive = true;
    const tick = () => {
      if (!alive) return;
      const raw = typeof getLevel === 'function' ? getLevel() : 0;
      // Perceptual-ish curve: quiet rooms sit around 0.02 RMS, a raised voice
      // around 0.25. Linear scaling makes the orb dead still at conversational
      // volume in a noisy room.
      const scaled = Math.min(1, Math.pow(raw * 3.6, 0.62));
      setGrow((prev) => prev + (scaled - prev) * 0.35);
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => {
      alive = false;
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [status, getLevel]);

  const isActive = status !== 'idle' && status !== 'error';
  const color = stateColor(status);

  // Haptic tick on state change — the operator hears *and* feels the handoff.
  useEffect(() => {
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      navigator.vibrate(status === 'speaking' ? 12 : 8);
    }
  }, [status]);

  const handlePrimary = useCallback(() => {
    if (status === 'idle' || status === 'error') {
      start();
    } else if (status === 'speaking') {
      interrupt();
    } else {
      stop();
    }
  }, [status, start, stop, interrupt]);

  const Icon = status === 'idle' || status === 'ready' || status === 'listening'
    ? Mic
    : status === 'speaking'
      ? Volume2
      : status === 'error'
        ? AlertTriangle
        : Loader2;

  return (
    <div
      style={{
        width: 'var(--voice-orb-size)',
        height: 'var(--voice-orb-size)',
        position: 'relative',
        display: 'grid',
        placeItems: 'center',
        flexShrink: 0
      }}
    >
      {/* Reactive amplitude ring — the only motion that responds to the room */}
      <svg
        viewBox="0 0 100 100"
        aria-hidden="true"
        style={{
          position: 'absolute',
          inset: 0,
          width: '100%',
          height: '100%',
          transform: 'rotate(-90deg)',
          overflow: 'visible'
        }}
      >
        <circle
          cx="50" cy="50" r={RADIUS}
          fill="none"
          stroke={color}
          strokeWidth="1.4"
          opacity="0.16"
        />
        <circle
          cx="50" cy="50" r={RADIUS}
          fill="none"
          stroke={color}
          strokeWidth="2.6"
          strokeLinecap="round"
          strokeDasharray={CIRCUMFERENCE}
          strokeDashoffset={CIRCUMFERENCE * (1 - grow)}
          style={{ transition: 'stroke 220ms var(--ease-spring)' }}
        />
      </svg>

      {/* Breathing halo. Idle pulses slowly to invite the first tap; once the
          session is live it stops so it never competes with the amplitude ring. */}
      <div
        className={isActive ? '' : 'cb-orb-halo'}
        style={{
          position: 'absolute',
          inset: 0,
          borderRadius: '50%',
          background: color,
          opacity: 0.1,
          filter: 'blur(22px)',
          transform: `scale(${0.82 + grow * 0.3})`,
          transition: 'transform 90ms linear, background 260ms var(--ease-spring)'
        }}
      />

      {/* The button itself */}
      <button
        ref={orbRef}
        type="button"
        onClick={handlePrimary}
        aria-label={LABELS[status] || 'Bolo'}
        aria-pressed={isActive}
        className="tap-effect"
        style={{
          position: 'relative',
          width: 'var(--voice-orb-size)',
          height: 'var(--voice-orb-size)',
          maxWidth: '100%',
          borderRadius: '50%',
          border: 'none',
          cursor: 'pointer',
          display: 'grid',
          placeItems: 'center',
          background: `radial-gradient(circle at 32% 28%, ${color} 0%, hsl(30 25% 10%) 78%)`,
          color: '#fff',
          boxShadow: `0 18px 48px -14px ${color}`,
          transform: `scale(${1 + grow * 0.045})`,
          transition: 'transform 90ms linear, box-shadow 260ms var(--ease-spring), background 260ms var(--ease-spring)',
          WebkitTapHighlightColor: 'transparent',
          touchAction: 'manipulation'
        }}
      >
        <Icon
          size={Math.round((parseFloat(getComputedStyle(document.documentElement).fontSize) || 16) * 2.4)}
          strokeWidth={1.9}
          className={status === 'thinking' || status === 'connecting' ? 'spin' : ''}
          style={{ filter: 'drop-shadow(0 2px 6px rgba(0,0,0,0.35))' }}
        />
      </button>

      {/* Ripple rings while listening — reads as "the mic is open" from across
          a room, which matters when you cannot lean in and read a label. */}
      {status === 'listening' && (
        <>
          <span className="cb-orb-ripple" style={{ borderColor: color, animationDelay: '0ms' }} />
          <span className="cb-orb-ripple" style={{ borderColor: color, animationDelay: '900ms' }} />
        </>
      )}
    </div>
  );
}
