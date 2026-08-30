import React, { useState } from 'react';
import { useStore } from '../store/useStore';

export default function NewEntry({ setActiveTab }) {
  const shop = useStore((state) => state.shop);
  const customers = useStore((state) => state.customers);
  const addTransaction = useStore((state) => state.addTransaction);
  const addCustomer = useStore((state) => state.addCustomer);

  const [type, setType] = useState('pisai'); // pisai, pirai, khari_sale, payment
  const [selectedCustomerId, setSelectedCustomerId] = useState('');
  const [newCustomerName, setNewCustomerName] = useState('');
  const [newCustomerPhone, setNewCustomerPhone] = useState('');
  const [showAddCustomer, setShowAddCustomer] = useState(false);

  const [grainType, setGrainType] = useState('Wheat (Gehun)');
  const [weight, setWeight] = useState('');
  const [rate, setRate] = useState(shop.rates.pisai);
  const [paymentMode, setPaymentMode] = useState('cash'); // cash, upi, credit
  const [notes, setNotes] = useState('');

  // Handle Type Change & set default rate
  const handleTypeChange = (newType) => {
    setType(newType);
    if (newType === 'pisai') setRate(shop.rates.pisai);
    else if (newType === 'pirai') setRate(shop.rates.pirai);
    else if (newType === 'khari_sale') setRate(shop.rates.khari);
    else setRate(0);
  };

  // Weight change calculation
  const calculatedAmount = type === 'payment' ? Number(weight) || 0 : (Number(weight) || 0) * (Number(rate) || 0);

  // Submit Handler
  const handleSubmit = (e) => {
    e.preventDefault();

    let targetCustId = selectedCustomerId;
    let targetCustName = customers.find((c) => c.id === selectedCustomerId)?.name || '';

    // If new customer inline creation
    if (showAddCustomer && newCustomerName.trim()) {
      const created = addCustomer({ name: newCustomerName.trim(), phone: newCustomerPhone.trim() });
      targetCustId = created.id;
      targetCustName = created.name;
    }

    const txnData = {
      type,
      customerId: targetCustId,
      customerName: targetCustName,
      grainType: type === 'pisai' ? grainType : type === 'pirai' ? 'Mustard (Sarson)' : '',
      weight: type === 'payment' ? 0 : Number(weight),
      rate: Number(rate),
      amount: calculatedAmount,
      paymentMode,
      notes,
    };

    addTransaction(txnData);

    // WhatsApp share prompt
    const shareText = `🌾 *${shop.name}* Bill Receipt:\n` +
      `Customer: ${targetCustName || 'Cash'}\n` +
      `Type: ${type.toUpperCase()}\n` +
      (weight ? `Weight: ${weight} kg @ ₹${rate}/kg\n` : '') +
      `*Total Amount: ₹${calculatedAmount}*\n` +
      `Payment Mode: ${paymentMode.toUpperCase()}\n` +
      `Thank you! 🙏`;

    if (window.confirm(`Entry saved! WhatsApp bill share karein?`)) {
      window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(shareText)}`, '_blank');
    }

    setActiveTab('home');
  };

  return (
    <div className="app-container">
      <h2 style={{ fontSize: '1.2rem', marginBottom: '14px' }}>⚡ Nayi Entry Add Karein</h2>

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
        
        {/* Entry Type Selector Tabs */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: '6px' }}>
          {[
            { id: 'pisai', label: '🌾 Pisai' },
            { id: 'pirai', label: '🫒 Pirai' },
            { id: 'khari_sale', label: '📦 Khari' },
            { id: 'payment', label: '💵 Payment' }
          ].map((t) => (
            <button
              type="button"
              key={t.id}
              onClick={() => handleTypeChange(t.id)}
              className={`btn ${type === t.id ? 'btn-primary' : 'btn-outline'}`}
              style={{ padding: '8px 4px', fontSize: '0.8rem', borderRadius: 'var(--radius-sm)' }}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Customer Selection */}
        <div className="card">
          <label style={{ fontSize: '0.85rem', fontWeight: 600, display: 'block', marginBottom: '6px' }}>
            Customer (Grahak)
          </label>
          
          {!showAddCustomer ? (
            <div style={{ display: 'flex', gap: '8px' }}>
              <select
                className="input-field"
                value={selectedCustomerId}
                onChange={(e) => setSelectedCustomerId(e.target.value)}
              >
                <option value="">-- Cash / Direct Entry --</option>
                {customers.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} {c.balance ? `(Dues: ₹${c.balance})` : ''}
                  </option>
                ))}
              </select>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => setShowAddCustomer(true)}
                style={{ width: 'auto', padding: '0 12px', whiteSpace: 'nowrap' }}
              >
                + Naya
              </button>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <input
                type="text"
                className="input-field"
                placeholder="Grahak ka Naam (Required)"
                value={newCustomerName}
                onChange={(e) => setNewCustomerName(e.target.value)}
                required
              />
              <input
                type="tel"
                className="input-field"
                placeholder="Mobile Number (Optional)"
                value={newCustomerPhone}
                onChange={(e) => setNewCustomerPhone(e.target.value)}
              />
              <button
                type="button"
                style={{ background: 'none', border: 'none', color: 'var(--danger)', fontSize: '0.8rem', textAlign: 'left', cursor: 'pointer' }}
                onClick={() => setShowAddCustomer(false)}
              >
                ✖ Cancel & Select existing
              </button>
            </div>
          )}
        </div>

        {/* Dynamic Inputs based on type */}
        <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          
          {type === 'pisai' && (
            <div>
              <label style={{ fontSize: '0.85rem', fontWeight: 600, display: 'block', marginBottom: '4px' }}>
                Grain / Anaj Type
              </label>
              <select className="input-field" value={grainType} onChange={(e) => setGrainType(e.target.value)}>
                <option value="Wheat (Gehun)">🌾 Wheat (Gehun)</option>
                <option value="Maize (Makka)">🌽 Maize (Makka)</option>
                <option value="Gram (Chana / Dana)">🧆 Gram (Chana / Dana)</option>
                <option value="Multi-grain">🌾 Multi-grain</option>
              </select>
            </div>
          )}

          {type !== 'payment' ? (
            <>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div>
                  <label style={{ fontSize: '0.85rem', fontWeight: 600, display: 'block', marginBottom: '4px' }}>
                    Vazan (Weight in Kg)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    className="input-field"
                    placeholder="e.g. 50"
                    value={weight}
                    onChange={(e) => setWeight(e.target.value)}
                    required
                  />
                </div>
                <div>
                  <label style={{ fontSize: '0.85rem', fontWeight: 600, display: 'block', marginBottom: '4px' }}>
                    Rate (₹/kg)
                  </label>
                  <input
                    type="number"
                    step="0.5"
                    className="input-field"
                    value={rate}
                    onChange={(e) => setRate(e.target.value)}
                    required
                  />
                </div>
              </div>
            </>
          ) : (
            <div>
              <label style={{ fontSize: '0.85rem', fontWeight: 600, display: 'block', marginBottom: '4px' }}>
                Jama Rashi (Payment Received Amount ₹)
              </label>
              <input
                type="number"
                className="input-field"
                placeholder="e.g. 500"
                value={weight}
                onChange={(e) => setWeight(e.target.value)}
                required
              />
            </div>
          )}

          {/* Live Total Display */}
          <div style={{
            background: 'var(--wheat-light)',
            padding: '12px',
            borderRadius: 'var(--radius-sm)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}>
            <span style={{ fontWeight: 600 }}>Kul Rashi (Total Amount):</span>
            <span style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--wheat-dark)' }}>
              ₹ {calculatedAmount}
            </span>
          </div>

          {/* Payment Mode */}
          <div>
            <label style={{ fontSize: '0.85rem', fontWeight: 600, display: 'block', marginBottom: '6px' }}>
              Payment Mode
            </label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '6px' }}>
              {[
                { id: 'cash', label: '🟢 Cash' },
                { id: 'upi', label: '📱 UPI' },
                { id: 'credit', label: '🔴 Udhar (Credit)' }
              ].map((m) => (
                <button
                  type="button"
                  key={m.id}
                  onClick={() => setPaymentMode(m.id)}
                  className={`btn ${paymentMode === m.id ? 'btn-primary' : 'btn-outline'}`}
                  style={{ padding: '8px 4px', fontSize: '0.8rem', borderRadius: 'var(--radius-sm)' }}
                >
                  {m.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <input
              type="text"
              className="input-field"
              placeholder="Notes / Remark (Optional)"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>

        </div>

        <button type="submit" className="btn btn-accent" style={{ padding: '14px', fontSize: '1.1rem' }}>
          💾 Save & WhatsApp Share
        </button>

      </form>
    </div>
  );
}
