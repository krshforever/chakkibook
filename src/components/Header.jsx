import React from 'react';
import { Wheat, Droplets, Sun, Moon } from 'lucide-react';
import { useStore } from '../store/useStore';

export default function Header() {
  const activeMode = useStore((state) => state.activeMode || 'chakki');
  const setActiveMode = useStore((state) => state.setActiveMode);
  const theme = useStore((state) => state.theme || 'light');
  const setTheme = useStore((state) => state.setTheme);
  const shop = useStore((state) => state.shop || {});

  const toggleTheme = () => {
    const nextTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(nextTheme);
  };

  return (
    <header style={{ 
      width: '100%', 
      backgroundColor: '#ffffff', 
      borderBottom: '1.5px solid #cbd5e1',
      position: 'sticky',
      top: 0,
      zIndex: 100,
      boxSizing: 'border-box'
    }}>
      <div style={{
        padding: '10px 16px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '12px'
      }}>
        {/* Brand & Shop Title */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <img 
            src="/logo.png" 
            alt="Logo" 
            style={{ 
              width: '36px', 
              height: '36px', 
              borderRadius: '8px', 
              objectFit: 'cover'
            }} 
            onError={(e) => { e.target.style.display = 'none'; }}
          />
          <div>
            <h1 style={{ 
              fontSize: '1.15rem', 
              margin: 0, 
              fontWeight: 800, 
              color: '#020617', 
              letterSpacing: '-0.02em',
              fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif"
            }}>
              Chakkibook
            </h1>
            <p style={{ fontSize: '0.75rem', color: '#475569', margin: 0, fontWeight: 600 }}>
              {shop.name || 'Atta Chakki & Oil Mill'}
            </p>
          </div>
        </div>

        {/* Mode Switcher Pills (Chakki vs Spellar) */}
        <div style={{
          display: 'inline-flex',
          background: '#f1f5f9',
          borderRadius: '0.65rem',
          padding: '3px',
          gap: '4px',
          border: '1px solid #cbd5e1'
        }}>
          <button
            type="button"
            onClick={() => setActiveMode('chakki')}
            style={{
              height: '44px',
              minWidth: '88px',
              padding: '0 12px',
              borderRadius: '0.5rem',
              border: 'none',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
              fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif",
              fontSize: '0.85rem',
              fontWeight: activeMode === 'chakki' ? 800 : 600,
              background: activeMode === 'chakki' ? '#ffffff' : 'transparent',
              color: activeMode === 'chakki' ? '#d97706' : '#475569',
              boxShadow: activeMode === 'chakki' ? '0 2px 4px rgba(0,0,0,0.08)' : 'none',
              transition: 'all 0.15s ease'
            }}
          >
            <Wheat size={16} color={activeMode === 'chakki' ? '#d97706' : '#475569'} />
            <span>Chakki</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveMode('spellar')}
            style={{
              height: '44px',
              minWidth: '88px',
              padding: '0 12px',
              borderRadius: '0.5rem',
              border: 'none',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
              fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif",
              fontSize: '0.85rem',
              fontWeight: activeMode === 'spellar' ? 800 : 600,
              background: activeMode === 'spellar' ? '#ffffff' : 'transparent',
              color: activeMode === 'spellar' ? '#059669' : '#475569',
              boxShadow: activeMode === 'spellar' ? '0 2px 4px rgba(0,0,0,0.08)' : 'none',
              transition: 'all 0.15s ease'
            }}
          >
            <Droplets size={16} color={activeMode === 'spellar' ? '#059669' : '#475569'} />
            <span>Spellar</span>
          </button>
        </div>

        {/* Simple Light/Dark Theme Trigger */}
        <button
          type="button"
          onClick={toggleTheme}
          title={theme === 'light' ? 'Dark Mode' : 'Light Mode'}
          aria-label="Toggle Theme"
          style={{
            width: '44px',
            height: '44px',
            borderRadius: '0.5rem',
            border: '1px solid #cbd5e1',
            background: '#ffffff',
            color: '#475569',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer'
          }}
        >
          {theme === 'light' ? <Moon size={18} /> : <Sun size={18} />}
        </button>
      </div>
    </header>
  );
}
