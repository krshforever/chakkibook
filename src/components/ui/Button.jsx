import React from 'react';

export default function Button({ 
  children, 
  variant = 'brand', // 'brand' | 'quiet' | 'danger' | 'ghost'
  size = 'md',        // 'sm' | 'md' | 'lg'
  icon: Icon,
  disabled = false,
  onClick,
  className = '',
  type = 'button',
  fullWidth = false,
  ...props 
}) {
  const getVariantStyles = () => {
    switch (variant) {
      case 'quiet':
        return {
          backgroundColor: 'hsl(var(--surface-2))',
          color: 'hsl(var(--ink))',
          border: '1px solid hsl(var(--line))',
        };
      case 'danger':
        return {
          backgroundColor: 'hsl(var(--risk-udhar-bg))',
          color: 'hsl(var(--risk-udhar-text))',
          border: '1px solid rgba(185, 45, 21, 0.2)',
        };
      case 'ghost':
        return {
          backgroundColor: 'transparent',
          color: 'hsl(var(--ink-2))',
          border: 'none',
        };
      case 'brand':
      default:
        return {
          backgroundColor: 'var(--primary-color)',
          color: '#FFFFFF',
          border: 'none',
        };
    }
  };

  const variantStyles = getVariantStyles();

  return (
    <button
      type={type}
      disabled={disabled}
      onClick={onClick}
      className={`tap-effect ${className}`}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '0.5rem',
        minHeight: '48px', // 48px minimum touch target for mill hands
        padding: size === 'sm' ? '0 1rem' : size === 'lg' ? '0.875rem 1.5rem' : '0.625rem 1.25rem',
        borderRadius: 'var(--radius-sm)',
        fontSize: size === 'sm' ? '0.875rem' : '0.95rem',
        fontWeight: '600',
        cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.6 : 1,
        width: fullWidth ? '100%' : 'auto',
        transition: 'all 0.15s ease',
        ...variantStyles
      }}
      {...props}
    >
      {Icon && <Icon size={size === 'sm' ? 16 : 18} />}
      <span>{children}</span>
    </button>
  );
}
