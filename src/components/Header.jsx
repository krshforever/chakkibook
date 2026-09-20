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
      {/* Top Bar */}
      <div style={{
        padding: '12px 16px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <img 
            src="/logo.png" 
            alt="Chakkibook Logo" 
            style={{ 
              width: '32px', 
              height: '32px', 
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
              color: '#0f172a', 
              letterSpacing: '-0.02em',
              fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif"
            }}>
              Chakkibook
            </h1>
            <p style={{ fontSize: '0.72rem', color: '#64748b', margin: 0, fontWeight: 500 }}>
              {shop.name || 'Atta Chakki & Oil Mill'}
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <button
            type="button"
            onClick={toggleTheme}
            title={theme === 'light' ? 'Switch to Dark Mode' : 'Switch to Light Mode'}
            aria-label="Toggle Theme"
            style={{
              width: '34px',
              height: '34px',
              borderRadius: '0.6rem',
              border: '1px solid #e2e8f0',
              background: '#f8fafc',
              color: '#475569',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              transition: 'all 0.15s ease'
            }}
          >
            {theme === 'light' ? <Moon size={16} /> : <Sun size={16} />}
          </button>

          <button
            type="button"
            onClick={logout}
            title="Sign Out"
            aria-label="Sign Out"
            style={{
              width: '34px',
              height: '34px',
              borderRadius: '0.6rem',
              border: '1px solid #fee2e2',
              background: '#fef2f2',
              color: '#ef4444',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              transition: 'all 0.15s ease'
            }}
          >
            <LogOut size={16} />
          </button>
        </div>
      </div>

      {/* Mode Toggle Bar: Clean Segmented Control */}
      <div style={{
        padding: '0 16px 12px 16px'
      }}>
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          background: '#f1f5f9',
          borderRadius: '0.75rem',
          padding: '3px',
          gap: '4px'
        }}>
          {/* Chakki Option */}
          <button
            type="button"
            onClick={() => setActiveMode('chakki')}
            style={{
              height: '40px',
              borderRadius: '0.6rem',
              border: 'none',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
              fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif",
              fontSize: '0.85rem',
              fontWeight: 700,
              background: activeMode === 'chakki' ? '#ffffff' : 'transparent',
              color: activeMode === 'chakki' ? '#d97706' : '#64748b',
              boxShadow: activeMode === 'chakki' ? '0 1px 3px rgba(0,0,0,0.08)' : 'none',
              transition: 'all 0.2s ease'
            }}
          >
            <Wheat size={16} color={activeMode === 'chakki' ? '#d97706' : '#64748b'} />
            <span>Chakki (Atta/Dana)</span>
          </button>

          {/* Spellar Option */}
          <button
            type="button"
            onClick={() => setActiveMode('spellar')}
            style={{
              height: '40px',
              borderRadius: '0.6rem',
              border: 'none',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
              fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif",
              fontSize: '0.85rem',
              fontWeight: 700,
              background: activeMode === 'spellar' ? '#ffffff' : 'transparent',
              color: activeMode === 'spellar' ? '#059669' : '#64748b',
              boxShadow: activeMode === 'spellar' ? '0 1px 3px rgba(0,0,0,0.08)' : 'none',
              transition: 'all 0.2s ease'
            }}
          >
            <Droplets size={16} color={activeMode === 'spellar' ? '#059669' : '#64748b'} />
            <span>Spellar (Oil/Khali)</span>
          </button>
        </div>
      </div>
    </header>
  );
}
