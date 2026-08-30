import React, { useState } from 'react';
import Header from './components/Header';
import BottomNav from './components/BottomNav';
import Dashboard from './pages/Dashboard';
import NewEntry from './pages/NewEntry';
import Khata from './pages/Khata';
import Settings from './pages/Settings';

export default function App() {
  const [activeTab, setActiveTab] = useState('home');
  const [selectedCustomer, setSelectedCustomer] = useState(null);

  const handleSelectCustomer = (customer) => {
    setSelectedCustomer(customer);
  };

  const handleClearSelectedCustomer = () => {
    setSelectedCustomer(null);
  };

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
        {activeTab === 'settings' && <Settings />}
      </main>

      <BottomNav activeTab={activeTab} setActiveTab={setActiveTab} />
    </div>
  );
}
