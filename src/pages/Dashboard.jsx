import React, { useState } from 'react';
import { 
  Wheat, 
  Droplets, 
  Clock, 
  CheckCircle2, 
  PlusCircle, 
  Search, 
  BookOpen, 
  ChevronRight,
  MapPin,
  Package,
  Scale
} from 'lucide-react';
import { useStore } from '../store/useStore';
import { useTranslation } from '../utils/translations';
import GaonSelector from '../components/GaonSelector';

export default function Dashboard({ setActiveTab, onSelectCustomer }) {
  const { t } = useTranslation();
  const activeMode = useStore((state) => state.activeMode || 'chakki');
  const boris = useStore((state) => state.boris || []);
  const customers = useStore((state) => state.customers || []);
  const markBoriDone = useStore((state) => state.markBoriDone);
  const selectedVillage = useStore((state) => state.selectedVillage || 'all');
  const setSelectedVillage = useStore((state) => state.setSelectedVillage);

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
    if (diffDays === 1) return t('dashboard.yesterday');
    if (diffDays > 1) return `${diffDays}d pehle`;
    return t('dashboard.today');
  };

  const now = new Date();
  const todayStr = now.toISOString().split('T')[0];
  const yesterdayDate = new Date(now - 86400000);
  const yesterdayStr = yesterdayDate.toISOString().split('T')[0];

  // Filter Boris by mode
  const modeBoris = boris.filter((b) => b.mode === activeMode);
  const query = searchQuery.trim().toLowerCase();

  // 1. Pending Boris in current mode (filtered by selected village & search)
  const pendingBoris = modeBoris
    .filter((b) => b.status === 'pending')
    .filter((b) => {
      if (selectedVillage === 'all') return true;
      const vTarget = selectedVillage.trim().toLowerCase();
      const bV = (b.customerVillage || '').trim().toLowerCase();
      if (bV) return bV === vTarget;
      const cust = customers.find(c => c.id === b.customerId || c.name === b.customerName);
      return (cust?.village || '').trim().toLowerCase() === vTarget;
    })
    .filter((b) => {
      if (!query) return true;
      return (
        b.customerName?.toLowerCase().includes(query) ||
        b.grainType?.toLowerCase().includes(query) ||
        b.outputType?.toLowerCase().includes(query) ||
        b.customerVillage?.toLowerCase().includes(query) ||
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

  // 2. Completed Entries (filtered by selected village, date, & search)
  const filteredCompletedBoris = modeBoris
    .filter((b) => b.status === 'done' || b.status === 'picked_up')
    .filter((b) => isDateInFilter(b.doneDate || b.createdAt))
    .filter((b) => {
      if (selectedVillage === 'all') return true;
      const vTarget = selectedVillage.trim().toLowerCase();
      const bV = (b.customerVillage || '').trim().toLowerCase();
      if (bV) return bV === vTarget;
      const cust = customers.find(c => c.id === b.customerId || c.name === b.customerName);
      return (cust?.village || '').trim().toLowerCase() === vTarget;
    })
    .filter((b) => {
      if (!query) return true;
      return (
        b.customerName?.toLowerCase().includes(query) ||
        b.grainType?.toLowerCase().includes(query) ||
        b.outputType?.toLowerCase().includes(query) ||
        b.customerVillage?.toLowerCase().includes(query) ||
        b.customerPhone?.includes(query) ||
        b.notes?.toLowerCase().includes(query)
      );
    });

  // Summary Stats
  const allDateDone = modeBoris
    .filter((b) => b.status === 'done' || b.status === 'picked_up')
    .filter((b) => isDateInFilter(b.doneDate || b.createdAt))
    .filter((b) => {
      if (selectedVillage === 'all') return true;
      const vTarget = selectedVillage.trim().toLowerCase();
      const bV = (b.customerVillage || '').trim().toLowerCase();
      if (bV) return bV === vTarget;
      const cust = customers.find(c => c.id === b.customerId || c.name === b.customerName);
      return (cust?.village || '').trim().toLowerCase() === vTarget;
    });

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
      
      {/* 1. Hero Summary Card (High-Contrast Shop Floor Edition) */}
      <section style={{
        backgroundColor: '#ffffff',
        border: '1.5px solid #cbd5e1',
        borderRadius: '1rem',
        padding: '1.25rem',
        boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
        boxSizing: 'border-box'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <div style={{ fontSize: '0.8rem', fontWeight: 800, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            {dateFilter === 'aaj' ? t('dashboard.todaySummary') : (dateFilter === 'kal' ? t('dashboard.yesterdaySummary') : t('dashboard.summary'))} • {activeMode.toUpperCase()}{selectedVillage !== 'all' ? ` (${selectedVillage})` : ''}
          </div>
          <div style={{ fontSize: '0.78rem', fontWeight: 800, color: activeMode === 'chakki' ? '#d97706' : '#059669', display: 'flex', alignItems: 'center', gap: '4px' }}>
            {activeMode === 'chakki' ? <Wheat size={16} /> : <Droplets size={16} />}
            <span>{activeMode === 'chakki' ? t('dashboard.grainsSubtitleChakki') : t('dashboard.grainsSubtitleSpellar')}</span>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px', textAlign: 'left' }}>
          {/* Income */}
          <div>
            <div style={{ fontSize: '0.75rem', color: '#475569', fontWeight: 700, marginBottom: '2px' }}>
              {t('dashboard.totalIncome')}
            </div>
            <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#020617', fontFamily: "'Plus Jakarta Sans', sans-serif", fontVariantNumeric: 'tabular-nums' }}>
              ₹ {totalKamai}
            </div>
          </div>

          {/* Weight */}
          <div>
            <div style={{ fontSize: '0.75rem', color: '#475569', fontWeight: 700, marginBottom: '2px' }}>
              {activeMode === 'chakki' ? t('dashboard.grinding') : t('dashboard.pressing')}
            </div>
            <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#020617', fontFamily: "'Plus Jakarta Sans', sans-serif", fontVariantNumeric: 'tabular-nums' }}>
              {totalKg} <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#475569' }}>{t('common.kg')}</span>
            </div>
          </div>

          {/* Udhar */}
          <div>
            <div style={{ fontSize: '0.75rem', color: '#dc2626', fontWeight: 700, marginBottom: '2px' }}>
              {t('dashboard.remainingDues')}
            </div>
            <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#dc2626', fontFamily: "'Plus Jakarta Sans', sans-serif", fontVariantNumeric: 'tabular-nums' }}>
              ₹ {totalUdhar}
            </div>
          </div>
        </div>
      </section>

      {/* 2. Quick Action Bar - 52px Touch Target */}
      <section style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
        <button
          type="button"
          onClick={() => setActiveTab('entry')}
          style={{
            height: '52px',
            backgroundColor: '#d97706',
            color: '#ffffff',
            border: 'none',
            borderRadius: '0.75rem',
            fontSize: '0.95rem',
            fontWeight: 800,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            boxShadow: '0 4px 14px rgba(217, 119, 6, 0.3)',
            transition: 'all 0.15s ease'
          }}
        >
          <PlusCircle size={20} />
          <span>{t('dashboard.newBoriEntry')}</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('khata')}
          style={{
            height: '52px',
            backgroundColor: '#ffffff',
            color: '#020617',
            border: '1.5px solid #cbd5e1',
            borderRadius: '0.75rem',
            fontSize: '0.95rem',
            fontWeight: 800,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            transition: 'all 0.15s ease'
          }}
        >
          <BookOpen size={20} color="#475569" />
          <span>{t('dashboard.grahakKhata')}</span>
        </button>
      </section>

      {/* 2.5. Gaon Selector (1-Tap Multi-Village Filter for Queue & Stats) */}
      <GaonSelector
        selectedVillage={selectedVillage}
        onSelectVillage={(v) => setSelectedVillage(v)}
        badgeType="pending"
        allLabel={t('common.allVillages')}
      />

      {/* 3. Search & Date Filter Triggers */}
      <section style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        <div style={{ position: 'relative', width: '100%' }}>
          <Search size={18} color="#475569" style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)' }} />
          <input
            type="text"
            placeholder={t('dashboard.searchPlaceholder')}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              width: '100%',
              height: '48px',
              padding: '0 14px 0 42px',
              borderRadius: '0.75rem',
              border: '1.5px solid #cbd5e1',
              backgroundColor: '#ffffff',
              fontSize: '0.92rem',
              color: '#020617',
              fontWeight: 600,
              outline: 'none',
              boxSizing: 'border-box'
            }}
          />
        </div>

        {/* Minimal Filter Tabs - 44px Height */}
        <div style={{ display: 'flex', borderBottom: '1.5px solid #cbd5e1', gap: '16px', paddingBottom: '4px' }}>
          {[
            { id: 'aaj', label: t('dashboard.today') },
            { id: 'kal', label: t('dashboard.yesterday') },
            { id: 'hafta', label: t('dashboard.days7') },
            { id: 'mahina', label: t('dashboard.thisMonth') }
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setDateFilter(tab.id)}
              style={{
                background: 'none',
                border: 'none',
                borderBottom: dateFilter === tab.id ? '2.5px solid #d97706' : '2.5px solid transparent',
                paddingBottom: '8px',
                color: dateFilter === tab.id ? '#d97706' : '#475569',
                fontSize: '0.85rem',
                fontWeight: dateFilter === tab.id ? 800 : 600,
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
          <h2 style={{ fontSize: '0.95rem', fontWeight: 800, color: '#020617', margin: 0, display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Clock size={18} color="#d97706" />
            <span>{t('dashboard.pendingQueue')} ({pendingBoris.length})</span>
          </h2>
        </div>

        {pendingBoris.length === 0 ? (
          <div style={{
            backgroundColor: '#ffffff',
            border: '1.5px solid #cbd5e1',
            borderRadius: '0.85rem',
            padding: '1.5rem',
            textAlign: 'center',
            color: '#475569',
            fontSize: '0.88rem',
            fontWeight: 600
          }}>
            {t('dashboard.noPending')}
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {pendingBoris.map((b) => (
              <div
                key={b.id}
                style={{
                  backgroundColor: '#ffffff',
                  border: '1.5px solid #cbd5e1',
                  borderLeft: '5px solid #f59e0b',
                  borderRadius: '0.75rem',
                  padding: '14px 16px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  boxShadow: '0 2px 6px rgba(0,0,0,0.03)'
                }}
              >
                <div>
                  <div
                    onClick={() => handleCustomerClick(b.customerId, b.customerName)}
                    style={{ fontSize: '1rem', fontWeight: 800, color: '#020617', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}
                  >
                    <span>{b.customerName}</span>
                    {b.customerVillage && (
                      <span style={{ 
                        fontSize: '0.72rem', 
                        backgroundColor: '#f1f5f9', 
                        color: '#475569', 
                        padding: '1px 7px', 
                        borderRadius: 'var(--radius-pill)', 
                        fontWeight: 700,
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '3px'
                      }}>
                        <MapPin size={10} />
                        {b.customerVillage}
                      </span>
                    )}
                    <ChevronRight size={16} color="#475569" />
                  </div>
                  <div style={{ fontSize: '0.82rem', color: '#475569', marginTop: '3px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                    <span style={{ fontWeight: 800, color: '#020617' }}>{b.inputWeight} kg</span>
                    <span>{b.grainType}</span>
                    {b.outputType && (
                      <span style={{
                        fontSize: '0.72rem',
                        fontWeight: 800,
                        padding: '1px 6px',
                        borderRadius: 'var(--radius-pill)',
                        backgroundColor: '#fef3c7',
                        color: '#92400e',
                        border: '1px solid #fde68a'
                      }}>
                        {b.outputType}
                      </span>
                    )}
                    <span>• ₹ {b.amount} ({getRelativeTime(b.createdAt)})</span>
                  </div>
                </div>

                {/* Done Trigger - 48px Inviolable Touch Target */}
                <button
                  type="button"
                  onClick={() => markBoriDone(b.id)}
                  style={{
                    height: '48px',
                    minWidth: '96px',
                    backgroundColor: '#16a34a',
                    color: '#ffffff',
                    border: 'none',
                    borderRadius: '0.65rem',
                    padding: '0 16px',
                    fontSize: '0.88rem',
                    fontWeight: 800,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px',
                    boxShadow: '0 3px 8px rgba(22, 163, 74, 0.3)'
                  }}
                >
                  <CheckCircle2 size={18} />
                  <span>{t('dashboard.done')}</span>
                </button>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* 5. Completed Register */}
      <section style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        <h2 style={{ fontSize: '0.95rem', fontWeight: 800, color: '#020617', margin: 0 }}>
          {t('dashboard.completedRegister')} ({filteredCompletedBoris.length})
        </h2>

        {filteredCompletedBoris.length === 0 ? (
          <div style={{ backgroundColor: '#ffffff', border: '1.5px solid #cbd5e1', borderRadius: '0.85rem', padding: '1.25rem', textAlign: 'center', color: '#475569', fontSize: '0.85rem', fontWeight: 600 }}>
            {t('dashboard.noCompleted')}
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {filteredCompletedBoris.map((b) => (
              <div
                key={b.id}
                style={{
                  backgroundColor: '#ffffff',
                  border: '1.5px solid #e2e8f0',
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
                    style={{ fontSize: '0.92rem', fontWeight: 700, color: '#020617', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}
                  >
                    <span>{b.customerName}</span>
                    {b.customerVillage && (
                      <span style={{ fontSize: '0.7rem', color: '#64748b', fontWeight: 600 }}>
                        ({b.customerVillage})
                      </span>
                    )}
                  </div>
                  <div style={{ fontSize: '0.78rem', color: '#475569', fontWeight: 500, display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <span>{b.inputWeight} kg {b.grainType}</span>
                    {b.outputType && <span style={{ fontWeight: 700, color: '#d97706' }}>[{b.outputType}]</span>}
                    <span>• {b.date || getRelativeTime(b.createdAt)}</span>
                  </div>
                </div>

                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '0.95rem', fontWeight: 800, color: '#020617', fontVariantNumeric: 'tabular-nums' }}>
                    ₹ {b.amount}
                  </div>
                  <div style={{
                    fontSize: '0.72rem',
                    fontWeight: 700,
                    color: b.paymentMode === 'credit' ? '#dc2626' : '#16a34a'
                  }}>
                    {b.paymentMode === 'credit' ? t('common.udhar') : t('common.paid')}
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
