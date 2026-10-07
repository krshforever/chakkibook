import React, { useState, useEffect, lazy, Suspense } from 'react';
import AppBar from './components/layout/AppBar';
import BottomNav from './components/layout/BottomNav';
import Dashboard from './pages/Dashboard';
import Login from './pages/Login';
import AISheet from './components/features/ai/AISheet';
import ErrorBoundary from './components/ErrorBoundary';
import Modal from './components/ui/Modal';
import { onAuthChange } from './firebase/auth';
import { useStore } from './store/useStore';
import { findShopByPhone } from './firebase/firestore';

const Khata = lazy(() => import('./pages/Khata'));
const Inventory = lazy(() => import('./pages/Inventory'));
const Settings = lazy(() => import('./pages/Settings'));
const NewEntry = lazy(() => import('./pages/NewEntry'));

export default function App() {
  const [activeTab, setActiveTab] = useState('dashboard'); // 'dashboard' | 'khata' | 'stock'
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [initializing, setInitializing] = useState(true);
  const [authError, setAuthError] = useState(null);

  // Modals & Drawers
  const [isNewEntryOpen, setIsNewEntryOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  const currentUser = useStore((state) => state.currentUser);
  const setAuthUser = useStore((state) => state.setAuthUser);
  const isAISheetOpen = useStore((state) => state.isAISheetOpen);
  const closeAISheet = useStore((state) => state.closeAISheet);

  useEffect(() => {
    let isMounted = true;
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
        } else {
          await setAuthUser(null, null, null);
        }
      } catch (err) {
        if (isMounted) setAuthError(err.message || 'Authentication error occurred');
      } finally {
        if (isMounted) setInitializing(false);
      }
    });

    return () => {
      isMounted = false;
      unsub();
    };
  }, [setAuthUser]);

  const handleLoginSuccess = (user, shopId, role) => {
    setAuthError(null);
    setAuthUser(user, shopId, role);
  };

  const handleSelectCustomer = (customer) => {
    setSelectedCustomer(customer);
    setActiveTab('khata');
  };

  const handleClearSelectedCustomer = () => {
    setSelectedCustomer(null);
  };

  // 1. Initializing Splash State
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

  // 2. Fatal Auth Error Screen (Hindi)
  if (authError) {
    return (
      <div
        style={{
          minHeight: '100vh',
          padding: '24px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: '#F7F3EB',
          textAlign: 'center',
          fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif"
        }}
      >
        <div style={{ fontSize: '3rem', marginBottom: '12px' }}>⚠️</div>
        <h2 style={{ fontSize: '1.35rem', fontWeight: 800, color: '#b91c1c', marginBottom: '8px' }}>
          Authentication Mein Samasya Aayi Hai
        </h2>
        <p style={{ fontSize: '0.9rem', color: '#475569', marginBottom: '20px', maxWidth: '360px', lineHeight: 1.5 }}>
          Dukaan ledger security ke liye login zaroori hai. Error: {authError}
        </p>
        <button
          type="button"
          onClick={() => {
            setAuthError(null);
            setInitializing(true);
            window.location.reload();
          }}
          style={{
            padding: '12px 24px',
            borderRadius: '12px',
            background: 'linear-gradient(180deg, #ea580c, #c2410c)',
            color: '#fff',
            border: 'none',
            fontWeight: 700,
            fontSize: '0.95rem',
            cursor: 'pointer',
            marginBottom: '16px'
          }}
        >
          Dobara Try Karein
        </button>
        <div style={{ fontSize: '0.8rem', color: '#64748b' }}>
          Sahayata ke liye support se sampark karein: <strong>+91 9876543210</strong>
        </div>
      </div>
    );
  }

  return (
    <ErrorBoundary>
      {(!currentUser || !currentUser.uid) ? (
        <Login onLoginSuccess={handleLoginSuccess} />
      ) : (
        <div className="app-shell">
          {/* App Bar (Header with shop name, mode switcher, language, profile avatar) */}
          <AppBar onOpenSettings={() => setIsSettingsOpen(true)} />

          {/* Main View Area */}
          <main style={{ paddingBottom: 'calc(80px + env(safe-area-inset-bottom, 0px))' }}>
            <Suspense fallback={<div style={{ padding: '2rem', textAlign: 'center', color: 'hsl(var(--brand-600))', fontWeight: 600 }}>Loading tab...</div>}>
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
            </Suspense>
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
            <Suspense fallback={<div style={{ padding: '1rem', textAlign: 'center' }}>Loading form...</div>}>
              <NewEntry
                setActiveTab={(tab) => {
                  setIsNewEntryOpen(false);
                  setActiveTab(tab);
                }}
                initialCustomerId={selectedCustomer?.id}
              />
            </Suspense>
          </Modal>

          {/* Settings Modal Sheet */}
          <Modal
            isOpen={isSettingsOpen}
            onClose={() => setIsSettingsOpen(false)}
            title="Dukaan & Profile Settings"
            subtitle="Rates, shop details, and backup"
          >
            <Suspense fallback={<div style={{ padding: '1rem', textAlign: 'center' }}>Loading settings...</div>}>
              <Settings onClose={() => setIsSettingsOpen(false)} />
            </Suspense>
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
