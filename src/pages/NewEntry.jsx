import React, { useState, useEffect, useMemo } from 'react';
import { 
  Scale, 
  Sparkles, 
  Package, 
  Warehouse, 
  User, 
  Plus, 
  Search, 
  MapPin, 
  Phone, 
  Check, 
  Coins, 
  CreditCard, 
  ArrowUpRight, 
  ArrowDownLeft, 
  Droplets, 
  Droplet, 
  Wheat, 
  X, 
  AlertCircle,
  Share2,
  ShoppingCart,
  UserPlus
} from 'lucide-react';
import { useStore } from '../store/useStore';

export default function NewEntry({ setActiveTab, initialCustomerId }) {
  const activeMode = useStore((state) => state.activeMode || 'chakki');
  const shop = useStore((state) => state.shop || {});
  const customers = useStore((state) => state.customers || []);
  const addCustomer = useStore((state) => state.addCustomer);
  const addBori = useStore((state) => state.addBori);
  const addStockEntry = useStore((state) => state.addStockEntry);

  // Spellar sub-toggle: 'pirai' | 'khari_sale' | 'owner_stock'
  const [spellarSubMode, setSpellarSubMode] = useState('pirai');

  // Customer selection / Creation
  const [selectedCustomerId, setSelectedCustomerId] = useState(initialCustomerId || '');
  const [customerSearch, setCustomerSearch] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);
  const [showAddCustomerModal, setShowAddCustomerModal] = useState(false);
  const [newCustName, setNewCustName] = useState('');
  const [newCustVillage, setNewCustVillage] = useState('');
  const [newCustPhone, setNewCustPhone] = useState('');

  // Chakki Fields
  const [grainType, setGrainType] = useState('Wheat');
  const [inputWeight, setInputWeight] = useState('');
  const [pisaiRate, setPisaiRate] = useState(shop.chakkiRates?.pisai || 4);
  const [manualKadda, setManualKadda] = useState('');
  const [isKaddaOverridden, setIsKaddaOverridden] = useState(false);

  // Spellar Fields
  const [piraiRate, setPiraiRate] = useState(shop.spellarRates?.pirai || 12);
  const [khariRate, setKhariRate] = useState(shop.spellarRates?.khari || 35);
  const [oilOutput, setOilOutput] = useState('');
  const [khaliOutput, setKhaliOutput] = useState('');

  // Owner Stock Fields
  const [stockType, setStockType] = useState('purchase'); // 'purchase' | 'oil_sale' | 'khari_sale'
  const [stockWeight, setStockWeight] = useState('');
  const [stockRate, setStockRate] = useState(55);
  const [stockNotes, setStockNotes] = useState('');

  // Shared Entry status & Payment
  const [status, setStatus] = useState('pending'); // 'pending' | 'done'
  const [paymentMode, setPaymentMode] = useState('cash'); // 'cash' | 'upi' | 'credit'
  const [notes, setNotes] = useState('');

  // Sync initial rates when shop state or mode changes
  useEffect(() => {
    setPisaiRate(shop.chakkiRates?.pisai || 4);
    setPiraiRate(shop.spellarRates?.pirai || 12);
    setKhariRate(shop.spellarRates?.khari || 35);
  }, [shop]);

  // Set initial customer if passed
  useEffect(() => {
    if (initialCustomerId) {
      const c = customers.find((cust) => cust.id === initialCustomerId);
      if (c) {
        setSelectedCustomerId(c.id);
        setCustomerSearch(c.name);
      }
    }
  }, [initialCustomerId, customers]);

  // Filter customers for autocomplete
  const filteredCustomers = useMemo(() => {
    if (!customerSearch.trim()) return customers.slice(0, 5); // show 5 recent
    const q = customerSearch.toLowerCase();
    return customers.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        (c.village && c.village.toLowerCase().includes(q)) ||
        (c.phone && c.phone.includes(q))
    );
  }, [customers, customerSearch]);

  const selectedCustomerObj = customers.find((c) => c.id === selectedCustomerId);

  // Calculate Chakki Kadda & Amounts
  const weightNum = parseFloat(inputWeight) || 0;

  // Kadda Calculation based on grain type
  const kaddaRatePerMann = useMemo(() => {
    const grainKey = grainType.toLowerCase();
    const kaddaMap = shop.chakkiRates?.kadda || { wheat: 1, dana: 1.5, maize: 1 };
    return kaddaMap[grainKey] !== undefined ? kaddaMap[grainKey] : 1;
  }, [grainType, shop.chakkiRates]);

  const kaddaPer = shop.chakkiRates?.kaddaPer || 40;
  const calculatedKadda = weightNum > 0 ? parseFloat(((weightNum / kaddaPer) * kaddaRatePerMann).toFixed(2)) : 0;
  const effectiveKadda = isKaddaOverridden && manualKadda !== '' ? parseFloat(manualKadda) || 0 : calculatedKadda;
  const outputWeight = weightNum > 0 ? Math.max(0, parseFloat((weightNum - effectiveKadda).toFixed(2))) : 0;
  const chakkiAmount = Math.round(weightNum * pisaiRate);

  // Spellar Pirai calculation
  const spellarPiraiAmount = Math.round(weightNum * piraiRate);

  // Spellar Khari sale calculation
  const khariSaleAmount = Math.round(weightNum * khariRate);

  // Owner stock amount
  const stockWeightNum = parseFloat(stockWeight) || 0;
  const stockRateNum = parseFloat(stockRate) || 0;
  const stockTotalAmount = Math.round(stockWeightNum * stockRateNum);

  // Auto-estimate Oil & Khali when weight changes in Spellar mode
  const handleSpellarWeightChange = (val) => {
    setInputWeight(val);
    const w = parseFloat(val) || 0;
    if (w > 0) {
      // Typically ~33% oil and ~62% khali from mustard seeds
      setOilOutput((w * 0.33).toFixed(1));
      setKhaliOutput((w * 0.62).toFixed(1));
    } else {
      setOilOutput('');
      setKhaliOutput('');
    }
  };

  // Inline New Customer Creation
  const handleCreateCustomer = (e) => {
    e.preventDefault();
    if (!newCustName.trim()) return;

    const created = addCustomer({
      name: newCustName.trim(),
      village: newCustVillage.trim(),
      phone: newCustPhone.trim()
    });

    setSelectedCustomerId(created.id);
    setCustomerSearch(created.name);
    setShowAddCustomerModal(false);
    setNewCustName('');
    setNewCustVillage('');
    setNewCustPhone('');
  };

  // Submit Handler
  const handleSave = (e) => {
    e.preventDefault();

    let targetCustId = selectedCustomerId;
    let targetCustName = selectedCustomerObj ? selectedCustomerObj.name : customerSearch.trim() || 'Cash Customer';
    let targetCustPhone = selectedCustomerObj ? selectedCustomerObj.phone : '';

    // 1. Chakki Mode Entry
    if (activeMode === 'chakki') {
      if (weightNum <= 0) {
        alert('Kripya valid vazan (weight) daalein!');
        return;
      }

      const boriData = {
        mode: 'chakki',
        type: 'pisai',
        customerId: targetCustId,
        customerName: targetCustName,
        customerPhone: targetCustPhone,
        grainType,
        inputWeight: weightNum,
        kaddaDeducted: effectiveKadda,
        outputWeight,
        rate: pisaiRate,
        amount: chakkiAmount,
        status,
        paymentMode,
        notes: notes.trim(),
        oilOutput: 0,
        khaliOutput: 0
      };

      addBori(boriData);
    }
    // 2. Spellar Mode Entry
    else {
      if (spellarSubMode === 'pirai') {
        if (weightNum <= 0) {
          alert('Kripya valid sarson vazan daalein!');
          return;
        }

        const boriData = {
          mode: 'spellar',
          type: 'pirai',
          customerId: targetCustId,
          customerName: targetCustName,
          customerPhone: targetCustPhone,
          grainType: 'Sarson',
          inputWeight: weightNum,
          kaddaDeducted: 0,
          outputWeight: 0,
          oilOutput: parseFloat(oilOutput) || 0,
          khaliOutput: parseFloat(khaliOutput) || 0,
          rate: piraiRate,
          amount: spellarPiraiAmount,
          status,
          paymentMode,
          notes: notes.trim()
        };

        addBori(boriData);
      } else if (spellarSubMode === 'khari_sale') {
        if (weightNum <= 0) {
          alert('Kripya valid khari vazan daalein!');
          return;
        }

        const boriData = {
          mode: 'spellar',
          type: 'khari_sale',
          customerId: targetCustId,
          customerName: targetCustName,
          customerPhone: targetCustPhone,
          grainType: 'Khali',
          inputWeight: weightNum,
          kaddaDeducted: 0,
          outputWeight: 0,
          oilOutput: 0,
          khaliOutput: 0,
          rate: khariRate,
          amount: khariSaleAmount,
          status: 'done', // direct sale is completed
          paymentMode,
          notes: notes.trim()
        };

        addBori(boriData);
      } else if (spellarSubMode === 'owner_stock') {
        if (stockWeightNum <= 0) {
          alert('Kripya valid quantity daalein!');
          return;
        }

        const stockData = {
          type: stockType,
          item:
            stockType === 'purchase'
              ? 'Sarson Seeds'
              : stockType === 'oil_sale'
              ? 'Mustard Oil'
              : 'Khali / Mustard Cake',
          weight: stockWeightNum,
          unit: stockType === 'oil_sale' ? 'litre' : 'kg',
          rate: stockRateNum,
          amount: stockTotalAmount,
          notes: stockNotes.trim()
        };

        addStockEntry(stockData);
      }
    }

    // Optional WhatsApp receipt share
    if (activeMode === 'chakki' || (activeMode === 'spellar' && spellarSubMode !== 'owner_stock')) {
      const finalAmount =
        activeMode === 'chakki'
          ? chakkiAmount
          : spellarSubMode === 'pirai'
          ? spellarPiraiAmount
          : khariSaleAmount;

      const shareText =
        `*${shop.name || 'Chakkibook'}* Slip\n` +
        `------------------------\n` +
        `Grahak: ${targetCustName}\n` +
        `Item: ${activeMode === 'chakki' ? `${grainType} Pisai` : spellarSubMode === 'pirai' ? 'Sarson Pirai' : 'Khali Bikri'}\n` +
        `Vazan: ${weightNum} kg\n` +
        (activeMode === 'chakki' ? `Kadda: ${effectiveKadda} kg | Atta: ${outputWeight} kg\n` : '') +
        (spellarSubMode === 'pirai' && oilOutput ? `Tel Nikla: ${oilOutput} L | Khali: ${khaliOutput} kg\n` : '') +
        `*Kul Rashi: ₹${finalAmount}*\n` +
        `Payment: ${paymentMode.toUpperCase()}\n` +
        `Status: ${status === 'done' ? 'Taiyar / Complete' : 'Bori Jama (Queue)'}\n` +
        `Dhanyawad!`;

      if (window.confirm('Entry Save ho gayi! Kya WhatsApp par slip bhejna chahte hain?')) {
        window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(shareText)}`, '_blank');
      }
    }

    setActiveTab('home');
  };

  return (
    <div className="app-container">
      {/* Header Banner */}
      <div className="section-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {activeMode === 'chakki' ? (
            <Scale size={18} style={{ color: 'var(--primary)' }} />
          ) : (
            <Droplets size={18} style={{ color: 'var(--primary)' }} />
          )}
          <span style={{ fontSize: '0.95rem', fontWeight: 800, color: 'var(--text-main)' }}>
            {activeMode === 'chakki' ? 'Nayi Bori Entry (Chakki)' : 'Nayi Entry (Spellar Mill)'}
          </span>
        </div>
        <span className="section-badge" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          {activeMode === 'chakki' ? <Wheat size={12} /> : <Droplet size={12} />}
          {activeMode.toUpperCase()}
        </span>
      </div>

      {/* Spellar Sub-Toggle if Spellar mode is active */}
      {activeMode === 'spellar' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px', marginBottom: '4px' }}>
          <button
            type="button"
            className={`pill-btn ${spellarSubMode === 'pirai' ? 'active' : ''}`}
            onClick={() => setSpellarSubMode('pirai')}
            style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
          >
            <Droplets size={15} />
            <span>Pirai</span>
          </button>
          <button
            type="button"
            className={`pill-btn ${spellarSubMode === 'khari_sale' ? 'active' : ''}`}
            onClick={() => setSpellarSubMode('khari_sale')}
            style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
          >
            <Package size={15} />
            <span>Khari Bikri</span>
          </button>
          <button
            type="button"
            className={`pill-btn ${spellarSubMode === 'owner_stock' ? 'active' : ''}`}
            onClick={() => setSpellarSubMode('owner_stock')}
            style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
          >
            <Warehouse size={15} />
            <span>Apna Stock</span>
          </button>
        </div>
      )}

      {/* Main Entry Form */}
      <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
        
        {/* Customer Search & Select (Not needed for Owner Stock) */}
        {!(activeMode === 'spellar' && spellarSubMode === 'owner_stock') && (
          <div className="card" style={{ position: 'relative', overflow: 'visible' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
              <label className="input-label" style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '6px' }}>
                <User size={15} style={{ color: 'var(--primary)' }} />
                <span>Grahak (Customer)</span>
              </label>
              <button
                type="button"
                className="section-badge"
                style={{ 
                  border: 'none', 
                  cursor: 'pointer', 
                  background: 'var(--primary-light)', 
                  color: 'var(--primary-dark)',
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '4px',
                  padding: '4px 10px' 
                }}
                onClick={() => setShowAddCustomerModal(true)}
              >
                <Plus size={13} />
                <span>Naya Grahak</span>
              </button>
            </div>

            <div style={{ position: 'relative' }}>
              <div style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', pointerEvents: 'none' }}>
                <Search size={16} />
              </div>
              <input
                type="text"
                className="form-input"
                style={{ paddingLeft: '40px', paddingRight: selectedCustomerObj ? '110px' : '14px' }}
                placeholder="Search grahak naam, phone, ya gaon..."
                value={customerSearch}
                onChange={(e) => {
                  setCustomerSearch(e.target.value);
                  setSelectedCustomerId('');
                  setShowDropdown(true);
                }}
                onFocus={() => setShowDropdown(true)}
              />

              {selectedCustomerObj && (
                <div
                  style={{
                    position: 'absolute',
                    right: '8px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    fontSize: '0.75rem',
                    background: selectedCustomerObj.balance > 0 ? 'var(--danger-bg)' : 'var(--success-bg)',
                    color: selectedCustomerObj.balance > 0 ? 'var(--danger)' : 'var(--success)',
                    padding: '3px 9px',
                    borderRadius: 'var(--radius-pill)',
                    fontWeight: 700,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px'
                  }}
                >
                  {selectedCustomerObj.balance > 0 ? (
                    <>
                      <ArrowUpRight size={13} />
                      <span>Udhar: ₹{selectedCustomerObj.balance}</span>
                    </>
                  ) : (
                    <>
                      <Check size={13} />
                      <span>Clear</span>
                    </>
                  )}
                </div>
              )}
            </div>

            {/* Autocomplete Dropdown */}
            {showDropdown && filteredCustomers.length > 0 && (
              <div
                style={{
                  position: 'absolute',
                  top: 'calc(100% + 4px)',
                  left: '0',
                  right: '0',
                  background: 'var(--bg-elevated)',
                  border: '1.5px solid var(--card-border)',
                  borderRadius: 'var(--radius-sm)',
                  boxShadow: 'var(--shadow-lg)',
                  zIndex: 60,
                  maxHeight: '220px',
                  overflowY: 'auto'
                }}
              >
                {filteredCustomers.map((cust) => (
                  <div
                    key={cust.id}
                    style={{
                      padding: '10px 14px',
                      borderBottom: '1px solid var(--card-border)',
                      cursor: 'pointer',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      transition: 'background-color 0.15s ease'
                    }}
                    onMouseDown={() => {
                      setSelectedCustomerId(cust.id);
                      setCustomerSearch(cust.name);
                      setShowDropdown(false);
                    }}
                  >
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <User size={14} style={{ color: 'var(--text-muted)' }} />
                        <strong style={{ fontSize: '0.95rem', color: 'var(--text-main)' }}>{cust.name}</strong>
                      </div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '10px', marginTop: '2px' }}>
                        <span style={{ display: 'flex', alignItems: 'center', gap: '3px' }}>
                          <MapPin size={11} /> {cust.village || 'Gaon'}
                        </span>
                        <span style={{ display: 'flex', alignItems: 'center', gap: '3px' }}>
                          <Phone size={11} /> {cust.phone || 'No phone'}
                        </span>
                      </div>
                    </div>
                    <div
                      style={{
                        fontSize: '0.85rem',
                        fontWeight: 800,
                        color: cust.balance > 0 ? 'var(--danger)' : 'var(--success)',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '2px'
                      }}
                    >
                      {cust.balance > 0 ? (
                        <>
                          <ArrowUpRight size={13} />
                          ₹{cust.balance}
                        </>
                      ) : (
                        <>
                          <Check size={13} />
                          ₹0
                        </>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* =================================================================
            CHAKKI MODE FORM
            ================================================================= */}
        {activeMode === 'chakki' && (
          <>
            {/* Grain Selector Pills */}
            <div className="card">
              <label className="input-label" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Wheat size={16} style={{ color: 'var(--primary)' }} />
                <span>Anaj (Grain Type)</span>
              </label>
              <div className="pill-grid">
                {[
                  { id: 'Wheat', label: 'Wheat (Gehun)', icon: Wheat },
                  { id: 'Dana', label: 'Dana', icon: Package },
                  { id: 'Maize', label: 'Maize (Makka)', icon: Scale },
                  { id: 'Multi-grain', label: 'Multi-grain', icon: Sparkles }
                ].map((g) => {
                  const Icon = g.icon;
                  return (
                    <button
                      type="button"
                      key={g.id}
                      className={`pill-btn ${grainType === g.id ? 'active' : ''}`}
                      onClick={() => {
                        setGrainType(g.id);
                        setIsKaddaOverridden(false);
                      }}
                      style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
                    >
                      <Icon size={15} />
                      <span>{g.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Big Vazan (Weight) Input */}
            <div className="hero-input-container">
              <div className="hero-input-label" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Scale size={16} />
                <span>Vazan / Weight (Kg)</span>
              </div>
              <input
                type="number"
                step="0.1"
                min="0.1"
                className="hero-input"
                placeholder="50"
                value={inputWeight}
                onChange={(e) => {
                  setInputWeight(e.target.value);
                  setIsKaddaOverridden(false);
                }}
                required
                autoFocus
              />
              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600 }}>
                Kilograms (kg)
              </span>

              {/* Quick Preset Weight Pills */}
              <div style={{ display: 'flex', gap: '6px', overflowX: 'auto', marginTop: '12px', justifyContent: 'center', width: '100%' }}>
                {[
                  { label: '10 kg', val: 10 },
                  { label: '20 kg', val: 20 },
                  { label: '40 kg (1 Mann)', val: 40 },
                  { label: '50 kg (Bori)', val: 50 },
                  { label: '80 kg (2 Mann)', val: 80 }
                ].map((p) => (
                  <button
                    key={p.val}
                    type="button"
                    onClick={() => {
                      setInputWeight(p.val.toString());
                      setIsKaddaOverridden(false);
                    }}
                    style={{
                      padding: '5px 12px',
                      borderRadius: 'var(--radius-pill)',
                      border: Number(inputWeight) === p.val ? '2px solid var(--primary)' : '1px solid var(--card-border)',
                      backgroundColor: Number(inputWeight) === p.val ? 'var(--primary)' : 'var(--bg-elevated)',
                      color: Number(inputWeight) === p.val ? '#ffffff' : 'var(--text-main)',
                      fontSize: '0.78rem',
                      fontWeight: '700',
                      cursor: 'pointer',
                      whiteSpace: 'nowrap',
                      transition: 'all 0.15s ease'
                    }}
                  >
                    {p.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Rate & Kadda Config Bar */}
            <div className="card" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div>
                <label className="input-label" style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                  <Coins size={14} style={{ color: 'var(--primary)' }} />
                  <span>Pisai Rate (₹/kg)</span>
                </label>
                <input
                  type="number"
                  step="0.5"
                  className="form-input"
                  value={pisaiRate}
                  onChange={(e) => setPisaiRate(parseFloat(e.target.value) || 0)}
                  required
                />
              </div>

              <div>
                <label className="input-label" style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                  <Scale size={14} style={{ color: 'var(--primary)' }} />
                  <span>Kadda ({kaddaRatePerMann}kg/{kaddaPer}kg)</span>
                </label>
                <input
                  type="number"
                  step="0.01"
                  className="form-input"
                  value={isKaddaOverridden ? manualKadda : calculatedKadda}
                  onChange={(e) => {
                    setManualKadda(e.target.value);
                    setIsKaddaOverridden(true);
                  }}
                  placeholder="Kadda kg"
                />
              </div>
            </div>

            {/* Auto-Calculation Box */}
            <div className="calc-summary-box">
              <div className="calc-row">
                <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Coins size={14} />
                  <span>Pisai Charge ({weightNum}kg @ ₹{pisaiRate}):</span>
                </span>
                <strong>₹ {chakkiAmount}</strong>
              </div>
              <div className="calc-row">
                <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Scale size={14} />
                  <span>Kadda Deducted:</span>
                </span>
                <strong>{effectiveKadda} kg</strong>
              </div>
              <div className="calc-row highlight">
                <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Package size={16} />
                  <span>Atta Returned (Grahak ko):</span>
                </span>
                <span className="big-number" style={{ fontSize: '1.4rem', color: 'var(--primary-dark)' }}>
                  {outputWeight} kg
                </span>
              </div>
            </div>

            {/* Status Selector: Bori Drop-off vs Done Now */}
            <div className="card">
              <label className="input-label" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Package size={15} style={{ color: 'var(--primary)' }} />
                <span>Bori Status</span>
              </label>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                <button
                  type="button"
                  className={`pill-btn ${status === 'pending' ? 'active' : ''}`}
                  onClick={() => setStatus('pending')}
                  style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
                >
                  <Package size={15} />
                  <span>Bori Jama (Queue)</span>
                </button>
                <button
                  type="button"
                  className={`pill-btn ${status === 'done' ? 'active' : ''}`}
                  onClick={() => setStatus('done')}
                  style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
                >
                  <Check size={15} />
                  <span>Abhi Pisai (Done)</span>
                </button>
              </div>
            </div>

            {/* Payment Mode Pills */}
            <div className="card">
              <label className="input-label" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Coins size={15} style={{ color: 'var(--primary)' }} />
                <span>Payment Mode</span>
              </label>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}>
                {[
                  { id: 'cash', label: 'Cash (Nokad)', icon: Coins },
                  { id: 'upi', label: 'UPI Online', icon: Phone },
                  { id: 'credit', label: 'Udhar (Dues)', icon: ArrowUpRight }
                ].map((m) => {
                  const Icon = m.icon;
                  return (
                    <button
                      type="button"
                      key={m.id}
                      className={`pill-btn ${paymentMode === m.id ? 'active' : ''}`}
                      onClick={() => setPaymentMode(m.id)}
                      style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
                    >
                      <Icon size={14} />
                      <span>{m.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Notes */}
            <input
              type="text"
              className="form-input"
              placeholder="Notes / Remark (Optional e.g. Mota Atta, Chokar, Urgent)"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </>
        )}

        {/* =================================================================
            SPELLAR MODE FORMS: PIRAI
            ================================================================= */}
        {activeMode === 'spellar' && spellarSubMode === 'pirai' && (
          <>
            {/* Sarson Vazan */}
            <div className="hero-input-container">
              <div className="hero-input-label" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Droplets size={16} />
                <span>Sarson Vazan / Weight (Kg)</span>
              </div>
              <input
                type="number"
                step="0.1"
                min="0.1"
                className="hero-input"
                placeholder="80"
                value={inputWeight}
                onChange={(e) => handleSpellarWeightChange(e.target.value)}
                required
                autoFocus
              />
              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600 }}>
                Mustard Seeds (kg)
              </span>
            </div>

            {/* Pirai Rate */}
            <div className="card">
              <label className="input-label" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Coins size={14} style={{ color: 'var(--primary)' }} />
                <span>Pirai Rate (₹/kg)</span>
              </label>
              <input
                type="number"
                step="0.5"
                className="form-input"
                value={piraiRate}
                onChange={(e) => setPiraiRate(parseFloat(e.target.value) || 0)}
                required
              />
            </div>

            {/* Oil & Khali Output Manual Inputs */}
            <div className="card" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div>
                <label className="input-label" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Droplet size={14} style={{ color: 'var(--primary)' }} />
                  <span>Tel Output (Litres)</span>
                </label>
                <input
                  type="number"
                  step="0.1"
                  className="form-input"
                  placeholder="e.g. 26.5"
                  value={oilOutput}
                  onChange={(e) => setOilOutput(e.target.value)}
                />
              </div>

              <div>
                <label className="input-label" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Package size={14} style={{ color: 'var(--primary)' }} />
                  <span>Khali Output (Kg)</span>
                </label>
                <input
                  type="number"
                  step="0.1"
                  className="form-input"
                  placeholder="e.g. 50"
                  value={khaliOutput}
                  onChange={(e) => setKhaliOutput(e.target.value)}
                />
              </div>
            </div>

            {/* Calculation Box */}
            <div className="calc-summary-box">
              <div className="calc-row highlight">
                <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Coins size={16} />
                  <span>Pirai Charge ({weightNum}kg @ ₹{piraiRate}):</span>
                </span>
                <span className="big-number" style={{ fontSize: '1.4rem', color: 'var(--primary-dark)' }}>
                  ₹ {spellarPiraiAmount}
                </span>
              </div>
            </div>

            {/* Status Selector */}
            <div className="card">
              <label className="input-label" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Package size={15} style={{ color: 'var(--primary)' }} />
                <span>Status</span>
              </label>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                <button
                  type="button"
                  className={`pill-btn ${status === 'pending' ? 'active' : ''}`}
                  onClick={() => setStatus('pending')}
                  style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
                >
                  <Package size={15} />
                  <span>Sarson Drop-off</span>
                </button>
                <button
                  type="button"
                  className={`pill-btn ${status === 'done' ? 'active' : ''}`}
                  onClick={() => setStatus('done')}
                  style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
                >
                  <Check size={15} />
                  <span>Pirai Ho Gayi (Done)</span>
                </button>
              </div>
            </div>

            {/* Payment Mode */}
            <div className="card">
              <label className="input-label" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Coins size={15} style={{ color: 'var(--primary)' }} />
                <span>Payment Mode</span>
              </label>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}>
                {[
                  { id: 'cash', label: 'Cash (Nokad)', icon: Coins },
                  { id: 'upi', label: 'UPI Online', icon: Phone },
                  { id: 'credit', label: 'Udhar (Dues)', icon: ArrowUpRight }
                ].map((m) => {
                  const Icon = m.icon;
                  return (
                    <button
                      type="button"
                      key={m.id}
                      className={`pill-btn ${paymentMode === m.id ? 'active' : ''}`}
                      onClick={() => setPaymentMode(m.id)}
                      style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
                    >
                      <Icon size={14} />
                      <span>{m.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            <input
              type="text"
              className="form-input"
              placeholder="Notes / Remarks"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </>
        )}

        {/* =================================================================
            SPELLAR: KHARI SELL SUBMODE
            ================================================================= */}
        {activeMode === 'spellar' && spellarSubMode === 'khari_sale' && (
          <>
            <div className="hero-input-container">
              <div className="hero-input-label" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Package size={16} />
                <span>Khali Vazan / Weight (Kg)</span>
              </div>
              <input
                type="number"
                step="0.5"
                min="0.5"
                className="hero-input"
                placeholder="20"
                value={inputWeight}
                onChange={(e) => setInputWeight(e.target.value)}
                required
                autoFocus
              />
              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600 }}>
                Mustard Cake / Khali (kg)
              </span>
            </div>

            <div className="card">
              <label className="input-label" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Coins size={14} style={{ color: 'var(--primary)' }} />
                <span>Khali Rate (₹/kg)</span>
              </label>
              <input
                type="number"
                step="0.5"
                className="form-input"
                value={khariRate}
                onChange={(e) => setKhariRate(parseFloat(e.target.value) || 0)}
                required
              />
            </div>

            <div className="calc-summary-box">
              <div className="calc-row highlight">
                <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Coins size={16} />
                  <span>Kul Rashi (Total Amount):</span>
                </span>
                <span className="big-number" style={{ fontSize: '1.4rem', color: 'var(--primary-dark)' }}>
                  ₹ {khariSaleAmount}
                </span>
              </div>
            </div>

            <div className="card">
              <label className="input-label" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Coins size={15} style={{ color: 'var(--primary)' }} />
                <span>Payment Mode</span>
              </label>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}>
                {[
                  { id: 'cash', label: 'Cash (Nokad)', icon: Coins },
                  { id: 'upi', label: 'UPI Online', icon: Phone },
                  { id: 'credit', label: 'Udhar (Dues)', icon: ArrowUpRight }
                ].map((m) => {
                  const Icon = m.icon;
                  return (
                    <button
                      type="button"
                      key={m.id}
                      className={`pill-btn ${paymentMode === m.id ? 'active' : ''}`}
                      onClick={() => setPaymentMode(m.id)}
                      style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
                    >
                      <Icon size={14} />
                      <span>{m.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            <input
              type="text"
              className="form-input"
              placeholder="Notes / Remarks"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </>
        )}

        {/* =================================================================
            SPELLAR: OWNER STOCK SUBMODE
            ================================================================= */}
        {activeMode === 'spellar' && spellarSubMode === 'owner_stock' && (
          <>
            <div className="card">
              <label className="input-label" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Warehouse size={16} style={{ color: 'var(--primary)' }} />
                <span>Stock Transaction Type</span>
              </label>
              <div className="pill-grid">
                {[
                  { id: 'purchase', label: 'Buy Sarson Seeds', icon: ShoppingCart },
                  { id: 'oil_sale', label: 'Sell Mustard Oil', icon: ArrowUpRight },
                  { id: 'khari_sale', label: 'Sell Khali Cake', icon: Package }
                ].map((s) => {
                  const Icon = s.icon;
                  return (
                    <button
                      type="button"
                      key={s.id}
                      className={`pill-btn ${stockType === s.id ? 'active' : ''}`}
                      onClick={() => {
                        setStockType(s.id);
                        if (s.id === 'purchase') setStockRate(55);
                        else if (s.id === 'oil_sale') setStockRate(140);
                        else setStockRate(35);
                      }}
                      style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
                    >
                      <Icon size={14} />
                      <span>{s.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="hero-input-container">
              <div className="hero-input-label" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Scale size={16} />
                <span>{stockType === 'oil_sale' ? 'Tel Quantity (Litres)' : 'Vazan / Weight (Kg)'}</span>
              </div>
              <input
                type="number"
                step="0.5"
                min="0.5"
                className="hero-input"
                placeholder="100"
                value={stockWeight}
                onChange={(e) => setStockWeight(e.target.value)}
                required
                autoFocus
              />
            </div>

            <div className="card">
              <label className="input-label" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Coins size={14} style={{ color: 'var(--primary)' }} />
                <span>Rate (₹/{stockType === 'oil_sale' ? 'Litre' : 'Kg'})</span>
              </label>
              <input
                type="number"
                step="0.5"
                className="form-input"
                value={stockRate}
                onChange={(e) => setStockRate(parseFloat(e.target.value) || 0)}
                required
              />
            </div>

            <div className="calc-summary-box">
              <div className="calc-row highlight">
                <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Coins size={16} />
                  <span>Total Transaction Amount:</span>
                </span>
                <span className="big-number" style={{ fontSize: '1.4rem', color: 'var(--primary-dark)' }}>
                  ₹ {stockTotalAmount}
                </span>
              </div>
            </div>

            <input
              type="text"
              className="form-input"
              placeholder="Vendor / Mandi / Notes"
              value={stockNotes}
              onChange={(e) => setStockNotes(e.target.value)}
            />
          </>
        )}

        {/* SINGLE BIG SAVE BUTTON AT BOTTOM */}
        <button 
          type="submit" 
          className="big-btn" 
          style={{ 
            marginTop: '8px', 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center', 
            gap: '10px' 
          }}
        >
          <Check size={20} />
          <span>SAVE ENTRY</span>
        </button>
      </form>

      {/* Inline Modal to Add New Customer */}
      {showAddCustomerModal && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0,0,0,0.65)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: '16px'
          }}
        >
          <div className="card" style={{ width: '100%', maxWidth: '420px', background: 'var(--bg-elevated)', boxShadow: 'var(--shadow-lg)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
              <h3 style={{ fontSize: '1.15rem', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                <UserPlus size={18} style={{ color: 'var(--primary)' }} />
                <span>Naya Grahak Add Karein</span>
              </h3>
              <button
                type="button"
                onClick={() => setShowAddCustomerModal(false)}
                style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: '4px' }}
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleCreateCustomer} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div>
                <label className="input-label" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <User size={14} style={{ color: 'var(--primary)' }} />
                  <span>Grahak ka Naam (Required)</span>
                </label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="e.g. Ramprasad"
                  value={newCustName}
                  onChange={(e) => setNewCustName(e.target.value)}
                  required
                  autoFocus
                />
              </div>

              <div>
                <label className="input-label" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <MapPin size={14} style={{ color: 'var(--primary)' }} />
                  <span>Gaon / Village (Optional)</span>
                </label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="e.g. Rampur, Ward 2"
                  value={newCustVillage}
                  onChange={(e) => setNewCustVillage(e.target.value)}
                />
              </div>

              <div>
                <label className="input-label" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Phone size={14} style={{ color: 'var(--primary)' }} />
                  <span>Mobile Number (Auto-SMS & WhatsApp)</span>
                </label>
                <input
                  type="tel"
                  className="form-input"
                  placeholder="e.g. 9812345678"
                  value={newCustPhone}
                  onChange={(e) => setNewCustPhone(e.target.value)}
                />
              </div>

              <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
                <button 
                  type="submit" 
                  className="big-btn" 
                  style={{ height: '48px', minHeight: '48px', flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
                >
                  <Check size={16} />
                  <span>Grahak Jodein</span>
                </button>
                <button
                  type="button"
                  className="btn-secondary-action"
                  style={{ height: '48px', minHeight: '48px', width: 'auto', padding: '0 16px', display: 'flex', alignItems: 'center', gap: '6px' }}
                  onClick={() => setShowAddCustomerModal(false)}
                >
                  <X size={16} />
                  <span>Cancel</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
