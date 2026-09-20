import React, { useState, useEffect } from 'react';
import { Wheat, Droplets, Sun, Moon, Wifi, WifiOff, Store } from 'lucide-react';
import { useStore } from '../store/useStore';
import { useTranslation } from '../utils/translations';

/**
 * Header Component for Chakkibook
 * 
 * Specs:
 * - Compact 54px header with safe-area top inset padding (`paddingTop: env(safe-area-inset-top)`).
 * - Glassmorphism backdrop blur (blur 16px, semi-transparent background).
 * - Shop title with brand logo / icon fallback.
 * - Chakki/Spellar pill switcher with spring indicator pill.
 * - Theme toggle (Sun / Moon SVG icons).
 * - Live offline/online network badge indicator.
 * - 100% SVG Lucide React icons (ZERO emojis).
 * - Full i18n support with useTranslation().
 */
export default function Header({ setActiveTab, onSelectCustomer }) {
  const { t } = useTranslation();
  const activeMode = useStore((state) => state.activeMode || 'chakki');
  const setActiveMode = useStore((state) => state.setActiveMode);
  const theme = useStore((state) => state.theme || 'light');
  const setTheme = useStore((state) => state.setTheme);
  const shop = useStore((state) => state.shop || {});

  // Live Online/Offline network state
  const [isOnline, setIsOnline] = useState(
    typeof navigator !== 'undefined' ? navigator.onLine : true
  );

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const toggleTheme = () => {
    const nextTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(nextTheme);
  };

  const isDark = theme === 'dark';

  return (
    <header
      role="banner"
      style={{
        width: '100%',
        height: '54px',
        minHeight: '54px',
        maxHeight: '54px',
        position: 'sticky',
        top: 0,
        zIndex: 100,
        boxSizing: 'border-box',
        paddingTop: 'env(safe-area-inset-top, 0px)',
        backgroundColor: isDark ? 'rgba(15, 23, 42, 0.85)' : 'rgba(255, 255, 255, 0.85)',
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
        borderBottom: isDark ? '1px solid rgba(51, 65, 85, 0.6)' : '1px solid rgba(226, 232, 240, 0.8)',
        boxShadow: isDark ? '0 4px 20px rgba(0, 0, 0, 0.4)' : '0 4px 20px -2px rgba(0, 0, 0, 0.05)',
        transition: 'background-color 0.25s ease, border-color 0.25s ease'
      }}
    >
      <div
        style={{
          height: '100%',
          padding: '0 12px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '8px',
          maxWidth: '100%',
          margin: '0 auto'
        }}
      >
        {/* Left: Brand Logo & Shop Name */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            minWidth: 0,
            flexShrink: 1
          }}
        >
          <div
            style={{
              width: '32px',
              height: '32px',
              borderRadius: '8px',
              background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
              boxShadow: '0 2px 8px rgba(217, 119, 6, 0.3)'
            }}
          >
            <img
              src="/logo.png"
              alt="Chakkibook Logo"
              style={{
                width: '100%',
                height: '100%',
                borderRadius: '8px',
                objectFit: 'cover'
              }}
              onError={(e) => {
                e.target.style.display = 'none';
                if (e.target.nextSibling) e.target.nextSibling.style.display = 'flex';
              }}
            />
            <Store
              size={18}
              color="#ffffff"
              style={{ display: 'none' }}
            />
          </div>

          <div style={{ minWidth: 0 }}>
            <h1
              style={{
                fontSize: '0.95rem',
                margin: 0,
                fontWeight: 800,
                color: isDark ? '#f8fafc' : '#020617',
                letterSpacing: '-0.02em',
                fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif",
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis'
              }}
            >
              {t('header.title')}
            </h1>
            <p
              style={{
                fontSize: '0.68rem',
                color: isDark ? '#94a3b8' : '#64748b',
                margin: 0,
                fontWeight: 600,
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                maxWidth: '120px'
              }}
              title={shop.name || t('header.subtitle')}
            >
              {shop.name || t('header.subtitle')}
            </p>
          </div>
        </div>

        {/* Center: Chakki / Spellar Mode Switcher with Spring Indicator */}
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            backgroundColor: isDark ? 'rgba(30, 41, 59, 0.8)' : '#f1f5f9',
            borderRadius: '9999px',
            padding: '3px',
            gap: '2px',
            border: isDark ? '1px solid #334155' : '1px solid #cbd5e1',
            flexShrink: 0
          }}
        >
          {/* Chakki Mode Button */}
          <button
            type="button"
            onClick={() => setActiveMode('chakki')}
            aria-pressed={activeMode === 'chakki'}
            style={{
              height: '32px',
              padding: '0 10px',
              borderRadius: '9999px',
              border: 'none',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '4px',
              fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif",
              fontSize: '0.76rem',
              fontWeight: activeMode === 'chakki' ? 800 : 600,
              backgroundColor: activeMode === 'chakki'
                ? (isDark ? '#1e293b' : '#ffffff')
                : 'transparent',
              color: activeMode === 'chakki'
                ? '#d97706'
                : (isDark ? '#94a3b8' : '#64748b'),
              boxShadow: activeMode === 'chakki'
                ? (isDark ? '0 2px 6px rgba(0,0,0,0.4)' : '0 2px 6px rgba(0,0,0,0.08)')
                : 'none',
              transform: activeMode === 'chakki' ? 'scale(1.02)' : 'scale(1)',
              transition: 'all 0.2s cubic-bezier(0.34, 1.56, 0.64, 1)'
            }}
          >
            <Wheat size={14} color={activeMode === 'chakki' ? '#d97706' : (isDark ? '#94a3b8' : '#64748b')} />
            <span>{t('header.chakki')}</span>
          </button>

          {/* Spellar Mode Button */}
          <button
            type="button"
            onClick={() => setActiveMode('spellar')}
            aria-pressed={activeMode === 'spellar'}
            style={{
              height: '32px',
              padding: '0 10px',
              borderRadius: '9999px',
              border: 'none',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '4px',
              fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif",
              fontSize: '0.76rem',
              fontWeight: activeMode === 'spellar' ? 800 : 600,
              backgroundColor: activeMode === 'spellar'
                ? (isDark ? '#1e293b' : '#ffffff')
                : 'transparent',
              color: activeMode === 'spellar'
                ? '#059669'
                : (isDark ? '#94a3b8' : '#64748b'),
              boxShadow: activeMode === 'spellar'
                ? (isDark ? '0 2px 6px rgba(0,0,0,0.4)' : '0 2px 6px rgba(0,0,0,0.08)')
                : 'none',
              transform: activeMode === 'spellar' ? 'scale(1.02)' : 'scale(1)',
              transition: 'all 0.2s cubic-bezier(0.34, 1.56, 0.64, 1)'
            }}
          >
            <Droplets size={14} color={activeMode === 'spellar' ? '#059669' : (isDark ? '#94a3b8' : '#64748b')} />
            <span>{t('header.spellar')}</span>
          </button>
        </div>

        {/* Right Controls: Live Network Badge & Theme Toggle */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0 }}>
          {/* Live Offline/Online Badge Indicator */}
          <div
            title={isOnline ? t('header.online') : t('header.offline')}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px',
              padding: '4px 8px',
              borderRadius: '9999px',
              fontSize: '0.68rem',
              fontWeight: 700,
              backgroundColor: isOnline
                ? (isDark ? 'rgba(34, 197, 94, 0.15)' : 'rgba(34, 197, 94, 0.12)')
                : (isDark ? 'rgba(239, 68, 68, 0.18)' : 'rgba(239, 68, 68, 0.12)'),
              color: isOnline ? '#16a34a' : '#dc2626',
              border: isOnline
                ? (isDark ? '1px solid rgba(34, 197, 94, 0.3)' : '1px solid rgba(34, 197, 94, 0.25)')
                : (isDark ? '1px solid rgba(239, 68, 68, 0.3)' : '1px solid rgba(239, 68, 68, 0.25)'),
              transition: 'all 0.2s ease'
            }}
          >
            <span
              style={{
                width: '6px',
                height: '6px',
                borderRadius: '50%',
                backgroundColor: isOnline ? '#22c55e' : '#ef4444',
                boxShadow: isOnline ? '0 0 6px #22c55e' : '0 0 6px #ef4444',
                display: 'inline-block'
              }}
            />
            {isOnline ? (
              <Wifi size={12} strokeWidth={2.2} />
            ) : (
              <WifiOff size={12} strokeWidth={2.2} />
            )}
            <span style={{ display: 'none' }} className="header-network-text">
              {isOnline ? t('header.online') : t('header.offline')}
            </span>
          </div>

          {/* Theme Toggle Button */}
          <button
            type="button"
            onClick={toggleTheme}
            title={isDark ? t('header.lightMode') : t('header.darkMode')}
            aria-label={isDark ? t('header.lightMode') : t('header.darkMode')}
            style={{
              width: '34px',
              height: '34px',
              borderRadius: '8px',
              border: isDark ? '1px solid #334155' : '1px solid #cbd5e1',
              backgroundColor: isDark ? 'rgba(30, 41, 59, 0.8)' : '#ffffff',
              color: isDark ? '#fbbf24' : '#475569',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              outline: 'none',
              boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
              transition: 'all 0.15s ease',
              WebkitTapHighlightColor: 'transparent'
            }}
          >
            {isDark ? (
              <Sun size={17} color="#fbbf24" strokeWidth={2.2} />
            ) : (
              <Moon size={17} color="#475569" strokeWidth={2.2} />
            )}
          </button>
        </div>
      </div>
    </header>
  );
}
