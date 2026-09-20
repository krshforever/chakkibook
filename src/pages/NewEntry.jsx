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
  Droplets, 
  Droplet, 
  Wheat, 
  X, 
  Share2, 
  ShoppingCart, 
  UserPlus,
  Copy,
  FileText,
  Calculator,
  Clock
} from 'lucide-react';
import { useStore } from '../store/useStore';
import { useTranslation } from '../utils/translations';
import GaonSelector from '../components/GaonSelector';

export default function NewEntry({ setActiveTab, initialCustomerId }) {
  const { t } = useTranslation();
  const activeMode = useStore((state) => state.activeMode || 'chakki');
  const setActiveMode = useStore((state) => state.setActiveMode);
  const shop = useStore((state) => state.shop || {});
  const customers = useStore((state) => state.customers || []);
  const getVillages = useStore((state) => state.getVillages);
  const addCustomer = useStore((state) => state.addCustomer);
  const addBori = useStore((state) => state.addBori);
  const addStockEntry = useStore((state) => state.addStockEntry);

  // Operation Selector: 'chakki' | 'spellar' | 'khari_sale' | 'owner_stock'
  const [operationMode, setOperationMode] = useState(
    activeMode === 'spellar' ? 'spellar' : 'chakki'
  );

  // Customer Selection & Creation
  const [selectedCustomerId, setSelectedCustomerId] = useState(initialCustomerId || '');
  const [customerSearch, setCustomerSearch] = useState('');
  const [selectedVillageFilter, setSelectedVillageFilter] = useState('all');
  const [showDropdown, setShowDropdown] = useState(false);
  const [showAddCustomerModal, setShowAddCustomerModal] = useState(false);
  const [newCustName, setNewCustName] = useState('');
  const [newCustVillage, setNewCustVillage] = useState('');
  const [newCustPhone, setNewCustPhone] = useState('');

  // Chakki Fields
  const [grainType, setGrainType] = useState('Gehun');
  const [outputType, setOutputType] = useState('Atta');
  const [inputWeight, setInputWeight] = useState('');
  const [pisaiRate, setPisaiRate] = useState(shop.chakkiRates?.grainRates?.gehun || shop.chakkiRates?.pisai || 4);
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

  // Shared Entry Status & Payment
  const [status, setStatus] = useState('pending'); // 'pending' | 'done'
  const [paymentMode, setPaymentMode] = useState('cash'); // 'cash' | 'upi' | 'credit'
  const [notes, setNotes] = useState('');

  // Receipt Copy Feedback
  const [copiedReceipt, setCopiedReceipt] = useState(false);

  // Sync rates when shop state changes
  useEffect(() => {
    if (operationMode === 'chakki') {
      const key = grainType.toLowerCase();
      const grainKey = key === 'wheat' ? 'gehun' : key === 'maize' ? 'makka' : key;
      const r = shop.chakkiRates?.grainRates?.[grainKey] ?? shop.chakkiRates?.pisai ?? 4;
      setPisaiRate(r);
    }
    setPiraiRate(shop.spellarRates?.pirai || 12);
    setKhariRate(shop.spellarRates?.khari || 35);
  }, [shop, grainType, operationMode]);

  // Set initial customer if passed from prop
  useEffect(() => {
    if (initialCustomerId) {
      const c = customers.find((cust) => cust.id === initialCustomerId);
      if (c) {
        setSelectedCustomerId(c.id);
        setCustomerSearch(c.name);
      }
    }
  }, [initialCustomerId, customers]);

  // Switch Operation Mode Handler
  const handleOperationModeChange = (mode) => {
    setOperationMode(mode);
    if (mode === 'chakki') {
      setActiveMode('chakki');
    } else {
      setActiveMode('spellar');
    }
  };

  // 1-Tap Primary Grain Change Handler
  const handleGrainChange = (newGrainId) => {
    setGrainType(newGrainId);
    setIsKaddaOverridden(false);
    setManualKadda('');

    const key = newGrainId.toLowerCase();
    const grainKey = key === 'wheat' ? 'gehun' : key === 'maize' ? 'makka' : key;
    const defaultRate = shop.chakkiRates?.grainRates?.[grainKey] ?? shop.chakkiRates?.pisai ?? 4;
    setPisaiRate(defaultRate);

    // Contextual output label: if Chana, set default output to Atta (which renders as Besan)
    if (newGrainId === 'Chana' && outputType !== 'Atta' && outputType !== 'Dana' && outputType !== 'Mota Dana') {
      setOutputType('Atta');
    }
  };

  // Filter customers for autocomplete with village filtering
  const filteredCustomers = useMemo(() => {
    let list = customers;
    if (selectedVillageFilter && selectedVillageFilter !== 'all') {
      const vTarget = selectedVillageFilter.trim().toLowerCase();
      list = list.filter((c) => (c.village || '').trim().toLowerCase() === vTarget);
    }
    if (!customerSearch.trim()) return list.slice(0, 6);
    const q = customerSearch.toLowerCase();
    return list.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        (c.village && c.village.toLowerCase().includes(q)) ||
        (c.phone && c.phone.includes(q))
    );
  }, [customers, customerSearch, selectedVillageFilter]);

  const selectedCustomerObj = customers.find((c) => c.id === selectedCustomerId);

  // Calculations for Chakki Mode
  const weightNum = parseFloat(inputWeight) || 0;

  // Kadda Calculation per Mann (40kg)
  const kaddaRatePerMann = useMemo(() => {
    const key = grainType.toLowerCase();
    const grainKey = key === 'wheat' ? 'gehun' : key === 'maize' ? 'makka' : key;
    const kaddaMap = shop.chakkiRates?.kadda || { 
      gehun: 1, 
      bajra: 1, 
      makka: 1.25, 
      chana: 1.5, 
      wheat: 1, 
      dana: 1.5, 
      maize: 1.25,
      multigrain: 1.25 
    };
    return kaddaMap[grainKey] !== undefined ? kaddaMap[grainKey] : (kaddaMap[key] !== undefined ? kaddaMap[key] : 1);
  }, [grainType, shop.chakkiRates]);

  const kaddaPer = shop.chakkiRates?.kaddaPer || 40;
  const calculatedKadda = weightNum > 0 ? parseFloat(((weightNum / kaddaPer) * kaddaRatePerMann).toFixed(2)) : 0;
  const effectiveKadda = isKaddaOverridden && manualKadda !== '' ? parseFloat(manualKadda) || 0 : calculatedKadda;
  const outputWeight = weightNum > 0 ? Math.max(0, parseFloat((weightNum - effectiveKadda).toFixed(2))) : 0;
  const chakkiAmount = Math.round(weightNum * pisaiRate);

  // Spellar Pirai & Khari Amounts
  const spellarPiraiAmount = Math.round(weightNum * piraiRate);
  const khariSaleAmount = Math.round(weightNum * khariRate);

  // Owner Stock Amount
  const stockWeightNum = parseFloat(stockWeight) || 0;
  const stockRateNum = parseFloat(stockRate) || 0;
  const stockTotalAmount = Math.round(stockWeightNum * stockRateNum);

  // Auto-estimate Oil & Khali for Spellar Mode
  const handleSpellarWeightChange = (val) => {
    setInputWeight(val);
    const w = parseFloat(val) || 0;
    if (w > 0) {
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

    if (created) {
      setSelectedCustomerId(created.id);
      setCustomerSearch(created.name);
    }
    setShowAddCustomerModal(false);
    setNewCustName('');
    setNewCustVillage('');
    setNewCustPhone('');
  };

  // Display Output Label
  const getDisplayOutputLabel = (type) => {
    if (type === 'Atta') {
      return grainType === 'Chana' ? t('outputTypes.besan') : t('outputTypes.atta');
    }
    if (type === 'Dana') return t('outputTypes.dana');
    if (type === 'Mota Dana') return t('outputTypes.motaDana');
    return type;
  };

  // Plain-Text WhatsApp Receipt Builder
  const whatsappReceiptText = useMemo(() => {
    const custName = selectedCustomerObj ? selectedCustomerObj.name : customerSearch.trim() || 'Cash Customer';
    const custVillage = selectedCustomerObj?.village || '';
    const shopName = shop.name || 'Vanshu Atta Chakki & Oil Mill';

    let itemDesc = '';
    let totalAmt = 0;

    if (operationMode === 'chakki') {
      const outLabel = getDisplayOutputLabel(outputType);
      itemDesc = `${grainType} (${outLabel})`;
      totalAmt = chakkiAmount;
    } else if (operationMode === 'spellar') {
      itemDesc = 'Sarson Pirai';
      totalAmt = spellarPiraiAmount;
    } else if (operationMode === 'khari_sale') {
      itemDesc = 'Khali Bikri';
      totalAmt = khariSaleAmount;
    } else {
      itemDesc = `Stock: ${stockType === 'purchase' ? 'Sarson Seeds Purchase' : stockType === 'oil_sale' ? 'Mustard Oil Sale' : 'Khali Sale'}`;
      totalAmt = stockTotalAmount;
    }

    let text = `*${shopName}*\n`;
    text += `Parchi / Order Receipt\n`;
    text += `------------------------\n`;
    text += `Grahak: ${custName}${custVillage ? ` (${custVillage})` : ''}\n`;
    text += `Item: ${itemDesc}\n`;
    text += `Kacha Vazan: ${operationMode === 'owner_stock' ? stockWeightNum : weightNum} kg\n`;

    if (operationMode === 'chakki') {
      text += `Kadda Deduction: ${effectiveKadda} kg\n`;
      text += `Net Nikla: ${outputWeight} kg (${getDisplayOutputLabel(outputType)})\n`;
      text += `Rate: ₹${pisaiRate} /kg\n`;
    } else if (operationMode === 'spellar') {
      if (oilOutput) text += `Tel Nikla: ${oilOutput} Litres | Khali: ${khaliOutput} kg\n`;
      text += `Rate: ₹${piraiRate} /kg\n`;
    } else if (operationMode === 'khari_sale') {
      text += `Rate: ₹${khariRate} /kg\n`;
    }

    text += `*Kul Rashi: ₹${totalAmt}*\n`;
    text += `Payment Mode: ${paymentMode.toUpperCase()}\n`;
    text += `Status: ${status === 'done' ? 'Complete / Ready' : 'Pending Queue (Bori Jama)'}\n`;
    text += `------------------------\n`;
    text += `Dhanyawad!`;

    return text;
  }, [
    operationMode,
    selectedCustomerObj,
    customerSearch,
    shop.name,
    grainType,
    outputType,
    chakkiAmount,
    spellarPiraiAmount,
    khariSaleAmount,
    stockType,
    stockTotalAmount,
    stockWeightNum,
    weightNum,
    effectiveKadda,
    outputWeight,
    pisaiRate,
    oilOutput,
    khaliOutput,
    piraiRate,
    khariRate,
    paymentMode,
    status
  ]);

  // Handle WhatsApp Direct Action
  const handleOpenWhatsApp = () => {
    const custPhone = selectedCustomerObj?.phone || '';
    const cleanPhone = custPhone.replace(/\D/g, '');
    let url = `https://api.whatsapp.com/send?text=${encodeURIComponent(whatsappReceiptText)}`;
    if (cleanPhone.length >= 10) {
      const phoneWithCountry = cleanPhone.length === 10 ? `91${cleanPhone}` : cleanPhone;
      url = `https://api.whatsapp.com/send?phone=${phoneWithCountry}&text=${encodeURIComponent(whatsappReceiptText)}`;
    }
    window.open(url, '_blank');
  };

  // Copy Receipt Handler
  const handleCopyReceipt = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(whatsappReceiptText);
      setCopiedReceipt(true);
      setTimeout(() => setCopiedReceipt(false), 2000);
    }
  };

  // Save Order Submit Handler
  const handleSave = (e) => {
    e.preventDefault();

    let targetCustId = selectedCustomerId;
    let targetCustName = selectedCustomerObj ? selectedCustomerObj.name : customerSearch.trim() || 'Cash Customer';
    let targetCustPhone = selectedCustomerObj ? selectedCustomerObj.phone : '';

    // 1. Chakki Mode Entry
    if (operationMode === 'chakki') {
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
        customerVillage: selectedCustomerObj?.village || '',
        grainType,
        outputType,
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
    // 2. Spellar Pressing Mode Entry
    else if (operationMode === 'spellar') {
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
        customerVillage: selectedCustomerObj?.village || '',
        grainType: 'Sarson',
        outputType: 'Tel',
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
    }
    // 3. Khari Sale Mode Entry
    else if (operationMode === 'khari_sale') {
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
        customerVillage: selectedCustomerObj?.village || '',
        grainType: 'Khali',
        outputType: 'Khali',
        inputWeight: weightNum,
        kaddaDeducted: 0,
        outputWeight: 0,
        oilOutput: 0,
        khaliOutput: 0,
        rate: khariRate,
        amount: khariSaleAmount,
        status: 'done',
        paymentMode,
        notes: notes.trim()
      };

      addBori(boriData);
    }
    // 4. Owner Stock Entry
    else if (operationMode === 'owner_stock') {
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

    // Direct Prompt for WhatsApp Receipt Sharing
    if (operationMode !== 'owner_stock') {
      if (window.confirm('Entry Save ho gayi! Kya WhatsApp par receipt slip bhejna chahte hain?')) {
        handleOpenWhatsApp();
      }
    }

    setActiveTab('home');
  };

  return (
    <div className="app-container" style={{ paddingBottom: '32px' }}>
      {/* 1. Mode & Operation Segmented Selector Bar */}
      <div className="card" style={{ padding: '8px', marginBottom: '14px' }}>
        <div style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--text-muted)', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
          Select Mill Operation
        </div>
        <div
          role="tablist"
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(4, 1fr)',
            gap: '6px',
            backgroundColor: 'var(--bg-main)',
            padding: '4px',
            borderRadius: 'var(--radius-md)',
            border: '1px solid var(--card-border)'
          }}
        >
          {[
            { id: 'chakki', label: t('newEntry.modeChakki') || 'Chakki', icon: Wheat },
            { id: 'spellar', label: t('newEntry.modeSpellar') || 'Spellar', icon: Droplets },
            { id: 'khari_sale', label: t('newEntry.modeKhari') || 'Khari Sale', icon: Package },
            { id: 'owner_stock', label: t('newEntry.modeStock') || 'Mill Stock', icon: Warehouse }
          ].map((op) => {
            const Icon = op.icon;
            const isSelected = operationMode === op.id;
            return (
              <button
                key={op.id}
                type="button"
                role="tab"
                aria-selected={isSelected}
                onClick={() => handleOperationModeChange(op.id)}
                style={{
                  minHeight: '46px',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '2px',
                  padding: '6px 2px',
                  borderRadius: 'var(--radius-sm)',
                  border: isSelected ? '1.5px solid var(--primary)' : '1px solid transparent',
                  backgroundColor: isSelected ? 'var(--primary)' : 'transparent',
                  color: isSelected ? '#ffffff' : 'var(--text-main)',
                  fontWeight: isSelected ? 800 : 600,
                  fontSize: '0.72rem',
                  cursor: 'pointer',
                  transition: 'all 0.15s cubic-bezier(0.4, 0, 0.2, 1)',
                  boxShadow: isSelected ? '0 3px 10px rgba(217, 119, 6, 0.3)' : 'none'
                }}
              >
                <Icon size={16} strokeWidth={isSelected ? 2.5 : 2} />
                <span style={{ textAlign: 'center', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden', width: '100%' }}>
                  {op.label}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Entry Form */}
      <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
        
        {/* 2. Customer Search & Selection (Hidden for Owner Stock) */}
        {operationMode !== 'owner_stock' && (
          <div className="card" style={{ position: 'relative', overflow: 'visible' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
              <label className="input-label" style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '6px' }}>
                <User size={15} style={{ color: 'var(--primary)' }} />
                <span>{t('newEntry.customerLabel')}</span>
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
                  padding: '4px 10px',
                  borderRadius: 'var(--radius-pill)',
                  fontWeight: 700,
                  fontSize: '0.78rem'
                }}
                onClick={() => setShowAddCustomerModal(true)}
              >
                <Plus size={13} />
                <span>{t('newEntry.newCustomer')}</span>
              </button>
            </div>

            {/* Gaon Quick Filter Bar */}
            <div style={{ marginBottom: '10px' }}>
              <GaonSelector
                selectedVillage={selectedVillageFilter}
                onSelectVillage={(v) => {
                  setSelectedVillageFilter(v);
                  setSelectedCustomerId('');
                  setCustomerSearch('');
                }}
                badgeType="customers"
                allLabel={t('common.allVillages')}
              />
            </div>

            <div style={{ position: 'relative' }}>
              <div style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', pointerEvents: 'none' }}>
                <Search size={16} />
              </div>
              <input
                type="text"
                className="form-input"
                style={{ paddingLeft: '40px', paddingRight: selectedCustomerObj ? '120px' : '14px' }}
                placeholder={t('newEntry.customerSearchPlaceholder')}
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
                      <span>{t('newEntry.duesAlert')} ₹{selectedCustomerObj.balance}</span>
                    </>
                  ) : (
                    <>
                      <Check size={13} />
                      <span>{t('newEntry.clearAlert')}</span>
                    </>
                  )}
                </div>
              )}
            </div>

            {/* Customer Autocomplete Dropdown */}
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
                        <User size={14} style={{ color: 'var(--primary)' }} />
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
            CHAKKI GRINDING MODE
            ================================================================= */}
        {operationMode === 'chakki' && (
          <>
            {/* 3. 1-Tap Primary Grain Cards */}
            <div className="card">
              <label className="input-label" style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px' }}>
                <Wheat size={16} style={{ color: 'var(--primary)' }} />
                <span>{t('newEntry.selectGrain')}</span>
              </label>
              <div className="pill-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(95px, 1fr))', gap: '8px' }}>
                {[
                  { id: 'Gehun', label: t('grainNames.gehun') || 'Gehun', icon: Wheat, rate: shop.chakkiRates?.grainRates?.gehun || 4, kadda: 1 },
                  { id: 'Bajra', label: t('grainNames.bajra') || 'Bajra', icon: Scale, rate: shop.chakkiRates?.grainRates?.bajra || 4.5, kadda: 1 },
                  { id: 'Makka', label: t('grainNames.makka') || 'Makka', icon: Scale, rate: shop.chakkiRates?.grainRates?.makka || 4.5, kadda: 1.25 },
                  { id: 'Chana', label: t('grainNames.chana') || 'Chana', icon: Package, rate: shop.chakkiRates?.grainRates?.chana || 5.5, kadda: 1.5 },
                  { id: 'Multigrain', label: t('grainNames.multigrain') || 'Multigrain', icon: Sparkles, rate: shop.chakkiRates?.grainRates?.multigrain || 5, kadda: 1.25 }
                ].map((g) => {
                  const Icon = g.icon;
                  const isSelected = grainType === g.id;
                  return (
                    <button
                      type="button"
                      key={g.id}
                      className={`pill-btn ${isSelected ? 'active' : ''}`}
                      onClick={() => handleGrainChange(g.id)}
                      style={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '3px',
                        minHeight: '62px',
                        padding: '8px 4px',
                        borderRadius: 'var(--radius-md)',
                        border: isSelected ? '2px solid var(--primary)' : '1.5px solid var(--card-border)',
                        backgroundColor: isSelected ? 'var(--primary)' : 'var(--bg-elevated)',
                        color: isSelected ? '#ffffff' : 'var(--text-main)',
                        boxShadow: isSelected ? '0 4px 14px rgba(217,119,6,0.3)' : 'none',
                        transition: 'all 0.15s cubic-bezier(0.4, 0, 0.2, 1)'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <Icon size={16} strokeWidth={2.5} />
                        <span style={{ fontSize: '0.86rem', fontWeight: 800 }}>{g.label}</span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.7rem', opacity: isSelected ? 0.95 : 0.7, fontWeight: 700 }}>
                        <span>₹{g.rate}/kg</span>
                        <span>•</span>
                        <span>{g.kadda}kg kadda</span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 4. 1-Tap Milling Output Segment */}
            <div className="card">
              <label className="input-label" style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px' }}>
                <Package size={16} style={{ color: 'var(--primary)' }} />
                <span>{t('newEntry.selectOutput')}</span>
              </label>
              <div className="pill-grid" style={{ gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}>
                {[
                  { id: 'Atta', label: grainType === 'Chana' ? (t('outputTypes.besan') || 'Besan') : (t('outputTypes.atta') || 'Atta'), sub: grainType === 'Chana' ? 'Gram Flour' : 'Fine Flour', icon: Wheat },
                  { id: 'Dana', label: t('outputTypes.dana') || 'Dana', sub: 'Animal Feed', icon: Package },
                  { id: 'Mota Dana', label: t('outputTypes.motaDana') || 'Mota Dana', sub: 'Coarse Daliya', icon: Scale }
                ].map((o) => {
                  const Icon = o.icon;
                  const isSelected = outputType === o.id;
                  return (
                    <button
                      type="button"
                      key={o.id}
                      className={`pill-btn ${isSelected ? 'active' : ''}`}
                      onClick={() => setOutputType(o.id)}
                      style={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '2px',
                        minHeight: '54px',
                        padding: '6px 4px',
                        borderRadius: 'var(--radius-md)',
                        border: isSelected ? '2px solid var(--primary)' : '1.5px solid var(--card-border)',
                        backgroundColor: isSelected ? 'var(--primary)' : 'var(--bg-elevated)',
                        color: isSelected ? '#ffffff' : 'var(--text-main)',
                        boxShadow: isSelected ? '0 3px 10px rgba(0,0,0,0.1)' : 'none',
                        transition: 'all 0.15s cubic-bezier(0.4, 0, 0.2, 1)'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                        <Icon size={15} />
                        <span style={{ fontSize: '0.85rem', fontWeight: 800 }}>{o.label}</span>
                      </div>
                      <span style={{ fontSize: '0.68rem', opacity: isSelected ? 0.9 : 0.6, fontWeight: 600 }}>
                        {o.sub}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 5. Quick Weight Presets & Weight Input */}
            <div className="hero-input-container">
              <div className="hero-input-label" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Scale size={16} />
                <span>{t('newEntry.weightLabel')}</span>
              </div>
              <input
                type="number"
                step="0.1"
                min="0.1"
                className="hero-input"
                placeholder={t('newEntry.weightPlaceholder')}
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

              {/* 1-Tap Quick Weight Chips */}
              <div style={{ display: 'flex', gap: '6px', overflowX: 'auto', marginTop: '12px', justifyContent: 'center', width: '100%', paddingBottom: '2px' }}>
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
                      padding: '6px 14px',
                      borderRadius: 'var(--radius-pill)',
                      border: Number(inputWeight) === p.val ? '2px solid var(--primary)' : '1px solid var(--card-border)',
                      backgroundColor: Number(inputWeight) === p.val ? 'var(--primary)' : 'var(--bg-elevated)',
                      color: Number(inputWeight) === p.val ? '#ffffff' : 'var(--text-main)',
                      fontSize: '0.8rem',
                      fontWeight: '700',
                      cursor: 'pointer',
                      whiteSpace: 'nowrap',
                      transition: 'all 0.15s ease',
                      boxShadow: Number(inputWeight) === p.val ? '0 3px 8px rgba(217,119,6,0.3)' : 'none'
                    }}
                  >
                    {p.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Pisai Rate & Kadda Config Bar */}
            <div className="card" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div>
                <label className="input-label" style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                  <Coins size={14} style={{ color: 'var(--primary)' }} />
                  <span>{t('newEntry.rateLabel')}</span>
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

            {/* 6. Live Bill Breakdown Card */}
            <div className="card" style={{ background: 'var(--bg-elevated)', border: '2px solid var(--primary-light)', borderRadius: 'var(--radius-md)', padding: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px', borderBottom: '1px solid var(--card-border)', paddingBottom: '8px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 800, fontSize: '0.95rem', color: 'var(--text-main)' }}>
                  <Calculator size={18} style={{ color: 'var(--primary)' }} />
                  <span>Live Bill Breakdown</span>
                </div>
                <span style={{ fontSize: '0.75rem', fontWeight: 700, padding: '2px 8px', borderRadius: 'var(--radius-pill)', background: 'var(--primary-light)', color: 'var(--primary-dark)' }}>
                  {grainType} • {getDisplayOutputLabel(outputType)}
                </span>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '0.88rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-muted)' }}>
                  <span>{t('newEntry.grossWeight') || 'Gross Weight'}:</span>
                  <strong style={{ color: 'var(--text-main)' }}>{weightNum} kg</strong>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-muted)' }}>
                  <span>{t('newEntry.kaddaDeduction') || 'Kadda Deduction'}:</span>
                  <strong style={{ color: 'var(--danger)' }}>- {effectiveKadda} kg</strong>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '6px 0', borderTop: '1px dashed var(--card-border)' }}>
                  <span style={{ fontWeight: 700, color: 'var(--text-main)' }}>
                    {t('newEntry.netReturned') || 'Net Returned'} ({getDisplayOutputLabel(outputType)}):
                  </span>
                  <strong style={{ fontSize: '1.1rem', color: 'var(--primary-dark)', fontWeight: 800 }}>
                    {outputWeight} kg
                  </strong>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-muted)' }}>
                  <span>Pisai Rate:</span>
                  <span>₹{pisaiRate} / kg</span>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 12px', background: 'var(--primary-light)', borderRadius: 'var(--radius-sm)', marginTop: '4px' }}>
                  <span style={{ fontWeight: 800, color: 'var(--primary-dark)', fontSize: '0.95rem' }}>
                    {t('newEntry.totalBill') || 'Total Bill Amount'}:
                  </span>
                  <span style={{ fontSize: '1.4rem', fontWeight: 900, color: 'var(--primary-dark)' }}>
                    ₹ {chakkiAmount}
                  </span>
                </div>
              </div>
            </div>

            {/* Bori Queue / Order Status Selector */}
            <div className="card">
              <label className="input-label" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Package size={15} style={{ color: 'var(--primary)' }} />
                <span>{t('newEntry.boriStatus')}</span>
              </label>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                <button
                  type="button"
                  className={`pill-btn ${status === 'pending' ? 'active' : ''}`}
                  onClick={() => setStatus('pending')}
                  style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
                >
                  <Clock size={15} />
                  <span>{t('newEntry.boriQueue')}</span>
                </button>
                <button
                  type="button"
                  className={`pill-btn ${status === 'done' ? 'active' : ''}`}
                  onClick={() => setStatus('done')}
                  style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
                >
                  <Check size={15} />
                  <span>{t('newEntry.abhiPisai')}</span>
                </button>
              </div>
            </div>

            {/* Payment Mode Segmented Selector */}
            <div className="card">
              <label className="input-label" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Coins size={15} style={{ color: 'var(--primary)' }} />
                <span>{t('newEntry.paymentMode')}</span>
              </label>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}>
                {[
                  { id: 'cash', label: t('common.cash'), icon: Coins },
                  { id: 'upi', label: t('common.upi'), icon: Phone },
                  { id: 'credit', label: t('common.credit'), icon: ArrowUpRight }
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
              placeholder={t('newEntry.notesPlaceholder')}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </>
        )}

        {/* =================================================================
            SPELLAR PRESSING MODE
            ================================================================= */}
        {operationMode === 'spellar' && (
          <>
            {/* Sarson Input Weight */}
            <div className="hero-input-container">
              <div className="hero-input-label" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Droplets size={16} />
                <span>{t('newEntry.sarsonWeight')}</span>
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

              {/* Quick Weight Chips for Spellar */}
              <div style={{ display: 'flex', gap: '6px', overflowX: 'auto', marginTop: '12px', justifyContent: 'center', width: '100%', paddingBottom: '2px' }}>
                {[
                  { label: '20 kg', val: 20 },
                  { label: '40 kg (1 Mann)', val: 40 },
                  { label: '80 kg (2 Mann)', val: 80 },
                  { label: '100 kg', val: 100 },
                  { label: '200 kg', val: 200 }
                ].map((p) => (
                  <button
                    key={p.val}
                    type="button"
                    onClick={() => handleSpellarWeightChange(p.val.toString())}
                    style={{
                      padding: '6px 14px',
                      borderRadius: 'var(--radius-pill)',
                      border: Number(inputWeight) === p.val ? '2px solid var(--primary)' : '1.5px solid var(--card-border)',
                      backgroundColor: Number(inputWeight) === p.val ? 'var(--primary)' : 'var(--bg-elevated)',
                      color: Number(inputWeight) === p.val ? '#ffffff' : 'var(--text-main)',
                      fontSize: '0.8rem',
                      fontWeight: '700',
                      cursor: 'pointer',
                      whiteSpace: 'nowrap'
                    }}
                  >
                    {p.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Pirai Rate */}
            <div className="card">
              <label className="input-label" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Coins size={14} style={{ color: 'var(--primary)' }} />
                <span>{t('newEntry.piraiRate')}</span>
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

            {/* Oil & Khali Output Estimations */}
            <div className="card" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div>
                <label className="input-label" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Droplet size={14} style={{ color: 'var(--primary)' }} />
                  <span>{t('newEntry.telOutput')}</span>
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
                  <span>{t('newEntry.khaliOutput')}</span>
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

            {/* Live Bill Card for Spellar Pirai */}
            <div className="card" style={{ background: 'var(--bg-elevated)', border: '2px solid var(--primary-light)', borderRadius: 'var(--radius-md)', padding: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
                <span style={{ fontWeight: 800, color: 'var(--text-main)', fontSize: '0.95rem' }}>
                  {t('newEntry.piraiCharge')}
                </span>
                <span style={{ fontSize: '1.4rem', fontWeight: 900, color: 'var(--primary-dark)' }}>
                  ₹ {spellarPiraiAmount}
                </span>
              </div>
              {oilOutput && khaliOutput && (
                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'flex', gap: '12px' }}>
                  <span>Tel Output: <strong>{oilOutput} L</strong></span>
                  <span>•</span>
                  <span>Khali: <strong>{khaliOutput} kg</strong></span>
                </div>
              )}
            </div>

            {/* Status & Payment Mode */}
            <div className="card">
              <label className="input-label" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Package size={15} style={{ color: 'var(--primary)' }} />
                <span>{t('newEntry.boriStatus')}</span>
              </label>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                <button
                  type="button"
                  className={`pill-btn ${status === 'pending' ? 'active' : ''}`}
                  onClick={() => setStatus('pending')}
                  style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
                >
                  <Clock size={15} />
                  <span>{t('newEntry.sarsonDropoff')}</span>
                </button>
                <button
                  type="button"
                  className={`pill-btn ${status === 'done' ? 'active' : ''}`}
                  onClick={() => setStatus('done')}
                  style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
                >
                  <Check size={15} />
                  <span>{t('newEntry.piraiDone')}</span>
                </button>
              </div>
            </div>

            <div className="card">
              <label className="input-label" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Coins size={15} style={{ color: 'var(--primary)' }} />
                <span>{t('newEntry.paymentMode')}</span>
              </label>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}>
                {[
                  { id: 'cash', label: t('common.cash'), icon: Coins },
                  { id: 'upi', label: t('common.upi'), icon: Phone },
                  { id: 'credit', label: t('common.credit'), icon: ArrowUpRight }
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
              placeholder={t('common.remarks')}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </>
        )}

        {/* =================================================================
            KHARI SALE MODE
            ================================================================= */}
        {operationMode === 'khari_sale' && (
          <>
            <div className="hero-input-container">
              <div className="hero-input-label" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Package size={16} />
                <span>{t('newEntry.khaliWeight')}</span>
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

              {/* Quick Weight Chips */}
              <div style={{ display: 'flex', gap: '6px', overflowX: 'auto', marginTop: '12px', justifyContent: 'center', width: '100%', paddingBottom: '2px' }}>
                {[
                  { label: '10 kg', val: 10 },
                  { label: '20 kg', val: 20 },
                  { label: '40 kg (1 Mann)', val: 40 },
                  { label: '50 kg (Bori)', val: 50 }
                ].map((p) => (
                  <button
                    key={p.val}
                    type="button"
                    onClick={() => setInputWeight(p.val.toString())}
                    style={{
                      padding: '6px 14px',
                      borderRadius: 'var(--radius-pill)',
                      border: Number(inputWeight) === p.val ? '2px solid var(--primary)' : '1.5px solid var(--card-border)',
                      backgroundColor: Number(inputWeight) === p.val ? 'var(--primary)' : 'var(--bg-elevated)',
                      color: Number(inputWeight) === p.val ? '#ffffff' : 'var(--text-main)',
                      fontSize: '0.8rem',
                      fontWeight: '700',
                      cursor: 'pointer',
                      whiteSpace: 'nowrap'
                    }}
                  >
                    {p.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="card">
              <label className="input-label" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Coins size={14} style={{ color: 'var(--primary)' }} />
                <span>{t('newEntry.khaliRate')}</span>
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

            {/* Live Bill Card for Khari Sale */}
            <div className="card" style={{ background: 'var(--bg-elevated)', border: '2px solid var(--primary-light)', borderRadius: 'var(--radius-md)', padding: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontWeight: 800, color: 'var(--text-main)', fontSize: '0.95rem' }}>
                  {t('newEntry.totalAmount')}
                </span>
                <span style={{ fontSize: '1.4rem', fontWeight: 900, color: 'var(--primary-dark)' }}>
                  ₹ {khariSaleAmount}
                </span>
              </div>
            </div>

            <div className="card">
              <label className="input-label" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Coins size={15} style={{ color: 'var(--primary)' }} />
                <span>{t('newEntry.paymentMode')}</span>
              </label>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}>
                {[
                  { id: 'cash', label: t('common.cash'), icon: Coins },
                  { id: 'upi', label: t('common.upi'), icon: Phone },
                  { id: 'credit', label: t('common.credit'), icon: ArrowUpRight }
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
              placeholder={t('common.remarks')}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </>
        )}

        {/* =================================================================
            OWNER STOCK MODE
            ================================================================= */}
        {operationMode === 'owner_stock' && (
          <>
            <div className="card">
              <label className="input-label" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Warehouse size={16} style={{ color: 'var(--primary)' }} />
                <span>{t('newEntry.stockType')}</span>
              </label>
              <div className="pill-grid">
                {[
                  { id: 'purchase', label: t('newEntry.buySarson'), icon: ShoppingCart },
                  { id: 'oil_sale', label: t('newEntry.sellOil'), icon: ArrowUpRight },
                  { id: 'khari_sale', label: t('newEntry.sellKhali'), icon: Package }
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
                <span>{stockType === 'oil_sale' ? 'Tel Quantity (Litres)' : t('newEntry.stockWeight')}</span>
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
                <span>{t('newEntry.stockRate')}</span>
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

            {/* Live Bill Card for Owner Stock */}
            <div className="card" style={{ background: 'var(--bg-elevated)', border: '2px solid var(--primary-light)', borderRadius: 'var(--radius-md)', padding: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontWeight: 800, color: 'var(--text-main)', fontSize: '0.95rem' }}>
                  Total Transaction Amount:
                </span>
                <span style={{ fontSize: '1.4rem', fontWeight: 900, color: 'var(--primary-dark)' }}>
                  ₹ {stockTotalAmount}
                </span>
              </div>
            </div>

            <input
              type="text"
              className="form-input"
              placeholder={t('newEntry.vendorNotes')}
              value={stockNotes}
              onChange={(e) => setStockNotes(e.target.value)}
            />
          </>
        )}

        {/* 7. WhatsApp Receipt Generator Preview & Action Bar */}
        {operationMode !== 'owner_stock' && (
          <div className="card" style={{ background: 'var(--bg-elevated)', border: '1.5px solid var(--card-border)', borderRadius: 'var(--radius-md)', padding: '14px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 800, fontSize: '0.88rem', color: 'var(--text-main)' }}>
                <FileText size={16} style={{ color: '#25D366' }} />
                <span>{t('newEntry.whatsappReceipt') || 'WhatsApp Receipt Generator'}</span>
              </div>
              <button
                type="button"
                onClick={handleCopyReceipt}
                style={{
                  background: 'transparent',
                  border: '1px solid var(--card-border)',
                  borderRadius: 'var(--radius-pill)',
                  padding: '4px 10px',
                  fontSize: '0.75rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  color: copiedReceipt ? 'var(--success)' : 'var(--text-main)'
                }}
              >
                {copiedReceipt ? <Check size={13} /> : <Copy size={13} />}
                <span>{copiedReceipt ? 'Copied!' : 'Copy Text'}</span>
              </button>
            </div>

            {/* Formatted Plain Text Receipt Display Box */}
            <pre
              style={{
                fontFamily: 'monospace, monospace',
                fontSize: '0.78rem',
                backgroundColor: 'var(--bg-main)',
                padding: '10px 12px',
                borderRadius: 'var(--radius-sm)',
                border: '1px solid var(--card-border)',
                whiteSpace: 'pre-wrap',
                margin: 0,
                color: 'var(--text-main)',
                lineHeight: '1.45'
              }}
            >
              {whatsappReceiptText}
            </pre>

            <button
              type="button"
              onClick={handleOpenWhatsApp}
              style={{
                marginTop: '10px',
                width: '100%',
                padding: '10px 14px',
                borderRadius: 'var(--radius-sm)',
                border: 'none',
                backgroundColor: '#25D366',
                color: '#ffffff',
                fontWeight: 800,
                fontSize: '0.85rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                boxShadow: '0 3px 10px rgba(37, 211, 102, 0.3)'
              }}
            >
              <Share2 size={16} />
              <span>{t('newEntry.shareWhatsapp') || 'Share WhatsApp Receipt'}</span>
            </button>
          </div>
        )}

        {/* Single Primary Save Button */}
        <button 
          type="submit" 
          className="big-btn" 
          style={{ 
            marginTop: '8px', 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center', 
            gap: '10px',
            fontSize: '1.05rem',
            fontWeight: 800
          }}
        >
          <Check size={22} strokeWidth={3} />
          <span>{t('newEntry.saveEntry')}</span>
        </button>
      </form>

      {/* 8. Customer Quick Add Modal */}
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
              <h3 style={{ fontSize: '1.1rem', margin: 0, display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 800 }}>
                <UserPlus size={18} style={{ color: 'var(--primary)' }} />
                <span>{t('newEntry.addCustomerTitle')}</span>
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
                  <span>{t('newEntry.custNameLabel')}</span>
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
                  <span>{t('newEntry.custVillageLabel')}</span>
                </label>
                {/* 1-Tap Existing Village Chips */}
                {getVillages && getVillages().length > 0 && (
                  <div style={{ display: 'flex', gap: '6px', overflowX: 'auto', marginBottom: '8px', paddingBottom: '2px' }}>
                    {getVillages().map((v) => {
                      const isSelected = newCustVillage.trim().toLowerCase() === v.name.toLowerCase();
                      return (
                        <button
                          key={v.name}
                          type="button"
                          onClick={() => setNewCustVillage(v.name)}
                          style={{
                            padding: '4px 10px',
                            borderRadius: 'var(--radius-pill)',
                            border: isSelected ? '1.5px solid var(--primary)' : '1px solid var(--card-border)',
                            backgroundColor: isSelected ? 'var(--primary-light)' : 'var(--bg-elevated)',
                            color: isSelected ? 'var(--primary-dark)' : 'var(--text-main)',
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
                  className="form-input"
                  placeholder="e.g. Rampur, Ward 2"
                  value={newCustVillage}
                  onChange={(e) => setNewCustVillage(e.target.value)}
                />
              </div>

              <div>
                <label className="input-label" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Phone size={14} style={{ color: 'var(--primary)' }} />
                  <span>{t('newEntry.custPhoneLabel')}</span>
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
                  <span>{t('newEntry.saveCustomer')}</span>
                </button>
                <button
                  type="button"
                  className="btn-secondary-action"
                  style={{ height: '48px', minHeight: '48px', width: 'auto', padding: '0 16px', display: 'flex', alignItems: 'center', gap: '6px' }}
                  onClick={() => setShowAddCustomerModal(false)}
                >
                  <X size={16} />
                  <span>{t('common.cancel')}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
