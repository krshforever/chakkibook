import React, { useState, useMemo } from 'react';
import {
  Wheat,
  Droplets,
  TrendingUp,
  Clock,
  CheckCircle2,
  AlertCircle,
  PlusCircle,
  UserPlus,
  Search,
  Calendar,
  DollarSign,
  Scale,
  Phone,
  Package,
  X,
  ArrowRight,
  ChevronRight,
  MapPin,
  IndianRupee
} from 'lucide-react';
import { useStore } from '../store/useStore';

export default function Dashboard({ setActiveTab, onSelectCustomer }) {
  const activeMode = useStore((state) => state.activeMode || 'chakki');
  const boris = useStore((state) => state.boris || []);
  const customers = useStore((state) => state.customers || []);
  const inventory = useStore((state) => state.inventory || []);
  const markBoriDone = useStore((state) => state.markBoriDone);
  const hasPermission = useStore((state) => state.hasPermission);

  const [searchQuery, setSearchQuery] = useState('');
  const [dateFilter, setDateFilter] = useState('aaj'); // 'aaj' | 'kal' | 'hafta' | 'mahina'

  // Relative time helper (clean Hindi/Hinglish)
  const getRelativeTime = (dateStr) => {
    if (!dateStr) return 'Kuch der pehle';
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now - date;
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffHours < 1) return 'Abhi abhi';
    if (diffHours < 4) return `${diffHours} ghante pehle`;
    if (diffHours < 14) return 'Aaj subah';
    if (diffDays === 1) return 'Kal (1 din pehle)';
    if (diffDays > 1) return `${diffDays} din pehle`;
    return 'Aaj';
  };

  const now = new Date();
  const todayStr = now.toISOString().split('T')[0];
  const yesterdayDate = new Date(now.getTime() - 86400000);
  const yesterdayStr = yesterdayDate.toISOString().split('T')[0];

  // Filter Boris by active mode
  const modeBoris = useMemo(() => {
    return boris.filter((b) => b.mode === activeMode);
  }, [boris, activeMode]);

  const query = searchQuery.trim().toLowerCase();

  // 1. Pending Boris in current mode
  const pendingBoris = useMemo(() => {
    return modeBoris
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
  }, [modeBoris, query]);

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
  const filteredCompletedBoris = useMemo(() => {
    return modeBoris
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
  }, [modeBoris, dateFilter, query]);

  // Summary Stats based on current date selection
  const allDateDone = useMemo(() => {
    return modeBoris
      .filter((b) => b.status === 'done' || b.status === 'picked_up')
      .filter((b) => isDateInFilter(b.doneDate || b.createdAt));
  }, [modeBoris, dateFilter]);

  const totalKg = allDateDone.reduce((sum, b) => sum + (Number(b.inputWeight) || 0), 0);
  const totalKamai = allDateDone.reduce((sum, b) => sum + (Number(b.amount) || 0), 0);
  const totalUdhar = allDateDone
    .filter((b) => b.paymentMode === 'credit')
    .reduce((sum, b) => sum + (Number(b.amount) || 0), 0);

  const pendingWeight = pendingBoris.reduce((sum, b) => sum + (Number(b.inputWeight) || 0), 0);

  // Overall Customer Udhar / Due Khata
  const totalOutstandingDue = useMemo(() => {
    return customers.reduce((sum, c) => sum + (c.balance > 0 ? Number(c.balance) : 0), 0);
  }, [customers]);

  const customersWithDueCount = useMemo(() => {
    return customers.filter((c) => c.balance > 0).length;
  }, [customers]);

  // Inventory & Stock stats
  const totalStockUnits = useMemo(() => {
    return inventory.reduce((sum, item) => sum + (Number(item.stock) || 0), 0);
  }, [inventory]);

  const lowStockItems = useMemo(() => {
    return inventory.filter((item) => Number(item.stock) <= Number(item.lowAlert || 0));
  }, [inventory]);

  // Matching customers if search query is active
  const matchingCustomers = useMemo(() => {
    if (!query) return [];
    return customers.filter(
      (c) =>
        c.name.toLowerCase().includes(query) ||
        (c.phone && c.phone.includes(query)) ||
        (c.village && c.village.toLowerCase().includes(query))
    );
  }, [customers, query]);

  const handleCustomerClick = (customerId, customerName) => {
    const cust = customers.find((c) => c.id === customerId || c.name === customerName);
    if (cust && onSelectCustomer) {
      onSelectCustomer(cust);
    }
    setActiveTab('khata');
  };

  const getDateFilterLabel = () => {
    switch (dateFilter) {
      case 'aaj':
        return 'Aaj Ka Hisab';
      case 'kal':
        return 'Kal Ka Hisab';
      case 'hafta':
        return 'Is Hafte Ka Hisab';
      case 'mahina':
        return 'Is Mahine Ka Hisab';
      default:
        return 'Kul Hisab';
    }
  };

  return (
    <div className="app-container">
      {/* Top Mode Header Banner */}
      <section
        style={{
          background:
            activeMode === 'chakki'
              ? 'linear-gradient(135deg, #2e1d10 0%, #1e293b 100%)'
              : 'linear-gradient(135deg, #142e18 0%, #1e293b 100%)',
          border: `1px solid ${activeMode === 'chakki' ? 'rgba(217, 119, 6, 0.4)' : 'rgba(101, 163, 13, 0.4)'}`,
          borderRadius: '1rem',
          padding: '0.85rem 1rem',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          boxShadow: '0 4px 14px rgba(0, 0, 0, 0.25)'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
          <div
            style={{
              width: '36px',
              height: '36px',
              borderRadius: '0.6rem',
              backgroundColor: activeMode === 'chakki' ? 'rgba(217, 119, 6, 0.25)' : 'rgba(101, 163, 13, 0.25)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: activeMode === 'chakki' ? '#fbbf24' : '#a3e635'
            }}
          >
            {activeMode === 'chakki' ? <Wheat size={20} strokeWidth={2.2} /> : <Droplets size={20} strokeWidth={2.2} />}
          </div>
          <div>
            <div
              style={{
                fontSize: '0.72rem',
                fontWeight: '700',
                color: activeMode === 'chakki' ? '#fcd34d' : '#bef264',
                textTransform: 'uppercase',
                letterSpacing: '0.06em'
              }}
            >
              {activeMode === 'chakki' ? 'Atta Pisai Mode' : 'Oil Spellar Mill'}
            </div>
            <div style={{ fontSize: '0.95rem', fontWeight: '800', color: '#ffffff' }}>
              {getDateFilterLabel()}
            </div>
          </div>
        </div>

        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.35rem',
            padding: '0.3rem 0.65rem',
            borderRadius: '9999px',
            backgroundColor: activeMode === 'chakki' ? '#d97706' : '#4d7c0f',
            color: '#ffffff',
            fontSize: '0.72rem',
            fontWeight: '700'
          }}
        >
          {activeMode === 'chakki' ? <Wheat size={13} strokeWidth={2.5} /> : <Droplets size={13} strokeWidth={2.5} />}
          <span>{activeMode === 'chakki' ? 'Chakki Register' : 'Spellar Register'}</span>
        </div>
      </section>

      {/* 1. Hero Metric Cards (Today's Earnings, Pending Boris, Due Khata, Active Stock) */}
      <section
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(2, 1fr)',
          gap: '10px'
        }}
      >
        {/* Metric 1: Today's / Filtered Earnings */}
        <div
          className="card"
          style={{
            background: 'linear-gradient(145deg, rgba(22, 101, 52, 0.18), rgba(15, 23, 42, 0.45))',
            border: '1px solid rgba(34, 197, 94, 0.3)',
            borderRadius: '1rem',
            padding: '0.9rem',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)'
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.4rem' }}>
            <span style={{ fontSize: '0.74rem', fontWeight: '700', color: '#86efac', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              {dateFilter === 'aaj' ? "Today's Earnings" : 'Total Earnings'}
            </span>
            <div
              style={{
                width: '30px',
                height: '30px',
                borderRadius: '8px',
                backgroundColor: 'rgba(34, 197, 94, 0.2)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#4ade80'
              }}
            >
              <TrendingUp size={16} strokeWidth={2.4} />
            </div>
          </div>
          <div>
            <div style={{ fontSize: '1.65rem', fontWeight: '900', color: '#4ade80', lineHeight: 1.15 }}>
              ₹{totalKamai.toLocaleString('en-IN')}
            </div>
            <div style={{ fontSize: '0.72rem', color: '#cbd5e1', marginTop: '0.25rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
              <span>{allDateDone.length} entries</span>
              <span>•</span>
              <span>{totalKg} kg</span>
            </div>
          </div>
        </div>

        {/* Metric 2: Pending Boris */}
        <div
          className="card"
          style={{
            background: 'linear-gradient(145deg, rgba(161, 98, 7, 0.18), rgba(15, 23, 42, 0.45))',
            border: '1px solid rgba(234, 179, 8, 0.3)',
            borderRadius: '1rem',
            padding: '0.9rem',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)'
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.4rem' }}>
            <span style={{ fontSize: '0.74rem', fontWeight: '700', color: '#fde047', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Pending Boris
            </span>
            <div
              style={{
                width: '30px',
                height: '30px',
                borderRadius: '8px',
                backgroundColor: 'rgba(234, 179, 8, 0.2)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#facc15'
              }}
            >
              <Clock size={16} strokeWidth={2.4} />
            </div>
          </div>
          <div>
            <div style={{ fontSize: '1.65rem', fontWeight: '900', color: '#facc15', lineHeight: 1.15 }}>
              {pendingBoris.length}
            </div>
            <div style={{ fontSize: '0.72rem', color: '#cbd5e1', marginTop: '0.25rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
              <Scale size={12} strokeWidth={2.2} />
              <span>{pendingWeight} kg in queue</span>
            </div>
          </div>
        </div>

        {/* Metric 3: Due Khata (Udhaar) */}
        <div
          className="card"
          style={{
            background: 'linear-gradient(145deg, rgba(159, 18, 57, 0.18), rgba(15, 23, 42, 0.45))',
            border: '1px solid rgba(244, 63, 94, 0.3)',
            borderRadius: '1rem',
            padding: '0.9rem',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)'
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.4rem' }}>
            <span style={{ fontSize: '0.74rem', fontWeight: '700', color: '#fda4af', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Due Khata
            </span>
            <div
              style={{
                width: '30px',
                height: '30px',
                borderRadius: '8px',
                backgroundColor: 'rgba(244, 63, 94, 0.2)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#fb7185'
              }}
            >
              <DollarSign size={16} strokeWidth={2.4} />
            </div>
          </div>
          <div>
            <div style={{ fontSize: '1.65rem', fontWeight: '900', color: '#fb7185', lineHeight: 1.15 }}>
              ₹{totalOutstandingDue.toLocaleString('en-IN')}
            </div>
            <div style={{ fontSize: '0.72rem', color: '#cbd5e1', marginTop: '0.25rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
              <span>{customersWithDueCount} grahak baaki</span>
              {totalUdhar > 0 && <span style={{ color: '#f87171' }}>• +₹{totalUdhar}</span>}
            </div>
          </div>
        </div>

        {/* Metric 4: Active Stock */}
        <div
          className="card"
          style={{
            background: 'linear-gradient(145deg, rgba(3, 105, 161, 0.18), rgba(15, 23, 42, 0.45))',
            border: '1px solid rgba(56, 189, 248, 0.3)',
            borderRadius: '1rem',
            padding: '0.9rem',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)'
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.4rem' }}>
            <span style={{ fontSize: '0.74rem', fontWeight: '700', color: '#7dd3fc', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Active Stock
            </span>
            <div
              style={{
                width: '30px',
                height: '30px',
                borderRadius: '8px',
                backgroundColor: 'rgba(56, 189, 248, 0.2)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#38bdf8'
              }}
            >
              <Scale size={16} strokeWidth={2.4} />
            </div>
          </div>
          <div>
            <div style={{ fontSize: '1.65rem', fontWeight: '900', color: '#38bdf8', lineHeight: 1.15 }}>
              {activeMode === 'spellar' ? `${totalStockUnits}` : `${inventory.length}`}
              <span style={{ fontSize: '0.82rem', fontWeight: '600', marginLeft: '3px', color: '#94a3b8' }}>
                {activeMode === 'spellar' ? (inventory[0]?.unit || 'kg') : 'items'}
              </span>
            </div>
            <div style={{ fontSize: '0.72rem', color: '#cbd5e1', marginTop: '0.25rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
              {lowStockItems.length > 0 ? (
                <span style={{ color: '#fb923c', display: 'flex', alignItems: 'center', gap: '2px' }}>
                  <AlertCircle size={12} strokeWidth={2.4} />
                  <span>{lowStockItems.length} low stock</span>
                </span>
              ) : (
                <span style={{ color: '#4ade80', display: 'flex', alignItems: 'center', gap: '2px' }}>
                  <CheckCircle2 size={12} strokeWidth={2.2} />
                  <span>Stock OK</span>
                </span>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* 2. Low Stock Alert Banner (When Items Need Reorder) */}
      {lowStockItems.length > 0 && (
        <div
          style={{
            backgroundColor: 'rgba(124, 45, 18, 0.25)',
            border: '1px solid rgba(249, 115, 22, 0.4)',
            borderRadius: '0.85rem',
            padding: '0.75rem 1rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '0.75rem'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <div
              style={{
                width: '28px',
                height: '28px',
                borderRadius: '6px',
                backgroundColor: 'rgba(249, 115, 22, 0.2)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#fb923c'
              }}
            >
              <AlertCircle size={16} strokeWidth={2.4} />
            </div>
            <div style={{ fontSize: '0.8rem', color: '#fdba74' }}>
              <strong>Low Stock:</strong>{' '}
              {lowStockItems.map((i) => `${i.name.split('(')[0]} (${i.stock} ${i.unit})`).join(', ')}
            </div>
          </div>

          <button
            type="button"
            onClick={() => setActiveTab('stock')}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px',
              background: '#f97316',
              border: 'none',
              borderRadius: '0.5rem',
              color: '#ffffff',
              fontSize: '0.74rem',
              fontWeight: '700',
              padding: '0.4rem 0.65rem',
              cursor: 'pointer',
              whiteSpace: 'nowrap'
            }}
          >
            <span>Stock Check</span>
            <ArrowRight size={13} strokeWidth={2.2} />
          </button>
        </div>
      )}

      {/* 3. 4 Quick Action Cards */}
      <section>
        <div className="section-header">
          <span>Quick Actions</span>
          <span className="section-badge">Fast Register</span>
        </div>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(2, 1fr)',
            gap: '10px'
          }}
        >
          {/* Action 1: Nayi Bori Entry */}
          <button
            type="button"
            onClick={() => setActiveTab('entry')}
            style={{
              background: 'var(--card-bg)',
              border: '1px solid var(--card-border)',
              borderRadius: '0.95rem',
              padding: '0.9rem',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'flex-start',
              gap: '0.5rem',
              cursor: 'pointer',
              textAlign: 'left',
              transition: 'all 0.15s ease',
              boxShadow: 'var(--shadow-sm)'
            }}
          >
            <div
              style={{
                width: '38px',
                height: '38px',
                borderRadius: '0.65rem',
                backgroundColor: activeMode === 'chakki' ? 'rgba(217, 119, 6, 0.18)' : 'rgba(101, 163, 13, 0.18)',
                color: activeMode === 'chakki' ? 'var(--primary)' : '#84cc16',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <PlusCircle size={20} strokeWidth={2.3} />
            </div>
            <div>
              <div style={{ fontSize: '0.95rem', fontWeight: '800', color: 'var(--text-main)' }}>
                Nayi Bori
              </div>
              <div style={{ fontSize: '0.73rem', color: 'var(--text-muted)' }}>
                {activeMode === 'chakki' ? 'Pisai Entry Karein' : 'Pirai Entry Karein'}
              </div>
            </div>
          </button>

          {/* Action 2: Naya Grahak */}
          <button
            type="button"
            onClick={() => setActiveTab('khata')}
            style={{
              background: 'var(--card-bg)',
              border: '1px solid var(--card-border)',
              borderRadius: '0.95rem',
              padding: '0.9rem',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'flex-start',
              gap: '0.5rem',
              cursor: 'pointer',
              textAlign: 'left',
              transition: 'all 0.15s ease',
              boxShadow: 'var(--shadow-sm)'
            }}
          >
            <div
              style={{
                width: '38px',
                height: '38px',
                borderRadius: '0.65rem',
                backgroundColor: 'rgba(99, 102, 241, 0.18)',
                color: '#818cf8',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <UserPlus size={20} strokeWidth={2.3} />
            </div>
            <div>
              <div style={{ fontSize: '0.95rem', fontWeight: '800', color: 'var(--text-main)' }}>
                Naya Grahak
              </div>
              <div style={{ fontSize: '0.73rem', color: 'var(--text-muted)' }}>
                Khata & Phone Add
              </div>
            </div>
          </button>

          {/* Action 3: Due Khata */}
          <button
            type="button"
            onClick={() => setActiveTab('khata')}
            style={{
              background: 'var(--card-bg)',
              border: '1px solid var(--card-border)',
              borderRadius: '0.95rem',
              padding: '0.9rem',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'flex-start',
              gap: '0.5rem',
              cursor: 'pointer',
              textAlign: 'left',
              transition: 'all 0.15s ease',
              boxShadow: 'var(--shadow-sm)'
            }}
          >
            <div
              style={{
                width: '38px',
                height: '38px',
                borderRadius: '0.65rem',
                backgroundColor: 'rgba(239, 68, 68, 0.18)',
                color: '#f87171',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <DollarSign size={20} strokeWidth={2.3} />
            </div>
            <div>
              <div style={{ fontSize: '0.95rem', fontWeight: '800', color: 'var(--text-main)' }}>
                Udhar Khata
              </div>
              <div style={{ fontSize: '0.73rem', color: 'var(--text-muted)' }}>
                ₹{totalOutstandingDue.toLocaleString('en-IN')} Baaki
              </div>
            </div>
          </button>

          {/* Action 4: Stock & Mandi */}
          <button
            type="button"
            onClick={() => setActiveTab('stock')}
            style={{
              background: 'var(--card-bg)',
              border: '1px solid var(--card-border)',
              borderRadius: '0.95rem',
              padding: '0.9rem',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'flex-start',
              gap: '0.5rem',
              cursor: 'pointer',
              textAlign: 'left',
              transition: 'all 0.15s ease',
              boxShadow: 'var(--shadow-sm)'
            }}
          >
            <div
              style={{
                width: '38px',
                height: '38px',
                borderRadius: '0.65rem',
                backgroundColor: 'rgba(16, 185, 129, 0.18)',
                color: '#34d399',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <Package size={20} strokeWidth={2.3} />
            </div>
            <div>
              <div style={{ fontSize: '0.95rem', fontWeight: '800', color: 'var(--text-main)' }}>
                Stock & Mal
              </div>
              <div style={{ fontSize: '0.73rem', color: 'var(--text-muted)' }}>
                {activeMode === 'spellar' ? 'Tel & Khali Mal' : 'Dukan Mal & Galla'}
              </div>
            </div>
          </button>
        </div>
      </section>

      {/* 4. Search Bar & Date Filter Pills */}
      <section style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {/* Search Bar */}
        <div className="search-bar-wrapper">
          <span className="search-icon" style={{ display: 'flex', alignItems: 'center' }}>
            <Search size={18} strokeWidth={2.2} />
          </span>
          <input
            type="text"
            className="search-bar"
            placeholder="Search grahak naam, phone, gaon, anaj..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              type="button"
              aria-label="Clear Search"
              style={{
                position: 'absolute',
                right: '14px',
                top: '50%',
                transform: 'translateY(-50%)',
                background: 'none',
                border: 'none',
                color: 'var(--text-muted)',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <X size={18} strokeWidth={2.2} />
            </button>
          )}
        </div>

        {/* Date Filter Pills */}
        <div
          style={{
            display: 'flex',
            gap: '6px',
            overflowX: 'auto',
            paddingBottom: '2px'
          }}
        >
          {[
            { id: 'aaj', label: 'Aaj', icon: <Calendar size={14} strokeWidth={2.3} /> },
            { id: 'kal', label: 'Kal', icon: <Clock size={14} strokeWidth={2.3} /> },
            { id: 'hafta', label: 'Is Hafta', icon: <TrendingUp size={14} strokeWidth={2.3} /> },
            { id: 'mahina', label: 'Is Mahina', icon: <Calendar size={14} strokeWidth={2.3} /> }
          ].map((f) => {
            const isActive = dateFilter === f.id;
            return (
              <button
                key={f.id}
                type="button"
                onClick={() => setDateFilter(f.id)}
                style={{
                  flex: 1,
                  minHeight: '40px',
                  padding: '0.4rem 0.65rem',
                  borderRadius: '2rem',
                  border: isActive
                    ? `1.5px solid ${activeMode === 'chakki' ? '#d97706' : '#65a30d'}`
                    : '1px solid var(--card-border)',
                  backgroundColor: isActive
                    ? (activeMode === 'chakki' ? '#d97706' : '#65a30d')
                    : 'var(--card-bg)',
                  color: isActive ? '#ffffff' : 'var(--text-main)',
                  fontSize: '0.8rem',
                  fontWeight: isActive ? '800' : '600',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '5px',
                  whiteSpace: 'nowrap',
                  boxShadow: isActive ? 'var(--shadow-sm)' : 'none',
                  transition: 'all 0.15s ease'
                }}
              >
                {f.icon}
                <span>{f.label}</span>
              </button>
            );
          })}
        </div>
      </section>

      {/* 5. Matching Customers (Live Search Drawer) */}
      {query && matchingCustomers.length > 0 && (
        <section style={{ marginTop: '0.25rem' }}>
          <div className="section-header">
            <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
              <UserPlus size={15} strokeWidth={2.2} />
              <span>Matching Grahak ({matchingCustomers.length})</span>
            </span>
            <span className="section-badge">Khata Directory</span>
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
                  cursor: 'pointer',
                  borderRadius: '0.85rem'
                }}
                onClick={() => handleCustomerClick(cust.id, cust.name)}
              >
                <div>
                  <strong style={{ fontSize: '0.98rem', color: 'var(--text-main)' }}>{cust.name}</strong>
                  <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '3px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '3px' }}>
                      <MapPin size={12} strokeWidth={2} />
                      <span>{cust.village || 'Gaon'}</span>
                    </span>
                    <span>•</span>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '3px' }}>
                      <Phone size={12} strokeWidth={2} />
                      <span>{cust.phone || 'No phone'}</span>
                    </span>
                  </div>
                </div>

                <div style={{ textAlign: 'right' }}>
                  <div
                    style={{
                      fontSize: '0.95rem',
                      fontWeight: 800,
                      color: cust.balance > 0 ? 'var(--danger)' : 'var(--success)'
                    }}
                  >
                    {cust.balance > 0 ? `₹${cust.balance} Udhar` : 'Clear'}
                  </div>
                  <span
                    style={{
                      fontSize: '0.74rem',
                      color: 'var(--primary)',
                      fontWeight: 700,
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '2px',
                      marginTop: '2px'
                    }}
                  >
                    <span>Khata Kholein</span>
                    <ChevronRight size={13} strokeWidth={2.4} />
                  </span>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* 6. Pending Boris Queue (Structured Cards) */}
      <section>
        <div className="section-header">
          <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Clock size={16} strokeWidth={2.4} />
            <span>Pending Queue ({pendingBoris.length})</span>
          </span>
          <span className="section-badge">
            {activeMode === 'chakki' ? 'Chakki Pisai' : 'Spellar Pirai'}
          </span>
        </div>

        {pendingBoris.length === 0 ? (
          <div
            className="card empty-state"
            style={{
              textAlign: 'center',
              padding: '2rem 1rem',
              borderRadius: '1rem',
              backgroundColor: 'var(--card-bg)'
            }}
          >
            <div
              style={{
                width: '60px',
                height: '60px',
                borderRadius: '50%',
                backgroundColor: 'rgba(234, 179, 8, 0.15)',
                color: '#eab308',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 0.75rem auto'
              }}
            >
              <Package size={30} strokeWidth={2} />
            </div>
            <h3 style={{ fontSize: '1.1rem', fontWeight: '800', margin: '0 0 0.25rem 0' }}>
              Sab kaam complete hai!
            </h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', margin: '0 0 1rem 0' }}>
              {query
                ? 'Koi matching pending bori nahi mili.'
                : `Abhi koi pending ${activeMode === 'chakki' ? 'pisai' : 'pirai'} bori nahi hai.`}
            </p>
            {hasPermission('addBori') && (
              <button
                type="button"
                className="big-btn"
                onClick={() => setActiveTab('entry')}
                style={{ width: 'auto', margin: '0 auto', padding: '0.75rem 1.5rem', minHeight: '48px' }}
              >
                <PlusCircle size={18} strokeWidth={2.4} />
                <span>Nayi Bori Jama Karein</span>
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
                  border: '1px solid var(--card-border)',
                  boxShadow: 'var(--shadow-sm)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.75rem'
                }}
              >
                {/* Customer Row */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <strong
                      style={{
                        fontSize: '1.05rem',
                        color: 'var(--text-main)',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px'
                      }}
                      onClick={() => handleCustomerClick(bori.customerId, bori.customerName)}
                    >
                      <UserPlus size={16} strokeWidth={2.2} style={{ color: 'var(--primary)' }} />
                      <span>{bori.customerName || 'Walk-in Grahak'}</span>
                    </strong>
                    <div
                      style={{
                        fontSize: '0.78rem',
                        color: 'var(--text-muted)',
                        marginTop: '3px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '5px'
                      }}
                    >
                      <Clock size={12} strokeWidth={2} />
                      <span>{getRelativeTime(bori.dropOffDate || bori.createdAt)}</span>
                      {bori.notes && <span>• {bori.notes}</span>}
                    </div>
                  </div>

                  <span
                    className="section-badge"
                    style={{
                      background: 'rgba(234, 179, 8, 0.2)',
                      color: '#facc15',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px'
                    }}
                  >
                    <Clock size={11} strokeWidth={2.4} />
                    <span>PENDING</span>
                  </span>
                </div>

                {/* Weight & Grain Details */}
                <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '0.6rem' }}>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.35rem' }}>
                    <Scale size={16} strokeWidth={2.3} style={{ color: '#fbbf24', alignSelf: 'center' }} />
                    <span style={{ fontSize: '1.5rem', fontWeight: '800', color: '#fbbf24' }}>
                      {bori.inputWeight} kg
                    </span>
                  </div>

                  <span
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px',
                      padding: '3px 8px',
                      borderRadius: '0.5rem',
                      backgroundColor: 'rgba(255, 255, 255, 0.08)',
                      fontSize: '0.85rem',
                      fontWeight: '700',
                      color: '#cbd5e1'
                    }}
                  >
                    {activeMode === 'chakki' ? <Wheat size={14} strokeWidth={2.2} /> : <Droplets size={14} strokeWidth={2.2} />}
                    <span>{bori.grainType || (activeMode === 'chakki' ? 'Wheat' : 'Sarson')}</span>
                  </span>

                  {bori.kaddaDeducted > 0 && (
                    <span style={{ fontSize: '0.76rem', color: '#94a3b8' }}>
                      (Kadda: -{bori.kaddaDeducted}kg = Net {bori.outputWeight}kg)
                    </span>
                  )}
                </div>

                {/* Amount and Rate Info */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                  <span>
                    Rate: ₹{bori.rate || (activeMode === 'chakki' ? 4 : 12)}/kg • Kul: ₹{bori.amount || 0}
                  </span>
                  <span
                    className={`status-pill ${bori.paymentMode || 'cash'}`}
                    style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                  >
                    {bori.paymentMode === 'credit' ? (
                      <>
                        <AlertCircle size={11} strokeWidth={2.4} />
                        <span>Udhar</span>
                      </>
                    ) : bori.paymentMode === 'upi' ? (
                      <>
                        <TrendingUp size={11} strokeWidth={2.4} />
                        <span>UPI</span>
                      </>
                    ) : (
                      <>
                        <CheckCircle2 size={11} strokeWidth={2.4} />
                        <span>Cash</span>
                      </>
                    )}
                  </span>
                </div>

                {/* Action Buttons */}
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: bori.customerPhone ? '1fr 1fr' : '1fr',
                    gap: '8px',
                    marginTop: '0.2rem'
                  }}
                >
                  {hasPermission('markDone') && (
                    <button
                      type="button"
                      onClick={() => markBoriDone(bori.id)}
                      style={{
                        minHeight: '48px',
                        backgroundColor: '#166534',
                        color: '#ffffff',
                        border: 'none',
                        borderRadius: '0.75rem',
                        fontSize: '0.95rem',
                        fontWeight: '800',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '0.45rem',
                        boxShadow: '0 2px 6px rgba(22, 101, 52, 0.4)'
                      }}
                    >
                      <CheckCircle2 size={18} strokeWidth={2.4} />
                      <span>Done (Complete)</span>
                    </button>
                  )}

                  {bori.customerPhone && (
                    <a
                      href={`tel:${bori.customerPhone}`}
                      style={{
                        minHeight: '48px',
                        backgroundColor: '#1e293b',
                        color: '#38bdf8',
                        border: '1px solid #0284c7',
                        borderRadius: '0.75rem',
                        fontSize: '0.92rem',
                        fontWeight: '700',
                        textDecoration: 'none',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '0.45rem'
                      }}
                    >
                      <Phone size={16} strokeWidth={2.3} />
                      <span>Call Customer</span>
                    </a>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* 7. Completed Entries Feed */}
      <section style={{ marginTop: '0.25rem' }}>
        <div className="section-header">
          <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <CheckCircle2 size={16} strokeWidth={2.4} />
            <span>Complete Entries ({filteredCompletedBoris.length})</span>
          </span>
          <span className="section-badge" style={{ display: 'inline-flex', alignItems: 'center', gap: '3px' }}>
            <Calendar size={11} strokeWidth={2.2} />
            <span>{dateFilter.toUpperCase()}</span>
          </span>
        </div>

        {filteredCompletedBoris.length === 0 ? (
          <div
            className="card"
            style={{
              textAlign: 'center',
              padding: '1.75rem 1rem',
              color: 'var(--text-muted)',
              fontSize: '0.9rem',
              borderRadius: '0.85rem'
            }}
          >
            <Clock size={24} strokeWidth={2} style={{ margin: '0 auto 0.5rem auto', opacity: 0.6 }} />
            <div>Is time period mein koi complete entry nahi hai.</div>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {filteredCompletedBoris.map((bori) => {
              const isCredit = bori.paymentMode === 'credit';
              return (
                <div
                  key={bori.id}
                  className="entry-row"
                  style={{
                    backgroundColor: 'var(--card-bg)',
                    borderRadius: '0.75rem',
                    padding: '0.85rem 1rem',
                    borderLeft: `4px solid ${isCredit ? '#ef4444' : '#22c55e'}`
                  }}
                >
                  <div className="entry-row-left">
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        fontWeight: '700',
                        fontSize: '0.98rem',
                        cursor: 'pointer'
                      }}
                      onClick={() => handleCustomerClick(bori.customerId, bori.customerName)}
                    >
                      {isCredit ? (
                        <AlertCircle size={15} strokeWidth={2.4} style={{ color: '#ef4444' }} />
                      ) : (
                        <CheckCircle2 size={15} strokeWidth={2.4} style={{ color: '#22c55e' }} />
                      )}
                      <span>{bori.customerName || 'Cash Customer'}</span>
                    </div>

                    <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '2px', display: 'flex', alignItems: 'center', gap: '5px' }}>
                      <Scale size={12} strokeWidth={2} />
                      <span>
                        {bori.inputWeight ? `${bori.inputWeight} kg ${bori.grainType || ''}` : bori.notes || 'Entry'}
                      </span>
                      <span>•</span>
                      <span>{getRelativeTime(bori.doneDate || bori.createdAt)}</span>
                    </div>
                  </div>

                  <div className="entry-row-right" style={{ textAlign: 'right' }}>
                    <div
                      style={{
                        fontSize: '1.15rem',
                        fontWeight: 900,
                        color: isCredit ? '#f87171' : '#4ade80'
                      }}
                    >
                      ₹{bori.amount}
                    </div>
                    <span
                      className={`status-pill ${bori.paymentMode || 'cash'}`}
                      style={{ display: 'inline-flex', alignItems: 'center', gap: '3px' }}
                    >
                      {isCredit ? (
                        <>
                          <AlertCircle size={10} strokeWidth={2.4} />
                          <span>Udhar</span>
                        </>
                      ) : bori.paymentMode === 'upi' ? (
                        <>
                          <TrendingUp size={10} strokeWidth={2.4} />
                          <span>UPI</span>
                        </>
                      ) : (
                        <>
                          <CheckCircle2 size={10} strokeWidth={2.4} />
                          <span>Cash</span>
                        </>
                      )}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* 8. Bottom Primary Action Button */}
      {hasPermission('addBori') && (
        <button
          type="button"
          className="big-btn"
          onClick={() => setActiveTab('entry')}
          style={{
            marginTop: '0.5rem',
            backgroundColor: activeMode === 'chakki' ? 'var(--primary)' : '#65a30d'
          }}
        >
          <PlusCircle size={20} strokeWidth={2.4} />
          <span>Nayi Bori Entry Karein</span>
        </button>
      )}
    </div>
  );
}
