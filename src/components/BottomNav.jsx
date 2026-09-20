import React from 'react';
import { Home, BookOpen, Bot, Sparkles, Package, Settings } from 'lucide-react';

/**
 * BottomNav Component for Chakkibook
 * 5-tab ergonomic mobile layout with highlighted ChakkiBot AI center tab:
 * 1. Home (Dashboard)
 * 2. Khata (Customer Accounts & Ledger)
 * 3. Chakki AI (Center Highlighted AI Co-pilot Tab)
 * 4. Stock (Godam Inventory & Grain/Oil/Khali)
 * 5. Settings (Shop Rates, Info, Operators)
 */
export default function BottomNav({ activeTab, setActiveTab, onToggleAI, previousTab }) {
  const navItems = [
    { 
      id: 'home', 
      label: 'Home', 
      icon: Home, 
      ariaLabel: 'Dashboard Home' 
    },
    { 
      id: 'khata', 
      label: 'Khata', 
      icon: BookOpen, 
      ariaLabel: 'Grahak Khata Ledger' 
    },
    { 
      id: 'ai', 
      label: 'Chakki AI', 
      icon: Bot, 
      isAI: true,
      ariaLabel: 'ChakkiBot AI Assistant' 
    },
    { 
      id: 'stock', 
      label: 'Stock', 
      icon: Package, 
      ariaLabel: 'Godam Inventory & Stock' 
    },
    { 
      id: 'settings', 
      label: 'Settings', 
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
        height: 'calc(60px + env(safe-area-inset-bottom, 0px))',
        minHeight: '60px',
        backgroundColor: 'var(--card, #ffffff)',
        borderTop: '1px solid var(--border, #cbd5e1)',
        display: 'grid',
        gridTemplateColumns: 'repeat(5, 1fr)',
        alignItems: 'center',
        zIndex: 100,
        boxSizing: 'border-box',
        boxShadow: '0 -4px 20px rgba(0, 0, 0, 0.05)',
        paddingBottom: 'env(safe-area-inset-bottom, 0px)'
      }}
    >
      {navItems.map((item) => {
        const isActive = activeTab === item.id;
        const Icon = item.icon;

        // Custom Highlighted Treatment for ChakkiBot AI Tab (Center Slot)
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
                background: 'transparent',
                border: 'none',
                cursor: 'pointer',
                position: 'relative',
                padding: '2px 0',
                outline: 'none',
                WebkitTapHighlightColor: 'transparent'
              }}
            >
              {/* Highlighted AI Capsule Container */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  position: 'relative',
                  padding: isActive ? '4px 14px' : '3px 12px',
                  borderRadius: '9999px',
                  background: isActive
                    ? 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 55%, #7c3aed 100%)'
                    : 'linear-gradient(135deg, rgba(99, 102, 241, 0.12), rgba(139, 92, 246, 0.16))',
                  border: isActive
                    ? '1.5px solid rgba(255, 255, 255, 0.65)'
                    : '1px solid rgba(99, 102, 241, 0.35)',
                  boxShadow: isActive
                    ? '0 4px 14px rgba(99, 102, 241, 0.5), 0 0 10px rgba(168, 85, 247, 0.35)'
                    : '0 2px 6px rgba(99, 102, 241, 0.15)',
                  transform: isActive ? 'translateY(-2px)' : 'none',
                  transition: 'all 0.2s cubic-bezier(0.34, 1.56, 0.64, 1)'
                }}
              >
                <Icon
                  size={19}
                  style={{
                    color: isActive ? '#ffffff' : '#6366f1',
                    filter: isActive ? 'drop-shadow(0 1px 2px rgba(0,0,0,0.2))' : 'none'
                  }}
                  strokeWidth={isActive ? 2.4 : 2}
                />
                <Sparkles
                  size={11}
                  style={{
                    marginLeft: '3px',
                    color: isActive ? '#fde047' : '#8b5cf6'
                  }}
                />
                {/* Active pulsating beacon dot */}
                <span
                  style={{
                    position: 'absolute',
                    top: '-2px',
                    right: '-2px',
                    width: '7px',
                    height: '7px',
                    borderRadius: '50%',
                    backgroundColor: isActive ? '#22c55e' : '#a855f7',
                    boxShadow: isActive ? '0 0 6px #22c55e' : 'none'
                  }}
                />
              </div>

              {/* Label */}
              <span
                style={{
                  fontSize: '0.68rem',
                  fontWeight: isActive ? 800 : 700,
                  marginTop: '2px',
                  color: isActive ? '#6366f1' : '#64748b',
                  letterSpacing: '0.01em',
                  fontFamily: "'Inter', system-ui, sans-serif",
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
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
              color: isActive ? '#d97706' : '#64748b',
              position: 'relative',
              padding: '2px 0',
              outline: 'none',
              WebkitTapHighlightColor: 'transparent',
              transition: 'color 0.15s ease'
            }}
          >
            {isActive && (
              <span
                style={{
                  position: 'absolute',
                  top: 0,
                  width: '26px',
                  height: '2.5px',
                  backgroundColor: '#d97706',
                  borderRadius: '0 0 3px 3px',
                  boxShadow: '0 1px 4px rgba(217, 119, 6, 0.4)'
                }}
              />
            )}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '2px 8px',
                borderRadius: '9999px',
                backgroundColor: isActive ? 'rgba(217, 119, 6, 0.08)' : 'transparent',
                transition: 'background-color 0.15s ease, transform 0.15s ease',
                transform: isActive ? 'translateY(-1px)' : 'none'
              }}
            >
              <Icon size={19} strokeWidth={isActive ? 2.4 : 1.8} />
            </div>
            <span
              style={{
                fontSize: '0.68rem',
                fontWeight: isActive ? 700 : 500,
                fontFamily: "'Inter', system-ui, sans-serif"
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
