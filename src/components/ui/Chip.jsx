import React from 'react';

export default function Chip({
  label,
  active = false,
  onClick,
  count,
  icon: Icon,
  className = ''
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`tap-effect ${className}`}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '0.375rem',
        minHeight: '38px',
        padding: '0.375rem 0.875rem',
        borderRadius: 'var(--radius-pill)',
        fontSize: '0.85rem',
        fontWeight: active ? '600' : '500',
        backgroundColor: active ? 'var(--primary-light)' : 'hsl(var(--surface))',
        color: active ? 'var(--primary-dark)' : 'hsl(var(--ink-2))',
        border: active ? '1.5px solid var(--primary-color)' : '1px solid hsl(var(--line))',
        cursor: 'pointer',
        whiteSpace: 'nowrap',
        transition: 'all 0.15s ease'
      }}
    >
      {Icon && <Icon size={14} />}
      <span>{label}</span>
      {count !== undefined && count !== null && (
        <span
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '0.75rem',
            fontWeight: '700',
            padding: '0.1rem 0.4rem',
            borderRadius: 'var(--radius-pill)',
            backgroundColor: active ? 'var(--primary-color)' : 'hsl(var(--surface-2))',
            color: active ? '#FFFFFF' : 'hsl(var(--ink-2))'
          }}
        >
          {count}
        </span>
      )}
    </button>
  );
}
