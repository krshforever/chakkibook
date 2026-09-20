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
  Minus, 
  CheckCircle2, 
  ArrowUpRight,
  TrendingUp
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

  const [activeSubTab, setActiveSubTab] = useState('stock'); // 'stock' | 'add' | 'mandi'
  const [selectedItem, setSelectedItem] = useState(null);
  const [qtyChange, setQtyChange] = useState('');
  
  // New Item State
  const [newItemName, setNewItemName] = useState('');
  const [newItemCategory, setNewItemCategory] = useState('seed');
  const [newItemStock, setNewItemStock] = useState('');
  const [newItemUnit, setNewItemUnit] = useState('kg');
  const [newItemAlert, setNewItemAlert] = useState('20');
  const [newItemPrice, setNewItemPrice] = useState('');

  // Mandi Purchase State
  const [mandiItem, setMandiItem] = useState('Sarson Seeds');
  const [mandiQty, setMandiQty] = useState('');
  const [mandiRate, setMandiRate] = useState('');
  const [mandiNotes, setMandiNotes] = useState('');

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
    if (!mandiQty || !mandiRate) return;
    const amount = Number(mandiQty) * Number(mandiRate);
    addStockEntry({
      type: 'purchase',
      item: mandiItem,
      weight: Number(mandiQty),
      unit: 'kg',
      rate: Number(mandiRate),
      amount,
      notes: mandiNotes || 'Mandi Batch Purchase'
    });
    setMandiQty('');
    setMandiRate('');
    setMandiNotes('');
    setActiveSubTab('stock');
  };

  // Total valuation calculation
  const totalValuation = inventory.reduce((acc, item) => {
    const rate = item.pricePerUnit || (item.category === 'seed' ? 55 : item.category === 'oil' ? 140 : 35);
    return acc + (item.stock * rate);
  }, 0);

  const lowStockCount = inventory.filter(i => i.stock <= i.lowAlert).length;

  return (
    <div className="app-container">
      {/* Top Banner & Valuation Summary */}
      <div 
        className="card" 
        style={{ 
          background: 'linear-gradient(135deg, #1e293b, #0f172a)', 
          color: '#ffffff', 
          padding: '16px', 
          marginBottom: '8px', 
          borderRadius: 'var(--radius)', 
          border: '1px solid rgba(255,255,255,0.1)' 
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '2px' }}>
              <Package size={14} style={{ color: '#94a3b8' }} />
              <span style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: '#94a3b8', letterSpacing: '0.05em', fontWeight: 700 }}>
                {t('inventory.title')}
              </span>
            </div>
            <h2 style={{ fontSize: '1.6rem', margin: '4px 0 0 0', color: '#fbbf24', fontWeight: 800 }}>
              ₹ {totalValuation.toLocaleString('en-IN')}
            </h2>
            <span style={{ fontSize: '0.75rem', color: '#cbd5e1' }}>{t('inventory.marketValuation')}</span>
          </div>

          <div style={{ textAlign: 'right' }}>
            {lowStockCount > 0 ? (
              <span 
                className="badge" 
                style={{ 
                  background: 'rgba(239, 68, 68, 0.2)', 
                  border: '1px solid #ef4444',
                  color: '#f87171', 
                  fontSize: '0.75rem', 
                  padding: '5px 10px', 
                  borderRadius: 'var(--radius-pill)', 
                  fontWeight: 700,
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px'
                }}
              >
                <AlertTriangle size={13} />
                <span>{lowStockCount} {t('inventory.lowStock')}</span>
              </span>
            ) : (
              <span 
                className="badge" 
                style={{ 
                  background: 'rgba(16, 185, 129, 0.2)', 
                  border: '1px solid #10b981',
                  color: '#34d399', 
                  fontSize: '0.75rem', 
                  padding: '5px 10px', 
                  borderRadius: 'var(--radius-pill)', 
                  fontWeight: 700,
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px'
                }}
              >
                <Check size={13} />
                <span>{t('inventory.stockHealthFull')}</span>
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Navigation Sub-Tabs */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}>
        <button
          type="button"
          className={`pill-btn ${activeSubTab === 'stock' ? 'active' : ''}`}
          onClick={() => setActiveSubTab('stock')}
          style={{ minHeight: '42px', fontSize: '0.82rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
        >
          <Package size={15} />
          <span>{t('inventory.stockOverview')}</span>
        </button>
        <button
          type="button"
          className={`pill-btn ${activeSubTab === 'mandi' ? 'active' : ''}`}
          onClick={() => setActiveSubTab('mandi')}
          style={{ minHeight: '42px', fontSize: '0.82rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
        >
          <ShoppingCart size={15} />
          <span>{t('inventory.mandiPurchase')}</span>
        </button>
        <button
          type="button"
          className={`pill-btn ${activeSubTab === 'add' ? 'active' : ''}`}
          onClick={() => setActiveSubTab('add')}
          style={{ minHeight: '42px', fontSize: '0.82rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
        >
          <Plus size={15} />
          <span>{t('inventory.newItem')}</span>
        </button>
      </div>

      {/* TAB 1: Stock Overview with Reorder Progress Bars */}
      {activeSubTab === 'stock' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {inventory.map((item) => {
            const isLow = item.stock <= item.lowAlert;
            const isCritical = item.stock <= item.lowAlert * 0.5;
            const estRate = item.pricePerUnit || (item.category === 'seed' ? 55 : item.category === 'oil' ? 140 : 35);
            const value = item.stock * estRate;

            // Calculate stock progress bar percentage
            const safeCapacity = Math.max(item.lowAlert * 2.5, item.stock, 50);
            const progressPercent = Math.min(100, Math.max(5, Math.round((item.stock / safeCapacity) * 100)));
            const alertThresholdPercent = Math.min(100, Math.round((item.lowAlert / safeCapacity) * 100));

            // Bar color scheme
            const barColor = isCritical ? '#ef4444' : isLow ? '#f59e0b' : '#10b981';

            return (
              <div
                key={item.id}
                className="card"
                style={{
                  borderLeft: isLow ? '5px solid #ef4444' : '5px solid #10b981',
                  background: isLow ? 'var(--card-bg)' : 'var(--card-bg)',
                  padding: '14px 16px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '10px'
                }}
              >
                {/* Header row */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <h3 style={{ fontSize: '1.05rem', margin: 0, fontWeight: 700, color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      {item.category === 'oil' ? (
                        <Droplet size={16} style={{ color: 'var(--primary)' }} />
                      ) : (
                        <Wheat size={16} style={{ color: 'var(--primary)' }} />
                      )}
                      <span>{item.name}</span>
                    </h3>
                    <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', display: 'flex', gap: '8px', alignItems: 'center', marginTop: '3px' }}>
                      <span style={{ textTransform: 'capitalize' }}>Category: {item.category}</span>
                      <span>•</span>
                      <span>Value: ₹{value.toLocaleString('en-IN')}</span>
                    </div>
                  </div>

                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '1.35rem', fontWeight: 800, color: isLow ? '#ef4444' : 'var(--text-main)' }}>
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
                          height: '32px',
                          minHeight: '32px',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px'
                        }}
                      >
                        <RefreshCw size={12} />
                        <span>{t('inventory.adjustStock')}</span>
                      </button>
                    )}
                  </div>
                </div>

                {/* Stock Reorder Progress Bar Section */}
                <div style={{ marginTop: '2px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.75rem', marginBottom: '4px' }}>
                    <span style={{ color: isLow ? '#ef4444' : 'var(--text-muted)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px' }}>
                      {isLow ? (
                        <>
                          <AlertTriangle size={12} />
                          <span>{t('inventory.reorderWarning')} (Min: {item.lowAlert} {item.unit})</span>
                        </>
                      ) : (
                        <>
                          <CheckCircle2 size={12} style={{ color: '#10b981' }} />
                          <span>{t('inventory.healthyStock')} (Min: {item.lowAlert} {item.unit})</span>
                        </>
                      )}
                    </span>
                    <span style={{ fontWeight: 700, color: barColor }}>
                      {progressPercent}% Full
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

          {/* Quick Stock Adjustment Modal / Card */}
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
                  <h4 style={{ fontSize: '1rem', margin: 0, fontWeight: 700 }}>Adjust Stock: {selectedItem.name}</h4>
                </div>
                <span style={{ fontSize: '0.85rem', fontWeight: 800, color: 'var(--primary)' }}>
                  Current: {selectedItem.stock} {selectedItem.unit}
                </span>
              </div>
              
              <form onSubmit={handleStockUpdate} style={{ display: 'flex', gap: '10px', flexDirection: 'column' }}>
                {/* Preset increment / decrement buttons */}
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
                    placeholder="Enter change (e.g. +50 or -10)"
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

      {/* TAB 2: Mandi Purchase Log */}
      {activeSubTab === 'mandi' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div className="card" style={{ padding: '16px' }}>
            <h3 style={{ fontSize: '1.1rem', marginTop: 0, marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <ShoppingCart size={18} style={{ color: 'var(--primary)' }} />
              <span>{t('inventory.mandiTitle')}</span>
            </h3>

            <form onSubmit={handleMandiPurchase} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div>
                <label className="input-label">Material Name</label>
                <select className="form-input" value={mandiItem} onChange={(e) => setMandiItem(e.target.value)}>
                  <option value="Sarson Seeds">Sarson Seeds (Peeli / Kali)</option>
                  <option value="Wheat Grain">Gehun Grain (Wheat)</option>
                  <option value="Maize Grain">Makka Grain</option>
                  <option value="Packing Bags">Packing Bags (Katte)</option>
                </select>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div>
                  <label className="input-label" style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                    <Scale size={14} style={{ color: 'var(--primary)' }} />
                    <span>Vazan (Kg / Qty)</span>
                  </label>
                  <input
                    type="number"
                    className="form-input"
                    placeholder="e.g. 500"
                    value={mandiQty}
                    onChange={(e) => setMandiQty(e.target.value)}
                    required
                  />
                </div>
                <div>
                  <label className="input-label" style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                    <Coins size={14} style={{ color: 'var(--primary)' }} />
                    <span>Mandi Rate (₹/Kg)</span>
                  </label>
                  <input
                    type="number"
                    className="form-input"
                    placeholder="e.g. 55"
                    value={mandiRate}
                    onChange={(e) => setMandiRate(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div>
                <label className="input-label">Trader / Mandi Note</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="e.g. Grain Market Batch #14 - Cash Paid"
                  value={mandiNotes}
                  onChange={(e) => setMandiNotes(e.target.value)}
                />
              </div>

              {mandiQty && mandiRate && (
                <div 
                  className="calc-summary-box"
                  style={{ padding: '10px 14px' }}
                >
                  <div className="calc-row highlight" style={{ border: 'none', padding: 0 }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <Coins size={16} />
                      <span>Kul Mandi Cost:</span>
                    </span>
                    <span className="big-number" style={{ fontSize: '1.3rem', color: 'var(--primary-dark)' }}>
                      ₹ {(Number(mandiQty) * Number(mandiRate)).toLocaleString('en-IN')}
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
                      <div style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--text-main)' }}>{st.item}</div>
                      <div style={{ fontSize: '0.76rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                        {new Date(st.date).toLocaleDateString('en-IN')} • {st.notes}
                      </div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontWeight: 800, color: 'var(--primary)', fontSize: '1rem' }}>
                        ₹ {st.amount.toLocaleString('en-IN')}
                      </div>
                      <div style={{ fontSize: '0.76rem', color: 'var(--text-muted)' }}>
                        {st.weight} {st.unit} @ ₹{st.rate}/kg
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: Add New Inventory Item */}
      {activeSubTab === 'add' && (
        <div className="card" style={{ padding: '16px' }}>
          <h3 style={{ fontSize: '1.1rem', marginTop: 0, marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Plus size={18} style={{ color: 'var(--primary)' }} />
            <span>{t('inventory.newItem')}</span>
          </h3>

          <form onSubmit={handleCreateItem} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div>
              <label className="input-label">Item Naam</label>
              <input
                type="text"
                className="form-input"
                placeholder="e.g. Suji Bag 50kg, Chokar, Peeli Sarson"
                value={newItemName}
                onChange={(e) => setNewItemName(e.target.value)}
                required
                autoFocus
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
              <div>
                <label className="input-label">Category</label>
                <select className="form-input" value={newItemCategory} onChange={(e) => setNewItemCategory(e.target.value)}>
                  <option value="seed">Seed (Beej)</option>
                  <option value="oil">Oil (Tel)</option>
                  <option value="khari">Khali (Cake)</option>
                  <option value="flour">Atta / Suji</option>
                  <option value="packing">Bags / Packing</option>
                </select>
              </div>
              <div>
                <label className="input-label">Unit</label>
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
                <label className="input-label">Initial Stock</label>
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
                <label className="input-label">Low Stock Warning Limit</label>
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
              <label className="input-label">Estimated Rate (₹ per unit)</label>
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
              <span>{t('inventory.saveNewItem')}</span>
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
