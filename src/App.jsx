import React, { useState, useEffect, lazy, Suspense } from 'react';
import { Wheat, AlertTriangle, RotateCcw } from 'lucide-react';
import AppBar from './components/layout/AppBar';
import BottomNav from './components/layout/BottomNav';
import Dashboard from './pages/Dashboard';
import Login from './pages/Login';
import VoiceScreen from './components/voice/VoiceScreen';
import ErrorBoundary from './components/ErrorBoundary';
import Modal from './components/ui/Modal';
import { onAuthChange } from './firebase/auth';
import { resolveShopForUser, shopIdForUser } from './firebase/shopBootstrap';
import { useStore } from './store/useStore';

const Khata = lazy(() => import('./pages/Khata'));
const Inventory = lazy(() => import('./pages/Inventory'));
const Settings = lazy(() => import('./pages/Settings'));
const NewEntry = lazy(() => import('./pages/NewEntry'));

export default function App() {
  // 'voice' is the landing tab. AI-first means the screen an operator opens
  // first is the one they can operate without reading.
  const [activeTab, setActiveTab] = useState('voice');
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [initializing, setInitializing] = useState(true);
  const [authError, setAuthError] = useState(null);

  const [isNewEntryOpen, setIsNewEntryOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  const currentUser = useStore((state) => state.currentUser);
  const setAuthUser = useStore((state) => state.setAuthUser);

  // True until the shop profile exists. Kept as local state rather than
  // derived from `currentUser`, because `onAuthChange` fires the instant
  // Firebase recognises the identity — before a brand-new user has been asked
  // to name their shop. Gating on the store alone unmounted Login at that
  // exact moment, so the "name your shop" step could never render.
  const [needsShopProfile, setNeedsShopProfile] = useState(false);

  useEffect(() => {
    let isMounted = true;
    const unsub = onAuthChange(async (user) => {
      try {
        if (user) {
          let shopId = null;
          let needsProfile = false;
          try {
            const resolved = await resolveShopForUser(user);
            shopId = resolved.shopId;
            needsProfile = Boolean(resolved.needsShopData);
          } catch (e) {
            console.warn('Shop resolution notice:', e);
            shopId = shopIdForUser(user);
          }
          if (isMounted) {
            setNeedsShopProfile(needsProfile);
            await setAuthUser(user, shopId, 'owner');
          }
        } else {
          if (isMounted) {
            setNeedsShopProfile(false);
            await setAuthUser(null, null, null);
          }
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
    setNeedsShopProfile(false);
    setAuthUser(user, shopId, role);
  };

  const handleSelectCustomer = (customer) => {
    setSelectedCustomer(customer);
    setActiveTab('khata');
  };

  const handleClearSelectedCustomer = () => setSelectedCustomer(null);

  // 1. Splash
  if (initializing) {
    return (
      <div className="cb-splash">
        <div className="cb-splash-mark">
          <Wheat size={40} strokeWidth={1.8} />
        </div>
        <h2 className="cb-splash-title">Chakkibook V2.0</h2>
        <p className="cb-splash-sub">Lad ho raha hai...</p>
      </div>
    );
  }

  // 2. Fatal auth error
  if (authError) {
    return (
      <div className="cb-splash">
        <div className="cb-splash-mark is-error">
          <AlertTriangle size={40} strokeWidth={1.8} />
        </div>
        <h2 className="cb-splash-title">Login mein dikkat</h2>
        <p className="cb-splash-sub" style={{ maxWidth: '22rem' }}>
          Dukaan ka khata surakshit rakhne ke liye login zaroori hai.
          <br />
          <span style={{ fontSize: '0.75rem', color: 'hsl(var(--ink-3))' }}>{authError}</span>
        </p>
        <button
          type="button"
          className="big-btn"
          style={{ marginTop: '1.25rem', maxWidth: '16rem' }}
          onClick={() => {
            setAuthError(null);
            setInitializing(true);
            window.location.reload();
          }}
        >
          <RotateCcw size={18} /> Dobara koshish karein
        </button>
      </div>
    );
  }

  return (
    <ErrorBoundary>
      {(!currentUser || !currentUser.uid || needsShopProfile) ? (
        <Login onLoginSuccess={handleLoginSuccess} />
      ) : (
        <div className="app-shell">
          <AppBar onOpenSettings={() => setIsSettingsOpen(true)} onNavigate={setActiveTab} />

          <main style={{ paddingBottom: 'calc(92px + env(safe-area-inset-bottom, 0px))' }}>
            {activeTab === 'voice' && (
              <VoiceScreen onNavigate={(tab) => { setIsNewEntryOpen(false); setActiveTab(tab); }} />
            )}

            <Suspense fallback={<div className="cb-tab-loading">Loading...</div>}>
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

          <BottomNav
            activeTab={activeTab}
            setActiveTab={setActiveTab}
            onOpenNewEntry={() => setIsNewEntryOpen(true)}
          />

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
        </div>
      )}
    </ErrorBoundary>
  );
}
