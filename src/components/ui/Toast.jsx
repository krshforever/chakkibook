import React, { useEffect } from 'react';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';

export default function Toast({
  message,
  type = 'success', // 'success' | 'error' | 'info'
  isOpen = false,
  onClose,
  duration = 3000
}) {
  useEffect(() => {
    if (isOpen && duration) {
      const timer = setTimeout(() => {
        onClose?.();
      }, duration);
      return () => clearTimeout(timer);
    }
  }, [isOpen, duration, onClose]);

  if (!isOpen || !message) return null;

  const getTypeStyles = () => {
    switch (type) {
      case 'error':
        return {
          bg: 'hsl(var(--risk-udhar-bg))',
          text: 'hsl(var(--risk-udhar-text))',
          border: 'rgba(185, 45, 21, 0.2)',
          icon: AlertCircle
        };
      case 'info':
        return {
          bg: 'hsl(212 90% 95%)',
          text: 'hsl(212 90% 30%)',
          border: 'rgba(37, 99, 235, 0.2)',
          icon: Info
        };
      case 'success':
      default:
        return {
          bg: 'hsl(var(--status-healthy-bg))',
          text: 'hsl(var(--status-healthy-text))',
          border: 'rgba(27, 105, 57, 0.2)',
          icon: CheckCircle2
        };
    }
  };

  const style = getTypeStyles();
  const Icon = style.icon;

  return (
    <div
      style={{
        position: 'fixed',
        bottom: '84px',
        left: '50%',
        transform: 'translateX(-50%)',
        zIndex: 1100,
        width: '90%',
        maxWidth: '420px',
        backgroundColor: style.bg,
        color: style.text,
        border: `1px solid ${style.border}`,
        borderRadius: 'var(--radius-pill)',
        padding: '0.625rem 1rem',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '0.75rem',
        boxShadow: '0 8px 24px rgba(33, 26, 18, 0.12)',
        animation: 'fadeInUp 0.2s cubic-bezier(0.16, 1, 0.3, 1)'
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        <Icon size={18} />
        <span style={{ fontSize: '0.875rem', fontWeight: '600' }}>{message}</span>
      </div>

      <button
        type="button"
        onClick={onClose}
        style={{
          background: 'none',
          border: 'none',
          color: 'inherit',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          opacity: 0.8
        }}
      >
        <X size={16} />
      </button>

      <style>{`
        @keyframes fadeInUp {
          from { opacity: 0; transform: translate(-50%, 12px); }
          to { opacity: 1; transform: translate(-50%, 0); }
        }
      `}</style>
    </div>
  );
}
