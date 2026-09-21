import React from 'react';

export default function Section({
  title,
  subtitle,
  action,
  children,
  className = '',
  style = {}
}) {
  return (
    <section className={className} style={{ marginBottom: '1.25rem', ...style }}>
      {(title || action) && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: '0.625rem',
            padding: '0 0.25rem'
          }}
        >
          <div>
            {title && (
              <h2
                style={{
                  fontSize: '15px', // 15px semibold title-case, NEVER ALL CAPS
                  fontWeight: '600',
                  color: 'hsl(var(--ink))',
                  textTransform: 'none',
                  letterSpacing: '-0.01em'
                }}
              >
                {title}
              </h2>
            )}
            {subtitle && (
              <p style={{ fontSize: '12px', color: 'hsl(var(--ink-2))', marginTop: '1px' }}>
                {subtitle}
              </p>
            )}
          </div>

          {action && <div>{action}</div>}
        </div>
      )}

      {children}
    </section>
  );
}
