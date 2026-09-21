import React from 'react';

export default function Card({
  children,
  variant = 'flat', // 'flat' | 'elevated' | 'interactive' | 'glass' | 'dark'
  className = '',
  onClick,
  style = {},
  ...props
}) {
  const getStyles = () => {
    switch (variant) {
      case 'dark':
        return {
          backgroundColor: 'hsl(var(--surface-dark))',
          color: '#FFFFFF',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          borderRadius: 'var(--radius-lg)',
          padding: '1.25rem'
        };
      case 'elevated':
        return {
          backgroundColor: 'hsl(var(--surface))',
          color: 'hsl(var(--ink))',
          border: '1px solid hsl(var(--line))',
          boxShadow: '0 4px 20px rgba(33, 26, 18, 0.06)',
          borderRadius: 'var(--radius-md)',
          padding: '1rem'
        };
      case 'interactive':
        return {
          backgroundColor: 'hsl(var(--surface))',
          color: 'hsl(var(--ink))',
          border: '1px solid hsl(var(--line))',
          borderRadius: 'var(--radius-md)',
          padding: '1rem',
          cursor: 'pointer'
        };
      case 'glass':
        return {
          backgroundColor: 'rgba(255, 255, 255, 0.85)',
          backdropFilter: 'blur(8px)',
          border: '1px solid hsl(var(--line))',
          borderRadius: 'var(--radius-md)',
          padding: '1rem'
        };
      case 'flat':
      default:
        return {
          backgroundColor: 'hsl(var(--surface))',
          color: 'hsl(var(--ink))',
          border: '1px solid hsl(var(--line))',
          borderRadius: 'var(--radius-md)',
          padding: '1rem'
        };
    }
  };

  return (
    <div
      onClick={onClick}
      className={`${variant === 'interactive' ? 'tap-effect' : ''} ${className}`}
      style={{
        transition: 'all 0.15s ease',
        ...getStyles(),
        ...style
      }}
      {...props}
    >
      {children}
    </div>
  );
}
