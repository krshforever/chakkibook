import React from 'react';
import { Home, PlusCircle, BookOpen, Package, Settings } from 'lucide-react';

export default function BottomNav({ activeTab, setActiveTab }) {
  const navItems = [
    { id: 'home', label: 'Home', icon: Home },
    { id: 'entry', label: 'Nayi Entry', icon: PlusCircle },
    { id: 'khata', label: 'Khata', icon: BookOpen },
    { id: 'stock', label: 'Stock', icon: Package },
    { id: 'settings', label: 'Settings', icon: Settings }
  ];

  return (
    <nav style={{
      position: 'fixed',
      bottom: 0,
      left: 0,
      right: 0,
      height: '56px',
      backgroundColor: '#ffffff',
      borderTop: '1px solid #e2e8f0',
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
              color: isActive ? '#d97706' : '#64748b',
              position: 'relative',
              padding: '2px 0'
            }}
          >
            {isActive && (
              <span style={{
                position: 'absolute',
                top: 0,
                width: '24px',
                height: '2px',
                backgroundColor: '#d97706',
                borderRadius: '0 0 2px 2px'
              }} />
            )}
            <Icon size={18} strokeWidth={isActive ? 2.2 : 1.7} />
            <span style={{
              fontSize: '0.68rem',
              fontWeight: isActive ? 700 : 500,
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
