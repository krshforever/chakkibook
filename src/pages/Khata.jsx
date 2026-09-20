import React, { useState, useMemo } from 'react';
import jsPDF from 'jspdf';
import { 
  BookOpen, 
  UserPlus, 
  Search, 
  Phone, 
  MapPin, 
  Coins, 
  Download, 
  Share2, 
  CheckCircle2, 
  ArrowUpRight, 
  ArrowDownLeft, 
  X, 
  Plus,
  UserCheck
} from 'lucide-react';
import { useStore } from '../store/useStore';
import GaonSelector from '../components/GaonSelector';

export default function Khata({ selectedCustomer: initialSelectedCustomer, onClearSelectedCustomer }) {
  const customers = useStore((state) => state.customers || []);
  const boris = useStore((state) => state.boris || []);
  const addBori = useStore((state) => state.addBori);
  const addCustomer = useStore((state) => state.addCustomer);
  const shop = useStore((state) => state.shop || {});
  const selectedVillage = useStore((state) => state.selectedVillage || 'all');
  const setSelectedVillage = useStore((state) => state.setSelectedVillage);
  const getVillages = useStore((state) => state.getVillages);
  const getVillageStats = useStore((state) => state.getVillageStats);

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

  // Current Village Aggregate Stats
  const currentVillageStats = useMemo(() => {
    return getVillageStats ? getVillageStats(selectedVillage) : { customerCount: customers.length, totalDues: totalOutstandingDues };
  }, [getVillageStats, selectedVillage, customers, boris, totalOutstandingDues]);

  // Sort customers: filtered by active village and search, highest dues first
  const sortedCustomers = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    let list = customers;
    if (selectedVillage && selectedVillage !== 'all') {
      const vTarget = selectedVillage.trim().toLowerCase();
      list = list.filter((c) => (c.village || '').trim().toLowerCase() === vTarget);
    }
    return list
      .filter((c) => {
        if (!q) return true;
        return (
          c.name.toLowerCase().includes(q) ||
          (c.phone && c.phone.includes(q)) ||
          (c.village && c.village.toLowerCase().includes(q))
        );
      })
      .sort((a, b) => (b.balance || 0) - (a.balance || 0));
  }, [customers, searchQuery, selectedVillage]);

  const activeCustomer = useMemo(() => {
    return customers.find((c) => c.id === activeCustomerId) || null;
  }, [customers, activeCustomerId]);

  const activeCustomerBoris = useMemo(() => {
    if (!activeCustomer) return [];
    return boris.filter((b) => b.customerId === activeCustomer.id || b.customerName === activeCustomer.name);
  }, [boris, activeCustomer]);

  const handlePaymentSubmit = (e) => {
    e.preventDefault();
    const amt = Number(payAmount);
    if (!amt || amt <= 0 || !activeCustomer) return;

    addBori({
      mode: 'chakki',
      customerId: activeCustomer.id,
      customerName: activeCustomer.name,
      customerPhone: activeCustomer.phone,
      grainType: 'Jama Payment',
      inputWeight: 0,
      rate: 0,
      amount: amt,
      status: 'done',
      paymentMode: payMode === 'cash' ? 'cash' : 'upi',
      notes: payNotes ? `Jama Payment (${payNotes})` : 'Jama Payment'
    });

    setPayAmount('');
    setPayNotes('');
  };

  const handleCreateCustomer = (e) => {
    e.preventDefault();
    if (!custName.trim()) return;

    const newCust = addCustomer({
      name: custName.trim(),
      village: custVillage.trim(),
      phone: custPhone.trim()
    });

    setCustName('');
    setCustVillage('');
    setCustPhone('');
    setShowAddCust(false);
    if (newCust && newCust.id) {
      setActiveCustomerId(newCust.id);
    }
  };

  // Generate PDF Statement
  const generatePDFStatement = () => {
    if (!activeCustomer) return;
    const doc = new jsPDF();
    doc.setFontSize(18);
    doc.text(`${shop.name || 'Chakkibook'} Statement`, 14, 20);
    doc.setFontSize(12);
    doc.text(`Grahak: ${activeCustomer.name} (${activeCustomer.village || ''})`, 14, 28);
    doc.text(`Mobile: ${activeCustomer.phone || 'N/A'}`, 14, 34);
    doc.text(`Kul Baki Udhar: Rs ${activeCustomer.balance || 0}`, 14, 40);

    doc.line(14, 45, 196, 45);

    doc.setFontSize(11);
    doc.text('Tareekh', 14, 52);
    doc.text('Vivran (Details)', 50, 52);
    doc.text('Rakam (Rs)', 150, 52);

    let y = 60;
    activeCustomerBoris.forEach((b) => {
      const dateStr = b.date || (b.createdAt ? b.createdAt.split('T')[0] : '');
      const itemDesc = `${b.grainType}${b.outputType ? ` (${b.outputType})` : ''} (${b.inputWeight || 0}kg)`;
      doc.text(dateStr, 14, y);
      doc.text(itemDesc, 50, y);
      doc.text(`Rs ${b.amount || 0}`, 150, y);
      y += 8;
      if (y > 280) {
        doc.addPage();
        y = 20;
      }
    });

    doc.save(`Khata_${activeCustomer.name.replace(/\s+/g, '_')}.pdf`);
  };

  // WhatsApp Reminder
  const sendWhatsAppReminder = () => {
    if (!activeCustomer || !activeCustomer.phone) {
      alert('Sahi mobile number nahi mila!');
      return;
    }
    const cleanPhone = activeCustomer.phone.replace(/\D/g, '');
    const phoneWithCountry = cleanPhone.length === 10 ? `91${cleanPhone}` : cleanPhone;
    const msg = `Namaste ${activeCustomer.name} ji, ${shop.name || 'Atta Chakki'} par aapka kul baki udhar Rs ${activeCustomer.balance || 0} hai. Kripya samay par bhugtan karein. Dhanyawad!`;
    const url = `https://wa.me/${phoneWithCountry}?text=${encodeURIComponent(msg)}`;
    window.open(url, '_blank');
  };

  return (
    <div className="app-container" style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
      {/* 1. Dues Hero Summary (Village Aware) */}
      <section style={{
        background: 'linear-gradient(135deg, #7f1d1d, #991b1b)',
        color: '#ffffff',
        borderRadius: '1.25rem',
        padding: '1.25rem',
        boxShadow: '0 8px 20px rgba(153, 27, 27, 0.25)',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <div>
          <div style={{ fontSize: '0.8rem', fontWeight: 700, color: '#fca5a5', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            {selectedVillage === 'all' 
              ? 'Kul Baki Udhar (All Villages)' 
              : `${selectedVillage} Ka Kul Baki Udhar (${currentVillageStats.customerCount} Grahak)`}
          </div>
          <div style={{ fontSize: '2rem', fontWeight: 800, color: '#ffffff', marginTop: '2px', fontFamily: "'Outfit', sans-serif" }}>
            ₹{selectedVillage === 'all' ? totalOutstandingDues : currentVillageStats.totalDues}
          </div>
        </div>

        <button
          type="button"
          onClick={() => setShowAddCust(true)}
          style={{
            backgroundColor: '#ffffff',
            color: '#991b1b',
            border: 'none',
            borderRadius: '0.75rem',
            padding: '10px 16px',
            fontSize: '0.85rem',
            fontWeight: 800,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
          }}
        >
          <UserPlus size={16} />
          <span>Naya Grahak</span>
        </button>
      </section>

      {/* 1.5. Gaon Selector (1-Tap Multi-Village Filter) */}
      <GaonSelector
        selectedVillage={selectedVillage}
        onSelectVillage={(v) => setSelectedVillage(v)}
        badgeType="dues"
        allLabel="सभी गाँव"
      />

      {/* 2. Customer Search Bar */}
      <section style={{ position: 'relative', width: '100%' }}>
        <Search size={18} color="#94a3b8" style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)' }} />
        <input
          type="text"
          placeholder="Search grahak name, village, mobile..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          style={{
            width: '100%',
            height: '46px',
            padding: '0 14px 0 42px',
            borderRadius: '0.85rem',
            border: '1.5px solid #cbd5e1',
            backgroundColor: '#ffffff',
            fontSize: '0.9rem',
            color: '#0f172a',
            outline: 'none',
            boxSizing: 'border-box'
          }}
        />
      </section>

      {/* 3. Main Khata View: Customer List + Detail Drawer */}
      <section style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {activeCustomer ? (
          /* Active Customer Detail Drawer */
          <div style={{
            backgroundColor: '#ffffff',
            border: '1px solid #e2e8f0',
            borderRadius: '1.25rem',
            padding: '1.25rem',
            boxShadow: '0 4px 16px rgba(0,0,0,0.06)',
            display: 'flex',
            flexDirection: 'column',
            gap: '14px'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <button
                  type="button"
                  onClick={() => {
                    setActiveCustomerId(null);
                    if (onClearSelectedCustomer) onClearSelectedCustomer();
                  }}
                  style={{
                    background: '#f1f5f9',
                    border: 'none',
                    borderRadius: '0.5rem',
                    padding: '4px 8px',
                    fontSize: '0.75rem',
                    fontWeight: 700,
                    color: '#475569',
                    cursor: 'pointer',
                    marginBottom: '8px'
                  }}
                >
                  ← Wapas Grahak List
                </button>

                <h2 style={{ fontSize: '1.3rem', fontWeight: 800, color: '#0f172a', margin: 0 }}>
                  {activeCustomer.name}
                </h2>
                <div style={{ fontSize: '0.82rem', color: '#64748b', marginTop: '2px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                  {activeCustomer.village && (
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                      <MapPin size={14} color="#94a3b8" />
                      {activeCustomer.village}
                    </span>
                  )}
                  {activeCustomer.phone && (
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                      <Phone size={14} color="#94a3b8" />
                      {activeCustomer.phone}
                    </span>
                  )}
                </div>
              </div>

              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: 700, textTransform: 'uppercase' }}>
                  Baki Balance
                </div>
                <div style={{
                  fontSize: '1.5rem',
                  fontWeight: 800,
                  color: (activeCustomer.balance || 0) > 0 ? '#ef4444' : '#16a34a',
                  fontFamily: "'Outfit', sans-serif"
                }}>
                  ₹{activeCustomer.balance || 0}
                </div>
              </div>
            </div>

            {/* Statement Actions */}
            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                type="button"
                onClick={generatePDFStatement}
                style={{
                  flex: 1,
                  padding: '8px 12px',
                  backgroundColor: '#f8fafc',
                  border: '1px solid #cbd5e1',
                  borderRadius: '0.65rem',
                  fontSize: '0.8rem',
                  fontWeight: 700,
                  color: '#334155',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px'
                }}
              >
                <Download size={15} />
                <span>PDF Statement</span>
              </button>

              <button
                type="button"
                onClick={sendWhatsAppReminder}
                style={{
                  flex: 1,
                  padding: '8px 12px',
                  backgroundColor: '#f0fdf4',
                  border: '1px solid #bbf7d0',
                  borderRadius: '0.65rem',
                  fontSize: '0.8rem',
                  fontWeight: 700,
                  color: '#16a34a',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px'
                }}
              >
                <Share2 size={15} />
                <span>WhatsApp Hisab</span>
              </button>
            </div>

            {/* Jama Payment Quick Form */}
            <form onSubmit={handlePaymentSubmit} style={{
              backgroundColor: '#fffbeb',
              border: '1px solid #fde68a',
              borderRadius: '0.85rem',
              padding: '12px',
              display: 'flex',
              flexDirection: 'column',
              gap: '8px'
            }}>
              <div style={{ fontSize: '0.82rem', fontWeight: 800, color: '#92400e', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Coins size={16} />
                <span>Jama Payment Entry (Grahak Rakam Jama Kare)</span>
              </div>

              <div style={{ display: 'flex', gap: '8px' }}>
                <input
                  type="number"
                  placeholder="Rakam (₹)"
                  value={payAmount}
                  onChange={(e) => setPayAmount(e.target.value)}
                  required
                  style={{
                    flex: 1,
                    height: '42px',
                    padding: '0 12px',
                    borderRadius: '0.65rem',
                    border: '1px solid #cbd5e1',
                    fontSize: '1rem',
                    fontWeight: 700,
                    outline: 'none'
                  }}
                />
                <select
                  value={payMode}
                  onChange={(e) => setPayMode(e.target.value)}
                  style={{
                    height: '42px',
                    padding: '0 10px',
                    borderRadius: '0.65rem',
                    border: '1px solid #cbd5e1',
                    fontSize: '0.85rem',
                    fontWeight: 700,
                    backgroundColor: '#ffffff'
                  }}
                >
                  <option value="cash">Cash</option>
                  <option value="upi">UPI / Online</option>
                </select>
                <button
                  type="submit"
                  style={{
                    height: '42px',
                    padding: '0 16px',
                    backgroundColor: '#d97706',
                    color: '#ffffff',
                    border: 'none',
                    borderRadius: '0.65rem',
                    fontSize: '0.88rem',
                    fontWeight: 800,
                    cursor: 'pointer'
                  }}
                >
                  Jama
                </button>
              </div>
            </form>

            {/* Transaction Timeline */}
            <div>
              <div style={{ fontSize: '0.85rem', fontWeight: 800, color: '#0f172a', marginBottom: '8px' }}>
                Transaction History ({activeCustomerBoris.length})
              </div>

              {activeCustomerBoris.length === 0 ? (
                <div style={{ fontSize: '0.8rem', color: '#94a3b8', fontStyle: 'italic' }}>
                  Is grahak ka abhi tak koi transaction record nahi hai.
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  {activeCustomerBoris.map((b) => (
                    <div
                      key={b.id}
                      style={{
                        padding: '8px 12px',
                        borderRadius: '0.65rem',
                        border: '1px solid #f1f5f9',
                        backgroundColor: '#f8fafc',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center'
                      }}
                    >
                      <div>
                        <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#0f172a' }}>
                          {b.grainType}{b.outputType ? ` (${b.outputType})` : ''} ({b.inputWeight || 0}kg)
                        </div>
                        <div style={{ fontSize: '0.72rem', color: '#64748b' }}>
                          {b.date || (b.createdAt ? b.createdAt.split('T')[0] : '')} • {b.paymentMode === 'credit' ? 'Udhar' : 'Paid'}
                        </div>
                      </div>

                      <div style={{
                        fontSize: '0.92rem',
                        fontWeight: 800,
                        color: b.paymentMode === 'credit' ? '#ef4444' : '#16a34a'
                      }}>
                        {b.paymentMode === 'credit' ? `+₹${b.amount}` : `-₹${b.amount}`}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        ) : (
          /* Customer List View */
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {sortedCustomers.length === 0 ? (
              <div style={{ backgroundColor: '#ffffff', padding: '1.5rem', borderRadius: '1rem', textAlign: 'center', color: '#64748b' }}>
                Koi grahak nahi mila. Naya grahak add karein!
              </div>
            ) : (
              sortedCustomers.map((c) => (
                <div
                  key={c.id}
                  onClick={() => setActiveCustomerId(c.id)}
                  style={{
                    backgroundColor: '#ffffff',
                    border: '1px solid #e2e8f0',
                    borderRadius: '0.85rem',
                    padding: '12px 14px',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    cursor: 'pointer',
                    boxShadow: '0 2px 6px rgba(0,0,0,0.03)',
                    transition: 'all 0.2s ease'
                  }}
                >
                  <div>
                    <div style={{ fontSize: '0.98rem', fontWeight: 800, color: '#0f172a' }}>
                      {c.name}
                    </div>
                    <div style={{ fontSize: '0.78rem', color: '#64748b', marginTop: '2px', display: 'flex', gap: '8px' }}>
                      {c.village && <span>{c.village}</span>}
                      {c.phone && <span>• {c.phone}</span>}
                    </div>
                  </div>

                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '0.7rem', color: '#94a3b8', fontWeight: 600 }}>Balance</div>
                    <div style={{
                      fontSize: '1.1rem',
                      fontWeight: 800,
                      color: (c.balance || 0) > 0 ? '#ef4444' : '#16a34a',
                      fontFamily: "'Outfit', sans-serif"
                    }}>
                      ₹{c.balance || 0}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </section>

      {/* 4. Add Customer Modal */}
      {showAddCust && (
        <div style={{
          position: 'fixed',
          inset: 0,
          backgroundColor: 'rgba(0,0,0,0.5)',
          zIndex: 200,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '16px'
        }}>
          <div style={{
            width: '100%',
            maxWidth: '380px',
            backgroundColor: '#ffffff',
            borderRadius: '1.25rem',
            padding: '1.5rem',
            boxShadow: '0 20px 40px rgba(0,0,0,0.2)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#0f172a', margin: 0 }}>
                Naya Grahak Add Karein
              </h3>
              <button
                type="button"
                onClick={() => setShowAddCust(false)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b' }}
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleCreateCustomer} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: '#334155', marginBottom: '4px' }}>
                  Grahak Ka Naam
                </label>
                <input
                  type="text"
                  placeholder="e.g. Ramesh Kumar"
                  value={custName}
                  onChange={(e) => setCustName(e.target.value)}
                  required
                  style={{
                    width: '100%',
                    height: '44px',
                    padding: '0 12px',
                    borderRadius: '0.75rem',
                    border: '1px solid #cbd5e1',
                    fontSize: '0.95rem',
                    outline: 'none',
                    boxSizing: 'border-box'
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: '#334155', marginBottom: '4px' }}>
                  Gaon / Address (1-Tap Chunin ya Naya Likhein)
                </label>
                {/* 1-Tap Existing Village Chips */}
                {getVillages && getVillages().length > 0 && (
                  <div style={{ display: 'flex', gap: '6px', overflowX: 'auto', marginBottom: '8px', paddingBottom: '2px' }}>
                    {getVillages().map((v) => {
                      const isSelected = custVillage.trim().toLowerCase() === v.name.toLowerCase();
                      return (
                        <button
                          key={v.name}
                          type="button"
                          onClick={() => setCustVillage(v.name)}
                          style={{
                            padding: '4px 10px',
                            borderRadius: 'var(--radius-pill)',
                            border: isSelected ? '1.5px solid #d97706' : '1px solid #cbd5e1',
                            backgroundColor: isSelected ? '#fef3c7' : '#f8fafc',
                            color: isSelected ? '#92400e' : '#334155',
                            fontSize: '0.75rem',
                            fontWeight: 700,
                            cursor: 'pointer',
                            whiteSpace: 'nowrap'
                          }}
                        >
                          {v.name}
                        </button>
                      );
                    })}
                  </div>
                )}
                <input
                  type="text"
                  placeholder="e.g. Rampur"
                  value={custVillage}
                  onChange={(e) => setCustVillage(e.target.value)}
                  style={{
                    width: '100%',
                    height: '44px',
                    padding: '0 12px',
                    borderRadius: '0.75rem',
                    border: '1px solid #cbd5e1',
                    fontSize: '0.95rem',
                    outline: 'none',
                    boxSizing: 'border-box'
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: '#334155', marginBottom: '4px' }}>
                  Mobile Number
                </label>
                <input
                  type="tel"
                  placeholder="9876543210"
                  maxLength="10"
                  value={custPhone}
                  onChange={(e) => setCustPhone(e.target.value)}
                  style={{
                    width: '100%',
                    height: '44px',
                    padding: '0 12px',
                    borderRadius: '0.75rem',
                    border: '1px solid #cbd5e1',
                    fontSize: '0.95rem',
                    outline: 'none',
                    boxSizing: 'border-box'
                  }}
                />
              </div>

              <button
                type="submit"
                style={{
                  width: '100%',
                  height: '48px',
                  backgroundColor: '#d97706',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '0.75rem',
                  fontSize: '1rem',
                  fontWeight: 800,
                  cursor: 'pointer',
                  marginTop: '0.5rem'
                }}
              >
                Grahak Save Karein
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
