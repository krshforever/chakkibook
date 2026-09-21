import React, { useState, useMemo } from 'react';
import { Check, ChevronRight, BarChart2, Users, Bot } from 'lucide-react';
import { useStore } from '../store/useStore';
import GaonSelector from '../components/shared/GaonSelector';
import SearchBar from '../components/shared/SearchBar';

export default function Dashboard({ setActiveTab, onSelectCustomer, onOpenNewEntry }) {
  const activeMode = useStore((state) => state.activeMode || 'chakki');
  const boris = useStore((state) => state.boris || []);
  const customers = useStore((state) => state.customers || []);
  const shop = useStore((state) => state.shop || {});
  const markBoriDone = useStore((state) => state.markBoriDone);
  const selectedVillage = useStore((state) => state.selectedVillage || 'all');
  const setSelectedVillage = useStore((state) => state.setSelectedVillage);
  const toggleAISheet = useStore((state) => state.toggleAISheet);

  const [searchQuery, setSearchQuery] = useState('');

  const now = useMemo(() => new Date(), []);
  const todayStr = useMemo(() => now.toISOString().split('T')[0], [now]);
  const dateFormatted = useMemo(() => {
    return now.toLocaleDateString('en-US', { weekday: 'long', day: 'numeric', month: 'long' });
  }, [now]);

  // Mode filtered boris
  const modeBoris = useMemo(() => boris.filter((b) => b.mode === activeMode), [boris, activeMode]);
  const query = searchQuery.trim().toLowerCase();

  // Search filter
  const matchesSearch = (b) => {
    if (!query) return true;
    return (
      b.customerName?.toLowerCase().includes(query) ||
      b.grainType?.toLowerCase().includes(query) ||
      b.customerVillage?.toLowerCase().includes(query) ||
      b.customerPhone?.includes(query)
    );
  };

  // Village filter
  const matchesVillage = (b) => {
    if (selectedVillage === 'all') return true;
    const vTarget = selectedVillage.trim().toLowerCase();
    const bV = (b.customerVillage || '').trim().toLowerCase();
    if (bV) return bV === vTarget;
    const cust = customers.find((c) => c.id === b.customerId || c.name === b.customerName);
    return (cust?.village || '').trim().toLowerCase() === vTarget;
  };

  // Pending Queue
  const pendingBoris = useMemo(() => {
    return modeBoris
      .filter((b) => b.status === 'pending')
      .filter(matchesVillage)
      .filter(matchesSearch)
      .sort((a, b) => new Date(a.dropOffDate || a.createdAt).getTime() - new Date(b.dropOffDate || b.createdAt).getTime());
  }, [modeBoris, selectedVillage, query]);

  // Today Earnings calculation
  const todayEarnings = useMemo(() => {
    return modeBoris
      .filter((b) => {
        const dStr = (b.dropOffDate || b.createdAt || '').split('T')[0];
        return dStr === todayStr;
      })
      .reduce((sum, b) => sum + (Number(b.amount) || 0), 0);
  }, [modeBoris, todayStr]);

  // Today Pisai (kg)
  const todayPisaiKg = useMemo(() => {
    return modeBoris
      .filter((b) => {
        const dStr = (b.dropOffDate || b.createdAt || '').split('T')[0];
        return dStr === todayStr;
      })
      .reduce((sum, b) => sum + (Number(b.inputWeight) || 0), 0);
  }, [modeBoris, todayStr]);

  // Total Baki Udhar
  const totalUdhar = useMemo(() => {
    return customers.reduce((sum, c) => sum + (Number(c.balance || 0) > 0 ? Number(c.balance) : 0), 0);
  }, [customers]);

  const ownerFirstName = (shop?.ownerName || 'Anuj').split(' ')[0];

  return (
    <div style={{ padding: '1rem 1rem 6rem', display: 'flex', flexDirection: 'column', gap: '14px' }}>
      
      {/* 1. TOP GREETING LINE & V1 HERO */}
      <div>
        <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '24px', fontWeight: '600', color: 'hsl(var(--ink))', lineHeight: 1.2 }}>
          Namaste, {ownerFirstName} ji
        </h1>
        <p style={{ fontSize: '12.5px', color: 'hsl(var(--ink-2))', marginTop: '2px' }}>
          {dateFormatted}
        </p>
      </div>

      {/* V1 HERO SECTION */}
      <section className="surface hero">
        <div className="hlabel">
          <span>Aaj ki kamai</span>
          <span className="trend">+12%</span>
        </div>
        <div className="hbig num">₹{todayEarnings.toLocaleString('en-IN')}</div>
        <div className="hsplit">
          <div>
            <div className="hlabel">Pisai aaj</div>
            <div className="v">{todayPisaiKg} kg</div>
          </div>
          <div>
            <div className="hlabel">Baki udhar</div>
            <div className="v danger">₹{totalUdhar.toLocaleString('en-IN')}</div>
            <button className="s" onClick={() => setActiveTab('khata')}>
              grahak dekhein ›
            </button>
          </div>
        </div>
      </section>

      {/* 2. V2 QUICK ACTIONS */}
      <div className="acts">
        <button className="btn-brand" onClick={onOpenNewEntry}>
          + Nayi Bori Entry
        </button>
        <button className="btn-quiet" onClick={() => setActiveTab('khata')}>
          Grahak Khata
        </button>
      </div>

      {/* 3. V3 AI BANNER */}
      <div className="ai-banner-row" onClick={toggleAISheet}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0 }}>
          <div className="ai-avatar-indigo">
            <Bot size={18} />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0 }}>
            <b style={{ fontSize: '11px', fontWeight: '700', color: 'hsl(var(--ai-indigo))', lineHeight: 1.2 }}>
              ChakkiBot · 1 insight
            </b>
            <span style={{ fontSize: '12.5px', color: 'hsl(var(--ink-2))', marginTop: '1px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              2 grahak ke ₹2,130 atke hain — tap to see details
            </span>
          </div>
        </div>
        <ChevronRight size={16} style={{ color: 'hsl(var(--ink-3))', flexShrink: 0 }} />
      </div>

      {/* 4. (a) PRO INSIGHTS SURFACE */}
      <section className="surface">
        <div style={{ padding: '12px 14px', borderBottom: '1px solid hsl(var(--line))', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <h2 style={{ fontSize: '15px', fontWeight: '600', color: 'hsl(var(--ink))' }}>
              Proactive Intelligence
            </h2>
            <span className="pro-tag">PRO</span>
          </div>
        </div>

        <div>
          <div className="ins-row" onClick={toggleAISheet} style={{ cursor: 'pointer' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <BarChart2 size={16} style={{ color: 'hsl(var(--ink-2))' }} />
              <span>Kal ki demand: ~420 kg gehun</span>
            </div>
            <ChevronRight size={14} style={{ color: 'hsl(var(--ink-3))' }} />
          </div>

          <div className="ins-row" onClick={() => setActiveTab('khata')} style={{ cursor: 'pointer' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <Users size={16} style={{ color: 'hsl(var(--ink-2))' }} />
              <span>3 grahak 30 din se nahi aaye</span>
            </div>
            <ChevronRight size={14} style={{ color: 'hsl(var(--ink-3))' }} />
          </div>
        </div>
      </section>

      {/* 5. (b) VILLAGE CHIPS ROW WITH LIVE COUNTS */}
      <GaonSelector
        selectedVillage={selectedVillage}
        onSelectVillage={setSelectedVillage}
      />

      {/* 6. (c) SEARCH FIELD */}
      <SearchBar
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        onClear={() => setSearchQuery('')}
      />

      {/* 7. QUEUE SECTION HEAD + QUEUE (V4 `.q-row` target ≤76px per row) */}
      <section className="surface" style={{ overflow: 'hidden' }}>
        <div style={{ padding: '12px 16px', borderBottom: '1px solid hsl(var(--line))', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <h2 style={{ fontSize: '15px', fontWeight: '600', color: 'hsl(var(--ink))' }}>
            Pending Bori Queue ({pendingBoris.length})
          </h2>
        </div>

        {pendingBoris.length === 0 ? (
          <div style={{ padding: '2rem 1rem', textAlign: 'center', color: 'hsl(var(--ink-2))', fontSize: '13px' }}>
            Sabhi bori complete hain! Koi pending queue nahi hai.
          </div>
        ) : (
          <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
            {pendingBoris.map((b) => {
              const isDue = b.paymentMode === 'credit';
              return (
                <li className="q-row" key={b.id}>
                  <span className="q-main">
                    <span className="q-name">{b.customerName}</span>
                    <span className="q-sub">
                      {b.inputWeight} kg {b.grainType} · {b.customerVillage || 'Main'} · {b.notes || 'Grinding'} · <b className={isDue ? 'due' : 'ok'}>{isDue ? 'Udhar' : 'Nokad'}</b>
                    </span>
                  </span>
                  <span className="q-side">
                    <span className="q-amt num">₹{b.amount}</span>
                    <button className="done-btn" onClick={() => markBoriDone(b.id)}>
                      <Check size={14} /> Done
                    </button>
                  </span>
                </li>
              );
            })}
          </ul>
        )}
      </section>

    </div>
  );
}
