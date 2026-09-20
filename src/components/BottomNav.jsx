import React from 'react';
import { Home, BookOpen, Bot, Sparkles, Package, Settings } from 'lucide-react';
import { useStore } from '../store/useStore';
import { useTranslation } from '../utils/translations';

/**
 * BottomNav Component for Chakkibook
 * 
 * Specs:
 * - 5-column ergonomic mobile navigation bar.
 * - Safe-area bottom inset padding (`paddingBottom: env(safe-area-inset-bottom)`).
 * - Glassmorphism backdrop blur.
 * - Active indicator pill with active icon scaling physics.
 * - Center highlighted Chakki AI co-pilot tab with pulsating aura ring.
 * - 100% SVG Lucide React icons (ZERO emojis).
 * - Full i18n support with useTranslation().
 */
export default function BottomNav({ activeTab, setActiveTab, onToggleAI, previousTab }) {
  const { t } = useTranslation();
  const theme = useStore((state) => state.theme || 'light');
  const isDark = theme === 'dark';

  const navItems = [
    { 
      id: 'home', 
      label: t('bottomNav.home'), 
      icon: Home, 
      ariaLabel: 'Dashboard Home' 
    },
    { 
      id: 'khata', 
      label: t('bottomNav.khata'), 
      icon: BookOpen, 
      ariaLabel: 'Grahak Khata Ledger' 
    },
    { 
      id: 'ai', 
      label: t('bottomNav.ai'), 
      icon: Bot, 
      isAI: true,
      ariaLabel: 'Chakki AI Co-Pilot Assistant' 
    },
    { 
      id: 'stock', 
      label: t('bottomNav.stock'), 
      icon: Package, 
      ariaLabel: 'Godam Inventory & Stock' 
    },
    { 
      id: 'settings', 
      label: t('bottomNav.settings'), 
      icon: Settings, 
      ariaLabel: 'Shop Settings & Rates' 
    }
  ];

  const handleTabClick = (itemId) => {
    if (itemId === 'ai') {
      if (activeTab === 'ai') {
        if (onToggleAI) {
          onToggleAI();
        } else {
          setActiveTab(previousTab || 'home');
        }
      } else {
        setActiveTab('ai');
      }
      return;
    }
    setActiveTab(itemId);
  };

  return (
    <nav
      className="bottom-nav-container"
      role="navigation"
      aria-label="App Bottom Navigation"
      style={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        height: 'calc(62px + env(safe-area-inset-bottom, 0px))',
        minHeight: '62px',
        backgroundColor: isDark ? 'rgba(15, 23, 42, 0.92)' : 'rgba(255, 255, 255, 0.92)',
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
        borderTop: isDark ? '1px solid rgba(51, 65, 85, 0.6)' : '1px solid rgba(226, 232, 240, 0.8)',
        display: 'grid',
        gridTemplateColumns: 'repeat(5, 1fr)',
        alignItems: 'center',
        zIndex: 100,
        boxSizing: 'border-box',
        boxShadow: isDark ? '0 -4px 24px rgba(0, 0, 0, 0.4)' : '0 -4px 20px rgba(0, 0, 0, 0.05)',
        paddingBottom: 'env(safe-area-inset-bottom, 0px)',
        transition: 'background-color 0.25s ease, border-color 0.25s ease'
      }}
    >
      {navItems.map((item) => {
        const isActive = activeTab === item.id;
        const Icon = item.icon;

        // Custom Highlighted Treatment for Chakki AI Co-Pilot Tab (Center Slot)
        if (item.isAI) {
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => handleTabClick(item.id)}
              className={`nav-tab-item nav-tab-ai ${isActive ? 'active' : ''}`}
              role="tab"
              aria-selected={isActive}
              aria-label={item.ariaLabel}
              style={{
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: 'transparent',
                border: 'none',
                cursor: 'pointer',
                position: 'relative',
                padding: '2px 0',
                outline: 'none',
                WebkitTapHighlightColor: 'transparent'
              }}
            >
              {/* Highlighted AI Capsule Container with Pulsating Aura */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  position: 'relative',
                  padding: isActive ? '5px 14px' : '4px 12px',
                  borderRadius: '9999px',
                  background: isActive
                    ? 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 55%, #7c3aed 100%)'
                    : (isDark
                        ? 'linear-gradient(135deg, rgba(99, 102, 241, 0.25), rgba(139, 92, 246, 0.3))'
                        : 'linear-gradient(135deg, rgba(99, 102, 241, 0.12), rgba(139, 92, 246, 0.16))'),
                  border: isActive
                    ? '1.5px solid rgba(255, 255, 255, 0.7)'
                    : (isDark ? '1px solid rgba(139, 92, 246, 0.45)' : '1px solid rgba(99, 102, 241, 0.35)'),
                  boxShadow: isActive
                    ? '0 4px 16px rgba(99, 102, 241, 0.6), 0 0 12px rgba(168, 85, 247, 0.4)'
                    : '0 2px 6px rgba(99, 102, 241, 0.15)',
                  transform: isActive ? 'translateY(-3px) scale(1.05)' : 'translateY(0) scale(1)',
                  transition: 'all 0.2s cubic-bezier(0.34, 1.56, 0.64, 1)'
                }}
              >
                <Icon
                  size={19}
                  style={{
                    color: isActive ? '#ffffff' : (isDark ? '#a5b4fc' : '#6366f1'),
                    filter: isActive ? 'drop-shadow(0 1px 2px rgba(0,0,0,0.2))' : 'none'
                  }}
                  strokeWidth={isActive ? 2.4 : 2}
                />
                <Sparkles
                  size={11}
                  style={{
                    marginLeft: '3px',
                    color: isActive ? '#fde047' : (isDark ? '#c084fc' : '#8b5cf6')
                  }}
                />

                {/* Pulsating aura beacon dot */}
                <span
                  style={{
                    position: 'absolute',
                    top: '-2px',
                    right: '-2px',
                    width: '7px',
                    height: '7px',
                    borderRadius: '50%',
                    backgroundColor: isActive ? '#22c55e' : '#a855f7',
                    boxShadow: isActive ? '0 0 8px #22c55e' : '0 0 6px rgba(168, 85, 247, 0.5)'
                  }}
                />
              </div>

              {/* Label */}
              <span
                style={{
                  fontSize: '0.67rem',
                  fontWeight: isActive ? 800 : 700,
                  marginTop: '2px',
                  color: isActive
                    ? (isDark ? '#818cf8' : '#6366f1')
                    : (isDark ? '#94a3b8' : '#64748b'),
                  letterSpacing: '0.01em',
                  fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif",
                  transition: 'color 0.15s ease'
                }}
              >
                {item.label}
              </span>
            </button>
          );
        }

        // Standard Tab Items
        return (
          <button
            key={item.id}
            type="button"
            onClick={() => handleTabClick(item.id)}
            className={`nav-tab-item ${isActive ? 'active' : ''}`}
            role="tab"
            aria-selected={isActive}
            aria-label={item.ariaLabel}
            style={{
              height: '100%',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '2px',
              backgroundColor: 'transparent',
              border: 'none',
              cursor: 'pointer',
              color: isActive
                ? '#d97706'
                : (isDark ? '#94a3b8' : '#64748b'),
              position: 'relative',
              padding: '2px 0',
              outline: 'none',
              WebkitTapHighlightColor: 'transparent',
              transition: 'color 0.15s ease'
            }}
          >
            {/* Active Indicator Top Pill */}
            {isActive && (
              <span
                style={{
                  position: 'absolute',
                  top: 0,
                  width: '24px',
                  height: '3px',
                  backgroundColor: '#d97706',
                  borderRadius: '0 0 4px 4px',
                  boxShadow: '0 2px 8px rgba(217, 119, 6, 0.5)',
                  transition: 'all 0.2s ease'
                }}
              />
            )}

            {/* Active Icon Capsule Scaling */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '3px 9px',
                borderRadius: '9999px',
                backgroundColor: isActive
                  ? (isDark ? 'rgba(217, 119, 6, 0.18)' : 'rgba(217, 119, 6, 0.1)')
                  : 'transparent',
                transform: isActive ? 'translateY(-2px) scale(1.1)' : 'translateY(0) scale(1)',
                transition: 'all 0.2s cubic-bezier(0.34, 1.56, 0.64, 1)'
              }}
            >
              <Icon
                size={19}
                strokeWidth={isActive ? 2.4 : 1.9}
                color={isActive ? '#d97706' : (isDark ? '#94a3b8' : '#64748b')}
              />
            </div>

            {/* Label */}
            <span
              style={{
                fontSize: '0.67rem',
                fontWeight: isActive ? 700 : 600,
                fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif",
                letterSpacing: '-0.01em'
              }}
            >
              {item.label}
            </span>
          </button>
        );
      })}
    </nav>
  );
}
