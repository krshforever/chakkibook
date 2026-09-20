import React, { useState } from 'react';
import { useStore } from '../store/useStore';

export default function Analytics() {
  const boris = useStore((state) => state.boris || []);
  const expenses = useStore((state) => state.expenses || []);
  const customers = useStore((state) => state.customers || []);
  const addExpense = useStore((state) => state.addExpense);
  const deleteExpense = useStore((state) => state.deleteExpense);
  const hasPermission = useStore((state) => state.hasPermission);

  const [timeframe, setTimeframe] = useState('month'); // 'today' | 'week' | 'month' | 'all'
  const [showAddExpense, setShowAddExpense] = useState(false);
  const [expCategory, setExpCategory] = useState('Electricity');
  const [expAmount, setExpAmount] = useState('');
  const [expDesc, setExpDesc] = useState('');

  const now = new Date();
  const todayStr = now.toISOString().split('T')[0];

  // Helper date check
  const isDateInTimeframe = (dateISO) => {
    if (!dateISO) return false;
    const dStr = dateISO.split('T')[0];
    const dMs = new Date(dateISO).getTime();

    if (timeframe === 'today') return dStr === todayStr;
    if (timeframe === 'week') return dMs >= now.getTime() - 86400000 * 7;
    if (timeframe === 'month') return dMs >= now.getTime() - 86400000 * 30;
    return true;
  };

  // Filter completed transactions
  const completedBoris = boris.filter(
    (b) => (b.status === 'done' || b.status === 'picked_up') && isDateInTimeframe(b.doneDate || b.createdAt)
  );

  // Filter expenses
  const filteredExpenses = expenses.filter((e) => isDateInTimeframe(e.date));

  // Key Metric Calculations
  const chakkiBoris = completedBoris.filter((b) => b.mode === 'chakki');
  const spellarBoris = completedBoris.filter((b) => b.mode === 'spellar');

  const totalPisaiKg = chakkiBoris.reduce((acc, b) => acc + (Number(b.inputWeight) || 0), 0);
  const totalPiraiKg = spellarBoris.reduce((acc, b) => acc + (Number(b.inputWeight) || 0), 0);
  const totalOilL = spellarBoris.reduce((acc, b) => acc + (Number(b.oilOutput) || 0), 0);

  const grossRevenue = completedBoris.reduce((acc, b) => acc + (Number(b.amount) || 0), 0);
  const cashIncome = completedBoris
    .filter((b) => b.paymentMode === 'cash' || b.paymentMode === 'upi')
    .reduce((acc, b) => acc + (Number(b.amount) || 0), 0);
  const creditUdhar = completedBoris
    .filter((b) => b.paymentMode === 'credit')
    .reduce((acc, b) => acc + (Number(b.amount) || 0), 0);

  const totalExpenses = filteredExpenses.reduce((acc, e) => acc + (Number(e.amount) || 0), 0);
  const netProfit = grossRevenue - totalExpenses;

  // Top Customers Ranking
  const customerVolumeMap = {};
  completedBoris.forEach((b) => {
    const key = b.customerName || 'Walk-in Grahak';
    if (!customerVolumeMap[key]) {
      customerVolumeMap[key] = { name: key, totalKg: 0, totalAmount: 0, count: 0 };
    }
    customerVolumeMap[key].totalKg += Number(b.inputWeight) || 0;
    customerVolumeMap[key].totalAmount += Number(b.amount) || 0;
    customerVolumeMap[key].count += 1;
  });

  const topCustomers = Object.values(customerVolumeMap)
    .sort((a, b) => b.totalKg - a.totalKg)
    .slice(0, 5);

  const handleCreateExpense = (e) => {
    e.preventDefault();
    if (!expAmount || Number(expAmount) <= 0) return;

    addExpense({
      category: expCategory,
      amount: parseFloat(expAmount) || 0,
      description: expDesc.trim() || `${expCategory} expense`
    });

    setExpAmount('');
    setExpDesc('');
    setShowAddExpense(false);
  };

  return (
    <div className="app-container">
      {/* Section Header */}
      <div className="section-header">
        <span>📊 Business Analytics & P&L</span>
        <span className="section-badge">Live Hisab</span>
      </div>

      {/* Timeframe Selector Pills */}
      <div style={{ display: 'flex', gap: '6px', overflowX: 'auto', paddingBottom: '4px' }}>
        {[
          { id: 'today', label: '📅 Aaj' },
          { id: 'week', label: '📊 Is Hafta' },
          { id: 'month', label: '🗓️ Is Mahina' },
          { id: 'all', label: '♾️ Poora Data' }
        ].map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTimeframe(t.id)}
            style={{
              flex: 1,
              minHeight: '44px',
              padding: '0.4rem 0.75rem',
              borderRadius: '2rem',
              border: timeframe === t.id ? '2px solid #fbbf24' : '1px solid rgba(255,255,255,0.1)',
              backgroundColor: timeframe === t.id ? '#d97706' : 'var(--card-bg)',
              color: '#fff',
              fontSize: '0.85rem',
              fontWeight: timeframe === t.id ? '800' : '600',
              cursor: 'pointer',
              whiteSpace: 'nowrap'
            }}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Net Profit / P&L Hero Card */}
      <div className="card" style={{
        background: 'linear-gradient(135deg, #0f172a, #1e293b)',
        border: '1px solid #eab308',
        borderRadius: '1.25rem',
        padding: '1.25rem',
        boxShadow: '0 10px 20px rgba(0,0,0,0.3)'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
          <span style={{ fontSize: '0.85rem', fontWeight: '800', color: '#fbbf24', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            💹 NET PROFIT & LOSS (SHUDDH KAMAI)
          </span>
          <span className="section-badge" style={{ background: netProfit >= 0 ? '#15803d' : '#991b1b', color: '#fff' }}>
            {netProfit >= 0 ? ' PROFIT' : ' LOSS'}
          </span>
        </div>

        <div style={{ textAlign: 'center', margin: '0.5rem 0 1rem 0' }}>
          <div style={{ fontSize: '2.5rem', fontWeight: '800', color: netProfit >= 0 ? '#4ade80' : '#f87171', lineHeight: 1 }}>
            ₹ {netProfit.toLocaleString()}
          </div>
          <div style={{ fontSize: '0.8rem', color: '#cbd5e1', marginTop: '4px' }}>
            Total Kamai (₹{grossRevenue}) - Total Kharcha (₹{totalExpenses})
          </div>
        </div>

        {/* 3 Metric Breakdown */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px', borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '0.75rem' }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Kul Revenue</div>
            <div style={{ fontSize: '1.15rem', fontWeight: '800', color: '#fff' }}>₹{grossRevenue}</div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '0.75rem', color: '#f87171' }}>Kharcha (Expenses)</div>
            <div style={{ fontSize: '1.15rem', fontWeight: '800', color: '#f87171' }}>-₹{totalExpenses}</div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '0.75rem', color: '#eab308' }}>Nokad Cash</div>
            <div style={{ fontSize: '1.15rem', fontWeight: '800', color: '#fbbf24' }}>₹{cashIncome}</div>
          </div>
        </div>
      </div>

      {/* Production Volume Overview */}
      <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        <div className="section-header" style={{ marginBottom: 0 }}>
          <span>📦 Production & Grinding Volume</span>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px' }}>
          <div style={{ background: 'rgba(255,255,255,0.04)', padding: '0.75rem 0.5rem', borderRadius: '0.75rem', textAlign: 'center' }}>
            <div style={{ fontSize: '0.75rem', color: '#fbbf24', fontWeight: '700' }}>🌾 Pisai (Atta)</div>
            <div style={{ fontSize: '1.4rem', fontWeight: '800', color: '#fff', margin: '4px 0 0 0' }}>
              {totalPisaiKg} <span style={{ fontSize: '0.75rem' }}>kg</span>
            </div>
          </div>

          <div style={{ background: 'rgba(255,255,255,0.04)', padding: '0.75rem 0.5rem', borderRadius: '0.75rem', textAlign: 'center' }}>
            <div style={{ fontSize: '0.75rem', color: '#a3e635', fontWeight: '700' }}>🫒 Pirai (Sarson)</div>
            <div style={{ fontSize: '1.4rem', fontWeight: '800', color: '#fff', margin: '4px 0 0 0' }}>
              {totalPiraiKg} <span style={{ fontSize: '0.75rem' }}>kg</span>
            </div>
          </div>

          <div style={{ background: 'rgba(255,255,255,0.04)', padding: '0.75rem 0.5rem', borderRadius: '0.75rem', textAlign: 'center' }}>
            <div style={{ fontSize: '0.75rem', color: '#38bdf8', fontWeight: '700' }}>🛢️ Sarson Tel</div>
            <div style={{ fontSize: '1.4rem', fontWeight: '800', color: '#fff', margin: '4px 0 0 0' }}>
              {totalOilL} <span style={{ fontSize: '0.75rem' }}>L</span>
            </div>
          </div>
        </div>
      </div>

      {/* Expense Manager Section */}
      <section>
        <div className="section-header" style={{ justifyContent: 'space-between' }}>
          <span>💸 Shop Expenses ({filteredExpenses.length})</span>
          <button
            type="button"
            onClick={() => setShowAddExpense(!showAddExpense)}
            style={{
              background: '#d97706',
              color: '#fff',
              border: 'none',
              borderRadius: '0.5rem',
              padding: '4px 10px',
              fontSize: '0.8rem',
              fontWeight: '700',
              cursor: 'pointer'
            }}
          >
            {showAddExpense ? '✖ Close' : '➕ Naya Kharcha'}
          </button>
        </div>

        {/* Add Expense Form */}
        {showAddExpense && (
          <div className="card" style={{ background: 'var(--card-bg)', border: '1px solid #d97706', marginBottom: '10px' }}>
            <h4 style={{ fontSize: '0.95rem', marginBottom: '10px' }}>➕ Dukan ka Kharcha Entry Karein</h4>
            <form onSubmit={handleCreateExpense} style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                <div>
                  <label className="input-label">Category</label>
                  <select
                    value={expCategory}
                    onChange={(e) => setExpCategory(e.target.value)}
                    className="form-input"
                  >
                    <option value="Electricity">⚡ Electricity (Bijli)</option>
                    <option value="Maintenance">🔧 Belt / Machine Repair</option>
                    <option value="Diesel/Oil">⛽ Diesel & Lube Oil</option>
                    <option value="Salary">👨‍🔧 Worker Salary</option>
                    <option value="Rent">🏪 Shop Rent</option>
                    <option value="Other">📝 Other / Miscellanous</option>
                  </select>
                </div>

                <div>
                  <label className="input-label">Rashi (₹ Amount)</label>
                  <input
                    type="number"
                    step="1"
                    placeholder="e.g. 1500"
                    value={expAmount}
                    onChange={(e) => setExpAmount(e.target.value)}
                    className="form-input"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="input-label">Vivran / Notes</label>
                <input
                  type="text"
                  placeholder="e.g. Bijli bill payment"
                  value={expDesc}
                  onChange={(e) => setExpDesc(e.target.value)}
                  className="form-input"
                />
              </div>

              <button type="submit" className="big-btn" style={{ minHeight: '48px' }}>
                💾 Save Expense
              </button>
            </form>
          </div>
        )}

        {/* Expenses List */}
        {filteredExpenses.length === 0 ? (
          <div className="card" style={{ textAlign: 'center', padding: '1rem', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
            Is timeframe mein koi kharcha entry nahi hai.
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {filteredExpenses.map((exp) => (
              <div
                key={exp.id}
                className="card"
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '10px 14px',
                  borderLeft: '4px solid #ef4444'
                }}
              >
                <div>
                  <strong style={{ fontSize: '0.95rem' }}>{exp.category}</strong>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    {exp.description || 'Kharcha'} • {new Date(exp.date).toLocaleDateString()}
                  </div>
                </div>

                <div style={{ textAlign: 'right', display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <span style={{ fontSize: '1.15rem', fontWeight: '800', color: '#f87171' }}>
                    -₹ {exp.amount}
                  </span>
                  {hasPermission('changeRates') && (
                    <button
                      type="button"
                      onClick={() => deleteExpense(exp.id)}
                      style={{ background: 'none', border: 'none', color: '#991b1b', cursor: 'pointer', fontSize: '0.9rem' }}
                    >
                      🗑️
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Top 5 Customers Ranking */}
      <section style={{ marginTop: '0.5rem' }}>
        <div className="section-header">
          <span>👑 Top 5 Grahak (Highest Grinding Volume)</span>
        </div>

        {topCustomers.length === 0 ? (
          <div className="card" style={{ textAlign: 'center', padding: '1rem', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
            Koi customer data nahi mila.
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {topCustomers.map((cust, idx) => (
              <div
                key={cust.name}
                className="card"
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '10px 14px',
                  background: idx === 0 ? 'rgba(234, 179, 8, 0.1)' : 'var(--card-bg)',
                  border: idx === 0 ? '1px solid #eab308' : '1px solid rgba(255,255,255,0.06)'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <span style={{
                    fontSize: '1rem', fontWeight: '800', color: idx === 0 ? '#fbbf24' : '#cbd5e1',
                    width: '24px', textAlign: 'center'
                  }}>
                    #{idx + 1}
                  </span>
                  <div>
                    <strong style={{ fontSize: '0.95rem' }}>{cust.name}</strong>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                      {cust.count} baar pisai/pirai karvayi
                    </div>
                  </div>
                </div>

                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '1.1rem', fontWeight: '800', color: '#fbbf24' }}>
                    {cust.totalKg} kg
                  </div>
                  <div style={{ fontSize: '0.75rem', color: '#4ade80', fontWeight: '600' }}>
                    ₹{cust.totalAmount}
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
