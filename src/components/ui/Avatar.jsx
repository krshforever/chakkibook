import React from 'react';

export default function Avatar({
  name = 'User',
  size = 40,
  hasAiDot = false,
  className = '',
  onClick
}) {
  const getInitials = (n) => {
    if (!n) return 'U';
    const parts = n.trim().split(' ');
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    }
    return n.slice(0, 2).toUpperCase();
  };

  // Generate deterministic warm color pair based on name
  const getColors = (n) => {
    const charCode = (n || 'U').charCodeAt(0);
    const hues = [38, 28, 45, 142, 210];
    const hue = hues[charCode % hues.length];
    return {
      bg: `hsl(${hue} 80% 92%)`,
      text: `hsl(${hue} 90% 28%)`
    };
  };

  const colors = getColors(name);

  return (
    <div
      onClick={onClick}
      className={`tap-effect ${className}`}
      style={{
        position: 'relative',
        width: `${size}px`,
        height: `${size}px`,
        borderRadius: 'var(--radius-pill)',
        backgroundColor: colors.bg,
        color: colors.text,
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontWeight: '700',
        fontSize: `${size * 0.4}px`,
        fontFamily: 'var(--font-sans)',
        border: '1px solid hsl(var(--line))',
        flexShrink: 0,
        cursor: onClick ? 'pointer' : 'default'
      }}
    >
      {getInitials(name)}

      {/* Signature AI Indigo Dot */}
      {hasAiDot && (
        <span
          style={{
            position: 'absolute',
            bottom: '-1px',
            right: '-1px',
            width: `${Math.max(10, size * 0.3)}px`,
            height: `${Math.max(10, size * 0.3)}px`,
            borderRadius: '50%',
            backgroundColor: 'hsl(var(--ai-indigo))',
            border: '2px solid #FFFFFF'
          }}
        />
      )}
    </div>
  );
}
