import React from 'react';
import { Sparkles, ChevronRight } from 'lucide-react';
import { useStore } from '../../../store/useStore';

export default function AIInsightBanner({ insight, onClick }) {
  const toggleAISheet = useStore((state) => state.toggleAISheet);

  const defaultInsight = insight || {
    title: 'Optimal Milling Window',
    desc: 'Subah 10 baje se 1 baje tak pisai load sabse ziada rehta hai. Advance bori tayar rakhein.'
  };

  return (
    <div
      onClick={onClick || toggleAISheet}
      className="tap-effect"
      style={{
        backgroundColor: 'hsl(var(--surface-2))', // Warm paper surface, not cold billboard
        border: '1px solid hsl(var(--line))',
        borderRadius: 'var(--radius-md)',
        padding: '0.875rem 1rem',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '0.75rem',
        cursor: 'pointer'
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
        {/* Warm brand container with indigo signature dot */}
        <div
          style={{
            position: 'relative',
            width: '36px',
            height: '36px',
            borderRadius: '50%',
            backgroundColor: 'var(--primary-light)',
            color: 'var(--primary-color)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0
          }}
        >
          <Sparkles size={18} />
          {/* Signature Indigo Dot */}
          <span
            style={{
              position: 'absolute',
              top: '0',
              right: '0',
              width: '8px',
              height: '8px',
              borderRadius: '50%',
              backgroundColor: 'hsl(var(--ai-indigo))',
              border: '1px solid #FFFFFF'
            }}
          />
        </div>

        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
            <span style={{ fontSize: '12px', fontWeight: '700', color: 'var(--primary-color)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Chakki AI Whisper
            </span>
            <span style={{ color: 'hsl(var(--line-2))' }}>•</span>
            <span style={{ fontSize: '13px', fontWeight: '700', color: 'hsl(var(--ink))' }}>
              {defaultInsight.title}
            </span>
          </div>
          <p style={{ fontSize: '12px', color: 'hsl(var(--ink-2))', marginTop: '1px' }}>
            {defaultInsight.desc}
          </p>
        </div>
      </div>

      <ChevronRight size={18} style={{ color: 'hsl(var(--ink-3))', flexShrink: 0 }} />
    </div>
  );
}
