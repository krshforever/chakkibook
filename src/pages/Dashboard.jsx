import React, { useState, useMemo } from 'react';
import { Check, ChevronRight, BarChart2, Users, Mic } from 'lucide-react';
import { useStore } from '../store/useStore';
import GaonSelector from '../components/shared/GaonSelector';
import SearchBar from '../components/shared/SearchBar';
import { identifyAtRiskCustomers, predictNextWeekDemand } from '../services/predictive';

/**
 * Dashboard.
 *
 * Everything on this screen is now computed from the ledger. The previous
 * version shipped three hardcoded strings — a "+12%" trend badge, a
 * "₹2,130 atke hain" insight line, and "Kal ki demand: ~420 kg gehun" —
 * presented to a shopkeeper as if they were live business data. They were
 * decorative text that could be flatly wrong, which is worse than showing
 * nothing. The predictive engine in `services/predictive.js` that should have
 * been powering these existed and was never imported anywhere.
 */

export default function Dashboard({ setActiveTab, onSelectCustomer, onOpenNewEntry }) {
  const activeMode = useStore((state) => state.activeMode || 'chakki');
  const boris = useStore((state) => state.boris || []);
  const customers = useStore((state) => state.customers || []);
  const shop = useStore((state) => state.shop || {});
  const markBoriDone = useStore((state) => state.markBoriDone);
  const selectedVillage = useStore((state) => state.selectedVillage || 'all');
  const setSelectedVillage = useStore((state) => state.setSelectedVillage);

  const [searchQuery, setSearchQuery] = useState('');

  const now = useMemo(() => new Date(), []);
  const todayStr = useMemo(() => now.toISOString().split('T')[0], [now]);
  const yesterdayStr = useMemo(
    () => new Date(now.getTime() - 86400000).toISOString().split('T')[0],
    [now]
  );
  const dateFormatted = useMemo(
    () => now.toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' }),
    [now]
  );

  const modeBoris = useMemo(() => boris.filter((b) => b.mode === activeMode), [boris, activeMode]);
  const query = searchQuery.trim().toLowerCase();

  const matchesSearch = (b) => {
    if (!query) return true;
    return (
      b.customerName?.toLowerCase().includes(query) ||
      b.grainType?.toLowerCase().includes(query) ||
      b.customerVillage?.toLowerCase().includes(query) ||
      b.customerPhone?.includes(query)
    );
  };

  const matchesVillage = (b) => {
    if (selectedVillage === 'all') return true;
    const vTarget = selectedVillage.trim().toLowerCase();
    const bV = (b.customerVillage || '').trim().toLowerCase();
    if (bV) return bV === vTarget;
    const cust = customers.find((c) => c.id === b.customerId || c.name === b.customerName);
    return (cust?.village || '').trim().toLowerCase() === vTarget;
  };

  const pendingBoris = useMemo(() => {
    return modeBoris
      .filter((b) => b.status === 'pending')
      .filter(matchesVillage)
      .filter(matchesSearch)
      .sort((a, b) => new Date(a.dropOffDate || a.createdAt).getTime() - new Date(b.dropOffDate || b.createdAt).getTime());
  }, [modeBoris, selectedVillage, query]);

  const dayKey = (b, dateStr) => String(b.dropOffDate || b.createdAt || '').split('T')[0] === dateStr;

  const todayEarnings = useMemo(
    () => modeBoris.filter((b) => dayKey(b, todayStr)).reduce((s, b) => s + (Number(b.amount) || 0), 0),
    [modeBoris, todayStr]
  );
  const yesterdayEarnings = useMemo(
    () => modeBoris.filter((b) => dayKey(b, yesterdayStr)).reduce((s, b) => s + (Number(b.amount) || 0), 0),
    [modeBoris, yesterdayStr]
  );
  const todayPisaiKg = useMemo(
    () => modeBoris.filter((b) => dayKey(b, todayStr)).reduce((s, b) => s + (Number(b.inputWeight) || 0), 0),
    [modeBoris, todayStr]
  );
  const totalUdhar = useMemo(
    () => customers.reduce((sum, c) => sum + (Number(c.balance || 0) > 0 ? Number(c.balance) : 0), 0),
    [customers]
  );

  // Real trend. Only shown when there is a comparable prior day, otherwise it
  // is a divide-by-zero theatre.
  const trend = useMemo(() => {
    if (yesterdayEarnings <= 0) return null;
    const pct = Math.round(((todayEarnings - yesterdayEarnings) / yesterdayEarnings) * 100);
    return { pct, up: pct >= 0 };
  }, [todayEarnings, yesterdayEarnings]);

  const churn = useMemo(() => identifyAtRiskCustomers(customers, boris), [customers, boris]);
  const forecast = useMemo(() => predictNextWeekDemand(boris), [boris]);

  // Debtors list, worst first — replaces the fixed "₹2,130 / 2 grahak" line.
  const topDebtors = useMemo(
    () => customers
      .filter((c) => Number(c.balance) > 0)
      .sort((a, b) => Number(b.balance) - Number(a.balance))
      .slice(0, 5),
    [customers]
  );

  const ownerFirstName = (shop?.ownerName || 'Bhaiya').split(' ')[0];

  return (
    <div style={{ padding: '1rem 1rem 6.5rem', display: 'flex', flexDirection: 'column', gap: '14px' }}>

      <div>
        <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '24px', fontWeight: '600', color: 'hsl(var(--ink))', lineHeight: 1.2, letterSpacing: '-0.02em' }}>
          Namaste, {ownerFirstName} ji
        </h1>
        <p style={{ fontSize: '12.5px', fontWeight: '600', color: 'hsl(var(--ink-3))', marginTop: '2px' }}>
          {dateFormatted}
        </p>
      </div>

      {/* HERO — today's actuals */}
      <section className="surface hero">
        <div className="hlabel">
          <span>Aaj ki kamai</span>
          {trend && (
            <span className="trend" style={{ color: trend.up ? 'hsl(var(--green-700))' : 'hsl(var(--red-600))' }}>
              {trend.up ? '+' : ''}{trend.pct}%
            </span>
          )}
        </div>
        <div className="hbig num">₹{todayEarnings.toLocaleString('en-IN')}</div>
        <div className="hsplit">
          <div>
            <div className="hlabel">{activeMode === 'chakki' ? 'Pisai aaj' : 'Pirai aaj'}</div>
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

      {/* VOICE — the primary action, on every screen */}
      <button
        type="button"
        onClick={() => setActiveTab('voice')}
        className="cb-home-voice"
      >
        <span className="cb-home-voice-orb"><Mic size={22} strokeWidth={2.4} /></span>
        <span style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: '1px', minWidth: 0, flex: 1 }}>
          <b style={{ fontSize: '14.5px', fontWeight: '800', letterSpacing: '-0.01em' }}>ChakkiBot se boliye</b>
          <span style={{ fontSize: '11.5px', fontWeight: '600', color: 'hsl(var(--ink-3))' }}>
            Haath free — "Ramesh se 500 jama karo"
          </span>
        </span>
        <ChevronRight size={18} style={{ color: 'hsl(var(--ai-indigo))', flexShrink: 0 }} />
      </button>

      {/* QUICK ACTIONS */}
      <div className="acts">
        <button className="btn-brand" onClick={onOpenNewEntry}>
          + Nayi Bori Entry
        </button>
        <button className="btn-quiet" onClick={() => setActiveTab('khata')}>
          Grahak Khata
        </button>
      </div>

      {/* REAL INSIGHTS — computed, not decorated */}
      <section className="surface">
        <div style={{ padding: '12px 14px', borderBottom: '1px solid hsl(var(--line))', display: 'flex', alignItems: 'center' }}>
          <h2 style={{ fontSize: '15px', fontWeight: '700', color: 'hsl(var(--ink))' }}>Aaj ke insights</h2>
        </div>

        {topDebtors.length > 0 && (
          <div className="ins-row" onClick={() => setActiveTab('khata')} style={{ cursor: 'pointer' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0 }}>
              <Users size={16} style={{ color: 'hsl(var(--red-600))', flexShrink: 0 }} />
              <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                Sabse zyada: {topDebtors[0].name} — ₹{Number(topDebtors[0].balance).toLocaleString('en-IN')}
              </span>
            </div>
            <ChevronRight size={14} style={{ color: 'hsl(var(--ink-3))', flexShrink: 0 }} />
          </div>
        )}

        <div className="ins-row">
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0 }}>
            <BarChart2 size={16} style={{ color: 'hsl(var(--ai-indigo))', flexShrink: 0 }} />
            <span>{forecast.message}</span>
          </div>
        </div>

        {churn.count > 0 && (
          <div className="ins-row" onClick={() => setActiveTab('khata')} style={{ cursor: 'pointer' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0 }}>
              <Users size={16} style={{ color: 'hsl(var(--ink-3))', flexShrink: 0 }} />
              <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{churn.message}</span>
            </div>
            <ChevronRight size={14} style={{ color: 'hsl(var(--ink-3))', flexShrink: 0 }} />
          </div>
        )}
      </section>

      <GaonSelector selectedVillage={selectedVillage} onSelectVillage={setSelectedVillage} />

      <SearchBar
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        onClear={() => setSearchQuery('')}
      />

      <section className="surface" style={{ overflow: 'hidden' }}>
        <div style={{ padding: '12px 16px', borderBottom: '1px solid hsl(var(--line))', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <h2 style={{ fontSize: '15px', fontWeight: '700', color: 'hsl(var(--ink))' }}>
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
                      {b.inputWeight} kg {b.grainType} · {b.customerVillage || 'Main'} · <b className={isDue ? 'due' : 'ok'}>{isDue ? 'Udhar' : 'Nokad'}</b>
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
