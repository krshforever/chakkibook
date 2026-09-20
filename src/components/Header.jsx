import React, { useState, useRef, useEffect } from 'react';
import { 
  Wheat, 
  Droplets, 
  Sun, 
  Moon, 
  Search, 
  LogOut, 
  User, 
  X,
  Store
} from 'lucide-react';
import { useStore } from '../store/useStore';
import { logoutUser } from '../firebase/auth';

export default function Header({ setActiveTab, onSelectCustomer }) {
  const activeMode = useStore((state) => state.activeMode);
  const setActiveMode = useStore((state) => state.setActiveMode);
  const theme = useStore((state) => state.theme);
  const setTheme = useStore((state) => state.setTheme);
  const shop = useStore((state) => state.shop);
  const currentUser = useStore((state) => state.currentUser);
  const userRole = useStore((state) => state.userRole);
  const logout = useStore((state) => state.logout);
  const customers = useStore((state) => state.customers) || [];
  const boris = useStore((state) => state.boris) || [];

  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [logoError, setLogoError] = useState(false);
  const searchInputRef = useRef(null);

  useEffect(() => {
    if (isSearchOpen && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [isSearchOpen]);

  const toggleTheme = () => {
    const nextTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(nextTheme);
  };

  const handleLogout = async () => {
    if (window.confirm('Kya aap Chakkibook se logout karna chahte hain?')) {
      try {
        await logoutUser();
      } catch (err) {
        console.warn('Logout notice:', err);
      }
      logout();
    }
  };

  // Filter search results
  const trimmedQuery = searchQuery.trim().toLowerCase();
  const searchResults = trimmedQuery ? {
    customers: customers.filter(c => 
      c.name?.toLowerCase().includes(trimmedQuery) || 
      c.phone?.includes(trimmedQuery) ||
      c.village?.toLowerCase().includes(trimmedQuery)
    ).slice(0, 4),
    boris: boris.filter(b => 
      String(b.boriNumber || '').toLowerCase().includes(trimmedQuery) ||
      b.customerName?.toLowerCase().includes(trimmedQuery) ||
      b.grainType?.toLowerCase().includes(trimmedQuery)
    ).slice(0, 4)
  } : { customers: [], boris: [] };

  const handleCustomerClick = (customer) => {
    if (onSelectCustomer) {
      onSelectCustomer(customer);
    }
    if (setActiveTab) {
      setActiveTab('khata');
    }
    setIsSearchOpen(false);
    setSearchQuery('');
  };

  const handleBoriClick = (bori) => {
    const matchedCustomer = customers.find(c => c.id === bori.customerId || c.name === bori.customerName);
    if (matchedCustomer && onSelectCustomer) {
      onSelectCustomer(matchedCustomer);
    }
    if (setActiveTab) {
      setActiveTab('home');
    }
    setIsSearchOpen(false);
    setSearchQuery('');
  };

  return (
    <header className="main-app-header" style={{ width: '100%' }}>
      {/* Top Header Bar */}
      <div className="top-header">
        {/* Left: Shop Logo & Crisp Title Hierarchy */}
        <div className="app-title-group">
          <div className="header-logo-container">
            {!logoError ? (
              <img 
                src="/logo.png" 
                alt="Chakkibook Logo" 
                className="header-shop-logo"
                onError={() => setLogoError(true)}
              />
            ) : (
              <div className="header-shop-avatar-fallback">
                {activeMode === 'spellar' ? (
                  <Droplets size={18} className="shop-avatar-icon" />
                ) : (
                  <Wheat size={18} className="shop-avatar-icon" />
                )}
              </div>
            )}
          </div>

          <div className="header-text-stack">
            <h1 className="header-shop-name" title={shop.name || 'Vanshu Atta Chakki & Oil Mill'}>
              {shop.name || 'Vanshu Atta Chakki & Oil Mill'}
            </h1>
            <div className="header-sub-hierarchy">
              <span className="header-owner-badge">
                <User size={10} style={{ display: 'inline', marginRight: '3px' }} />
                {shop.ownerName || 'Bhaiya'}
              </span>
              <span className="header-dot-sep">•</span>
              <span className="header-system-tag">Chakkibook Enterprise</span>
            </div>
          </div>
        </div>

        {/* Right: Actions Cluster */}
        <div className="header-actions-group">
          {/* Live Pill Indicator */}
          <span className="header-live-pill" title="System Status: Connected">
            <span className="header-live-dot"></span>
            <span>LIVE</span>
          </span>

          {/* Quick Search Button */}
          <button
            type="button"
            onClick={() => setIsSearchOpen(!isSearchOpen)}
            className={`header-action-btn ${isSearchOpen ? 'active' : ''}`}
            title="Grahak ya Bori khojein"
            aria-label="Quick Search"
          >
            <Search size={16} />
          </button>

          {/* User Profile / Role Chip */}
          <div 
            className="header-user-chip" 
            title={`Logged in as: ${currentUser?.email || 'User'} (${userRole || 'owner'})`}
          >
            <User size={13} />
            <span className="user-role-label">{userRole === 'operator' ? 'Staff' : 'Admin'}</span>
          </div>

          {/* Theme Toggle Button (Lucide Sun/Moon) */}
          <button
            type="button"
            onClick={toggleTheme}
            className="header-action-btn theme-toggle-btn"
            title={theme === 'light' ? 'Switch to Dark Mode' : 'Switch to Light Mode'}
            aria-label="Toggle Theme"
          >
            {theme === 'light' ? <Moon size={16} /> : <Sun size={16} />}
          </button>

          {/* Logout Button */}
          <button
            type="button"
            onClick={handleLogout}
            className="header-action-btn logout-action-btn"
            title="Logout"
            aria-label="Logout"
          >
            <LogOut size={15} />
          </button>
        </div>
      </div>

      {/* Global Quick Search Dropdown / Bar */}
      {isSearchOpen && (
        <div className="header-search-tray">
          <div className="header-search-bar">
            <Search size={16} className="header-search-input-icon" />
            <input
              ref={searchInputRef}
              type="text"
              className="header-search-input"
              placeholder="Grahak naam, phone, bori no. khojein..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Escape') {
                  setIsSearchOpen(false);
                }
              }}
            />
            {searchQuery && (
              <button
                type="button"
                className="header-search-clear"
                onClick={() => setSearchQuery('')}
                aria-label="Clear Search"
              >
                <X size={14} />
              </button>
            )}
            <button
              type="button"
              className="header-search-close"
              onClick={() => setIsSearchOpen(false)}
              aria-label="Close Search"
            >
              <X size={16} />
            </button>
          </div>

          {/* Search Live Results */}
          {trimmedQuery && (
            <div className="header-search-results">
              {searchResults.customers.length === 0 && searchResults.boris.length === 0 ? (
                <div className="search-empty-state">
                  Koi customer ya bori nahi mili "{searchQuery}" ke liye
                </div>
              ) : (
                <>
                  {searchResults.customers.length > 0 && (
                    <div className="search-results-section">
                      <div className="search-section-header">Grahak ({searchResults.customers.length})</div>
                      {searchResults.customers.map(c => (
                        <div 
                          key={c.id} 
                          className="search-result-row"
                          onClick={() => handleCustomerClick(c)}
                        >
                          <div className="result-main">
                            <span className="result-name">{c.name}</span>
                            <span className="result-sub">{c.phone} {c.village ? `• ${c.village}` : ''}</span>
                          </div>
                          {c.balance > 0 ? (
                            <span className="result-due-pill">₹{c.balance} Baki</span>
                          ) : (
                            <span className="result-paid-pill">Chukta</span>
                          )}
                        </div>
                      ))}
                    </div>
                  )}

                  {searchResults.boris.length > 0 && (
                    <div className="search-results-section">
                      <div className="search-section-header">Boris ({searchResults.boris.length})</div>
                      {searchResults.boris.map(b => (
                        <div 
                          key={b.id} 
                          className="search-result-row"
                          onClick={() => handleBoriClick(b)}
                        >
                          <div className="result-main">
                            <span className="result-name">
                              Bori #{b.boriNumber || b.id.slice(-4)} • {b.grainType || 'Wheat'}
                            </span>
                            <span className="result-sub">{b.customerName} • {b.weight} kg</span>
                          </div>
                          <span className={`result-status-pill ${b.status}`}>
                            {b.status === 'ready' ? 'Taiyar' : b.status === 'in_progress' ? 'Pisai Chalu' : 'Jama'}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </>
              )}
            </div>
          )}
        </div>
      )}

      {/* Crisp Mode Switch Pills: Chakki vs Spellar */}
      <div className="mode-toggle-container">
        <div className="mode-toggle" role="tablist" aria-label="Machine Operating Mode">
          {/* Chakki Pill Button */}
          <button
            type="button"
            role="tab"
            aria-selected={activeMode === 'chakki'}
            onClick={() => setActiveMode('chakki')}
            className={`mode-toggle-btn ${activeMode === 'chakki' ? 'active active-chakki' : 'inactive'}`}
          >
            <div className="mode-title">
              <Wheat size={18} className="mode-lucide-icon" strokeWidth={activeMode === 'chakki' ? 2.5 : 2} />
              <span>CHAKKI</span>
            </div>
            <div className="mode-sub">Atta & Dana</div>
          </button>

          {/* Spellar Pill Button */}
          <button
            type="button"
            role="tab"
            aria-selected={activeMode === 'spellar'}
            onClick={() => setActiveMode('spellar')}
            className={`mode-toggle-btn ${activeMode === 'spellar' ? 'active active-spellar' : 'inactive'}`}
          >
            <div className="mode-title">
              <Droplets size={18} className="mode-lucide-icon" strokeWidth={activeMode === 'spellar' ? 2.5 : 2} />
              <span>SPELLAR</span>
            </div>
            <div className="mode-sub">Sarson Tel</div>
          </button>
        </div>
      </div>
    </header>
  );
}
