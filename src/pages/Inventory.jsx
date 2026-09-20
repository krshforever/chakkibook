import React, { useState } from 'react';
import { 
  Package, 
  ShoppingCart, 
  Plus, 
  AlertTriangle, 
  Check, 
  RefreshCw, 
  Coins, 
  Scale, 
  History, 
  Sliders, 
  X, 
  Droplet, 
  Wheat, 
  CheckCircle2, 
  TrendingUp,
  Calculator,
  Flame,
  Layers,
  ArrowRight,
  Truck,
  Building2,
  Receipt,
  Sparkles,
  ShieldCheck
} from 'lucide-react';
import { useStore } from '../store/useStore';
import { useTranslation } from '../utils/translations';

export default function Inventory() {
  const { t } = useTranslation();
  const inventory = useStore((state) => state.inventory || []);
  const updateStock = useStore((state) => state.updateStock);
  const addInventoryItem = useStore((state) => state.addInventoryItem);
  const stockEntries = useStore((state) => state.stockEntries || []);
  const addStockEntry = useStore((state) => state.addStockEntry);
  const hasPermission = useStore((state) => state.hasPermission);
  const shop = useStore((state) => state.shop || {});

  const [activeSubTab, setActiveSubTab] = useState('stock'); // 'stock' | 'mandi' | 'spellar' | 'add'
  const [stockFilter, setStockFilter] = useState('all'); // 'all' | 'low'
  const [selectedItem, setSelectedItem] = useState(null);
  const [qtyChange, setQtyChange] = useState('');
  
  // New Item State
  const [newItemName, setNewItemName] = useState('');
  const [newItemCategory, setNewItemCategory] = useState('seed');
  const [newItemStock, setNewItemStock] = useState('');
  const [newItemUnit, setNewItemUnit] = useState('kg');
  const [newItemAlert, setNewItemAlert] = useState('20');
  const [newItemPrice, setNewItemPrice] = useState('');

  // Mandi Purchase Batch Recorder State
  const [mandiSupplier, setMandiSupplier] = useState('');
  const [mandiItem, setMandiItem] = useState('Sarson Seeds');
  const [mandiQuintals, setMandiQuintals] = useState('');
  const [mandiRatePerQuintal, setMandiRatePerQuintal] = useState('');
  const [mandiNotes, setMandiNotes] = useState('');

  // Spellar Yield Calculator State
  const [sarsonInputKg, setSarsonInputKg] = useState('100');
  const [oilRatio, setOilRatio] = useState('0.33'); // 33% yield (0.33 L/kg)
  const [khaliRatio, setKhaliRatio] = useState('0.65'); // 65% yield (0.65 kg/kg)
  const [yieldNotice, setYieldNotice] = useState(false);

  // Helper calculations for Mandi Purchase
  const mandiWeightKg = (Number(mandiQuintals) || 0) * 100;
  const mandiTotalBill = (Number(mandiQuintals) || 0) * (Number(mandiRatePerQuintal) || 0);
  const mandiEffectiveRatePerKg = Number(mandiQuintals) > 0 ? (Number(mandiRatePerQuintal) / 100) : 0;

  // Helper calculations for Spellar Yield
  const sarsonKgNum = Number(sarsonInputKg) || 0;
  const expectedOilLitre = Math.round(sarsonKgNum * (Number(oilRatio) || 0.33) * 10) / 10;
  const expectedKhaliKg = Math.round(sarsonKgNum * (Number(khaliRatio) || 0.65) * 10) / 10;
  const pressingRate = shop.spellarRates?.pirai || 12;
  const khaliRate = shop.spellarRates?.khari || 35;
  const estimatedPressingCharge = sarsonKgNum * pressingRate;
  const estimatedOutputValuation = (expectedOilLitre * 140) + (expectedKhaliKg * khaliRate);

  const handleStockUpdate = (e) => {
    e.preventDefault();
    if (!selectedItem || !qtyChange) return;
    updateStock(selectedItem.id, Number(qtyChange));
    setQtyChange('');
    setSelectedItem(null);
  };

  const handleCreateItem = async (e) => {
    e.preventDefault();
    if (!newItemName || !newItemStock) return;
    await addInventoryItem({
      name: newItemName,
      category: newItemCategory,
      stock: Number(newItemStock),
      unit: newItemUnit,
      lowAlert: Number(newItemAlert),
      pricePerUnit: Number(newItemPrice) || 0
    });
    setNewItemName('');
    setNewItemStock('');
    setNewItemPrice('');
    setActiveSubTab('stock');
  };

  const handleMandiPurchase = (e) => {
    e.preventDefault();
    if (!mandiQuintals || !mandiRatePerQuintal) return;

    // Find or target inventory item for Sarson/Wheat
    let targetInvId = 'inv1';
    if (mandiItem.toLowerCase().includes('wheat')) targetInvId = 'inv4';
    
    addStockEntry({
      type: 'purchase',
      item: mandiItem,
      supplier: mandiSupplier.trim() || 'Mandi Trader',
      weight: mandiWeightKg,
      quintals: Number(mandiQuintals),
      ratePerQuintal: Number(mandiRatePerQuintal),
      unit: 'kg',
      rate: mandiEffectiveRatePerKg,
      amount: mandiTotalBill,
      notes: mandiNotes || `Mandi Batch: ${mandiQuintals} Quintals @ ₹${mandiRatePerQuintal}/Qtl`
    });

    setMandiSupplier('');
    setMandiQuintals('');
    setMandiRatePerQuintal('');
    setMandiNotes('');
    setActiveSubTab('stock');
  };

  const handleRecordPressingYield = (e) => {
    e.preventDefault();
    if (sarsonKgNum <= 0) return;

    // Deduct Sarson seeds (inv1)
    const sarsonItem = inventory.find(i => i.id === 'inv1' || i.category === 'seed');
    if (sarsonItem) {
      updateStock(sarsonItem.id, -sarsonKgNum);
    }

    // Increase Mustard Oil (inv2)
    const oilItem = inventory.find(i => i.id === 'inv2' || i.category === 'oil');
    if (oilItem) {
      updateStock(oilItem.id, expectedOilLitre);
    }

    // Increase Khali Cake (inv3)
    const khaliItem = inventory.find(i => i.id === 'inv3' || i.category === 'khari');
    if (khaliItem) {
      updateStock(khaliItem.id, expectedKhaliKg);
    }

    setYieldNotice(true);
    setTimeout(() => setYieldNotice(false), 4000);
  };

  // Godown Stock Valuation Breakdown
  const getItemValuation = (item) => {
    const estRate = item.pricePerUnit || (item.category === 'seed' ? 55 : item.category === 'oil' ? 140 : item.category === 'khari' ? 35 : 40);
    return item.stock * estRate;
  };

  const totalValuation = inventory.reduce((acc, item) => acc + getItemValuation(item), 0);
  
  const sarsonValuation = inventory
    .filter(i => i.category === 'seed' || i.name.toLowerCase().includes('sarson'))
    .reduce((acc, item) => acc + getItemValuation(item), 0);

  const oilValuation = inventory
    .filter(i => i.category === 'oil' || i.name.toLowerCase().includes('oil') || i.name.toLowerCase().includes('tel'))
    .reduce((acc, item) => acc + getItemValuation(item), 0);

  const khaliValuation = inventory
    .filter(i => i.category === 'khari' || i.name.toLowerCase().includes('khali') || i.name.toLowerCase().includes('cake'))
    .reduce((acc, item) => acc + getItemValuation(item), 0);

  const grainsValuation = Math.max(0, totalValuation - (sarsonValuation + oilValuation + khaliValuation));

  const lowStockItems = inventory.filter(i => i.stock <= i.lowAlert);
  const lowStockCount = lowStockItems.length;

  const displayedInventory = stockFilter === 'low' ? lowStockItems : inventory;

  return (
    <div className="app-container">
      {/* GODOWN STOCK VALUATION BANNER */}
      <div 
        className="card" 
        style={{ 
          background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)', 
          color: '#ffffff', 
          padding: '18px', 
          marginBottom: '10px', 
          borderRadius: 'var(--radius)', 
          border: '1px solid rgba(255,255,255,0.12)',
          boxShadow: '0 4px 14px rgba(0,0,0,0.15)'
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
              <Building2 size={16} style={{ color: '#fbbf24' }} />
              <span style={{ fontSize: '0.78rem', textTransform: 'uppercase', color: '#94a3b8', letterSpacing: '0.06em', fontWeight: 800 }}>
                {t('inventory.title')}
              </span>
            </div>
            <h2 style={{ fontSize: '1.8rem', margin: '4px 0 2px 0', color: '#fbbf24', fontWeight: 900, letterSpacing: '-0.02em' }}>
              ₹ {totalValuation.toLocaleString('en-IN')}
            </h2>
            <div style={{ fontSize: '0.76rem', color: '#cbd5e1', fontWeight: 600 }}>
              {t('inventory.totalValuation')}
            </div>
          </div>

          <div style={{ textAlign: 'right' }}>
            {lowStockCount > 0 ? (
              <div 
                style={{ 
                  background: 'rgba(239, 68, 68, 0.22)', 
                  border: '1.5px solid #ef4444',
                  color: '#f87171', 
                  fontSize: '0.78rem', 
                  padding: '6px 12px', 
                  borderRadius: 'var(--radius-pill)', 
                  fontWeight: 800,
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px'
                }}
              >
                <AlertTriangle size={14} />
                <span>{lowStockCount} {t('inventory.lowStock')}</span>
              </div>
            ) : (
              <div 
                style={{ 
                  background: 'rgba(16, 185, 129, 0.22)', 
                  border: '1.5px solid #10b981',
                  color: '#34d399', 
                  fontSize: '0.78rem', 
                  padding: '6px 12px', 
                  borderRadius: 'var(--radius-pill)', 
                  fontWeight: 800,
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px'
                }}
              >
                <ShieldCheck size={14} />
                <span>{t('inventory.healthyStock')}</span>
              </div>
            )}
          </div>
        </div>

        {/* Commodity Valuation Matrix Chips */}
        <div 
          style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(3, 1fr)', 
            gap: '8px', 
            marginTop: '16px',
            borderTop: '1px solid rgba(255,255,255,0.1)',
            paddingTop: '12px'
          }}
        >
          <div style={{ background: 'rgba(255,255,255,0.06)', padding: '8px 10px', borderRadius: '0.5rem', border: '1px solid rgba(255,255,255,0.08)' }}>
            <div style={{ fontSize: '0.7rem', color: '#94a3b8', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <Wheat size={12} style={{ color: '#f59e0b' }} />
              <span>{t('inventory.sarsonValuation')}</span>
            </div>
            <strong style={{ fontSize: '0.92rem', color: '#ffffff', fontWeight: 800 }}>
              ₹ {sarsonValuation.toLocaleString('en-IN')}
            </strong>
          </div>

          <div style={{ background: 'rgba(255,255,255,0.06)', padding: '8px 10px', borderRadius: '0.5rem', border: '1px solid rgba(255,255,255,0.08)' }}>
            <div style={{ fontSize: '0.7rem', color: '#94a3b8', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <Droplet size={12} style={{ color: '#3b82f6' }} />
              <span>{t('inventory.oilValuation')}</span>
            </div>
            <strong style={{ fontSize: '0.92rem', color: '#ffffff', fontWeight: 800 }}>
              ₹ {oilValuation.toLocaleString('en-IN')}
            </strong>
          </div>

          <div style={{ background: 'rgba(255,255,255,0.06)', padding: '8px 10px', borderRadius: '0.5rem', border: '1px solid rgba(255,255,255,0.08)' }}>
            <div style={{ fontSize: '0.7rem', color: '#94a3b8', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <Flame size={12} style={{ color: '#10b981' }} />
              <span>{t('inventory.khaliValuation')}</span>
            </div>
            <strong style={{ fontSize: '0.92rem', color: '#ffffff', fontWeight: 800 }}>
              ₹ {khaliValuation.toLocaleString('en-IN')}
            </strong>
          </div>
        </div>
      </div>

      {/* Navigation Sub-Tabs */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '6px' }}>
        <button
          type="button"
          className={`pill-btn ${activeSubTab === 'stock' ? 'active' : ''}`}
          onClick={() => setActiveSubTab('stock')}
          style={{ minHeight: '42px', fontSize: '0.78rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px', padding: '4px 6px' }}
        >
          <Package size={14} />
          <span>{t('inventory.stockOverview')}</span>
        </button>

        <button
          type="button"
          className={`pill-btn ${activeSubTab === 'mandi' ? 'active' : ''}`}
          onClick={() => setActiveSubTab('mandi')}
          style={{ minHeight: '42px', fontSize: '0.78rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px', padding: '4px 6px' }}
        >
          <ShoppingCart size={14} />
          <span>{t('inventory.mandiPurchase')}</span>
        </button>

        <button
          type="button"
          className={`pill-btn ${activeSubTab === 'spellar' ? 'active' : ''}`}
          onClick={() => setActiveSubTab('spellar')}
          style={{ minHeight: '42px', fontSize: '0.78rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px', padding: '4px 6px' }}
        >
          <Calculator size={14} />
          <span>Yield Calc</span>
        </button>

        <button
          type="button"
          className={`pill-btn ${activeSubTab === 'add' ? 'active' : ''}`}
          onClick={() => setActiveSubTab('add')}
          style={{ minHeight: '42px', fontSize: '0.78rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px', padding: '4px 6px' }}
        >
          <Plus size={14} />
          <span>{t('inventory.newItem')}</span>
        </button>
      </div>

      {/* SUB-TAB 1: GODOWN STOCK OVERVIEW & ALERTS */}
      {activeSubTab === 'stock' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {/* Stock Filter Switcher */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '4px 2px' }}>
            <span style={{ fontSize: '0.82rem', fontWeight: 800, color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Layers size={15} style={{ color: 'var(--primary)' }} />
              <span>{t('inventory.stockOverview')} ({displayedInventory.length})</span>
            </span>

            <div style={{ display: 'flex', gap: '6px' }}>
              <button
                type="button"
                className={`pill-btn ${stockFilter === 'all' ? 'active' : ''}`}
                onClick={() => setStockFilter('all')}
                style={{ minHeight: '32px', height: '32px', padding: '0 10px', fontSize: '0.75rem' }}
              >
                All Stock
              </button>
              <button
                type="button"
                className={`pill-btn ${stockFilter === 'low' ? 'active' : ''}`}
                onClick={() => setStockFilter('low')}
                style={{ 
                  minHeight: '32px', 
                  height: '32px', 
                  padding: '0 10px', 
                  fontSize: '0.75rem',
                  borderColor: lowStockCount > 0 ? '#ef4444' : undefined,
                  color: lowStockCount > 0 ? '#ef4444' : undefined
                }}
              >
                Low Stock ({lowStockCount})
              </button>
            </div>
          </div>

          {displayedInventory.map((item) => {
            const isLow = item.stock <= item.lowAlert;
            const isCritical = item.stock <= item.lowAlert * 0.5;
            const estRate = item.pricePerUnit || (item.category === 'seed' ? 55 : item.category === 'oil' ? 140 : item.category === 'khari' ? 35 : 40);
            const value = item.stock * estRate;

            const safeCapacity = Math.max(item.lowAlert * 2.5, item.stock, 50);
            const progressPercent = Math.min(100, Math.max(5, Math.round((item.stock / safeCapacity) * 100)));
            const barColor = isCritical ? '#ef4444' : isLow ? '#f59e0b' : '#10b981';

            return (
              <div
                key={item.id}
                className="card"
                style={{
                  borderLeft: isLow ? '5px solid #ef4444' : '5px solid #10b981',
                  background: 'var(--card-bg)',
                  padding: '14px 16px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '10px'
                }}
              >
                {/* Header row */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <h3 style={{ fontSize: '1.05rem', margin: 0, fontWeight: 800, color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      {item.category === 'oil' ? (
                        <Droplet size={17} style={{ color: '#3b82f6' }} />
                      ) : item.category === 'khari' ? (
                        <Flame size={17} style={{ color: '#10b981' }} />
                      ) : (
                        <Wheat size={17} style={{ color: '#f59e0b' }} />
                      )}
                      <span>{item.name}</span>
                    </h3>
                    <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', display: 'flex', gap: '8px', alignItems: 'center', marginTop: '3px' }}>
                      <span style={{ textTransform: 'capitalize' }}>Category: {item.category}</span>
                      <span>•</span>
                      <span>Market Value: ₹{value.toLocaleString('en-IN')}</span>
                    </div>
                  </div>

                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '1.35rem', fontWeight: 900, color: isLow ? '#ef4444' : 'var(--text-main)' }}>
                      {item.stock} <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-muted)' }}>{item.unit}</span>
                    </div>
                    {hasPermission('adjustStock') && (
                      <button
                        type="button"
                        className="btn-secondary-action"
                        onClick={() => setSelectedItem(item)}
                        style={{ 
                          padding: '4px 10px', 
                          fontSize: '0.76rem', 
                          marginTop: '4px', 
                          width: 'auto',
                          height: '30px',
                          minHeight: '30px',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px',
                          borderRadius: '0.5rem'
                        }}
                      >
                        <RefreshCw size={12} />
                        <span>{t('inventory.stockAdjust')}</span>
                      </button>
                    )}
                  </div>
                </div>

                {/* Stock Reorder Progress Bar Section */}
                <div style={{ marginTop: '2px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.75rem', marginBottom: '4px' }}>
                    <span style={{ color: isLow ? '#ef4444' : 'var(--text-muted)', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '4px' }}>
                      {isLow ? (
                        <>
                          <AlertTriangle size={13} style={{ color: '#ef4444' }} />
                          <span>{t('inventory.reorderWarning')} (Alert: {item.lowAlert} {item.unit})</span>
                        </>
                      ) : (
                        <>
                          <CheckCircle2 size={13} style={{ color: '#10b981' }} />
                          <span>{t('inventory.healthyStock')} (Alert Limit: {item.lowAlert} {item.unit})</span>
                        </>
                      )}
                    </span>
                    <span style={{ fontWeight: 800, color: barColor }}>
                      {progressPercent}% Stock
                    </span>
                  </div>

                  {/* Visual Bar Track */}
                  <div 
                    style={{ 
                      position: 'relative',
                      width: '100%', 
                      height: '8px', 
                      backgroundColor: 'rgba(0,0,0,0.08)', 
                      borderRadius: 'var(--radius-pill)', 
                      overflow: 'hidden' 
                    }}
                  >
                    <div 
                      style={{ 
                        height: '100%', 
                        width: `${progressPercent}%`, 
                        backgroundColor: barColor, 
                        borderRadius: 'var(--radius-pill)',
                        transition: 'width 0.4s cubic-bezier(0.4, 0, 0.2, 1)' 
                      }} 
                    />
                  </div>
                </div>
              </div>
            );
          })}

          {/* Quick Stock Adjustment Card */}
          {selectedItem && (
            <div 
              className="card" 
              style={{ 
                border: '2px solid var(--primary)', 
                background: 'var(--bg-elevated)', 
                padding: '16px', 
                borderRadius: 'var(--radius)',
                boxShadow: 'var(--shadow-lg)'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Sliders size={16} style={{ color: 'var(--primary)' }} />
                  <h4 style={{ fontSize: '1rem', margin: 0, fontWeight: 800 }}>
                    {t('inventory.adjustStockTitle')} {selectedItem.name}
                  </h4>
                </div>
                <span style={{ fontSize: '0.85rem', fontWeight: 800, color: 'var(--primary)' }}>
                  {t('inventory.current')} {selectedItem.stock} {selectedItem.unit}
                </span>
              </div>
              
              <form onSubmit={handleStockUpdate} style={{ display: 'flex', gap: '10px', flexDirection: 'column' }}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '6px' }}>
                  <button 
                    type="button" 
                    className="pill-btn" 
                    onClick={() => setQtyChange('+50')}
                    style={{ minHeight: '36px', fontSize: '0.78rem' }}
                  >
                    +50 {selectedItem.unit}
                  </button>
                  <button 
                    type="button" 
                    className="pill-btn" 
                    onClick={() => setQtyChange('+100')}
                    style={{ minHeight: '36px', fontSize: '0.78rem' }}
                  >
                    +100 {selectedItem.unit}
                  </button>
                  <button 
                    type="button" 
                    className="pill-btn" 
                    onClick={() => setQtyChange('-20')}
                    style={{ minHeight: '36px', fontSize: '0.78rem' }}
                  >
                    -20 {selectedItem.unit}
                  </button>
                  <button 
                    type="button" 
                    className="pill-btn" 
                    onClick={() => setQtyChange('-50')}
                    style={{ minHeight: '36px', fontSize: '0.78rem' }}
                  >
                    -50 {selectedItem.unit}
                  </button>
                </div>

                <div style={{ display: 'flex', gap: '8px' }}>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="e.g. +50 or -20"
                    value={qtyChange}
                    onChange={(e) => setQtyChange(e.target.value)}
                    required
                    autoFocus
                  />
                  <button 
                    type="submit" 
                    className="big-btn" 
                    style={{ width: 'auto', padding: '0 16px', minHeight: '48px', height: '48px', whiteSpace: 'nowrap', display: 'flex', alignItems: 'center', gap: '5px' }}
                  >
                    <Check size={16} />
                    <span>{t('inventory.save')}</span>
                  </button>
                  <button 
                    type="button" 
                    className="btn-secondary-action" 
                    onClick={() => setSelectedItem(null)} 
                    style={{ width: 'auto', padding: '0 14px', minHeight: '48px', height: '48px', display: 'flex', alignItems: 'center', gap: '4px' }}
                  >
                    <X size={16} />
                    <span>{t('inventory.cancel')}</span>
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>
      )}

      {/* SUB-TAB 2: MANDI PURCHASE BATCH RECORDER */}
      {activeSubTab === 'mandi' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div className="card" style={{ padding: '16px' }}>
            <h3 style={{ fontSize: '1.1rem', marginTop: 0, marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <ShoppingCart size={18} style={{ color: 'var(--primary)' }} />
              <span>{t('inventory.mandiTitle')}</span>
            </h3>

            <form onSubmit={handleMandiPurchase} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div>
                <label className="input-label" style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                  <Truck size={14} style={{ color: 'var(--primary)' }} />
                  <span>{t('inventory.supplierName')}</span>
                </label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="e.g. Laxmi Traders Mandi Gate 2"
                  value={mandiSupplier}
                  onChange={(e) => setMandiSupplier(e.target.value)}
                />
              </div>

              <div>
                <label className="input-label">{t('inventory.materialName')}</label>
                <select className="form-input" value={mandiItem} onChange={(e) => setMandiItem(e.target.value)}>
                  <option value="Sarson Seeds">Sarson Seeds (Peeli / Kali Mustard)</option>
                  <option value="Wheat Grain">Wheat Grain (Gehun)</option>
                  <option value="Maize Grain">Maize Grain (Makka)</option>
                  <option value="Packing Katte">Packing Bags (Katte)</option>
                </select>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div>
                  <label className="input-label" style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                    <Scale size={14} style={{ color: 'var(--primary)' }} />
                    <span>{t('inventory.weightQuintals')}</span>
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    className="form-input"
                    placeholder="e.g. 5.5 Quintals"
                    value={mandiQuintals}
                    onChange={(e) => setMandiQuintals(e.target.value)}
                    required
                  />
                  <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                    = {mandiWeightKg} Kg (1 Qtl = 100 Kg)
                  </span>
                </div>

                <div>
                  <label className="input-label" style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                    <Coins size={14} style={{ color: 'var(--primary)' }} />
                    <span>{t('inventory.ratePerQuintal')}</span>
                  </label>
                  <input
                    type="number"
                    step="10"
                    className="form-input"
                    placeholder="e.g. 5500"
                    value={mandiRatePerQuintal}
                    onChange={(e) => setMandiRatePerQuintal(e.target.value)}
                    required
                  />
                  <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                    = ₹{mandiEffectiveRatePerKg.toFixed(2)}/Kg
                  </span>
                </div>
              </div>

              <div>
                <label className="input-label">{t('inventory.mandiNotes')}</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="e.g. Mandi Batch #14 - Cash Paid / Bill No 402"
                  value={mandiNotes}
                  onChange={(e) => setMandiNotes(e.target.value)}
                />
              </div>

              {mandiQuintals && mandiRatePerQuintal && (
                <div className="calc-summary-box" style={{ padding: '12px 14px' }}>
                  <div className="calc-row highlight" style={{ border: 'none', padding: 0 }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <Receipt size={16} style={{ color: 'var(--primary-dark)' }} />
                      <span>{t('inventory.totalBill')}</span>
                    </span>
                    <span className="big-number" style={{ fontSize: '1.35rem', color: 'var(--primary-dark)', fontWeight: 900 }}>
                      ₹ {mandiTotalBill.toLocaleString('en-IN')}
                    </span>
                  </div>
                </div>
              )}

              <button 
                type="submit" 
                className="big-btn" 
                style={{ minHeight: '48px', fontSize: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
              >
                <Check size={18} />
                <span>{t('inventory.saveMandi')}</span>
              </button>
            </form>
          </div>

          {/* Recent Mandi Log Table */}
          <div>
            <div className="section-header" style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px' }}>
              <History size={15} style={{ color: 'var(--primary)' }} />
              <span>{t('inventory.recentMandi')} ({stockEntries.length})</span>
            </div>

            <div className="card" style={{ padding: '0', overflow: 'hidden' }}>
              {stockEntries.length === 0 ? (
                <div style={{ padding: '20px', textAlign: 'center', color: 'var(--text-muted)' }}>
                  <History size={24} style={{ opacity: 0.5, marginBottom: '6px' }} />
                  <p style={{ margin: 0, fontSize: '0.88rem' }}>{t('inventory.noMandi')}</p>
                </div>
              ) : (
                stockEntries.map((st) => (
                  <div 
                    key={st.id} 
                    style={{ 
                      display: 'flex', 
                      justifyContent: 'space-between', 
                      alignItems: 'center',
                      padding: '12px 16px', 
                      borderBottom: '1px solid var(--card-border)' 
                    }}
                  >
                    <div>
                      <div style={{ fontWeight: 800, fontSize: '0.95rem', color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span>{st.item}</span>
                        {st.supplier && (
                          <span style={{ fontSize: '0.72rem', background: 'var(--bg-elevated)', padding: '2px 6px', borderRadius: '4px', border: '1px solid var(--card-border)' }}>
                            {st.supplier}
                          </span>
                        )}
                      </div>
                      <div style={{ fontSize: '0.76rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                        {new Date(st.date).toLocaleDateString('en-IN')} • {st.notes}
                      </div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontWeight: 900, color: 'var(--primary)', fontSize: '1rem' }}>
                        ₹ {st.amount.toLocaleString('en-IN')}
                      </div>
                      <div style={{ fontSize: '0.76rem', color: 'var(--text-muted)' }}>
                        {st.quintals ? `${st.quintals} Qtl` : `${st.weight} kg`} @ ₹{st.ratePerQuintal ? `${st.ratePerQuintal}/Qtl` : `${st.rate}/kg`}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* SUB-TAB 3: SPELLAR OIL YIELD CALCULATOR */}
      {activeSubTab === 'spellar' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div className="card" style={{ padding: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
              <Calculator size={18} style={{ color: 'var(--primary)' }} />
              <h3 style={{ fontSize: '1.1rem', margin: 0, fontWeight: 800 }}>{t('inventory.spellarCalculator')}</h3>
            </div>

            {yieldNotice && (
              <div
                style={{
                  background: 'var(--success-bg)',
                  color: 'var(--success)',
                  padding: '10px 14px',
                  borderRadius: 'var(--radius)',
                  fontWeight: 700,
                  fontSize: '0.85rem',
                  marginBottom: '12px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  border: '1px solid var(--success)'
                }}
              >
                <CheckCircle2 size={16} />
                <span>{t('inventory.yieldSuccess')}</span>
              </div>
            )}

            <form onSubmit={handleRecordPressingYield} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div>
                <label className="input-label" style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                  <Wheat size={14} style={{ color: '#f59e0b' }} />
                  <span>{t('inventory.sarsonInput')}</span>
                </label>
                <input
                  type="number"
                  step="1"
                  className="form-input"
                  placeholder="e.g. 100"
                  value={sarsonInputKg}
                  onChange={(e) => setSarsonInputKg(e.target.value)}
                  required
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div>
                  <label className="input-label">{t('inventory.oilYieldRatio')}</label>
                  <input
                    type="number"
                    step="0.01"
                    className="form-input"
                    value={oilRatio}
                    onChange={(e) => setOilRatio(e.target.value)}
                    required
                  />
                  <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Default: 0.33 (33%)</span>
                </div>

                <div>
                  <label className="input-label">{t('inventory.khaliYieldRatio')}</label>
                  <input
                    type="number"
                    step="0.01"
                    className="form-input"
                    value={khaliRatio}
                    onChange={(e) => setKhaliRatio(e.target.value)}
                    required
                  />
                  <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Default: 0.65 (65%)</span>
                </div>
              </div>

              {/* Real-time Calculation Summary Box */}
              <div 
                className="calc-summary-box" 
                style={{ 
                  background: 'var(--bg-elevated)', 
                  padding: '14px', 
                  borderRadius: 'var(--radius)', 
                  border: '1px solid var(--card-border)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '8px'
                }}
              >
                <div style={{ fontSize: '0.85rem', fontWeight: 800, color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Sparkles size={15} style={{ color: 'var(--primary)' }} />
                  <span>Calculated Output Yields:</span>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginTop: '4px' }}>
                  <div style={{ background: 'rgba(59, 130, 246, 0.08)', padding: '10px', borderRadius: '0.5rem', border: '1px solid rgba(59, 130, 246, 0.2)' }}>
                    <div style={{ fontSize: '0.75rem', color: '#2563eb', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <Droplet size={13} />
                      <span>{t('inventory.calcOilOutput')}</span>
                    </div>
                    <div style={{ fontSize: '1.25rem', fontWeight: 900, color: '#1d4ed8', marginTop: '2px' }}>
                      {expectedOilLitre} Litres
                    </div>
                  </div>

                  <div style={{ background: 'rgba(16, 185, 129, 0.08)', padding: '10px', borderRadius: '0.5rem', border: '1px solid rgba(16, 185, 129, 0.2)' }}>
                    <div style={{ fontSize: '0.75rem', color: '#059669', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <Flame size={13} />
                      <span>{t('inventory.calcKhaliOutput')}</span>
                    </div>
                    <div style={{ fontSize: '1.25rem', fontWeight: 900, color: '#047857', marginTop: '2px' }}>
                      {expectedKhaliKg} Kg
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', color: 'var(--text-muted)', paddingTop: '6px', borderTop: '1px dashed var(--card-border)' }}>
                  <span>{t('inventory.calcPiraiFee')} (@ ₹{pressingRate}/kg):</span>
                  <strong style={{ color: 'var(--text-main)' }}>₹ {estimatedPressingCharge}</strong>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem', color: 'var(--primary-dark)', fontWeight: 800 }}>
                  <span>Output Market Valuation:</span>
                  <span>₹ {estimatedOutputValuation.toLocaleString('en-IN')}</span>
                </div>
              </div>

              <button 
                type="submit" 
                className="big-btn" 
                style={{ minHeight: '48px', fontSize: '0.95rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
              >
                <Check size={18} />
                <span>{t('inventory.recordPressingBatch')}</span>
              </button>
            </form>
          </div>
        </div>
      )}

      {/* SUB-TAB 4: ADD NEW INVENTORY ITEM */}
      {activeSubTab === 'add' && (
        <div className="card" style={{ padding: '16px' }}>
          <h3 style={{ fontSize: '1.1rem', marginTop: 0, marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Plus size={18} style={{ color: 'var(--primary)' }} />
            <span>{t('inventory.newItemTitle')}</span>
          </h3>

          <form onSubmit={handleCreateItem} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div>
              <label className="input-label">{t('inventory.itemName')}</label>
              <input
                type="text"
                className="form-input"
                placeholder="e.g. Suji Bag 50kg, Peeli Sarson"
                value={newItemName}
                onChange={(e) => setNewItemName(e.target.value)}
                required
                autoFocus
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
              <div>
                <label className="input-label">{t('inventory.category')}</label>
                <select className="form-input" value={newItemCategory} onChange={(e) => setNewItemCategory(e.target.value)}>
                  <option value="seed">Seed (Sarson)</option>
                  <option value="oil">Oil (Tel)</option>
                  <option value="khari">Khali (Cake)</option>
                  <option value="flour">Atta / Suji</option>
                  <option value="packing">Packing Katte</option>
                </select>
              </div>
              <div>
                <label className="input-label">{t('inventory.unit')}</label>
                <select className="form-input" value={newItemUnit} onChange={(e) => setNewItemUnit(e.target.value)}>
                  <option value="kg">kg</option>
                  <option value="litre">litre</option>
                  <option value="bag">bag (katta)</option>
                  <option value="piece">piece</option>
                </select>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
              <div>
                <label className="input-label">{t('inventory.initialStock')}</label>
                <input
                  type="number"
                  className="form-input"
                  placeholder="e.g. 100"
                  value={newItemStock}
                  onChange={(e) => setNewItemStock(e.target.value)}
                  required
                />
              </div>
              <div>
                <label className="input-label">{t('inventory.warningLimit')}</label>
                <input
                  type="number"
                  className="form-input"
                  placeholder="e.g. 20"
                  value={newItemAlert}
                  onChange={(e) => setNewItemAlert(e.target.value)}
                  required
                />
              </div>
            </div>

            <div>
              <label className="input-label">{t('inventory.estimatedRate')}</label>
              <input
                type="number"
                className="form-input"
                placeholder="e.g. 60"
                value={newItemPrice}
                onChange={(e) => setNewItemPrice(e.target.value)}
              />
            </div>

            <button 
              type="submit" 
              className="big-btn" 
              style={{ minHeight: '48px', fontSize: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', marginTop: '4px' }}
            >
              <Check size={18} />
              <span>{t('inventory.saveNewItemBtn')}</span>
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
