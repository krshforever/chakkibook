import React from 'react';

export default function Badge({
  children,
  variant = 'pending', // 'udhar' | 'healthy' | 'pending' | 'muted'
  size = 'md',          // 'sm' | 'md'
  icon: Icon,
  className = '',
  style = {}
}) {
  const getBadgeStyles = () => {
    switch (variant) {
      case 'udhar':
        return {
          backgroundColor: 'hsl(var(--risk-udhar-bg))',
          color: 'hsl(var(--risk-udhar-text))',
          border: '1px solid rgba(185, 45, 21, 0.2)'
        };
      case 'healthy':
        return {
          backgroundColor: 'hsl(var(--status-healthy-bg))',
          color: 'hsl(var(--status-healthy-text))',
          border: '1px solid rgba(27, 105, 57, 0.2)'
        };
      case 'pending':
        return {
          backgroundColor: 'hsl(var(--status-pending-bg))',
          color: 'hsl(var(--status-pending-text))',
          border: '1px solid rgba(153, 77, 0, 0.2)'
        };
      case 'muted':
      default:
        // Plain muted text category (does not earn colorful pill)
        return {
          backgroundColor: 'transparent',
          color: 'hsl(var(--ink-2))',
          border: 'none',
          padding: '0'
        };
    }
  };

  const isPlainMuted = variant === 'muted';

  return (
    <span
      className={className}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '0.25rem',
        padding: isPlainMuted ? '0' : size === 'sm' ? '0.15rem 0.5rem' : '0.25rem 0.65rem',
        borderRadius: isPlainMuted ? '0' : 'var(--radius-pill)',
        fontSize: size === 'sm' ? '0.75rem' : '0.8125rem',
        fontWeight: '600',
        lineHeight: 1.2,
        ...getBadgeStyles(),
        ...style
      }}
    >
      {Icon && <Icon size={size === 'sm' ? 12 : 14} />}
      <span>{children}</span>
    </span>
  );
}
