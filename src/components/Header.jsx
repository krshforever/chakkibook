import React from 'react';
import { useStore } from '../store/useStore';

export default function Header() {
  const shop = useStore((state) => state.shop);
  const theme = useStore((state) => state.theme);
  const setTheme = useStore((state) => state.setTheme);
  const activeMode = useStore((state) => state.activeMode);
  const setActiveMode = useStore((state) => state.setActiveMode);

  const toggleTheme = () => {
    const next = theme === 'light' ? 'dark' : 'light';
    setTheme(next);
    document.documentElement.setAttribute('data-theme', next);
  };

  return (
    <>
      <header className="top-header">
        <div>
          <h1>🌾 Chakkibook</h1>
          <p style={{ fontSize: '0.75rem', opacity: 0.85, margin: 0 }}>
            {shop.name || 'Atta & Oil Mill'}
          </p>
        </div>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <button
            onClick={toggleTheme}
            style={{
              background: 'rgba(255,255,255,0.15)',
              border: 'none',
              color: '#fff',
              padding: '6px 10px',
              borderRadius: '20px',
              cursor: 'pointer',
              fontSize: '0.8rem'
            }}
          >
            {theme === 'light' ? '🌙 Dark' : '☀️ Light'}
          </button>
        </div>
      </header>

      {/* Atta vs Sarson Primary Mode Toggle Bar */}
      <div style={{
        background: 'var(--soil-dark)',
        padding: '6px 16px',
        display: 'flex',
        justifyContent: 'center',
        gap: '8px',
        borderBottom: '1px solid rgba(255,255,255,0.1)'
      }}>
        {[
          { id: 'all', label: 'All Operations', icon: '⚡' },
          { id: 'atta', label: 'Atta / Pisai', icon: '🌾' },
          { id: 'sarson', label: 'Sarson / Pirai', icon: '🫒' }
        ].map((m) => (
          <button
            key={m.id}
            onClick={() => setActiveMode(m.id)}
            style={{
              background: activeMode === m.id ? 'var(--mustard)' : 'rgba(255,255,255,0.12)',
              color: activeMode === m.id ? 'var(--soil-dark)' : '#fff',
              border: 'none',
              padding: '6px 14px',
              borderRadius: 'var(--radius-pill)',
              fontSize: '0.8rem',
              fontWeight: 700,
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              display: 'flex',
              alignItems: 'center',
              gap: '4px'
            }}
          >
            <span>{m.icon}</span>
            <span>{m.label}</span>
          </button>
        ))}
      </div>
    </>
  );
}
