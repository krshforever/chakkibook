import React from 'react';
import { 
  Home, 
  PlusCircle, 
  BookOpen, 
  Package, 
  BarChart3, 
  Settings 
} from 'lucide-react';

export default function BottomNav({ activeTab, setActiveTab }) {
  const navItems = [
    { id: 'home', label: 'Home', icon: Home },
    { id: 'entry', label: 'Naya', icon: PlusCircle },
    { id: 'khata', label: 'Khata', icon: BookOpen },
    { id: 'stock', label: 'Stock', icon: Package },
    { id: 'analytics', label: 'Hisab', icon: BarChart3 },
    { id: 'settings', label: 'Setting', icon: Settings }
  ];

  return (
    <nav className="bottom-nav" role="navigation" aria-label="Bottom Navigation">
      {navItems.map((item) => {
        const isActive = activeTab === item.id;
        const IconComponent = item.icon;

        return (
          <button
            key={item.id}
            type="button"
            onClick={() => setActiveTab(item.id)}
            className={`bottom-nav-item ${isActive ? 'active' : ''}`}
            aria-label={item.label}
            aria-current={isActive ? 'page' : undefined}
          >
            <div className="nav-icon-pill">
              <IconComponent 
                size={19} 
                className="nav-icon" 
                strokeWidth={isActive ? 2.4 : 1.8} 
              />
            </div>
            <span className="nav-label">{item.label}</span>
          </button>
        );
      })}
    </nav>
  );
}
