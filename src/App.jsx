import React, { useState, useEffect } from 'react';
import Header from './components/Header';
import BottomNav from './components/BottomNav';
import Dashboard from './pages/Dashboard';
import NewEntry from './pages/NewEntry';
import Khata from './pages/Khata';
import Analytics from './pages/Analytics';
import Settings from './pages/Settings';
import Inventory from './pages/Inventory';
import Login from './pages/Login';
import { onAuthChange } from './firebase/auth';
import { useStore } from './store/useStore';
import { findShopByPhone } from './firebase/firestore';

export default function App() {
  const [activeTab, setActiveTab] = useState('home');
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [initializing, setInitializing] = useState(true);

  const currentUser = useStore((state) => state.currentUser);
  const setAuthUser = useStore((state) => state.setAuthUser);

  useEffect(() => {
    const unsub = onAuthChange(async (user) => {
      if (user) {
        // Extract phone number from email (synthetic email format)
        const phone = user.email ? user.email.split('@')[0] : '';
        let shopId = await findShopByPhone(phone);
        if (!shopId) {
          shopId = `shop_${phone || 'default'}`;
        }
        await setAuthUser(user, shopId, 'owner');
      } else {
        const cur = useStore.getState().currentUser;
        // Only logout if not using local demo / fallback auth mode
        if (cur && !cur.isFallback) {
          useStore.getState().logout();
        }
      }
      setInitializing(false);
    });

    return () => unsub();
  }, [setAuthUser]);

  const handleLoginSuccess = (user, shopId, role) => {
    setAuthUser(user, shopId, role);
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
        backgroundColor: '#0f172a',
        color: '#fbbf24',
        fontFamily: 'sans-serif'
      }}>
        <img 
          src="/logo.png" 
          alt="Logo" 
          style={{ width: '80px', height: '80px', borderRadius: '1rem', marginBottom: '1rem' }} 
          onError={(e) => { e.target.style.display = 'none'; }}
        />
        <h2 style={{ fontSize: '1.25rem', fontWeight: '700' }}>🌾 Chakkibook Load Ho Raha Hai...</h2>
      </div>
    );
  }

  if (!currentUser) {
    return <Login onLoginSuccess={handleLoginSuccess} />;
  }

  return (
    <div className="app-shell">
      <Header />
      
      <main style={{ paddingBottom: '70px' }}>
        {activeTab === 'home' && (
          <Dashboard
            setActiveTab={setActiveTab}
            onSelectCustomer={handleSelectCustomer}
          />
        )}
        {activeTab === 'entry' && (
          <NewEntry
            setActiveTab={setActiveTab}
            initialCustomerId={selectedCustomer?.id}
          />
        )}
        {activeTab === 'khata' && (
          <Khata
            selectedCustomer={selectedCustomer}
            onClearSelectedCustomer={handleClearSelectedCustomer}
          />
        )}
        {activeTab === 'stock' && <Inventory />}
        {activeTab === 'analytics' && <Analytics />}
        {activeTab === 'settings' && <Settings />}
      </main>

      <AIAgentWidget />
      <BottomNav activeTab={activeTab} setActiveTab={setActiveTab} />
    </div>
  );
}
