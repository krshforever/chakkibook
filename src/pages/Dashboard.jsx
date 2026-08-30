import React from 'react';
import { useStore } from '../store/useStore';

export default function Dashboard({ setActiveTab }) {
  const transactions = useStore((state) => state.transactions);
  const customers = useStore((state) => state.customers);
  const shop = useStore((state) => state.shop);
  const activeMode = useStore((state) => state.activeMode);

  // Today's stats calculation
  const todayStr = new Date().toISOString().split('T')[0];
  const todayTxns = transactions.filter((t) => t.date && t.date.startsWith(todayStr));

  // Filtered transactions according to Mode Switch
  const modeFilteredTxns = transactions.filter((t) => {
    if (activeMode === 'atta') return t.type === 'pisai';
    if (activeMode === 'sarson') return t.type === 'pirai' || t.type === 'khari_sale';
    return true;
  });

  const todayPisaiKg = todayTxns
    .filter((t) => t.type === 'pisai')
    .reduce((acc, t) => acc + (Number(t.weight) || 0), 0);

  const todayPiraiKg = todayTxns
    .filter((t) => t.type === 'pirai')
    .reduce((acc, t) => acc + (Number(t.weight) || 0), 0);

  const todayIncome = todayTxns.reduce((acc, t) => acc + (Number(t.amount) || 0), 0);

  // Total Outstanding Customer Dues (Udhar)
  const totalUdhar = customers.reduce((acc, c) => acc + (c.balance > 0 ? c.balance : 0), 0);

  return (
    <div className="app-container" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      
      {/* Rates Quick Banner */}
      <div style={{
        background: activeMode === 'atta' 
          ? 'linear-gradient(135deg, var(--wheat-dark), var(--soil))'
          : activeMode === 'sarson'
          ? 'linear-gradient(135deg, var(--mustard), var(--oil-amber))'
          : 'linear-gradient(135deg, var(--soil), var(--soil-light))',
        color: activeMode === 'sarson' ? 'var(--soil-dark)' : '#fff',
        borderRadius: 'var(--radius-md)',
        padding: '14px 16px',
        boxShadow: 'var(--shadow-md)',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        transition: 'all 0.3s ease'
      }}>
        <div>
          <span style={{ fontSize: '0.75rem', textTransform: 'uppercase', opacity: 0.9, fontWeight: 700 }}>
            {activeMode === 'atta' ? '🌾 Atta Mode Rates' : activeMode === 'sarson' ? '🫒 Sarson Oil Mode Rates' : 'Aaj ke Rates'}
          </span>
          <div style={{ display: 'flex', gap: '12px', marginTop: '4px', fontSize: '0.95rem', fontWeight: 700 }}>
            {(activeMode === 'all' || activeMode === 'atta') && <span>🌾 Pisai: ₹{shop.rates?.pisai}/kg</span>}
            {(activeMode === 'all' || activeMode === 'sarson') && <span>🫒 Pirai: ₹{shop.rates?.pirai}/kg</span>}
            {activeMode === 'sarson' && <span>📦 Khali: ₹{shop.rates?.khari}/kg</span>}
          </div>
        </div>
        <button
          className="btn btn-secondary"
          onClick={() => setActiveTab('settings')}
          style={{ padding: '6px 12px', fontSize: '0.8rem', width: 'auto' }}
        >
          Badlein
        </button>
      </div>

      {/* Today's Summary Metrics */}
      <h2 style={{ fontSize: '1.1rem', margin: 0, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span>📊 Aaj ka Hisab (Today's Summary)</span>
        <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)' }}>
          Mode: {activeMode.toUpperCase()}
        </span>
      </h2>
      
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
        {(activeMode === 'all' || activeMode === 'atta') && (
          <div className="card" style={{ background: 'var(--wheat-light)' }}>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>🌾 Total Pisai</span>
            <div style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--wheat-dark)' }}>
              {todayPisaiKg} <span style={{ fontSize: '0.9rem' }}>kg</span>
            </div>
          </div>
        )}

        {(activeMode === 'all' || activeMode === 'sarson') && (
          <div className="card" style={{ background: 'var(--mustard-bg)' }}>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>🫒 Sarson Pirai</span>
            <div style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--soil)' }}>
              {todayPiraiKg} <span style={{ fontSize: '0.9rem' }}>kg</span>
            </div>
          </div>
        )}

        <div className="card" style={{ background: 'var(--success-bg)' }}>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>💰 Aaj ki Kamai</span>
          <div style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--success)' }}>
            ₹ {todayIncome}
          </div>
        </div>

        <div className="card" style={{ background: 'var(--danger-bg)' }}>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>📖 Kul Udhar (Dues)</span>
          <div style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--danger)' }}>
            ₹ {totalUdhar}
          </div>
        </div>
      </div>

      {/* Quick Action Buttons */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginTop: '4px' }}>
        <button className="btn btn-accent" onClick={() => setActiveTab('entry')}>
          ⚡ Nayi Entry ({activeMode === 'atta' ? 'Pisai' : activeMode === 'sarson' ? 'Pirai' : 'Grind/Press'})
        </button>
        <button className="btn btn-secondary" onClick={() => setActiveTab('khata')}>
          📖 Customer Khata
        </button>
      </div>

      {/* Recent Transactions List */}
      <div style={{ marginTop: '8px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
          <h3 style={{ fontSize: '1rem' }}>⏱️ {activeMode.toUpperCase()} Entries</h3>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Total: {modeFilteredTxns.length}</span>
        </div>

        {modeFilteredTxns.length === 0 ? (
          <div className="card" style={{ textAlign: 'center', padding: '30px', color: 'var(--text-muted)' }}>
            Is mode me koi entry nahi mili. Nayi entry add karein!
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {modeFilteredTxns.slice(0, 6).map((t) => (
              <div key={t.id} className="card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px' }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span className={`badge badge-${t.type}`}>
                      {t.type === 'pisai' ? '🌾 Pisai' : t.type === 'pirai' ? '🫒 Pirai' : t.type === 'khari_sale' ? '📦 Khari' : '💵 Payment'}
                    </span>
                    <strong style={{ fontSize: '0.95rem' }}>{t.customerName || 'Cash Customer'}</strong>
                  </div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                    {t.weight ? `${t.weight} kg @ ₹${t.rate}/kg` : t.notes || 'Direct payment'}
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '1.1rem', fontWeight: 700, color: t.type === 'payment' ? 'var(--success)' : 'var(--text-main)' }}>
                    {t.type === 'payment' ? `- ₹${t.amount}` : `₹${t.amount}`}
                  </div>
                  <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                    {t.paymentMode === 'credit' ? '🔴 Udhar' : '🟢 Cash/UPI'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

    </div>
  );
}
