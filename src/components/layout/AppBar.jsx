import React, { useEffect, useState } from 'react';
import { Wheat, Droplets } from 'lucide-react';
import { useStore } from '../../store/useStore';
import { useVoiceStore } from '../../store/voice/useVoiceStore';
import Avatar from '../ui/Avatar';

/**
 * Top bar.
 *
 * The mic button that used to live here is gone — voice has its own tab, and a
 * 38px icon in a corner is the opposite of AI-first. In its place is a live
 * state pip: it tells the operator at a glance whether the co-pilot is
 * listening, thinking or speaking, without them having to leave the screen
 * they are on. Tapping it jumps to the voice deck.
 */
export default function AppBar({ onOpenSettings, onNavigate }) {
  const activeMode = useStore((state) => state.activeMode || 'chakki');
  const setActiveMode = useStore((state) => state.setActiveMode);
  const shop = useStore((state) => state.shop || {});
  const voiceStatus = useVoiceStore((s) => s.status);

  const voiceLive = voiceStatus !== 'idle' && voiceStatus !== 'error';

  return (
    <header
      style={{
        position: 'sticky',
        top: 0,
        zIndex: 100,
        backgroundColor: 'hsl(var(--surface))',
        borderBottom: '1px solid hsl(var(--line))',
        padding: '0 14px',
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        height: '58px',
        boxShadow: 'none'
      }}
    >
      <div className="cb-appbar-mark">
        <img
          src="/logo.png"
          alt=""
          style={{ width: '100%', height: '100%', borderRadius: 'inherit', objectFit: 'cover' }}
          onError={(e) => { e.target.style.display = 'none'; }}
        />
        <Wheat size={19} strokeWidth={2} />
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0, flex: 1, marginLeft: '2px' }}>
        <span
          style={{
            fontSize: '15px',
            fontWeight: '800',
            color: 'hsl(var(--ink))',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            lineHeight: 1.2,
            letterSpacing: '-0.01em'
          }}
        >
          {shop?.name || 'Vanshu Atta Mill'}
        </span>
        <span style={{ fontSize: '10.5px', fontWeight: '600', color: 'hsl(var(--ink-3))', marginTop: '1px' }}>
          {activeMode === 'chakki' ? 'Atta & Grain Mill' : 'Oil Expeller'}
        </span>
      </div>

      {/* Live voice state — colour matches the orb so the two read as one system */}
      <button
        type="button"
        onClick={() => onNavigate && onNavigate('voice')}
        aria-label={`ChakkiBot ${voiceStatus}`}
        className={`cb-voice-pip state-${voiceStatus}`}
      />

      <div className="cb-mode-switch" role="group" aria-label="Mill mode">
        <button
          type="button"
          onClick={() => setActiveMode('chakki')}
          aria-pressed={activeMode === 'chakki'}
          className="cb-mode-btn is-chakki"
          data-active={activeMode === 'chakki'}
        >
          <Wheat size={13} strokeWidth={2.4} />
          <span>Chakki</span>
        </button>
        <button
          type="button"
          onClick={() => setActiveMode('spellar')}
          aria-pressed={activeMode === 'spellar'}
          className="cb-mode-btn is-spellar"
          data-active={activeMode === 'spellar'}
        >
          <Droplets size={13} strokeWidth={2.4} />
          <span>Spellar</span>
        </button>
      </div>

      <Avatar name={shop?.ownerName || 'Bhaiya'} size={36} onClick={onOpenSettings} />
    </header>
  );
}
