import React, { useState } from 'react';
import { useStore } from '../store/useStore';

export default function Khata() {
  const customers = useStore((state) => state.customers);
  const transactions = useStore((state) => state.transactions);
  const addTransaction = useStore((state) => state.addTransaction);
  const shop = useStore((state) => state.shop);

  const [search, setSearch] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [payAmount, setPayAmount] = useState('');
  const [payMode, setPayMode] = useState('cash');

  const filteredCustomers = customers.filter(
    (c) => c.name.toLowerCase().includes(search.toLowerCase()) || (c.phone && c.phone.includes(search))
  );

  const totalDues = customers.reduce((sum, c) => sum + (c.balance > 0 ? c.balance : 0), 0);

  const handleRecordPayment = (e) => {
    e.preventDefault();
    if (!selectedCustomer || !payAmount) return;

    addTransaction({
      type: 'payment',
      customerId: selectedCustomer.id,
      customerName: selectedCustomer.name,
      amount: Number(payAmount),
      paymentMode: payMode,
      notes: 'Khata Payment Received'
    });

    setPayAmount('');
    alert(`₹${payAmount} payment saved for ${selectedCustomer.name}!`);
  };

  const sendWhatsAppReminder = (cust) => {
    const text = `Namaste ${cust.name} ji 🙏\n` +
      `*${shop.name}* ki taraf se aapka kul udhar (dues) balance: *₹${cust.balance}* hai.\n` +
      `Kripya samay par bhugtan karein. Dhanyawad!`;
    window.open(`https://api.whatsapp.com/send?phone=${cust.phone || ''}&text=${encodeURIComponent(text)}`, '_blank');
  };

  return (
    <div className="app-container">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
        <h2 style={{ fontSize: '1.2rem', margin: 0 }}>📖 Grahak Khata (Ledger)</h2>
        <div style={{ background: 'var(--danger-bg)', color: 'var(--danger)', padding: '6px 12px', borderRadius: 'var(--radius-pill)', fontWeight: 700, fontSize: '0.85rem' }}>
          Kul Udhar: ₹{totalDues}
        </div>
      </div>

      {!selectedCustomer ? (
        <>
          <input
            type="text"
            className="input-field"
            placeholder="🔍 Search Grahak (Naam / Phone)..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ marginBottom: '14px' }}
          />

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {filteredCustomers.map((cust) => (
              <div
                key={cust.id}
                className="card"
                onClick={() => setSelectedCustomer(cust)}
                style={{ cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
              >
                <div>
                  <h4 style={{ fontSize: '1rem', margin: 0 }}>{cust.name}</h4>
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                    📱 {cust.phone || 'No Phone'} {cust.notes ? `• ${cust.notes}` : ''}
                  </span>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{
                    fontSize: '1.1rem',
                    fontWeight: 800,
                    color: cust.balance > 0 ? 'var(--danger)' : 'var(--success)'
                  }}>
                    {cust.balance > 0 ? `₹${cust.balance} Dues` : 'Clear'}
                  </div>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Tap for statement 👉</span>
                </div>
              </div>
            ))}
          </div>
        </>
      ) : (
        /* Customer Details Statement View */
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <button
            onClick={() => setSelectedCustomer(null)}
            className="btn btn-outline"
            style={{ width: 'auto', alignSelf: 'flex-start', padding: '6px 12px', fontSize: '0.85rem' }}
          >
            ← Back to Customer List
          </button>

          <div className="card" style={{ background: 'var(--wheat-light)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <h3 style={{ fontSize: '1.2rem', margin: 0 }}>{selectedCustomer.name}</h3>
                <p style={{ margin: '2px 0 0 0', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                  📱 {selectedCustomer.phone || 'No phone'}
                </p>
              </div>
              <button
                className="btn btn-accent"
                onClick={() => sendWhatsAppReminder(selectedCustomer)}
                style={{ width: 'auto', padding: '6px 10px', fontSize: '0.8rem' }}
              >
                📲 WhatsApp Reminder
              </button>
            </div>
            
            <div style={{ marginTop: '12px', borderTop: '1px solid var(--border-light)', paddingTop: '8px', display: 'flex', justifyContent: 'space-between' }}>
              <span>Balance Due:</span>
              <strong style={{ fontSize: '1.2rem', color: selectedCustomer.balance > 0 ? 'var(--danger)' : 'var(--success)' }}>
                ₹ {selectedCustomer.balance}
              </strong>
            </div>
          </div>

          {/* Payment Collection Form */}
          <div className="card">
            <h4 style={{ fontSize: '0.95rem', marginBottom: '8px' }}>💵 Payments Collection (Udhar Jama)</h4>
            <form onSubmit={handleRecordPayment} style={{ display: 'flex', gap: '8px' }}>
              <input
                type="number"
                className="input-field"
                placeholder="Rashi ₹"
                value={payAmount}
                onChange={(e) => setPayAmount(e.target.value)}
                required
              />
              <button type="submit" className="btn btn-primary" style={{ width: 'auto', whiteSpace: 'nowrap' }}>
                Jama Karein
              </button>
            </form>
          </div>

          {/* Customer History */}
          <h4 style={{ fontSize: '1rem', margin: 0 }}>History (Hisab Kitab)</h4>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {transactions
              .filter((t) => t.customerId === selectedCustomer.id)
              .map((t) => (
                <div key={t.id} className="card" style={{ padding: '10px 14px', display: 'flex', justifyContent: 'space-between' }}>
                  <div>
                    <span className={`badge badge-${t.type}`}>{t.type.toUpperCase()}</span>
                    <div style={{ fontSize: '0.85rem', marginTop: '4px' }}>
                      {t.weight ? `${t.weight}kg @ ₹${t.rate}` : t.notes}
                    </div>
                    <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                      {new Date(t.date).toLocaleDateString('hi-IN')}
                    </span>
                  </div>
                  <div style={{ textAlign: 'right', fontWeight: 700, fontSize: '1rem' }}>
                    {t.type === 'payment' ? (
                      <span style={{ color: 'var(--success)' }}>- ₹{t.amount} (Jama)</span>
                    ) : (
                      <span style={{ color: 'var(--danger)' }}>+ ₹{t.amount}</span>
                    )}
                  </div>
                </div>
              ))}
          </div>
        </div>
      )}
    </div>
  );
}
