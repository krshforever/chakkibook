import React, { useState } from 'react';
import { useStore } from '../store/useStore';

export default function Inventory() {
  const inventory = useStore((state) => state.inventory);
  const updateStock = useStore((state) => state.updateStock);

  const [selectedItem, setSelectedItem] = useState(null);
  const [qtyChange, setQtyChange] = useState('');

  const handleStockUpdate = (e) => {
    e.preventDefault();
    if (!selectedItem || !qtyChange) return;

    updateStock(selectedItem.id, Number(qtyChange));
    setQtyChange('');
    setSelectedItem(null);
  };

  return (
    <div className="app-container">
      <h2 style={{ fontSize: '1.2rem', marginBottom: '12px' }}>🫒 Sarson Tel & Stock Tracking</h2>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {inventory.map((item) => {
          const isLow = item.stock <= item.lowAlert;
          return (
            <div
              key={item.id}
              className="card"
              style={{
                borderLeft: isLow ? '4px solid var(--danger)' : '4px solid var(--success)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}
            >
              <div>
                <h3 style={{ fontSize: '1.05rem', margin: 0 }}>{item.name}</h3>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                  Category: {item.category.toUpperCase()} {isLow ? '⚠️ Low Stock!' : ''}
                </span>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: '1.3rem', fontWeight: 800, color: isLow ? 'var(--danger)' : 'var(--text-main)' }}>
                  {item.stock} <span style={{ fontSize: '0.85rem' }}>{item.unit}</span>
                </div>
                <button
                  className="btn btn-outline"
                  onClick={() => setSelectedItem(item)}
                  style={{ padding: '4px 8px', fontSize: '0.75rem', marginTop: '4px', width: 'auto' }}
                >
                  ✏️ Adjust Stock
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Adjust Stock Modal/Form */}
      {selectedItem && (
        <div className="card" style={{ marginTop: '16px', background: 'var(--wheat-light)' }}>
          <h4 style={{ fontSize: '0.95rem', marginBottom: '8px' }}>
            Adjust Stock for: {selectedItem.name}
          </h4>
          <form onSubmit={handleStockUpdate} style={{ display: 'flex', gap: '8px' }}>
            <input
              type="number"
              className="input-field"
              placeholder="Qty (+ add, - reduce)"
              value={qtyChange}
              onChange={(e) => setQtyChange(e.target.value)}
              required
            />
            <button type="submit" className="btn btn-primary" style={{ width: 'auto', whiteSpace: 'nowrap' }}>
              Save Stock
            </button>
            <button
              type="button"
              className="btn btn-outline"
              onClick={() => setSelectedItem(null)}
              style={{ width: 'auto' }}
            >
              Cancel
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
