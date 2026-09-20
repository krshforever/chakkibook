import React, { useState } from 'react';
import { 
  Wheat, 
  Droplets, 
  TrendingUp, 
  Clock, 
  CheckCircle2, 
  PlusCircle, 
  Search, 
  Coins, 
  Scale, 
  BookOpen, 
  ChevronRight
} from 'lucide-react';
import { useStore } from '../store/useStore';

export default function Dashboard({ setActiveTab, onSelectCustomer }) {
  const activeMode = useStore((state) => state.activeMode || 'chakki');
  const boris = useStore((state) => state.boris || []);
  const customers = useStore((state) => state.customers || []);
  const markBoriDone = useStore((state) => state.markBoriDone);

  const [searchQuery, setSearchQuery] = useState('');
  const [dateFilter, setDateFilter] = useState('aaj'); // 'aaj' | 'kal' | 'hafta' | 'mahina'

  // Helper for relative time
  const getRelativeTime = (dateStr) => {
    if (!dateStr) return 'Kuch der pehle';
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now - date;
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffHours < 4) return 'Abhi abhi';
    if (diffHours < 14) return 'Aaj subah';
    if (diffDays === 1) return 'Kal';
    if (diffDays > 1) return `${diffDays}d pehle`;
    return 'Aaj';
  };

  const now = new Date();
  const todayStr = now.toISOString().split('T')[0];
  const yesterdayDate = new Date(now - 86400000);
  const yesterdayStr = yesterdayDate.toISOString().split('T')[0];

  // Filter Boris by mode
  const modeBoris = boris.filter((b) => b.mode === activeMode);
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

    if (dateFilter === 'aaj') return dStr === todayStr;
    if (dateFilter === 'kal') return dStr === yesterdayStr;
    if (dateFilter === 'hafta') {
      const dMs = new Date(dateISO).getTime();
      return dMs >= now.getTime() - 86400000 * 7;
    }
    if (dateFilter === 'mahina') {
      const dMs = new Date(dateISO).getTime();
      return dMs >= now.getTime() - 86400000 * 30;
    }
    return true;
  };

  // 2. Completed Entries
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

  // Summary Stats
  const allDateDone = modeBoris
    .filter((b) => b.status === 'done' || b.status === 'picked_up')
    .filter((b) => isDateInFilter(b.doneDate || b.createdAt));

  const totalKg = allDateDone.reduce((sum, b) => sum + (Number(b.inputWeight) || 0), 0);
  const totalKamai = allDateDone.reduce((sum, b) => sum + (Number(b.amount) || 0), 0);
  const totalUdhar = allDateDone
    .filter((b) => b.paymentMode === 'credit')
    .reduce((sum, b) => sum + (Number(b.amount) || 0), 0);

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
    <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '20px', maxWidth: '600px', margin: '0 auto' }}>
      
      {/* 1. Hero Summary Card (Minimalist Clean Design) */}
      <section style={{
        backgroundColor: '#ffffff',
        border: '1px solid #e2e8f0',
        borderRadius: '1rem',
        padding: '1.25rem',
        boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.04)',
        boxSizing: 'border-box'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
          <div style={{ fontSize: '0.78rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            {dateFilter === 'aaj' ? 'Aaj Ka Summary' : (dateFilter === 'kal' ? 'Kal Ka Summary' : 'Summary')} • {activeMode.toUpperCase()}
          </div>
          <div style={{ fontSize: '0.75rem', fontWeight: 600, color: '#d97706', display: 'flex', alignItems: 'center', gap: '4px' }}>
            {activeMode === 'chakki' ? <Wheat size={14} /> : <Droplets size={14} />}
            <span>{activeMode === 'chakki' ? 'Atta & Dana' : 'Sarson Tel'}</span>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px', textAlign: 'left' }}>
          {/* Income */}
          <div>
            <div style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: 600, marginBottom: '2px' }}>
              Kul Kamai
            </div>
            <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#0f172a', fontFamily: "'Plus Jakarta Sans', sans-serif", fontVariantNumeric: 'tabular-nums' }}>
              ₹{totalKamai}
            </div>
          </div>

          {/* Weight */}
          <div>
            <div style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: 600, marginBottom: '2px' }}>
              {activeMode === 'chakki' ? 'Pisai' : 'Pirai'}
            </div>
            <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#0f172a', fontFamily: "'Plus Jakarta Sans', sans-serif", fontVariantNumeric: 'tabular-nums' }}>
              {totalKg} <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#94a3b8' }}>kg</span>
            </div>
          </div>

          {/* Udhar */}
          <div>
            <div style={{ fontSize: '0.72rem', color: '#dc2626', fontWeight: 600, marginBottom: '2px' }}>
              Baki Udhar
            </div>
            <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#dc2626', fontFamily: "'Plus Jakarta Sans', sans-serif", fontVariantNumeric: 'tabular-nums' }}>
              ₹{totalUdhar}
            </div>
          </div>
        </div>
      </section>

      {/* 2. Quick Action Bar */}
      <section style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
        <button
          type="button"
          onClick={() => setActiveTab('entry')}
          style={{
            height: '48px',
            backgroundColor: '#d97706',
            color: '#ffffff',
            border: 'none',
            borderRadius: '0.75rem',
            fontSize: '0.92rem',
            fontWeight: 700,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            boxShadow: '0 4px 12px rgba(217, 119, 6, 0.25)',
            transition: 'all 0.15s ease'
          }}
        >
          <PlusCircle size={18} />
          <span>+ Nayi Bori Entry</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('khata')}
          style={{
            height: '48px',
            backgroundColor: '#ffffff',
            color: '#0f172a',
            border: '1px solid #e2e8f0',
            borderRadius: '0.75rem',
            fontSize: '0.92rem',
            fontWeight: 700,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            transition: 'all 0.15s ease'
          }}
        >
          <BookOpen size={18} color="#64748b" />
          <span>Grahak Khata</span>
        </button>
      </section>

      {/* 3. Search & Date Filter Triggers */}
      <section style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        <div style={{ position: 'relative', width: '100%' }}>
          <Search size={16} color="#94a3b8" style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)' }} />
          <input
            type="text"
            placeholder="Search grahak name, mobile, grain..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              width: '100%',
              height: '44px',
              padding: '0 14px 0 40px',
              borderRadius: '0.75rem',
              border: '1px solid #e2e8f0',
              backgroundColor: '#ffffff',
              fontSize: '0.88rem',
              color: '#0f172a',
              outline: 'none',
              boxSizing: 'border-box'
            }}
          />
        </div>

        {/* Minimal Underline Filter Tabs */}
        <div style={{ display: 'flex', borderBottom: '1px solid #e2e8f0', gap: '16px', paddingBottom: '4px' }}>
          {[
            { id: 'aaj', label: 'Aaj' },
            { id: 'kal', label: 'Kal' },
            { id: 'hafta', label: '7 Din' },
            { id: 'mahina', label: 'Is Mahine' }
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setDateFilter(tab.id)}
              style={{
                background: 'none',
                border: 'none',
                borderBottom: dateFilter === tab.id ? '2px solid #d97706' : '2px solid transparent',
                paddingBottom: '8px',
                color: dateFilter === tab.id ? '#d97706' : '#64748b',
                fontSize: '0.82rem',
                fontWeight: dateFilter === tab.id ? 700 : 500,
                cursor: 'pointer',
                transition: 'all 0.15s ease'
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </section>

      {/* 4. Pending Bori Queue */}
      <section style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2 style={{ fontSize: '0.92rem', fontWeight: 800, color: '#0f172a', margin: 0, display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Clock size={16} color="#d97706" />
            <span>Pending Bori Queue ({pendingBoris.length})</span>
          </h2>
        </div>

        {pendingBoris.length === 0 ? (
          <div style={{
            backgroundColor: '#ffffff',
            border: '1px solid #e2e8f0',
            borderRadius: '0.85rem',
            padding: '1.25rem',
            textAlign: 'center',
            color: '#64748b',
            fontSize: '0.85rem'
          }}>
            Koi pending bori nahi hai. Sabhi complete hain!
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {pendingBoris.map((b) => (
              <div
                key={b.id}
                style={{
                  backgroundColor: '#ffffff',
                  border: '1px solid #e2e8f0',
                  borderLeft: '4px solid #f59e0b',
                  borderRadius: '0.75rem',
                  padding: '12px 14px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}
              >
                <div>
                  <div
                    onClick={() => handleCustomerClick(b.customerId, b.customerName)}
                    style={{ fontSize: '0.95rem', fontWeight: 700, color: '#0f172a', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}
                  >
                    <span>{b.customerName}</span>
                    <ChevronRight size={14} color="#94a3b8" />
                  </div>
                  <div style={{ fontSize: '0.78rem', color: '#64748b', marginTop: '2px' }}>
                    <span style={{ fontWeight: 700, color: '#0f172a' }}>{b.inputWeight}kg</span> {b.grainType} • ₹{b.amount} ({getRelativeTime(b.createdAt)})
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => markBoriDone(b.id)}
                  style={{
                    backgroundColor: '#16a34a',
                    color: '#ffffff',
                    border: 'none',
                    borderRadius: '0.5rem',
                    padding: '6px 12px',
                    fontSize: '0.78rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px'
                  }}
                >
                  <CheckCircle2 size={14} />
                  <span>Done</span>
                </button>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* 5. Completed Register */}
      <section style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        <h2 style={{ fontSize: '0.92rem', fontWeight: 800, color: '#0f172a', margin: 0 }}>
          Completed Register ({filteredCompletedBoris.length})
        </h2>

        {filteredCompletedBoris.length === 0 ? (
          <div style={{ backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '0.85rem', padding: '1rem', textAlign: 'center', color: '#64748b', fontSize: '0.82rem' }}>
            Is filter me koi entry nahi hai.
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            {filteredCompletedBoris.map((b) => (
              <div
                key={b.id}
                style={{
                  backgroundColor: '#ffffff',
                  border: '1px solid #e2e8f0',
                  borderRadius: '0.65rem',
                  padding: '10px 14px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}
              >
                <div>
                  <div
                    onClick={() => handleCustomerClick(b.customerId, b.customerName)}
                    style={{ fontSize: '0.88rem', fontWeight: 600, color: '#0f172a', cursor: 'pointer' }}
                  >
                    {b.customerName}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: '#64748b' }}>
                    {b.inputWeight}kg {b.grainType} • {b.date || getRelativeTime(b.createdAt)}
                  </div>
                </div>

                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '0.9rem', fontWeight: 700, color: '#0f172a', fontVariantNumeric: 'tabular-nums' }}>
                    ₹{b.amount}
                  </div>
                  <div style={{
                    fontSize: '0.68rem',
                    fontWeight: 600,
                    color: b.paymentMode === 'credit' ? '#dc2626' : '#16a34a'
                  }}>
                    {b.paymentMode === 'credit' ? 'Udhar' : 'Paid'}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
