import React, { useState, useEffect } from 'react';
import Header from './components/Header';
import BottomNav from './components/BottomNav';
import FloatingActionButton from './components/FloatingActionButton';
import Dashboard from './pages/Dashboard';
import NewEntry from './pages/NewEntry';
import Khata from './pages/Khata';
import Analytics from './pages/Analytics';
import Settings from './pages/Settings';
import Inventory from './pages/Inventory';
import Login from './pages/Login';
import AIAgentWidget from './components/AIAgentWidget';
import ErrorBoundary from './components/ErrorBoundary';
import { onAuthChange } from './firebase/auth';
import { useStore } from './store/useStore';
import { findShopByPhone } from './firebase/firestore';

export default function App() {
  const [activeTab, setActiveTab] = useState('home');
  const [previousTab, setPreviousTab] = useState('home');
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [initializing, setInitializing] = useState(false);

  const currentUser = useStore((state) => state.currentUser);
  const setAuthUser = useStore((state) => state.setAuthUser);

  useEffect(() => {
    let isMounted = true;
    
    // Safety timer: Never allow auth initialization to block UI for more than 400ms
    const timer = setTimeout(() => {
      if (isMounted) setInitializing(false);
    }, 400);

    const unsub = onAuthChange(async (user) => {
      try {
        if (user) {
          const phone = user.email ? user.email.split('@')[0] : '';
          let shopId = null;
          try {
            shopId = await findShopByPhone(phone);
          } catch (e) {
            console.warn('Firestore findShopByPhone notice:', e);
          }
          if (!shopId) {
            shopId = `shop_${phone || 'default'}`;
          }
          await setAuthUser(user, shopId, 'owner');
        }
      } catch (err) {
        console.warn('onAuthChange notice:', err);
      } finally {
        if (isMounted) {
          setInitializing(false);
          clearTimeout(timer);
        }
      }
    });

    return () => {
      isMounted = false;
      clearTimeout(timer);
      unsub();
    };
  }, [setAuthUser]);

  const handleLoginSuccess = (user, shopId, role) => {
    setAuthUser(user, shopId, role);
  };

  const handleNavChange = (newTab) => {
    if (newTab === 'ai') {
      if (activeTab === 'ai') {
        setActiveTab(previousTab || 'home');
      } else {
        setPreviousTab(activeTab);
        setActiveTab('ai');
      }
    } else {
      setPreviousTab(newTab);
      setActiveTab(newTab);
    }
  };

  const handleSelectCustomer = (customer) => {
    setSelectedCustomer(customer);
  };

  const handleClearSelectedCustomer = () => {
    setSelectedCustomer(null);
  };

  if (initializing) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#fffbeb',
        color: '#d97706',
        fontFamily: "'Inter', system-ui, sans-serif"
      }}>
        <img 
          src="/logo.png" 
          alt="Logo" 
          style={{ width: '80px', height: '80px', borderRadius: '1rem', marginBottom: '1rem' }} 
          onError={(e) => { e.target.style.display = 'none'; }}
        />
        <h2 style={{ fontSize: '1.25rem', fontWeight: '700', color: '#b45309' }}>🌾 Chakkibook Load Ho Raha Hai...</h2>
      </div>
    );
  }

  // When AI drawer is active, preserve current main view underneath the backdrop blur
  const currentViewTab = activeTab === 'ai' ? previousTab : activeTab;

  return (
    <ErrorBoundary>
      {!currentUser ? (
        <Login onLoginSuccess={handleLoginSuccess} />
      ) : (
        <div className="app-shell" style={{ position: 'relative', minHeight: '100vh' }}>
          <Header setActiveTab={handleNavChange} onSelectCustomer={handleSelectCustomer} />
          
          <main style={{ paddingBottom: 'calc(80px + env(safe-area-inset-bottom, 0px))' }}>
            {currentViewTab === 'home' && (
              <Dashboard
                setActiveTab={handleNavChange}
                onSelectCustomer={handleSelectCustomer}
              />
            )}
            {currentViewTab === 'entry' && (
              <NewEntry
                setActiveTab={handleNavChange}
                initialCustomerId={selectedCustomer?.id}
              />
            )}
            {currentViewTab === 'khata' && (
              <Khata
                selectedCustomer={selectedCustomer}
                onClearSelectedCustomer={handleClearSelectedCustomer}
              />
            )}
            {currentViewTab === 'stock' && <Inventory />}
            {currentViewTab === 'analytics' && <Analytics />}
            {currentViewTab === 'settings' && <Settings />}
          </main>

          {/* Big '+' Floating Action Button (FAB) at Bottom-Right */}
          <FloatingActionButton
            activeTab={activeTab}
            onOpenEntry={() => handleNavChange('entry')}
          />

          {/* ChakkiBot AI Drawer Overlay */}
          <AIAgentWidget
            forceOpen={activeTab === 'ai'}
            onCloseTab={() => setActiveTab(previousTab || 'home')}
          />

          {/* 5-Tab Bottom Navigation with Highlighted ChakkiBot AI Tab */}
          <BottomNav
            activeTab={activeTab}
            setActiveTab={handleNavChange}
            previousTab={previousTab}
            onToggleAI={() => setActiveTab(previousTab || 'home')}
          />
        </div>
      )}
    </ErrorBoundary>
  );
}
