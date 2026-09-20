import React from 'react';
import { Home, BookOpen, Package, Sparkles, Settings } from 'lucide-react';

export default function BottomNav({ activeTab, setActiveTab }) {
  const navItems = [
    { id: 'home', label: 'Home', icon: Home },
    { id: 'khata', label: 'Khata', icon: BookOpen },
    { id: 'stock', label: 'Stock', icon: Package },
    { id: 'ai', label: 'Chakki AI', icon: Sparkles, isHighlighted: true },
    { id: 'settings', label: 'Settings', icon: Settings }
  ];

  return (
    <nav style={{
      position: 'fixed',
      bottom: 0,
      left: 0,
      right: 0,
      minHeight: '58px',
      height: 'calc(58px + env(safe-area-inset-bottom, 0px))',
      paddingBottom: 'env(safe-area-inset-bottom, 0px)',
      backgroundColor: '#ffffff',
      borderTop: '1.5px solid #cbd5e1',
      display: 'grid',
      gridTemplateColumns: `repeat(${navItems.length}, 1fr)`,
      alignItems: 'center',
      zIndex: 100,
      boxSizing: 'border-box'
    }}>
      {navItems.map((item) => {
        const isActive = activeTab === item.id;
        const Icon = item.icon;
        return (
          <button
            key={item.id}
            type="button"
            onClick={() => setActiveTab(item.id)}
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
              color: isActive ? (item.isHighlighted ? '#d97706' : '#d97706') : (item.isHighlighted ? '#b45309' : '#475569'),
              position: 'relative',
              padding: '2px 0'
            }}
          >
            {isActive && (
              <span style={{
                position: 'absolute',
                top: 0,
                width: '24px',
                height: '3px',
                backgroundColor: '#d97706',
                borderRadius: '0 0 3px 3px'
              }} />
            )}
            
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: item.isHighlighted ? '3px 8px' : '0',
              borderRadius: item.isHighlighted ? '1rem' : '0',
              backgroundColor: item.isHighlighted ? (isActive ? '#fef3c7' : '#fffbeb') : 'transparent',
              border: item.isHighlighted ? '1px solid #fde68a' : 'none'
            }}>
              <Icon size={18} strokeWidth={isActive ? 2.2 : 1.8} color={item.isHighlighted ? '#d97706' : undefined} />
            </div>

            <span style={{
              fontSize: '0.68rem',
              fontWeight: isActive ? 800 : (item.isHighlighted ? 700 : 500),
              fontFamily: "'Inter', system-ui, sans-serif"
            }}>
              {item.label}
            </span>
          </button>
        );
      })}
    </nav>
  );
}
