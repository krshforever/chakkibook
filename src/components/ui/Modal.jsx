import React, { useEffect } from 'react';
import { X } from 'lucide-react';

export default function Modal({
  isOpen,
  onClose,
  title,
  subtitle,
  children,
  maxWidth = '540px'
}) {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 999,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'flex-end',
        alignItems: 'center'
      }}
    >
      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{
          position: 'absolute',
          inset: 0,
          backgroundColor: 'rgba(33, 26, 18, 0.45)',
          backdropFilter: 'blur(4px)',
          transition: 'opacity 0.2s ease'
        }}
      />

      {/* Bottom Sheet Modal Container */}
      <div
        style={{
          position: 'relative',
          width: '100%',
          maxWidth,
          backgroundColor: 'hsl(var(--surface))',
          borderTopLeftRadius: '24px',
          borderTopRightRadius: '24px',
          border: '1px solid hsl(var(--line))',
          boxShadow: 'var(--shadow-modal)',
          maxHeight: '85vh',
          display: 'flex',
          flexDirection: 'column',
          zIndex: 1000,
          overflow: 'hidden',
          animation: 'slideUp 0.25s cubic-bezier(0.16, 1, 0.3, 1)'
        }}
      >
        {/* Drag Handle Bar */}
        <div style={{ padding: '12px 0 4px', display: 'flex', justifyContent: 'center' }}>
          <div
            style={{
              width: '40px',
              height: '4px',
              borderRadius: '999px',
              backgroundColor: 'hsl(var(--line-2))'
            }}
          />
        </div>

        {/* Modal Header */}
        <div
          style={{
            padding: '0.75rem 1.25rem 1rem',
            borderBottom: '1px solid hsl(var(--line))',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}
        >
          <div>
            {title && (
              <h3 style={{ fontSize: '16px', fontWeight: '700', color: 'hsl(var(--ink))' }}>
                {title}
              </h3>
            )}
            {subtitle && (
              <p style={{ fontSize: '13px', color: 'hsl(var(--ink-2))', marginTop: '2px' }}>
                {subtitle}
              </p>
            )}
          </div>

          <button
            type="button"
            onClick={onClose}
            className="tap-effect"
            style={{
              width: '36px',
              height: '36px',
              borderRadius: '50%',
              border: '1px solid hsl(var(--line))',
              backgroundColor: 'hsl(var(--surface-2))',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'hsl(var(--ink-2))',
              cursor: 'pointer'
            }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Modal Scrollable Body */}
        <div
          style={{
            padding: '1.25rem',
            overflowY: 'auto',
            WebkitOverflowScrolling: 'touch'
          }}
        >
          {children}
        </div>
      </div>

      <style>{`
        @keyframes slideUp {
          from { transform: translateY(100%); }
          to { transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}
