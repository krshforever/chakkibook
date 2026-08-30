import React, { useState } from 'react';
import { useStore } from '../store/useStore';

export default function Settings() {
  const shop = useStore((state) => state.shop);
  const updateShopRates = useStore((state) => state.updateShopRates);
  const storeState = useStore((state) => state);

  const [rates, setRates] = useState({
    pisai: shop.rates?.pisai || 4,
    pirai: shop.rates?.pirai || 12,
    khari: shop.rates?.khari || 35,
    dana: shop.rates?.dana || 5,
  });

  const handleSaveRates = (e) => {
    e.preventDefault();
    updateShopRates(rates);
    alert('Rates updated successfully! Nayi entries me naye rate auto-apply honge.');
  };

  // Export JSON backup
  const handleExportBackup = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(storeState, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `chakkibook_backup_${new Date().toISOString().split('T')[0]}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  return (
    <div className="app-container">
      <h2 style={{ fontSize: '1.2rem', marginBottom: '14px' }}>⚙️ Shop & Rate Settings</h2>

      {/* Rate Setting Form */}
      <form onSubmit={handleSaveRates} className="card" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        <h3 style={{ fontSize: '1rem', color: 'var(--soil)' }}>🌾 Rate Setting (₹ per Kg)</h3>
        
        <div>
          <label style={{ fontSize: '0.85rem', fontWeight: 600 }}>🌾 Pisai Rate (Gehun / Flour)</label>
          <input
            type="number"
            step="0.5"
            className="input-field"
            value={rates.pisai}
            onChange={(e) => setRates({ ...rates, pisai: Number(e.target.value) })}
            required
          />
        </div>

        <div>
          <label style={{ fontSize: '0.85rem', fontWeight: 600 }}>🫒 Pirai Rate (Sarson / Mustard Oil Press)</label>
          <input
            type="number"
            step="0.5"
            className="input-field"
            value={rates.pirai}
            onChange={(e) => setRates({ ...rates, pirai: Number(e.target.value) })}
            required
          />
        </div>

        <div>
          <label style={{ fontSize: '0.85rem', fontWeight: 600 }}>📦 Khari / Khali Selling Rate (per Kg)</label>
          <input
            type="number"
            step="0.5"
            className="input-field"
            value={rates.khari}
            onChange={(e) => setRates({ ...rates, khari: Number(e.target.value) })}
            required
          />
        </div>

        <button type="submit" className="btn btn-primary" style={{ marginTop: '8px' }}>
          💾 Rate Change Save Karein
        </button>
      </form>

      {/* Shop Profile Details */}
      <div className="card" style={{ marginTop: '14px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
        <h3 style={{ fontSize: '1rem', color: 'var(--soil)' }}>🏪 Shop Info</h3>
        <div style={{ fontSize: '0.9rem' }}>
          <div><strong>Shop Name:</strong> {shop.name}</div>
          <div><strong>Owner:</strong> {shop.ownerName}</div>
          <div><strong>Phone:</strong> {shop.phone}</div>
          <div><strong>Address:</strong> {shop.address}</div>
        </div>
      </div>

      {/* Data Backup & Restore */}
      <div className="card" style={{ marginTop: '14px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
        <h3 style={{ fontSize: '1rem', color: 'var(--soil)' }}>💾 Data Safety & Backup</h3>
        <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
          Apne poore khate, customer list, aur transactions ka backup file download karein.
        </p>
        <button onClick={handleExportBackup} className="btn btn-secondary">
          📥 Export Data Backup (.json)
        </button>
      </div>

    </div>
  );
}
