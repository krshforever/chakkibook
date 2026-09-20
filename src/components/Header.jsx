import React from 'react';
import { Wheat, Droplets, Sun, Moon, LogOut } from 'lucide-react';
import { useStore } from '../store/useStore';

export default function Header() {
  const activeMode = useStore((state) => state.activeMode || 'chakki');
  const setActiveMode = useStore((state) => state.setActiveMode);
  const theme = useStore((state) => state.theme || 'light');
  const setTheme = useStore((state) => state.setTheme);
  const shop = useStore((state) => state.shop || {});
  const logout = useStore((state) => state.logout);

  const toggleTheme = () => {
    const nextTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(nextTheme);
  };

  return (
    <header style={{ 
      width: '100%', 
      backgroundColor: '#ffffff', 
      borderBottom: '1px solid #e2e8f0',
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
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <img 
            src="/logo.png" 
            alt="Logo" 
            style={{ 
              width: '28px', 
              height: '28px', 
              borderRadius: '6px', 
              objectFit: 'cover'
            }} 
            onError={(e) => { e.target.style.display = 'none'; }}
          />
          <div>
            <h1 style={{ 
              fontSize: '1rem', 
              margin: 0, 
              fontWeight: 700, 
              color: '#0f172a', 
              letterSpacing: '-0.02em',
              fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif"
            }}>
              Chakkibook
            </h1>
            <p style={{ fontSize: '0.68rem', color: '#64748b', margin: 0, fontWeight: 500 }}>
              {shop.name || 'Atta Chakki & Oil Mill'}
            </p>
          </div>
        </div>

        {/* Compact Mode Switcher (Chakki vs Spellar) */}
        <div style={{
          display: 'inline-flex',
          background: '#f1f5f9',
          borderRadius: '0.5rem',
          padding: '2px',
          gap: '2px'
        }}>
          <button
            type="button"
            onClick={() => setActiveMode('chakki')}
            style={{
              height: '32px',
              padding: '0 10px',
              borderRadius: '0.4rem',
              border: 'none',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif",
              fontSize: '0.75rem',
              fontWeight: activeMode === 'chakki' ? 700 : 500,
              background: activeMode === 'chakki' ? '#ffffff' : 'transparent',
              color: activeMode === 'chakki' ? '#d97706' : '#64748b',
              boxShadow: activeMode === 'chakki' ? '0 1px 2px rgba(0,0,0,0.06)' : 'none',
              transition: 'all 0.15s ease'
            }}
          >
            <Wheat size={14} color={activeMode === 'chakki' ? '#d97706' : '#64748b'} />
            <span>Chakki</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveMode('spellar')}
            style={{
              height: '32px',
              padding: '0 10px',
              borderRadius: '0.4rem',
              border: 'none',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif",
              fontSize: '0.75rem',
              fontWeight: activeMode === 'spellar' ? 700 : 500,
              background: activeMode === 'spellar' ? '#ffffff' : 'transparent',
              color: activeMode === 'spellar' ? '#059669' : '#64748b',
              boxShadow: activeMode === 'spellar' ? '0 1px 2px rgba(0,0,0,0.06)' : 'none',
              transition: 'all 0.15s ease'
            }}
          >
            <Droplets size={14} color={activeMode === 'spellar' ? '#059669' : '#64748b'} />
            <span>Spellar</span>
          </button>
        </div>

        {/* Quick Utilities: Theme & Logout */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <button
            type="button"
            onClick={toggleTheme}
            title={theme === 'light' ? 'Switch to Dark Mode' : 'Switch to Light Mode'}
            aria-label="Toggle Theme"
            style={{
              width: '32px',
              height: '32px',
              borderRadius: '0.5rem',
              border: '1px solid #e2e8f0',
              background: '#ffffff',
              color: '#64748b',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer'
            }}
          >
            {theme === 'light' ? <Moon size={14} /> : <Sun size={14} />}
          </button>

          <button
            type="button"
            onClick={logout}
            title="Sign Out"
            aria-label="Sign Out"
            style={{
              width: '32px',
              height: '32px',
              borderRadius: '0.5rem',
              border: '1px solid #fee2e2',
              background: '#ffffff',
              color: '#dc2626',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer'
            }}
          >
            <LogOut size={14} />
          </button>
        </div>
      </div>
    </header>
  );
}
