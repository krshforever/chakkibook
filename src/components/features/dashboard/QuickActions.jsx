import React from 'react';
import { PlusCircle, BookOpen, Package, Droplets } from 'lucide-react';
import { useStore } from '../../../store/useStore';

export default function QuickActions({ onOpenNewEntry, onNavTab }) {
  const activeMode = useStore((state) => state.activeMode);

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
      <button
        type="button"
        onClick={onOpenNewEntry}
        className="tap-effect"
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.75rem',
          padding: '0.875rem 1rem',
          minHeight: '54px',
          borderRadius: 'var(--radius-md)',
          backgroundColor: 'hsl(var(--surface))',
          border: '1px solid hsl(var(--line))',
          textAlign: 'left',
          cursor: 'pointer'
        }}
      >
        <div
          style={{
            width: '36px',
            height: '36px',
            borderRadius: 'var(--radius-sm)',
            backgroundColor: 'var(--primary-light)',
            color: 'var(--primary-color)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0
          }}
        >
          <PlusCircle size={20} />
        </div>
        <div>
          <span style={{ fontSize: '14px', fontWeight: '700', color: 'hsl(var(--ink))', display: 'block' }}>
            Nayi Bori
          </span>
          <span style={{ fontSize: '11px', color: 'hsl(var(--ink-2))' }}>
            + {activeMode === 'chakki' ? 'Pisai Entry' : 'Pirai Entry'}
          </span>
        </div>
      </button>

      <button
        type="button"
        onClick={() => onNavTab?.('khata')}
        className="tap-effect"
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.75rem',
          padding: '0.875rem 1rem',
          minHeight: '54px',
          borderRadius: 'var(--radius-md)',
          backgroundColor: 'hsl(var(--surface))',
          border: '1px solid hsl(var(--line))',
          textAlign: 'left',
          cursor: 'pointer'
        }}
      >
        <div
          style={{
            width: '36px',
            height: '36px',
            borderRadius: 'var(--radius-sm)',
            backgroundColor: 'hsl(38 90% 95%)',
            color: 'hsl(38 100% 35%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0
          }}
        >
          <BookOpen size={20} />
        </div>
        <div>
          <span style={{ fontSize: '14px', fontWeight: '700', color: 'hsl(var(--ink))', display: 'block' }}>
            Grahak Khata
          </span>
          <span style={{ fontSize: '11px', color: 'hsl(var(--ink-2))' }}>
            Jama / Udhar Register
          </span>
        </div>
      </button>
    </div>
  );
}
