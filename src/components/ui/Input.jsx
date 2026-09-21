import React from 'react';
import { X } from 'lucide-react';

export default function Input({
  label,
  error,
  icon: Icon,
  value = '',
  onChange,
  onClear,
  placeholder = '',
  type = 'text',
  className = '',
  required = false,
  readOnly = false,
  ...props
}) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.375rem', width: '100%' }}>
      {label && (
        <label 
          style={{
            fontSize: '13px',
            fontWeight: '600',
            color: 'hsl(var(--ink-2))',
            letterSpacing: '0.01em'
          }}
        >
          {label} {required && <span style={{ color: 'hsl(var(--risk-udhar-text))' }}>*</span>}
        </label>
      )}

      <div style={{ position: 'relative', display: 'flex', alignItems: 'center', width: '100%' }}>
        {Icon && (
          <div style={{ position: 'absolute', left: '12px', color: 'hsl(var(--ink-3))', display: 'flex', alignItems: 'center' }}>
            <Icon size={18} />
          </div>
        )}

        <input
          type={type}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          readOnly={readOnly}
          className={className}
          style={{
            width: '100%',
            minHeight: '48px', // 48px touch target
            paddingLeft: Icon ? '40px' : '14px',
            paddingRight: onClear && value ? '40px' : '14px',
            backgroundColor: readOnly ? 'hsl(var(--surface-2))' : 'hsl(var(--surface))',
            border: error ? '1.5px solid hsl(var(--risk-udhar-text))' : '1px solid hsl(var(--line))',
            borderRadius: 'var(--radius-sm)',
            fontSize: '15px',
            fontWeight: '500',
            color: 'hsl(var(--ink))',
            outline: 'none',
            transition: 'border-color 0.15s ease'
          }}
          {...props}
        />

        {onClear && value && !readOnly && (
          <button
            type="button"
            onClick={onClear}
            style={{
              position: 'absolute',
              right: '10px',
              background: 'none',
              border: 'none',
              color: 'hsl(var(--ink-3))',
              cursor: 'pointer',
              padding: '4px',
              display: 'flex',
              alignItems: 'center'
            }}
          >
            <X size={16} />
          </button>
        )}
      </div>

      {error && (
        <span style={{ fontSize: '12px', color: 'hsl(var(--risk-udhar-text))', fontWeight: '500' }}>
          {error}
        </span>
      )}
    </div>
  );
}
