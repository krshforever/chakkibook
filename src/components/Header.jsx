import React from 'react';
import { useStore } from '../store/useStore';

export default function Header() {
  const shop = useStore((state) => state.shop);
  const theme = useStore((state) => state.theme);
  const setTheme = useStore((state) => state.setTheme);

  const toggleTheme = () => {
    const next = theme === 'light' ? 'dark' : 'light';
    setTheme(next);
    document.documentElement.setAttribute('data-theme', next);
  };

  return (
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
            fontSize: '0.85rem'
          }}
        >
          {theme === 'light' ? '🌙 Dark' : '☀️ Light'}
        </button>
      </div>
    </header>
  );
}
