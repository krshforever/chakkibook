import React from 'react';

export default function BottomNav({ activeTab, setActiveTab }) {
  const navItems = [
    { id: 'home', label: 'Home', icon: '🏠' },
    { id: 'entry', label: 'Naya', icon: '➕' },
    { id: 'khata', label: 'Khata', icon: '📖' },
    { id: 'settings', label: 'Rates', icon: '⚙️' }
  ];

  return (
    <nav className="bottom-nav">
      {navItems.map((item) => {
        const isActive = activeTab === item.id;
        return (
          <button
            key={item.id}
            type="button"
            onClick={() => setActiveTab(item.id)}
            className={`bottom-nav-item ${isActive ? 'active' : ''}`}
            style={{
              color: isActive ? 'var(--primary)' : 'var(--text-muted)'
            }}
          >
            <span className="nav-icon">{item.icon}</span>
            <span className="nav-label">{item.label}</span>
          </button>
        );
      })}
    </nav>
  );
}
