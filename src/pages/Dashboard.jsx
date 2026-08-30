import React, { useState } from 'react';
import { useStore } from '../store/useStore';

export default function Dashboard({ setActiveTab, onSelectCustomer }) {
  const activeMode = useStore((state) => state.activeMode);
  const boris = useStore((state) => state.boris);
  const customers = useStore((state) => state.customers);
  const markBoriDone = useStore((state) => state.markBoriDone);

  const [searchQuery, setSearchQuery] = useState('');

  // Helper for Hindi/Hinglish relative time
  const getRelativeTime = (dateStr) => {
    if (!dateStr) return 'Kuch der pehle';
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now - date;
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffHours < 4) return 'Abhi abhi';
    if (diffHours < 14) return 'Aaj subah';
    if (diffDays === 1) return 'Kal (1 din pehle)';
    if (diffDays > 1) return `${diffDays} din pehle`;
    return 'Aaj';
  };

  const todayStr = new Date().toISOString().split('T')[0];

  // Filter Boris by mode
  const modeBoris = boris.filter((b) => b.mode === activeMode);

  // Search filter
  const query = searchQuery.trim().toLowerCase();

  // 1. Pending Boris in current mode
  const pendingBoris = modeBoris
    .filter((b) => b.status === 'pending')
    .filter((b) => {
      if (!query) return true;
      return (
        b.customerName?.toLowerCase().includes(query) ||
        b.grainType?.toLowerCase().includes(query) ||
        b.notes?.toLowerCase().includes(query)
      );
    });

  // 2. Today's Completed Boris in current mode
  const todayCompletedBoris = modeBoris
    .filter((b) => b.status === 'done' || b.status === 'picked_up')
    .filter((b) => {
      const bDate = b.doneDate || b.createdAt || '';
      return bDate.startsWith(todayStr);
    })
    .filter((b) => {
      if (!query) return true;
      return (
        b.customerName?.toLowerCase().includes(query) ||
        b.grainType?.toLowerCase().includes(query) ||
        b.notes?.toLowerCase().includes(query)
      );
    });

  // Today's Stats for current mode
  const allTodayModeDone = modeBoris.filter((b) => {
    const bDate = b.doneDate || b.createdAt || '';
    return (b.status === 'done' || b.status === 'picked_up') && bDate.startsWith(todayStr);
  });

  const totalKgToday = allTodayModeDone.reduce((sum, b) => sum + (Number(b.inputWeight) || 0), 0);
  const totalKamaiToday = allTodayModeDone.reduce((sum, b) => sum + (Number(b.amount) || 0), 0);
  const todayUdhar = allTodayModeDone
    .filter((b) => b.paymentMode === 'credit')
    .reduce((sum, b) => sum + (Number(b.amount) || 0), 0);

  // Matching customers if search query is active
  const matchingCustomers = query
    ? customers.filter(
        (c) =>
          c.name.toLowerCase().includes(query) ||
          (c.phone && c.phone.includes(query)) ||
          (c.village && c.village.toLowerCase().includes(query))
      )
    : [];

  const handleCustomerClick = (customerId, customerName) => {
    const cust = customers.find((c) => c.id === customerId || c.name === customerName);
    if (cust && onSelectCustomer) {
      onSelectCustomer(cust);
      setActiveTab('khata');
    } else {
      setActiveTab('khata');
    }
  };

  return (
    <div className="app-container">
      {/* 1. Search Bar — Always visible at top */}
      <div className="search-bar-wrapper">
        <span className="search-icon">🔍</span>
        <input
          type="text"
          className="search-bar"
          placeholder="Search customer naam, phone, gaon..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
        {searchQuery && (
          <button
            onClick={() => setSearchQuery('')}
            style={{
              position: 'absolute',
              right: '14px',
              top: '50%',
              transform: 'translateY(-50%)',
              background: 'none',
              border: 'none',
              fontSize: '1rem',
              color: 'var(--text-muted)',
              cursor: 'pointer'
            }}
          >
            ✖
          </button>
        )}
      </div>

      {/* Matching Customers Quick-Card when searching */}
      {query && matchingCustomers.length > 0 && (
        <div>
          <div className="section-header">
            <span>👥 Matching Grahak ({matchingCustomers.length})</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {matchingCustomers.map((cust) => (
              <div
                key={cust.id}
                className="card"
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '12px 14px',
                  cursor: 'pointer'
                }}
                onClick={() => handleCustomerClick(cust.id, cust.name)}
              >
                <div>
                  <strong style={{ fontSize: '1rem', color: 'var(--text-main)' }}>{cust.name}</strong>
                  <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                    📍 {cust.village || 'Gaon'} • 📱 {cust.phone || 'No phone'}
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div
                    style={{
                      fontSize: '1rem',
                      fontWeight: 800,
                      color: cust.balance > 0 ? 'var(--danger)' : 'var(--success)'
                    }}
                  >
                    {cust.balance > 0 ? `₹${cust.balance} Udhar` : 'Clear'}
                  </div>
                  <span style={{ fontSize: '0.72rem', color: 'var(--primary-dark)', fontWeight: 600 }}>
                    Khata Kholein 👉
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 2. Pending Boris Section (Unground / Unprocessed Boris Queue) */}
      <section>
        <div className="section-header">
          <span>📦 Pending Boris ({pendingBoris.length})</span>
          <span className="section-badge">{activeMode === 'chakki' ? 'Chakki Queue' : 'Spellar Queue'}</span>
        </div>

        {pendingBoris.length === 0 ? (
          <div
            className="card"
            style={{
              textAlign: 'center',
              padding: '24px 16px',
              color: 'var(--text-muted)',
              fontSize: '0.9rem'
            }}
          >
            {query
              ? 'Koi matching pending bori nahi mili.'
              : `Koi pending bori nahi hai! Sab ${activeMode === 'chakki' ? 'pisai' : 'pirai'} ho chuki hai.`}
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {pendingBoris.map((bori) => (
              <div key={bori.id} className="bori-card">
                <div className="bori-info">
                  <div
                    className="bori-customer-name"
                    onClick={() => handleCustomerClick(bori.customerId, bori.customerName)}
                    title="Tap to view Khata"
                  >
                    <span>🟡</span>
                    <span>{bori.customerName || 'Walk-in Grahak'}</span>
                  </div>
                  <div className="bori-details">
                    <strong>{bori.grainType || (activeMode === 'chakki' ? 'Wheat' : 'Sarson')}</strong> •{' '}
                    <strong>{bori.inputWeight} kg</strong> • {getRelativeTime(bori.dropOffDate || bori.createdAt)}
                    {bori.notes ? ` • ${bori.notes}` : ''}
                  </div>
                </div>

                <button
                  type="button"
                  className="bori-done-btn"
                  onClick={() => markBoriDone(bori.id)}
                  title="Mark as Done"
                >
                  <span>✅</span>
                  <span>Done</span>
                </button>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* 3. Today's Entries Section (Completed Boris) */}
      <section>
        <div className="section-header">
          <span>✅ Aaj ki Entries ({todayCompletedBoris.length})</span>
          <span className="section-badge">Today</span>
        </div>

        {todayCompletedBoris.length === 0 ? (
          <div
            className="card"
            style={{
              textAlign: 'center',
              padding: '20px 16px',
              color: 'var(--text-muted)',
              fontSize: '0.9rem'
            }}
          >
            {query
              ? 'Koi matching entry nahi mili.'
              : `Aaj abhi tak koi ${activeMode === 'chakki' ? 'pisai' : 'pirai'} entry complete nahi hui.`}
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {todayCompletedBoris.map((bori) => {
              const isCredit = bori.paymentMode === 'credit';
              return (
                <div key={bori.id} className="entry-row">
                  <div className="entry-row-left">
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        fontWeight: 700,
                        fontSize: '0.95rem',
                        cursor: 'pointer'
                      }}
                      onClick={() => handleCustomerClick(bori.customerId, bori.customerName)}
                    >
                      <span>{isCredit ? '🔴' : '🟢'}</span>
                      <span>{bori.customerName || 'Cash Customer'}</span>
                    </div>
                    <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                      {bori.inputWeight ? `${bori.inputWeight} kg ${bori.grainType || ''}` : bori.notes || 'Entry'}{' '}
                      • {bori.paymentMode === 'credit' ? 'Udhar' : bori.paymentMode === 'upi' ? 'UPI' : 'Cash'}
                    </div>
                  </div>

                  <div className="entry-row-right">
                    <div
                      style={{
                        fontFamily: 'var(--font-head)',
                        fontSize: '1.15rem',
                        fontWeight: 800,
                        color: isCredit ? 'var(--danger)' : 'var(--text-main)'
                      }}
                    >
                      ₹ {bori.amount}
                    </div>
                    <span className={`status-pill ${bori.paymentMode || 'cash'}`}>
                      {bori.paymentMode === 'credit' ? 'Udhar' : bori.paymentMode === 'upi' ? 'UPI' : 'Cash'}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* 4. Today's Summary (Positioned at Bottom as per spec) */}
      <section style={{ marginTop: '8px' }}>
        <div className="section-header">
          <span>💰 Aaj ka Summary</span>
          <span className="section-badge">{activeMode.toUpperCase()}</span>
        </div>

        <div className="stat-card-row">
          {/* Card 1: Total Ground / Pressed */}
          <div className="stat-card">
            <div className="stat-number">
              {totalKgToday}
              <span style={{ fontSize: '1rem', fontWeight: 600, marginLeft: '2px' }}>kg</span>
            </div>
            <div className="stat-label">Total {activeMode === 'chakki' ? 'Ground' : 'Pressed'}</div>
            <div className="stat-sub">{activeMode === 'chakki' ? 'Pisai' : 'Pirai'}</div>
          </div>

          {/* Card 2: Income / Kamai */}
          <div className="stat-card">
            <div className="stat-number" style={{ color: 'var(--success)' }}>
              ₹{totalKamaiToday}
            </div>
            <div className="stat-label">Kamai</div>
            <div className="stat-sub">(Income)</div>
          </div>

          {/* Card 3: Udhar / Dues */}
          <div className="stat-card">
            <div className="stat-number" style={{ color: 'var(--danger)' }}>
              ₹{todayUdhar}
            </div>
            <div className="stat-label">Udhar</div>
            <div className="stat-sub">(Dues)</div>
          </div>
        </div>
      </section>

      {/* Quick Action button to Jump to Naya Entry */}
      <button
        type="button"
        className="big-btn"
        onClick={() => setActiveTab('entry')}
        style={{ marginTop: '4px' }}
      >
        <span>➕</span>
        <span>Nayi Bori Entry Karein</span>
      </button>
    </div>
  );
}
