import React, { useState, useMemo } from 'react';
import jsPDF from 'jspdf';
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

  // All transactions for active customer
  const customerStatements = useMemo(() => {
    if (!activeCustomerId) return [];
    return boris
      .filter((b) => b.customerId === activeCustomerId)
      .sort((a, b) => new Date(b.createdAt || b.doneDate || 0) - new Date(a.createdAt || a.date || 0));
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
      customerPhone: activeCustomer.phone || '',
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

  // WhatsApp Reminder
  const sendWhatsAppReminder = (cust) => {
    const text =
      `🌾 *${shop.name}*\n` +
      `Namaste ${cust.name} ji,\n` +
      `Aapka total bakaya (udhar) rashi *₹${cust.balance}* hai.\n` +
      `Kripya samay par bhugtan karein. Dhanyawad! 🙏`;

    window.open(
      `https://api.whatsapp.com/send?phone=${cust.phone || ''}&text=${encodeURIComponent(text)}`,
      '_blank'
    );
  };

  // PDF Statement Download Generator
  const exportPDFStatement = () => {
    if (!activeCustomer) return;
    const doc = new jsPDF();

    // Header
    doc.setFontSize(18);
    doc.setTextColor(217, 119, 6);
    doc.text(shop.name || 'Chakkibook Flour Mill & Spellar', 14, 20);

    doc.setFontSize(9);
    doc.setTextColor(100);
    doc.text(`Mobile: ${shop.phone || 'N/A'} | ${shop.address || 'Main Market'}`, 14, 26);

    doc.setLineWidth(0.5);
    doc.setDrawColor(217, 119, 6);
    doc.line(14, 30, 196, 30);

    // Customer Title
    doc.setFontSize(13);
    doc.setTextColor(0);
    doc.text(`GRAHAK KHATA STATEMENT: ${activeCustomer.name.toUpperCase()}`, 14, 40);

    doc.setFontSize(9);
    doc.setTextColor(80);
    doc.text(`Phone: ${activeCustomer.phone || 'N/A'} | Gaon: ${activeCustomer.village || 'N/A'}`, 14, 46);
    doc.text(`Date: ${new Date().toLocaleDateString('en-IN')}`, 14, 52);

    // Dues Box
    doc.setFillColor(254, 243, 199);
    doc.rect(14, 58, 182, 14, 'F');
    doc.setFontSize(11);
    doc.setTextColor(180, 83, 9);
    doc.text(`KUL BACHA HUA UDHAR (TOTAL DUES): RS ${activeCustomer.balance || 0}`, 20, 67);

    // Table Header
    let y = 82;
    doc.setFontSize(9);
    doc.setTextColor(255);
    doc.setFillColor(30, 41, 59);
    doc.rect(14, y - 6, 182, 9, 'F');
    doc.text('Date', 18, y);
    doc.text('Type / Item', 50, y);
    doc.text('Qty / Wt', 105, y);
    doc.text('Payment', 140, y);
    doc.text('Amount', 170, y);

    // Rows
    y += 9;
    doc.setTextColor(30);
    customerStatements.forEach((st) => {
      if (y > 270) {
        doc.addPage();
        y = 20;
      }
      const dStr = new Date(st.createdAt || st.doneDate || Date.now()).toLocaleDateString('en-IN');
      const typeStr = st.type === 'payment' ? 'Jama Payment' : `${st.mode?.toUpperCase() || ''} ${st.grainType || ''}`;
      const qtyStr = st.inputWeight ? `${st.inputWeight}kg` : (st.oilOutput ? `${st.oilOutput}L Tel` : '-');
      const modeStr = st.paymentMode === 'credit' ? 'Udhar' : (st.paymentMode === 'upi' ? 'UPI' : 'Cash');
      const amtStr = st.type === 'payment' ? `-Rs ${st.amount}` : `+Rs ${st.amount}`;

      doc.text(dStr, 18, y);
      doc.text(typeStr, 50, y);
      doc.text(qtyStr, 105, y);
      doc.text(modeStr, 140, y);
      doc.text(amtStr, 170, y);

      y += 8;
    });

    doc.setFontSize(8);
    doc.setTextColor(120);
    doc.text('Generated via Chakkibook Smart Ledger App', 14, 285);

    doc.save(`Khata_Statement_${activeCustomer.name.replace(/\s+/g, '_')}.pdf`);
  };

  // Add Customer Modal Submit
  const handleAddCustomerSubmit = (e) => {
    e.preventDefault();
    if (!custName.trim()) return;

    const created = addCustomer({
      name: custName.trim(),
      village: custVillage.trim(),
      phone: custPhone.trim(),
      balance: 0
    });

    setCustName('');
    setCustVillage('');
    setCustPhone('');
    setShowAddCust(false);
    if (created) setActiveCustomerId(created.id);
  };

  const handleBack = () => {
    setActiveCustomerId(null);
    if (onClearSelectedCustomer) onClearSelectedCustomer();
  };

  return (
    <div className="app-container">
      {!activeCustomer ? (
        /* 1. Customer List View */
        <>
          {/* Dues Header */}
          <div className="card" style={{ background: 'var(--card-bg)', border: '1px solid var(--danger)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <span style={{ fontSize: '0.8rem', color: 'var(--danger)', fontWeight: 700, textTransform: 'uppercase' }}>
                  🔴 Total Market Udhar (Dues)
                </span>
                <h2 className="big-number" style={{ color: 'var(--danger)', fontSize: '1.8rem', margin: '2px 0 0 0' }}>
                  ₹ {totalOutstandingDues.toLocaleString()}
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setShowAddCust(true)}
                className="big-btn"
                style={{ width: 'auto', padding: '0.6rem 1rem', minHeight: '44px', fontSize: '0.9rem' }}
              >
                <span>➕</span>
                <span>Naya Grahak</span>
              </button>
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
        /* 2. Customer Ledger View */
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <button
            type="button"
            onClick={handleBack}
            className="btn-secondary-action"
            style={{ width: 'auto', alignSelf: 'flex-start', padding: '6px 14px', height: '40px', minHeight: '40px' }}
          >
            ← Wapas Grahak List
          </button>

          {/* Customer Header Card with PDF & WhatsApp buttons */}
          <div className="card" style={{ background: 'var(--primary-light)', border: '1.5px solid var(--card-border)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <h3 style={{ fontSize: '1.25rem', margin: 0, color: 'var(--text-main)' }}>{activeCustomer.name}</h3>
                <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginTop: '3px' }}>
                  📍 Gaon: <strong>{activeCustomer.village || 'N/A'}</strong> | 📱 Phone: <strong>{activeCustomer.phone || 'N/A'}</strong>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '6px' }}>
                <button
                  type="button"
                  onClick={exportPDFStatement}
                  style={{
                    background: '#0284c7', color: '#fff', border: 'none', borderRadius: '0.5rem',
                    padding: '6px 10px', fontSize: '0.8rem', fontWeight: '700', cursor: 'pointer'
                  }}
                >
                  📄 PDF Bill
                </button>

                {activeCustomer.balance > 0 && (
                  <button
                    type="button"
                    onClick={() => sendWhatsAppReminder(activeCustomer)}
                    style={{
                      background: '#16a34a', color: '#fff', border: 'none', borderRadius: '0.5rem',
                      padding: '6px 10px', fontSize: '0.8rem', fontWeight: '700', cursor: 'pointer'
                    }}
                  >
                    📲 WhatsApp
                  </button>
                )}
              </div>
            </div>

            <div style={{ marginTop: '12px', borderTop: '1px dashed var(--card-border)', paddingTop: '10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '0.9rem', fontWeight: 600 }}>Kul Bacha Hua Udhar (Dues):</span>
              <span className="big-number" style={{ color: activeCustomer.balance > 0 ? 'var(--danger)' : 'var(--success)', fontSize: '1.6rem' }}>
                ₹ {activeCustomer.balance || 0}
              </span>
            </div>
          </div>

          {/* Payment Collection Form */}
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

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '4px' }}>
                  <button
                    type="button"
                    className={`pill-btn ${payMode === 'cash' ? 'active' : ''}`}
                    onClick={() => setPayMode('cash')}
                  >
                    Nokad Cash
                  </button>
                  <button
                    type="button"
                    className={`pill-btn ${payMode === 'upi' ? 'active' : ''}`}
                    onClick={() => setPayMode('upi')}
                  >
                    UPI
                  </button>
                  <button
                    type="button"
                    className={`pill-btn ${payMode === 'credit' ? 'active' : ''}`}
                    onClick={() => setPayMode('credit')}
                  >
                    Udhar
                  </button>
                </div>
              </div>

              <input
                type="text"
                className="form-input"
                placeholder="Notes / Receipt No (Optional)"
                value={payNotes}
                onChange={(e) => setPayNotes(e.target.value)}
              />

              <button type="submit" className="big-btn" style={{ minHeight: '48px' }}>
                <span>💰</span>
                <span>JAMA RASHI (COLLECT PAYMENT)</span>
              </button>
            </form>
          </div>

          {/* Transaction History Statement */}
          <div className="card">
            <div className="section-header">
              <span>📜 Transaction History ({customerStatements.length})</span>
            </div>

            {customerStatements.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '16px', color: 'var(--text-muted)' }}>
                Koi purana transaction record nahi hai.
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {customerStatements.map((st) => {
                  const isPayment = st.type === 'payment';
                  const isCredit = st.paymentMode === 'credit';
                  return (
                    <div
                      key={st.id}
                      style={{
                        padding: '10px 12px',
                        borderRadius: '0.5rem',
                        background: 'rgba(255,255,255,0.03)',
                        borderLeft: isPayment ? '4px solid #22c55e' : (isCredit ? '4px solid #ef4444' : '4px solid #38bdf8'),
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center'
                      }}
                    >
                      <div>
                        <strong style={{ fontSize: '0.95rem' }}>
                          {isPayment ? '💚 Jama Cash Payment' : `${st.mode?.toUpperCase()} • ${st.grainType || ''}`}
                        </strong>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                          {st.inputWeight ? `${st.inputWeight}kg` : (st.oilOutput ? `${st.oilOutput}L Tel` : '')}{' '}
                          • {new Date(st.createdAt || st.doneDate || Date.now()).toLocaleDateString()}
                          {st.notes ? ` • ${st.notes}` : ''}
                        </div>
                      </div>

                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: '1.1rem', fontWeight: 800, color: isPayment ? '#4ade80' : (isCredit ? '#f87171' : '#fff') }}>
                          {isPayment ? `-₹ ${st.amount}` : `+₹ ${st.amount}`}
                        </div>
                        <span className={`status-pill ${isPayment ? 'cash' : (st.paymentMode || 'cash')}`}>
                          {isPayment ? 'Jama' : (st.paymentMode === 'credit' ? 'Udhar' : 'Paid')}
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

      {/* Add Customer Modal */}
      {showAddCust && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '16px'
        }}>
          <div className="card" style={{ width: '100%', maxWidth: '420px', background: 'var(--card-bg)' }}>
            <h3 style={{ fontSize: '1.1rem', marginBottom: '12px' }}>➕ Naya Grahak Add Karein</h3>
            <form onSubmit={handleAddCustomerSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <input
                type="text"
                className="form-input"
                placeholder="Grahak ka Naam (e.g. Ramesh)"
                value={custName}
                onChange={(e) => setCustName(e.target.value)}
                required
                autoFocus
              />
              <input
                type="text"
                className="form-input"
                placeholder="Gaon / Village (Optional)"
                value={custVillage}
                onChange={(e) => setCustVillage(e.target.value)}
              />
              <input
                type="tel"
                className="form-input"
                placeholder="Mobile Number (📱 Auto-SMS)"
                value={custPhone}
                onChange={(e) => setCustPhone(e.target.value)}
              />
              <div style={{ display: 'flex', gap: '8px', marginTop: '6px' }}>
                <button type="submit" className="big-btn" style={{ minHeight: '48px' }}>Save Grahak</button>
                <button type="button" className="btn-secondary-action" style={{ minHeight: '48px' }} onClick={() => setShowAddCust(false)}>Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
