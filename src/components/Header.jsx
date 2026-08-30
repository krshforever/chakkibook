import React from 'react';
import { useStore } from '../store/useStore';

export default function Header() {
  const activeMode = useStore((state) => state.activeMode);
  const setActiveMode = useStore((state) => state.setActiveMode);
  const theme = useStore((state) => state.theme);
  const setTheme = useStore((state) => state.setTheme);
  const shop = useStore((state) => state.shop);

  const toggleTheme = () => {
    const nextTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(nextTheme);
  };

  return (
    <header style={{ width: '100%' }}>
      {/* Top Bar */}
      <div className="top-header">
        <div className="app-title-group">
          <div>
            <h1 style={{ fontSize: '1.25rem', margin: 0, display: 'flex', alignItems: 'center', gap: '6px' }}>
              🌾 Chakkibook
            </h1>
            <p style={{ fontSize: '0.72rem', opacity: 0.85, margin: 0, fontWeight: 500 }}>
              {shop.name || 'Vanshu Atta Chakki & Oil Mill'}
            </p>
          </div>
        </div>

        <button
          onClick={toggleTheme}
          className="theme-toggle-btn"
          title={theme === 'light' ? 'Switch to Dark Mode' : 'Switch to Light Mode'}
          aria-label="Toggle Theme"
        >
          {theme === 'light' ? '🌙' : '☀️'}
        </button>
      </div>

      {/* Mode Toggle Bar: Chakki vs Spellar */}
      <div className="mode-toggle-container">
        <div className="mode-toggle">
          {/* Chakki Option */}
          <button
            type="button"
            onClick={() => setActiveMode('chakki')}
            className={`mode-toggle-btn ${activeMode === 'chakki' ? 'active' : 'inactive'}`}
            style={{
              background: activeMode === 'chakki' ? 'var(--primary)' : 'rgba(255,255,255,0.08)',
              color: activeMode === 'chakki' ? '#ffffff' : 'rgba(255,255,255,0.7)',
            }}
          >
            <div className="mode-title">
              <span>🌾</span>
              <span>CHAKKI</span>
            </div>
            <div className="mode-sub">Atta & Dana</div>
          </button>

          {/* Spellar Option */}
          <button
            type="button"
            onClick={() => setActiveMode('spellar')}
            className={`mode-toggle-btn ${activeMode === 'spellar' ? 'active' : 'inactive'}`}
            style={{
              background: activeMode === 'spellar' ? 'var(--primary)' : 'rgba(255,255,255,0.08)',
              color: activeMode === 'spellar' ? '#ffffff' : 'rgba(255,255,255,0.7)',
            }}
          >
            <div className="mode-title">
              <span>🫒</span>
              <span>SPELLAR</span>
            </div>
            <div className="mode-sub">Sarson Tel</div>
          </button>
        </div>
      </div>
    </header>
  );
}
