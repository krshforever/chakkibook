import React, { useState } from 'react';
import { useStore } from '../store/useStore';

export default function Inventory() {
  const inventory = useStore((state) => state.inventory);
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
      {/* Top Banner & Summary */}
      <div className="card" style={{ background: 'linear-gradient(135deg, #1e293b, #0f172a)', color: '#fff', padding: '16px', marginBottom: '16px', borderRadius: '1rem', border: '1px solid rgba(255,255,255,0.1)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <span style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: '#94a3b8', letterSpacing: '0.05em' }}>Inventory & Mandi Stock</span>
            <h2 style={{ fontSize: '1.4rem', margin: '4px 0 0 0', color: '#fbbf24', fontWeight: 800 }}>
              ₹{totalValuation.toLocaleString('en-IN')}
            </h2>
            <span style={{ fontSize: '0.75rem', color: '#cbd5e1' }}>Kul Stock Market Value</span>
          </div>

          <div style={{ textAlign: 'right' }}>
            {lowStockCount > 0 ? (
              <span className="badge" style={{ background: '#ef4444', color: '#fff', fontSize: '0.75rem', padding: '4px 10px', borderRadius: '1rem', fontWeight: 700 }}>
                ⚠️ {lowStockCount} Low Stock
              </span>
            ) : (
              <span className="badge" style={{ background: '#10b981', color: '#fff', fontSize: '0.75rem', padding: '4px 10px', borderRadius: '1rem', fontWeight: 700 }}>
                ✅ Stock Health Full
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Navigation Sub-Tabs */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
        <button
          className={`btn ${activeSubTab === 'stock' ? 'btn-primary' : 'btn-outline'}`}
          onClick={() => setActiveSubTab('stock')}
          style={{ flex: 1, padding: '10px', fontSize: '0.85rem' }}
        >
          📦 Stock Overview
        </button>
        <button
          className={`btn ${activeSubTab === 'mandi' ? 'btn-primary' : 'btn-outline'}`}
          onClick={() => setActiveSubTab('mandi')}
          style={{ flex: 1, padding: '10px', fontSize: '0.85rem' }}
        >
          🛒 Mandi Khareedi
        </button>
        <button
          className={`btn ${activeSubTab === 'add' ? 'btn-primary' : 'btn-outline'}`}
          onClick={() => setActiveSubTab('add')}
          style={{ flex: 1, padding: '10px', fontSize: '0.85rem' }}
        >
          ➕ Naya Item
        </button>
      </div>

      {/* TAB 1: Stock Overview */}
      {activeSubTab === 'stock' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {inventory.map((item) => {
            const isLow = item.stock <= item.lowAlert;
            const estRate = item.pricePerUnit || (item.category === 'seed' ? 55 : item.category === 'oil' ? 140 : 35);
            const value = item.stock * estRate;

            return (
              <div
                key={item.id}
                className="card"
                style={{
                  borderLeft: isLow ? '5px solid #ef4444' : '5px solid #10b981',
                  background: isLow ? 'rgba(239, 68, 68, 0.04)' : 'var(--card-bg)',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '14px'
                }}
              >
                <div>
                  <h3 style={{ fontSize: '1.05rem', margin: '0 0 4px 0', fontWeight: 700 }}>{item.name}</h3>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'flex', gap: '8px', alignItems: 'center' }}>
                    <span style={{ textTransform: 'capitalize' }}>Category: {item.category}</span>
                    <span>•</span>
                    <span>Value: ₹{value.toLocaleString('en-IN')}</span>
                  </div>
                  {isLow && (
                    <div style={{ marginTop: '6px', fontSize: '0.75rem', color: '#ef4444', fontWeight: 600 }}>
                      ⚠️ Reorder Needed! (Min: {item.lowAlert} {item.unit})
                    </div>
                  )}
                </div>

                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '1.4rem', fontWeight: 800, color: isLow ? '#ef4444' : 'var(--text-main)' }}>
                    {item.stock} <span style={{ fontSize: '0.85rem', fontWeight: 500 }}>{item.unit}</span>
                  </div>
                  {hasPermission('adjustStock') && (
                    <button
                      className="btn btn-outline"
                      onClick={() => setSelectedItem(item)}
                      style={{ padding: '6px 12px', fontSize: '0.78rem', marginTop: '6px', width: 'auto' }}
                    >
                      ✏️ Stock Badhao/Ghatao
                    </button>
                  )}
                </div>
              </div>
            );
          })}

          {/* Quick Adjustment Modal */}
          {selectedItem && (
            <div className="card" style={{ border: '2px solid var(--primary)', background: 'var(--wheat-light)', padding: '16px', borderRadius: '1rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                <h4 style={{ fontSize: '1rem', margin: 0 }}>Adjustment: {selectedItem.name}</h4>
                <span style={{ fontSize: '0.85rem', fontWeight: 700 }}>Current: {selectedItem.stock} {selectedItem.unit}</span>
              </div>
              
              <form onSubmit={handleStockUpdate} style={{ display: 'flex', gap: '8px', flexDirection: 'column' }}>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button type="button" className="btn btn-outline" style={{ flex: 1 }} onClick={() => setQtyChange('+50')}>+50 {selectedItem.unit}</button>
                  <button type="button" className="btn btn-outline" style={{ flex: 1 }} onClick={() => setQtyChange('+100')}>+100 {selectedItem.unit}</button>
                  <button type="button" className="btn btn-outline" style={{ flex: 1 }} onClick={() => setQtyChange('-20')}>-20 {selectedItem.unit}</button>
                </div>

                <div style={{ display: 'flex', gap: '8px', marginTop: '6px' }}>
                  <input
                    type="number"
                    className="input-field"
                    placeholder="Exact quantity change (+50 or -10)"
                    value={qtyChange}
                    onChange={(e) => setQtyChange(e.target.value)}
                    required
                  />
                  <button type="submit" className="btn btn-primary" style={{ width: 'auto', whiteSpace: 'nowrap' }}>
                    Save
                  </button>
                  <button type="button" className="btn btn-outline" onClick={() => setSelectedItem(null)} style={{ width: 'auto' }}>
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>
      )}

      {/* TAB 2: Mandi Purchase Log */}
      {activeSubTab === 'mandi' && (
        <div>
          <div className="card" style={{ marginBottom: '16px', padding: '16px' }}>
            <h3 style={{ fontSize: '1.1rem', marginTop: 0, marginBottom: '12px' }}>🛒 Mandi Se Raw Material Khareedi Record</h3>
            <form onSubmit={handleMandiPurchase} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div>
                <label className="form-label">Material Name</label>
                <select className="input-field" value={mandiItem} onChange={(e) => setMandiItem(e.target.value)}>
                  <option value="Sarson Seeds">Sarson Seeds (Peeli / Kali)</option>
                  <option value="Wheat Grain">Gehun Grain (Wheat)</option>
                  <option value="Maize Grain">Makka Grain</option>
                  <option value="Packing Bags">Packing Bags (Katte)</option>
                </select>
              </div>

              <div style={{ display: 'flex', gap: '10px' }}>
                <div style={{ flex: 1 }}>
                  <label className="form-label">Wazan / Quantity (Kg)</label>
                  <input
                    type="number"
                    className="input-field"
                    placeholder="e.g. 500"
                    value={mandiQty}
                    onChange={(e) => setMandiQty(e.target.value)}
                    required
                  />
                </div>
                <div style={{ flex: 1 }}>
                  <label className="form-label">Mandi Rate (₹/Kg)</label>
                  <input
                    type="number"
                    className="input-field"
                    placeholder="e.g. 55"
                    value={mandiRate}
                    onChange={(e) => setMandiRate(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div>
                <label className="form-label">Trader / Mandi Note</label>
                <input
                  type="text"
                  className="input-field"
                  placeholder="e.g. Grain Market Batch #14 - Cash Paid"
                  value={mandiNotes}
                  onChange={(e) => setMandiNotes(e.target.value)}
                />
              </div>

              {mandiQty && mandiRate && (
                <div style={{ padding: '10px', background: 'rgba(234, 179, 8, 0.1)', border: '1px solid rgba(234, 179, 8, 0.3)', borderRadius: '0.5rem', fontWeight: 700, color: '#d97706' }}>
                  Kul Mandi Cost: ₹{(Number(mandiQty) * Number(mandiRate)).toLocaleString('en-IN')}
                </div>
              )}

              <button type="submit" className="btn btn-primary" style={{ minHeight: '52px', fontSize: '1rem' }}>
                ✅ Mandi Khareedi Save Karo
              </button>
            </form>
          </div>

          {/* Recent Mandi Log Table */}
          <h4 style={{ fontSize: '0.95rem', marginBottom: '8px' }}>📜 Recent Mandi Purchases</h4>
          <div className="card" style={{ padding: '0', overflow: 'hidden' }}>
            {stockEntries.length === 0 ? (
              <div style={{ padding: '16px', textAlign: 'center', color: 'var(--text-muted)' }}>Koi mandi khareedi entry nahi hai.</div>
            ) : (
              stockEntries.map((st) => (
                <div key={st.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 16px', borderBottom: '1px solid var(--border)' }}>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: '0.95rem' }}>{st.item}</div>
                    <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>{new Date(st.date).toLocaleDateString()} • {st.notes}</div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontWeight: 800, color: 'var(--primary)' }}>₹{st.amount.toLocaleString('en-IN')}</div>
                    <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>{st.weight} {st.unit} @ ₹{st.rate}/kg</div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* TAB 3: Add New Inventory Item */}
      {activeSubTab === 'add' && (
        <div className="card" style={{ padding: '16px' }}>
          <h3 style={{ fontSize: '1.1rem', marginTop: 0, marginBottom: '12px' }}>➕ Naya Stock Item Add Karo</h3>
          <form onSubmit={handleCreateItem} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div>
              <label className="form-label">Item Naam</label>
              <input
                type="text"
                className="input-field"
                placeholder="e.g. Suji Bag 50kg, Chokar, Peeli Sarson"
                value={newItemName}
                onChange={(e) => setNewItemName(e.target.value)}
                required
              />
            </div>

            <div style={{ display: 'flex', gap: '10px' }}>
              <div style={{ flex: 1 }}>
                <label className="form-label">Category</label>
                <select className="input-field" value={newItemCategory} onChange={(e) => setNewItemCategory(e.target.value)}>
                  <option value="seed">Seed (Beej)</option>
                  <option value="oil">Oil (Tel)</option>
                  <option value="khari">Khali (Cake)</option>
                  <option value="flour">Atta / Suji</option>
                  <option value="packing">Bags / Packing</option>
                </select>
              </div>
              <div style={{ flex: 1 }}>
                <label className="form-label">Unit</label>
                <select className="input-field" value={newItemUnit} onChange={(e) => setNewItemUnit(e.target.value)}>
                  <option value="kg">kg</option>
                  <option value="litre">litre</option>
                  <option value="bag">bag (katta)</option>
                  <option value="piece">piece</option>
                </select>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '10px' }}>
              <div style={{ flex: 1 }}>
                <label className="form-label">Initial Stock</label>
                <input
                  type="number"
                  className="input-field"
                  placeholder="e.g. 100"
                  value={newItemStock}
                  onChange={(e) => setNewItemStock(e.target.value)}
                  required
                />
              </div>
              <div style={{ flex: 1 }}>
                <label className="form-label">Low Stock Warning Limit</label>
                <input
                  type="number"
                  className="input-field"
                  placeholder="e.g. 20"
                  value={newItemAlert}
                  onChange={(e) => setNewItemAlert(e.target.value)}
                  required
                />
              </div>
            </div>

            <div>
              <label className="form-label">Estimated Rate (₹ per unit)</label>
              <input
                type="number"
                className="input-field"
                placeholder="e.g. 60"
                value={newItemPrice}
                onChange={(e) => setNewItemPrice(e.target.value)}
              />
            </div>

            <button type="submit" className="btn btn-primary" style={{ minHeight: '52px', fontSize: '1rem' }}>
              ✅ Save Naya Item
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
