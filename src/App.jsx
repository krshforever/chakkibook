import React, { useState, useEffect } from 'react';
import AppBar from './components/layout/AppBar';
import BottomNav from './components/layout/BottomNav';
import Dashboard from './pages/Dashboard';
import NewEntry from './pages/NewEntry';
import Khata from './pages/Khata';
import Inventory from './pages/Inventory';
import Settings from './pages/Settings';
import Login from './pages/Login';
import AISheet from './components/features/ai/AISheet';
import ErrorBoundary from './components/ErrorBoundary';
import Modal from './components/ui/Modal';
import { onAuthChange } from './firebase/auth';
import { useStore } from './store/useStore';
import { findShopByPhone } from './firebase/firestore';

export default function App() {
  const [activeTab, setActiveTab] = useState('dashboard'); // 'dashboard' | 'khata' | 'stock'
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [initializing, setInitializing] = useState(false);

  // Modals & Drawers
  const [isNewEntryOpen, setIsNewEntryOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  const currentUser = useStore((state) => state.currentUser);
  const setAuthUser = useStore((state) => state.setAuthUser);
  const isAISheetOpen = useStore((state) => state.isAISheetOpen);
  const closeAISheet = useStore((state) => state.closeAISheet);

  useEffect(() => {
    let isMounted = true;
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
          if (!shopId) shopId = `shop_${phone || 'default'}`;
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

  const handleSelectCustomer = (customer) => {
    setSelectedCustomer(customer);
    setActiveTab('khata');
  };

  const handleClearSelectedCustomer = () => {
    setSelectedCustomer(null);
  };

  if (initializing) {
    return (
      <div
        style={{
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: '#F7F3EB',
          color: '#C96A00',
          fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif"
        }}
      >
        <img
          src="/logo.png"
          alt="Logo"
          style={{ width: '80px', height: '80px', borderRadius: '1rem', marginBottom: '1rem' }}
          onError={(e) => { e.target.style.display = 'none'; }}
        />
        <h2 style={{ fontSize: '1.25rem', fontWeight: '700', color: '#9C5300' }}>
          🌾 Chakkibook V2.0 Load Ho Raha Hai...
        </h2>
      </div>
    );
  }

  return (
    <ErrorBoundary>
      {!currentUser ? (
        <Login onLoginSuccess={handleLoginSuccess} />
      ) : (
        <div className="app-shell">
          {/* App Bar (Header with shop name, mode switcher, language, profile avatar) */}
          <AppBar onOpenSettings={() => setIsSettingsOpen(true)} />

          {/* Main View Area */}
          <main style={{ paddingBottom: 'calc(80px + env(safe-area-inset-bottom, 0px))' }}>
            {activeTab === 'dashboard' && (
              <Dashboard
                setActiveTab={setActiveTab}
                onSelectCustomer={handleSelectCustomer}
                onOpenNewEntry={() => setIsNewEntryOpen(true)}
              />
            )}

            {activeTab === 'khata' && (
              <Khata
                selectedCustomer={selectedCustomer}
                onClearSelectedCustomer={handleClearSelectedCustomer}
                onOpenNewEntry={() => setIsNewEntryOpen(true)}
              />
            )}

            {activeTab === 'stock' && <Inventory />}
          </main>

          {/* 3-Tab Bottom Navigation + Floating Action Button (FAB) */}
          <BottomNav
            activeTab={activeTab}
            setActiveTab={setActiveTab}
            onOpenNewEntry={() => setIsNewEntryOpen(true)}
          />

          {/* New Entry Modal Sheet */}
          <Modal
            isOpen={isNewEntryOpen}
            onClose={() => setIsNewEntryOpen(false)}
            title="Nayi Bori Entry"
            subtitle="Quick entry for flour grinding or oil expelling"
          >
            <NewEntry
              setActiveTab={(tab) => {
                setIsNewEntryOpen(false);
                setActiveTab(tab);
              }}
              initialCustomerId={selectedCustomer?.id}
            />
          </Modal>

          {/* Settings Modal Sheet */}
          <Modal
            isOpen={isSettingsOpen}
            onClose={() => setIsSettingsOpen(false)}
            title="Dukaan & Profile Settings"
            subtitle="Rates, shop details, and backup"
          >
            <Settings onClose={() => setIsSettingsOpen(false)} />
          </Modal>

          {/* Chakki AI Bottom Sheet Widget */}
          <AISheet
            isOpen={isAISheetOpen}
            onClose={closeAISheet}
          />
        </div>
      )}
    </ErrorBoundary>
  );
}
