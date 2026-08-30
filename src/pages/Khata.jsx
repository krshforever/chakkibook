import React, { useState, useMemo } from 'react';
import { useStore } from '../store/useStore';

export default function Khata({ selectedCustomer: initialSelectedCustomer, onClearSelectedCustomer }) {
  const customers = useStore((state) => state.customers);
  const boris = useStore((state) => state.boris);
  const addBori = useStore((state) => state.addBori);
  const addCustomer = useStore((state) => state.addCustomer);
  const shop = useStore((state) => state.shop);

  const [searchQuery, setSearchQuery] = useState('');
  const [activeCustomerId, setActiveCustomerId] = useState(
    initialSelectedCustomer ? initialSelectedCustomer.id : null
  );

  // Payment form state
  const [payAmount, setPayAmount] = useState('');
  const [payMode, setPayMode] = useState('cash');
  const [payNotes, setPayNotes] = useState('');

  // Add customer modal state
  const [showAddCust, setShowAddCust] = useState(false);
  const [custName, setCustName] = useState('');
  const [custVillage, setCustVillage] = useState('');
  const [custPhone, setCustPhone] = useState('');

  // Total Outstanding Udhar across all customers
  const totalOutstandingDues = useMemo(() => {
    return customers.reduce((sum, c) => sum + (c.balance > 0 ? c.balance : 0), 0);
  }, [customers]);

  // Sort customers: highest dues first, then alphabetically
  const sortedCustomers = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    return [...customers]
      .filter((c) => {
        if (!q) return true;
        return (
          c.name.toLowerCase().includes(q) ||
          (c.village && c.village.toLowerCase().includes(q)) ||
          (c.phone && c.phone.includes(q))
        );
      })
      .sort((a, b) => {
        if (b.balance !== a.balance) {
          return (b.balance || 0) - (a.balance || 0);
        }
        return a.name.localeCompare(b.name);
      });
  }, [customers, searchQuery]);

  const activeCustomer = customers.find((c) => c.id === activeCustomerId);

  // All transactions (both Chakki & Spellar) for this customer
  const customerStatements = useMemo(() => {
    if (!activeCustomerId) return [];
    return boris
      .filter((b) => b.customerId === activeCustomerId)
      .sort((a, b) => new Date(b.createdAt || b.date || 0) - new Date(a.createdAt || a.date || 0));
  }, [boris, activeCustomerId]);

  // Handle Payment Collection (Jama Rashi)
  const handleRecordPayment = (e) => {
    e.preventDefault();
    const amountNum = parseFloat(payAmount) || 0;
    if (!activeCustomer || amountNum <= 0) return;

    addBori({
      mode: 'chakki',
      type: 'payment',
      customerId: activeCustomer.id,
      customerName: activeCustomer.name,
      grainType: '',
      inputWeight: 0,
      kaddaDeducted: 0,
      outputWeight: 0,
      rate: 0,
      amount: amountNum,
      status: 'done',
      paymentMode: payMode,
      notes: payNotes.trim() || 'Khata Jama Bhugtan'
    });

    const shareText =
      `🌾 *${shop.name}* Payment Receipt\n` +
      `------------------------\n` +
      `Grahak: ${activeCustomer.name}\n` +
      `Jama Rashi: *₹${amountNum}* (${payMode.toUpperCase()})\n` +
      `Bacha Hua Udhar: *₹${Math.max(0, (activeCustomer.balance || 0) - amountNum)}*\n` +
      `Dhanyawad! 🙏`;

    setPayAmount('');
    setPayNotes('');

    if (window.confirm(`₹${amountNum} jama ho gaya! WhatsApp receipt share karein?`)) {
      window.open(
        `https://api.whatsapp.com/send?phone=${activeCustomer.phone || ''}&text=${encodeURIComponent(shareText)}`,
        '_blank'
      );
    }
  };

  // WhatsApp Reminder Message
  const sendWhatsAppReminder = (cust) => {
    const text =
      `Namaste ${cust.name} ji 🙏\n\n` +
      `*${shop.name}* ki taraf se aapka hisab balance:\n` +
      `Kul Udhar (Dues): *₹${cust.balance}*\n\n` +
      `Kripya samay par bhugtan karein. Dhanyawad! 🌾`;
    window.open(`https://api.whatsapp.com/send?phone=${cust.phone || ''}&text=${encodeURIComponent(text)}`, '_blank');
  };

  // Inline Customer Creation
  const handleAddCustomer = (e) => {
    e.preventDefault();
    if (!custName.trim()) return;

    const created = addCustomer({
      name: custName.trim(),
      village: custVillage.trim(),
      phone: custPhone.trim()
    });

    setActiveCustomerId(created.id);
    setShowAddCust(false);
    setCustName('');
    setCustVillage('');
    setCustPhone('');
  };

  const handleBack = () => {
    setActiveCustomerId(null);
    if (onClearSelectedCustomer) onClearSelectedCustomer();
  };

  return (
    <div className="app-container">
      {/* 1. Customer List View */}
      {!activeCustomer ? (
        <>
          <div className="section-header">
            <span>📖 Grahak Khata (Ledger)</span>
            <button
              type="button"
              className="section-badge"
              style={{ border: 'none', cursor: 'pointer', background: 'var(--primary-light)' }}
              onClick={() => setShowAddCust(true)}
            >
              ➕ Naya Grahak
            </button>
          </div>

          {/* Kul Udhar Banner Card */}
          <div
            className="card"
            style={{
              background: 'var(--primary-light)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '14px 16px'
            }}
          >
            <div>
              <span style={{ fontSize: '0.8rem', textTransform: 'uppercase', fontWeight: 700, color: 'var(--text-muted)' }}>
                Kul Udhar (Total Dues)
              </span>
              <div className="big-number" style={{ color: 'var(--danger)', marginTop: '2px' }}>
                ₹ {totalOutstandingDues.toLocaleString('en-IN')}
              </div>
            </div>
            <div style={{ textAlign: 'right', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              <strong>{customers.length}</strong> Grahak
            </div>
          </div>

          {/* Search Bar */}
          <div className="search-bar-wrapper">
            <span className="search-icon">🔍</span>
            <input
              type="text"
              className="search-bar"
              placeholder="Search naam, gaon, ya mobile number..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          {/* Customer Cards List */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {sortedCustomers.map((cust) => {
              const hasDues = cust.balance > 0;
              return (
                <div
                  key={cust.id}
                  className="card"
                  onClick={() => setActiveCustomerId(cust.id)}
                  style={{
                    cursor: 'pointer',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    borderLeft: hasDues ? '5px solid var(--danger)' : '5px solid var(--success)'
                  }}
                >
                  <div>
                    <strong style={{ fontSize: '1.05rem', color: 'var(--text-main)' }}>{cust.name}</strong>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                      📍 {cust.village || 'Gaon'} • 📱 {cust.phone || 'No phone'}
                      {cust.notes ? ` • ${cust.notes}` : ''}
                    </div>
                  </div>

                  <div style={{ textAlign: 'right' }}>
                    <div
                      style={{
                        fontFamily: 'var(--font-head)',
                        fontSize: '1.2rem',
                        fontWeight: 800,
                        color: hasDues ? 'var(--danger)' : 'var(--success)'
                      }}
                    >
                      {hasDues ? `₹ ${cust.balance}` : '₹ 0'}
                    </div>
                    <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                      {hasDues ? 'Udhar Dues' : '🟢 Clear'} 👉
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      ) : (
        /* 2. Customer Full Ledger Statement View */
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {/* Back button */}
          <button
            type="button"
            onClick={handleBack}
            className="btn-secondary-action"
            style={{ width: 'auto', alignSelf: 'flex-start', padding: '6px 14px', height: '40px', minHeight: '40px' }}
          >
            ← Wapas Grahak List
          </button>

          {/* Customer Header Summary Card */}
          <div className="card" style={{ background: 'var(--primary-light)', border: '1.5px solid var(--card-border)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <h3 style={{ fontSize: '1.25rem', margin: 0, color: 'var(--text-main)' }}>{activeCustomer.name}</h3>
                <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginTop: '3px' }}>
                  📍 Gaon: <strong>{activeCustomer.village || 'N/A'}</strong> | 📱 Phone: <strong>{activeCustomer.phone || 'N/A'}</strong>
                </div>
              </div>

              {activeCustomer.balance > 0 && (
                <button
                  type="button"
                  onClick={() => sendWhatsAppReminder(activeCustomer)}
                  className="section-badge"
                  style={{
                    border: 'none',
                    cursor: 'pointer',
                    background: 'var(--success)',
                    color: '#ffffff',
                    padding: '6px 10px',
                    fontSize: '0.8rem'
                  }}
                >
                  📲 Remind
                </button>
              )}
            </div>

            <div
              style={{
                marginTop: '12px',
                borderTop: '1px dashed var(--card-border)',
                paddingTop: '10px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}
            >
              <span style={{ fontSize: '0.9rem', fontWeight: 600 }}>Kul Bacha Hua Udhar (Dues):</span>
              <span
                className="big-number"
                style={{
                  color: activeCustomer.balance > 0 ? 'var(--danger)' : 'var(--success)',
                  fontSize: '1.6rem'
                }}
              >
                ₹ {activeCustomer.balance || 0}
              </span>
            </div>
          </div>

          {/* Payment Collection Form (Udhar Jama) */}
          <div className="card">
            <div className="section-header">
              <span>💵 Jama Karein (Collect Payment)</span>
            </div>
            <form onSubmit={handleRecordPayment} style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                <input
                  type="number"
                  step="1"
                  min="1"
                  className="form-input"
                  placeholder="Rashi (₹) Amount"
                  value={payAmount}
                  onChange={(e) => setPayAmount(e.target.value)}
                  required
                />

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4px' }}>
                  <button
                    type="button"
                    className={`pill-btn ${payMode === 'cash' ? 'active' : ''}`}
                    onClick={() => setPayMode('cash')}
                    style={{ minHeight: '48px', height: '48px' }}
                  >
                    Cash
                  </button>
                  <button
                    type="button"
                    className={`pill-btn ${payMode === 'upi' ? 'active' : ''}`}
                    onClick={() => setPayMode('upi')}
                    style={{ minHeight: '48px', height: '48px' }}
                  >
                    UPI
                  </button>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '8px' }}>
                <input
                  type="text"
                  className="form-input"
                  placeholder="Payment notes (Optional)"
                  value={payNotes}
                  onChange={(e) => setPayNotes(e.target.value)}
                  style={{ flex: 1 }}
                />
                <button type="submit" className="big-btn" style={{ width: 'auto', minWidth: '130px' }}>
                  ₹ Jama Karein
                </button>
              </div>
            </form>
          </div>

          {/* Complete Ledger History (Chakki + Spellar entries + Payments) */}
          <div>
            <div className="section-header">
              <span>📜 Statement / Hisab Kitab ({customerStatements.length})</span>
            </div>

            {customerStatements.length === 0 ? (
              <div
                className="card"
                style={{ textAlign: 'center', padding: '20px', color: 'var(--text-muted)', fontSize: '0.9rem' }}
              >
                Is grahak ki koi purani entry nahi mili.
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {customerStatements.map((txn) => {
                  const isPayment = txn.type === 'payment';
                  const dateFormatted = new Date(txn.createdAt || txn.date || Date.now()).toLocaleDateString('hi-IN', {
                    day: 'numeric',
                    month: 'short'
                  });

                  return (
                    <div key={txn.id} className="entry-row">
                      <div className="entry-row-left">
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-muted)' }}>
                            {dateFormatted}
                          </span>
                          <strong style={{ fontSize: '0.95rem' }}>
                            {isPayment
                              ? '💵 Payment Received'
                              : txn.type === 'pisai'
                              ? `🌾 ${txn.grainType || 'Wheat'} ${txn.inputWeight ? `${txn.inputWeight}kg` : ''}`
                              : txn.type === 'pirai'
                              ? `🫒 Sarson Pirai ${txn.inputWeight ? `${txn.inputWeight}kg` : ''}`
                              : `📦 Khali ${txn.inputWeight ? `${txn.inputWeight}kg` : ''}`}
                          </strong>
                        </div>
                        <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                          {txn.notes || (isPayment ? `Jama via ${txn.paymentMode?.toUpperCase()}` : txn.paymentMode === 'credit' ? 'Udhar Bori' : 'Paid')}
                        </div>
                      </div>

                      <div className="entry-row-right">
                        <div
                          style={{
                            fontFamily: 'var(--font-head)',
                            fontSize: '1.15rem',
                            fontWeight: 800,
                            color: isPayment ? 'var(--success)' : 'var(--danger)'
                          }}
                        >
                          {isPayment ? `- ₹${txn.amount}` : `+ ₹${txn.amount}`}
                        </div>
                        <span className={`status-pill ${isPayment ? 'cash' : txn.paymentMode || 'credit'}`}>
                          {isPayment ? '🟢 Jama' : txn.paymentMode === 'credit' ? '🔴 Udhar' : '🟢 Paid'}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Modal to Add New Customer */}
      {showAddCust && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0,0,0,0.6)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: '16px'
          }}
        >
          <div className="card" style={{ width: '100%', maxWidth: '420px', background: 'var(--bg-elevated)' }}>
            <h3 style={{ fontSize: '1.1rem', marginBottom: '12px' }}>➕ Naya Grahak Jodein</h3>
            <form onSubmit={handleAddCustomer} style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <div>
                <label className="input-label">Grahak ka Naam (Required)</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="e.g. Ramesh Kumar"
                  value={custName}
                  onChange={(e) => setCustName(e.target.value)}
                  required
                  autoFocus
                />
              </div>

              <div>
                <label className="input-label">Gaon / Village (Optional)</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="e.g. Rampur"
                  value={custVillage}
                  onChange={(e) => setCustVillage(e.target.value)}
                />
              </div>

              <div>
                <label className="input-label">Mobile Number (Optional)</label>
                <input
                  type="tel"
                  className="form-input"
                  placeholder="e.g. 9812345678"
                  value={custPhone}
                  onChange={(e) => setCustPhone(e.target.value)}
                />
              </div>

              <div style={{ display: 'flex', gap: '8px', marginTop: '6px' }}>
                <button type="submit" className="big-btn" style={{ height: '48px', minHeight: '48px' }}>
                  Grahak Save Karein
                </button>
                <button
                  type="button"
                  className="btn-secondary-action"
                  style={{ height: '48px', minHeight: '48px' }}
                  onClick={() => setShowAddCust(false)}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
