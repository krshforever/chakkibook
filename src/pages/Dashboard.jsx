import React, { useState } from 'react';
import { useStore } from '../store/useStore';

export default function Dashboard({ setActiveTab, onSelectCustomer }) {
  const activeMode = useStore((state) => state.activeMode);
  const boris = useStore((state) => state.boris);
  const customers = useStore((state) => state.customers);
  const inventory = useStore((state) => state.inventory);
  const markBoriDone = useStore((state) => state.markBoriDone);
  const hasPermission = useStore((state) => state.hasPermission);

  const [searchQuery, setSearchQuery] = useState('');
  const [dateFilter, setDateFilter] = useState('aaj'); // 'aaj' | 'kal' | 'hafta' | 'mahina'

  // Helper for relative time (Hinglish)
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

  const now = new Date();
  const todayStr = now.toISOString().split('T')[0];
  const yesterdayDate = new Date(now - 86400000);
  const yesterdayStr = yesterdayDate.toISOString().split('T')[0];

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
        b.customerPhone?.includes(query) ||
        b.notes?.toLowerCase().includes(query)
      );
    });

  // Date Filter Logic for completed entries
  const isDateInFilter = (dateISO) => {
    if (!dateISO) return false;
    const dStr = dateISO.split('T')[0];

    if (dateFilter === 'aaj') {
      return dStr === todayStr;
    }
    if (dateFilter === 'kal') {
      return dStr === yesterdayStr;
    }
    if (dateFilter === 'hafta') {
      const dMs = new Date(dateISO).getTime();
      const weekAgoMs = now.getTime() - 86400000 * 7;
      return dMs >= weekAgoMs;
    }
    if (dateFilter === 'mahina') {
      const dMs = new Date(dateISO).getTime();
      const monthAgoMs = now.getTime() - 86400000 * 30;
      return dMs >= monthAgoMs;
    }
    return true;
  };

  // 2. Completed Entries in current mode filtered by Date & Search
  const filteredCompletedBoris = modeBoris
    .filter((b) => b.status === 'done' || b.status === 'picked_up')
    .filter((b) => isDateInFilter(b.doneDate || b.createdAt))
    .filter((b) => {
      if (!query) return true;
      return (
        b.customerName?.toLowerCase().includes(query) ||
        b.grainType?.toLowerCase().includes(query) ||
        b.customerPhone?.includes(query) ||
        b.notes?.toLowerCase().includes(query)
      );
    });

  // Summary Stats (Filtered by Date Selection)
  const allDateDone = modeBoris
    .filter((b) => b.status === 'done' || b.status === 'picked_up')
    .filter((b) => isDateInFilter(b.doneDate || b.createdAt));

  const totalKg = allDateDone.reduce((sum, b) => sum + (Number(b.inputWeight) || 0), 0);
  const totalKamai = allDateDone.reduce((sum, b) => sum + (Number(b.amount) || 0), 0);
  const totalUdhar = allDateDone
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

  // Track 6: Low Stock Items Check (Spellar Mode)
  const lowStockItems = inventory.filter((item) => Number(item.stock) <= Number(item.lowAlert || 0));

  return (
    <div className="app-container">
      {/* 1. Hero Stats Section — PROMINENT AT TOP */}
      <section className="stat-hero card" style={{
        background: activeMode === 'chakki' ? 'linear-gradient(135deg, #1e293b, #334155)' : 'linear-gradient(135deg, #142e18, #1e3a1e)',
        border: `1px solid ${activeMode === 'chakki' ? '#d97706' : '#65a30d'}`,
        borderRadius: '1.25rem',
        padding: '1.25rem',
        boxShadow: '0 10px 15px -3px rgba(0,0,0,0.3)'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <span style={{ fontSize: '0.85rem', fontWeight: '800', color: activeMode === 'chakki' ? '#fbbf24' : '#a3e635', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            💰 {dateFilter === 'aaj' ? 'AAJ KA HISAB' : (dateFilter === 'kal' ? 'KAL KA HISAB' : 'SUMMARY')} ({activeMode.toUpperCase()})
          </span>
          <span className="section-badge" style={{ background: activeMode === 'chakki' ? '#d97706' : '#4d7c0f', color: '#fff' }}>
            {activeMode === 'chakki' ? '🌾 Atta Chakki' : '🫒 Oil Spellar'}
          </span>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px', textAlign: 'center' }}>
          {/* Total Weight */}
          <div style={{ background: 'rgba(0,0,0,0.3)', padding: '0.75rem 0.5rem', borderRadius: '0.75rem' }}>
            <div style={{ fontSize: '1.8rem', fontWeight: '800', color: '#fff', lineHeight: 1.1 }}>
              {totalKg}
              <span style={{ fontSize: '0.8rem', fontWeight: '600', marginLeft: '2px', color: '#94a3b8' }}>kg</span>
            </div>
            <div style={{ fontSize: '0.75rem', fontWeight: '700', color: '#cbd5e1', marginTop: '4px' }}>
              {activeMode === 'chakki' ? 'Pisai' : 'Pirai'}
            </div>
          </div>

          {/* Income */}
          <div style={{ background: 'rgba(0,0,0,0.3)', padding: '0.75rem 0.5rem', borderRadius: '0.75rem' }}>
            <div style={{ fontSize: '1.8rem', fontWeight: '800', color: '#4ade80', lineHeight: 1.1 }}>
              ₹{totalKamai}
            </div>
            <div style={{ fontSize: '0.75rem', fontWeight: '700', color: '#4ade80', marginTop: '4px' }}>
              Kamai
            </div>
          </div>

          {/* Udhar */}
          <div style={{ background: 'rgba(0,0,0,0.3)', padding: '0.75rem 0.5rem', borderRadius: '0.75rem' }}>
            <div style={{ fontSize: '1.8rem', fontWeight: '800', color: '#f87171', lineHeight: 1.1 }}>
              ₹{totalUdhar}
            </div>
            <div style={{ fontSize: '0.75rem', fontWeight: '700', color: '#f87171', marginTop: '4px' }}>
              Udhar
            </div>
          </div>
        </div>
      </section>

      {/* 2. Track 6: Spellar Stock Card (SPELLAR MODE ONLY) */}
      {activeMode === 'spellar' && (
        <section style={{ margin: '0.5rem 0' }}>
          <div className="card" style={{ background: '#1c2e1f', border: '1px solid #4d7c0f', borderRadius: '1rem', padding: '1rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
              <span style={{ fontSize: '0.9rem', fontWeight: '800', color: '#a3e635' }}>
                🫒 Dukan Spellar Oil & Khali Stock
              </span>
              <button
                type="button"
                onClick={() => setActiveTab('settings')}
                style={{ background: 'none', border: 'none', color: '#a3e635', fontSize: '0.8rem', fontWeight: '700', cursor: 'pointer' }}
              >
                Stock Adjust ✏️
              </button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px' }}>
              {inventory.map((item) => (
                <div key={item.id} style={{ background: 'rgba(0,0,0,0.4)', padding: '0.6rem', borderRadius: '0.5rem', textAlign: 'center' }}>
                  <div style={{ fontSize: '0.72rem', color: '#a3e635', fontWeight: '600' }}>{item.name.split('(')[0]}</div>
                  <div style={{ fontSize: '1.25rem', fontWeight: '800', color: '#fff', margin: '2px 0' }}>
                    {item.stock} <span style={{ fontSize: '0.7rem' }}>{item.unit}</span>
                  </div>
                </div>
              ))}
            </div>

            {/* Low Stock Warning */}
            {lowStockItems.length > 0 && (
              <div style={{
                marginTop: '0.75rem',
                backgroundColor: '#7c2d12',
                color: '#fdba74',
                padding: '0.5rem 0.75rem',
                borderRadius: '0.5rem',
                fontSize: '0.8rem',
                fontWeight: '700',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem'
              }}>
                ⚠️ Alert: {lowStockItems.map(i => `${i.name.split('(')[0]} (${i.stock}${i.unit})`).join(', ')} ka stock kam hai!
              </div>
            )}
          </div>
        </section>
      )}

      {/* 3. Search & Date Filter Controls */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {/* Search Bar */}
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
                position: 'absolute', right: '14px', top: '50%', transform: 'translateY(-50%)',
                background: 'none', border: 'none', fontSize: '1rem', color: 'var(--text-muted)', cursor: 'pointer'
              }}
            >
              ✖
            </button>
          )}
        </div>

        {/* Date Filter Bar */}
        <div style={{ display: 'flex', gap: '6px', overflowX: 'auto', paddingBottom: '4px' }}>
          {[
            { id: 'aaj', label: '📅 Aaj' },
            { id: 'kal', label: '⏪ Kal' },
            { id: 'hafta', label: '📊 Is Hafta' },
            { id: 'mahina', label: '🗓️ Is Mahina' }
          ].map((f) => (
            <button
              key={f.id}
              type="button"
              onClick={() => setDateFilter(f.id)}
              style={{
                flex: 1,
                minHeight: '40px',
                padding: '0.4rem 0.75rem',
                borderRadius: '2rem',
                border: dateFilter === f.id ? '2px solid #d97706' : '1px solid rgba(255,255,255,0.1)',
                backgroundColor: dateFilter === f.id ? '#d97706' : 'var(--card-bg)',
                color: '#fff',
                fontSize: '0.82rem',
                fontWeight: dateFilter === f.id ? '800' : '600',
                cursor: 'pointer',
                whiteSpace: 'nowrap'
              }}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Matching Customers Quick Card */}
      {query && matchingCustomers.length > 0 && (
        <div style={{ marginTop: '0.5rem' }}>
          <div className="section-header">
            <span>👥 Matching Grahak ({matchingCustomers.length})</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {matchingCustomers.map((cust) => (
              <div
                key={cust.id}
                className="card"
                style={{
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 14px', cursor: 'pointer'
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
                  <div style={{ fontSize: '1rem', fontWeight: 800, color: cust.balance > 0 ? 'var(--danger)' : 'var(--success)' }}>
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

      {/* 4. Redesigned Pending Boris Queue */}
      <section>
        <div className="section-header">
          <span>📦 Pending Queue ({pendingBoris.length})</span>
          <span className="section-badge">{activeMode === 'chakki' ? 'Chakki Queue' : 'Spellar Queue'}</span>
        </div>

        {pendingBoris.length === 0 ? (
          <div className="card empty-state" style={{
            textAlign: 'center', padding: '2rem 1rem', borderRadius: '1rem', backgroundColor: 'var(--card-bg)'
          }}>
            <div style={{ fontSize: '3rem', marginBottom: '0.5rem' }}>📦</div>
            <h3 style={{ fontSize: '1.1rem', fontWeight: '800', margin: '0 0 0.25rem 0' }}>Sab kaam complete hai!</h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', margin: '0 0 1rem 0' }}>
              {query ? 'Koi matching pending bori nahi mili.' : `Abhi koi pending ${activeMode === 'chakki' ? 'pisai' : 'pirai'} bori nahi hai.`}
            </p>
            {hasPermission('addBori') && (
              <button
                type="button"
                className="big-btn"
                onClick={() => setActiveTab('entry')}
                style={{ width: 'auto', margin: '0 auto', padding: '0.75rem 1.5rem', minHeight: '48px' }}
              >
                <span>➕ Nayi Bori Jama Karein</span>
              </button>
            )}
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {pendingBoris.map((bori) => (
              <div
                key={bori.id}
                className="bori-card-v2"
                style={{
                  backgroundColor: 'var(--card-bg)',
                  borderRadius: '1rem',
                  padding: '1rem',
                  borderLeft: '5px solid #eab308',
                  border: '1px solid rgba(255,255,255,0.08)',
                  boxShadow: '0 4px 6px -1px rgba(0,0,0,0.2)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.75rem'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <strong
                      style={{ fontSize: '1.1rem', color: 'var(--text-main)', cursor: 'pointer' }}
                      onClick={() => handleCustomerClick(bori.customerId, bori.customerName)}
                    >
                      👤 {bori.customerName || 'Walk-in Grahak'}
                    </strong>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                      📅 {getRelativeTime(bori.dropOffDate || bori.createdAt)} {bori.notes ? `• ${bori.notes}` : ''}
                    </div>
                  </div>
                  <span className="section-badge" style={{ background: '#713f12', color: '#fef08a' }}>
                    PENDING
                  </span>
                </div>

                <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.5rem' }}>
                  <span style={{ fontSize: '1.5rem', fontWeight: '800', color: '#fbbf24' }}>
                    {bori.inputWeight} kg
                  </span>
                  <span style={{ fontSize: '1rem', fontWeight: '700', color: '#cbd5e1' }}>
                    {bori.grainType || (activeMode === 'chakki' ? 'Wheat' : 'Sarson')}
                  </span>
                  {bori.kaddaDeducted > 0 && (
                    <span style={{ fontSize: '0.78rem', color: '#94a3b8' }}>
                      (Kadda: -{bori.kaddaDeducted}kg = Net {bori.outputWeight}kg)
                    </span>
                  )}
                </div>

                {/* Action Buttons */}
                <div style={{ display: 'grid', gridTemplateColumns: bori.customerPhone ? '1fr 1fr' : '1fr', gap: '8px' }}>
                  {hasPermission('markDone') && (
                    <button
                      type="button"
                      onClick={() => markBoriDone(bori.id)}
                      style={{
                        minHeight: '50px',
                        backgroundColor: '#166534',
                        color: '#ffffff',
                        border: 'none',
                        borderRadius: '0.75rem',
                        fontSize: '1rem',
                        fontWeight: '800',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '0.4rem'
                      }}
                    >
                      <span>✅</span>
                      <span>Done (Complete)</span>
                    </button>
                  )}

                  {bori.customerPhone && (
                    <a
                      href={`tel:${bori.customerPhone}`}
                      style={{
                        minHeight: '50px',
                        backgroundColor: '#1e293b',
                        color: '#38bdf8',
                        border: '1px solid #0284c7',
                        borderRadius: '0.75rem',
                        fontSize: '0.95rem',
                        fontWeight: '700',
                        textDecoration: 'none',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '0.4rem'
                      }}
                    >
                      <span>📲</span>
                      <span>Call Customer</span>
                    </a>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* 5. Completed Entries Section */}
      <section style={{ marginTop: '0.5rem' }}>
        <div className="section-header">
          <span>✅ Complete Entries ({filteredCompletedBoris.length})</span>
          <span className="section-badge">{dateFilter.toUpperCase()}</span>
        </div>

        {filteredCompletedBoris.length === 0 ? (
          <div className="card" style={{ textAlign: 'center', padding: '1.5rem', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
            Is time period mein koi complete entry nahi hai.
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {filteredCompletedBoris.map((bori) => {
              const isCredit = bori.paymentMode === 'credit';
              return (
                <div key={bori.id} className="entry-row" style={{
                  backgroundColor: 'var(--card-bg)', borderRadius: '0.75rem', padding: '0.85rem', borderLeft: `4px solid ${isCredit ? '#ef4444' : '#22c55e'}`
                }}>
                  <div className="entry-row-left">
                    <div
                      style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: '700', fontSize: '1rem', cursor: 'pointer' }}
                      onClick={() => handleCustomerClick(bori.customerId, bori.customerName)}
                    >
                      <span>{isCredit ? '🔴' : '🟢'}</span>
                      <span>{bori.customerName || 'Cash Customer'}</span>
                    </div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                      {bori.inputWeight ? `${bori.inputWeight} kg ${bori.grainType || ''}` : bori.notes || 'Entry'}{' '}
                      • {bori.paymentMode === 'credit' ? 'Udhar' : bori.paymentMode === 'upi' ? 'UPI' : 'Nokad Cash'}
                    </div>
                  </div>

                  <div className="entry-row-right" style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '1.2rem', fontWeight: 800, color: isCredit ? '#f87171' : '#4ade80' }}>
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

      {/* Quick Action Button */}
      {hasPermission('addBori') && (
        <button
          type="button"
          className="big-btn"
          onClick={() => setActiveTab('entry')}
          style={{ marginTop: '0.5rem' }}
        >
          <span>➕</span>
          <span>Nayi Bori Entry Karein</span>
        </button>
      )}
    </div>
  );
}
