import React, { useState } from 'react';
import Header from './components/Header';
import BottomNav from './components/BottomNav';
import Dashboard from './pages/Dashboard';
import NewEntry from './pages/NewEntry';
import Khata from './pages/Khata';
import Inventory from './pages/Inventory';
import Settings from './pages/Settings';

export default function App() {
  const [activeTab, setActiveTab] = useState('home');

  return (
    <div className="app-shell">
      <Header />
      
      <main style={{ paddingBottom: '75px' }}>
        {activeTab === 'home' && <Dashboard setActiveTab={setActiveTab} />}
        {activeTab === 'entry' && <NewEntry setActiveTab={setActiveTab} />}
        {activeTab === 'khata' && <Khata />}
        {activeTab === 'inventory' && <Inventory />}
        {activeTab === 'settings' && <Settings />}
      </main>

      <BottomNav activeTab={activeTab} setActiveTab={setActiveTab} />
    </div>
  );
}
