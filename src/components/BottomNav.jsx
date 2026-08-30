import React from 'react';

export default function BottomNav({ activeTab, setActiveTab }) {
  const navs = [
    { id: 'home', label: 'Home', icon: '🏠' },
    { id: 'entry', label: '+ Entry', icon: '⚡' },
    { id: 'khata', label: 'Khata', icon: '📖' },
    { id: 'inventory', label: 'Stock', icon: '🫒' },
    { id: 'settings', label: 'Rates', icon: '⚙️' }
  ];

  return (
    <nav className="bottom-nav">
      {navs.map((item) => (
        <button
          key={item.id}
          onClick={() => setActiveTab(item.id)}
          className={`nav-item ${activeTab === item.id ? 'active' : ''}`}
          style={{ background: 'none', border: 'none', cursor: 'pointer' }}
        >
          <span style={{ fontSize: '1.3rem' }}>{item.icon}</span>
          <span>{item.label}</span>
        </button>
      ))}
    </nav>
  );
}
