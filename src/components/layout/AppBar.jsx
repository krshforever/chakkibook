import React from 'react';
import { Wheat, Droplets, Mic } from 'lucide-react';
import { useStore } from '../../store/useStore';
import Avatar from '../ui/Avatar';

export default function AppBar({ onOpenSettings }) {
  const activeMode = useStore((state) => state.activeMode || 'chakki');
  const setActiveMode = useStore((state) => state.setActiveMode);
  const shop = useStore((state) => state.shop || {});
  const toggleAISheet = useStore((state) => state.toggleAISheet);
  const setVoiceListening = useStore((state) => state.setVoiceListening);

  const handleMicClick = () => {
    setVoiceListening(true);
    toggleAISheet();
  };

  return (
    <header
      style={{
        position: 'sticky',
        top: 0,
        zIndex: 100,
        backgroundColor: 'hsl(var(--surface))',
        borderBottom: '1px solid hsl(var(--line))',
        padding: '0 16px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        height: '60px',
        boxShadow: 'none' /* SHADOW AUDIT */
      }}
    >
      {/* 1. Logo (38px) */}
      <div
        style={{
          width: '38px',
          height: '38px',
          borderRadius: '10px',
          backgroundColor: 'hsl(var(--brand-light, 38 90% 95%))',
          color: 'hsl(var(--brand-500))',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0
        }}
      >
        <img
          src="/logo.png"
          alt="Logo"
          style={{ width: '38px', height: '38px', borderRadius: '10px', objectFit: 'cover' }}
          onError={(e) => { e.target.style.display = 'none'; }}
        />
        <Wheat size={20} />
      </div>

      {/* 2. Stack (mill name 15/700 + "Atta & Grain Mill" 10.5 muted) */}
      <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0, flex: 1, marginLeft: '10px', marginRight: '10px' }}>
        <span
          style={{
            fontSize: '15px',
            fontWeight: '700',
            color: 'hsl(var(--ink))',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            lineHeight: 1.2
          }}
        >
          {shop?.name || 'Vanshu Atta Mill'}
        </span>
        <span style={{ fontSize: '10.5px', color: 'hsl(var(--ink-2))', marginTop: '1px' }}>
          Atta & Grain Mill
        </span>
      </div>

      {/* 3. Mode Segmented Control (Chakki | Spellar, icons + 11px labels, pill container) */}
      <div
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          backgroundColor: 'hsl(var(--surface-2))',
          borderRadius: '999px',
          padding: '3px',
          gap: '2px',
          border: '1px solid hsl(var(--line))',
          flexShrink: 0,
          marginRight: '8px'
        }}
      >
        <button
          type="button"
          onClick={() => setActiveMode('chakki')}
          style={{
            height: '28px',
            padding: '0 8px',
            borderRadius: '999px',
            border: 'none',
            backgroundColor: activeMode === 'chakki' ? 'hsl(var(--surface))' : 'transparent',
            color: activeMode === 'chakki' ? 'hsl(var(--brand-600))' : 'hsl(var(--ink-2))',
            fontSize: '11px',
            fontWeight: activeMode === 'chakki' ? '700' : '600',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '4px'
          }}
        >
          <Wheat size={12} />
          <span>Chakki</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveMode('spellar')}
          style={{
            height: '28px',
            padding: '0 8px',
            borderRadius: '999px',
            border: 'none',
            backgroundColor: activeMode === 'spellar' ? 'hsl(var(--surface))' : 'transparent',
            color: activeMode === 'spellar' ? 'hsl(var(--spellar-500))' : 'hsl(var(--ink-2))',
            fontSize: '11px',
            fontWeight: activeMode === 'spellar' ? '700' : '600',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '4px'
          }}
        >
          <Droplets size={12} />
          <span>Spellar</span>
        </button>
      </div>

      {/* 4. Mic icon-button (38px) */}
      <button
        type="button"
        onClick={handleMicClick}
        style={{
          width: '38px',
          height: '38px',
          borderRadius: '50%',
          backgroundColor: 'hsl(var(--surface-2))',
          border: '1px solid hsl(var(--line))',
          color: 'hsl(var(--ink))',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          flexShrink: 0,
          marginRight: '8px'
        }}
        title="Voice AI"
      >
        <Mic size={18} />
      </button>

      {/* 5. Avatar (38px) */}
      <Avatar
        name={shop?.ownerName || 'Bhaiya'}
        size={38}
        onClick={onOpenSettings}
      />
    </header>
  );
}
