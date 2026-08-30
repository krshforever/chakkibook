import React, { useState } from 'react';
import { useStore } from '../store/useStore';

export default function Settings() {
  const shop = useStore((state) => state.shop);
  const updateShopRates = useStore((state) => state.updateShopRates);
  const updateShopInfo = useStore((state) => state.updateShopInfo);
  const inventory = useStore((state) => state.inventory);
  const updateStock = useStore((state) => state.updateStock);
  const fullStore = useStore((state) => state);

  // Form State: Chakki Rates
  const [pisaiRate, setPisaiRate] = useState(shop.chakkiRates?.pisai || 4);
  const [kaddaWheat, setKaddaWheat] = useState(shop.chakkiRates?.kadda?.wheat || 1);
  const [kaddaDana, setKaddaDana] = useState(shop.chakkiRates?.kadda?.dana || 1.5);
  const [kaddaMaize, setKaddaMaize] = useState(shop.chakkiRates?.kadda?.maize || 1);
  const [kaddaPer, setKaddaPer] = useState(shop.chakkiRates?.kaddaPer || 40);

  // Form State: Spellar Rates
  const [piraiRate, setPiraiRate] = useState(shop.spellarRates?.pirai || 12);
  const [khariRate, setKhariRate] = useState(shop.spellarRates?.khari || 35);

  // Form State: Shop Info
  const [shopName, setShopName] = useState(shop.name || 'Vanshu Atta Chakki & Oil Mill');
  const [shopPhone, setShopPhone] = useState(shop.phone || '9876543210');
  const [ownerName, setOwnerName] = useState(shop.ownerName || 'Bhaiya');
  const [shopAddress, setShopAddress] = useState(shop.address || 'Main Market Road, Ward 4');

  // Stock Adjustment State
  const [selectedStockItem, setSelectedStockItem] = useState(null);
  const [stockDelta, setStockDelta] = useState('');

  const [savedAlert, setSavedAlert] = useState(false);

  // Save All Rates
  const handleSaveRates = (e) => {
    e.preventDefault();
    updateShopRates({
      chakkiRates: {
        pisai: parseFloat(pisaiRate) || 0,
        kadda: {
          wheat: parseFloat(kaddaWheat) || 0,
          dana: parseFloat(kaddaDana) || 0,
          maize: parseFloat(kaddaMaize) || 0,
        },
        kaddaPer: parseFloat(kaddaPer) || 40,
      },
      spellarRates: {
        pirai: parseFloat(piraiRate) || 0,
        khari: parseFloat(khariRate) || 0,
      }
    });

    updateShopInfo({
      name: shopName.trim(),
      phone: shopPhone.trim(),
      ownerName: ownerName.trim(),
      address: shopAddress.trim(),
    });

    setSavedAlert(true);
    setTimeout(() => setSavedAlert(false), 3000);
  };

  // Stock Adjustment
  const handleStockUpdate = (e) => {
    e.preventDefault();
    if (!selectedStockItem || !stockDelta) return;
    updateStock(selectedStockItem.id, parseFloat(stockDelta) || 0);
    setSelectedStockItem(null);
    setStockDelta('');
  };

  // Export JSON Backup
  const handleExportBackup = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(fullStore, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `chakkibook_v2_backup_${new Date().toISOString().split('T')[0]}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  return (
    <div className="app-container">
      <div className="section-header">
        <span>⚙️ Rates & Shop Settings</span>
        <span className="section-badge">Master Rates</span>
      </div>

      {savedAlert && (
        <div
          style={{
            background: 'var(--success-bg)',
            color: 'var(--success)',
            padding: '12px 16px',
            borderRadius: 'var(--radius)',
            fontWeight: 700,
            textAlign: 'center',
            fontSize: '0.9rem',
            border: '1px solid var(--success)'
          }}
        >
          ✅ Rates & Settings Save ho gaye!
        </div>
      )}

      <form onSubmit={handleSaveRates} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
        {/* 1. Chakki Rates */}
        <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div className="section-header" style={{ marginBottom: '2px' }}>
            <span>🌾 Chakki Rates (Pisai & Kadda)</span>
          </div>

          <div>
            <label className="input-label">Pisai Rate (₹ per Kg)</label>
            <input
              type="number"
              step="0.5"
              className="form-input"
              value={pisaiRate}
              onChange={(e) => setPisaiRate(e.target.value)}
              required
            />
          </div>

          <div>
            <label className="input-label">Kadda Standard Base (Kg)</label>
            <input
              type="number"
              step="1"
              className="form-input"
              value={kaddaPer}
              onChange={(e) => setKaddaPer(e.target.value)}
              placeholder="e.g. 40 (1 Mann)"
              required
            />
            <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
              Standard 40kg (1 Mann) par kitna kadda kata jata hai
            </span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px' }}>
            <div>
              <label className="input-label" style={{ fontSize: '0.75rem' }}>
                🌾 Gehun (Wheat)
              </label>
              <input
                type="number"
                step="0.1"
                className="form-input"
                value={kaddaWheat}
                onChange={(e) => setKaddaWheat(e.target.value)}
                placeholder="1"
                required
              />
              <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>kg / {kaddaPer}kg</span>
            </div>

            <div>
              <label className="input-label" style={{ fontSize: '0.75rem' }}>
                🧆 Dana (Chana)
              </label>
              <input
                type="number"
                step="0.1"
                className="form-input"
                value={kaddaDana}
                onChange={(e) => setKaddaDana(e.target.value)}
                placeholder="1.5"
                required
              />
              <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>kg / {kaddaPer}kg</span>
            </div>

            <div>
              <label className="input-label" style={{ fontSize: '0.75rem' }}>
                🌽 Makka (Maize)
              </label>
              <input
                type="number"
                step="0.1"
                className="form-input"
                value={kaddaMaize}
                onChange={(e) => setKaddaMaize(e.target.value)}
                placeholder="1"
                required
              />
              <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>kg / {kaddaPer}kg</span>
            </div>
          </div>
        </div>

        {/* 2. Spellar Rates */}
        <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div className="section-header" style={{ marginBottom: '2px' }}>
            <span>🫒 Spellar Rates (Pirai & Khali)</span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
            <div>
              <label className="input-label">🫒 Pirai Charge (₹/kg)</label>
              <input
                type="number"
                step="0.5"
                className="form-input"
                value={piraiRate}
                onChange={(e) => setPiraiRate(e.target.value)}
                required
              />
            </div>

            <div>
              <label className="input-label">📦 Khari Bikri Rate (₹/kg)</label>
              <input
                type="number"
                step="0.5"
                className="form-input"
                value={khariRate}
                onChange={(e) => setKhariRate(e.target.value)}
                required
              />
            </div>
          </div>
        </div>

        {/* 3. Shop Information */}
        <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <div className="section-header" style={{ marginBottom: '2px' }}>
            <span>🏪 Shop Profile</span>
          </div>

          <div>
            <label className="input-label">Dukan ka Naam (Shop Name)</label>
            <input
              type="text"
              className="form-input"
              value={shopName}
              onChange={(e) => setShopName(e.target.value)}
              required
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
            <div>
              <label className="input-label">Owner Naam</label>
              <input
                type="text"
                className="form-input"
                value={ownerName}
                onChange={(e) => setOwnerName(e.target.value)}
              />
            </div>

            <div>
              <label className="input-label">Mobile Number</label>
              <input
                type="tel"
                className="form-input"
                value={shopPhone}
                onChange={(e) => setShopPhone(e.target.value)}
              />
            </div>
          </div>

          <div>
            <label className="input-label">Pata / Address</label>
            <input
              type="text"
              className="form-input"
              value={shopAddress}
              onChange={(e) => setShopAddress(e.target.value)}
            />
          </div>
        </div>

        {/* SAVE BUTTON */}
        <button type="submit" className="big-btn">
          <span>💾</span>
          <span>SAVE RATES & SETTINGS</span>
        </button>
      </form>

      {/* 4. Spellar Stock Overview */}
      <section>
        <div className="section-header">
          <span>📦 Spellar Stock Tracking</span>
          <span className="section-badge">Live Stock</span>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {inventory.map((item) => (
            <div
              key={item.id}
              className="card"
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '12px 14px'
              }}
            >
              <div>
                <strong style={{ fontSize: '1rem' }}>{item.name}</strong>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                  Unit: {item.unit}
                </div>
              </div>

              <div style={{ textAlign: 'right', display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div className="big-number" style={{ fontSize: '1.4rem' }}>
                  {item.stock} <span style={{ fontSize: '0.8rem', fontWeight: 600 }}>{item.unit}</span>
                </div>
                <button
                  type="button"
                  className="btn-secondary-action"
                  style={{ width: 'auto', padding: '4px 10px', height: '36px', minHeight: '36px', fontSize: '0.8rem' }}
                  onClick={() => setSelectedStockItem(item)}
                >
                  ✏️ Adjust
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Stock Adjustment Dialog */}
        {selectedStockItem && (
          <div className="card" style={{ marginTop: '10px', background: 'var(--primary-light)' }}>
            <h4 style={{ fontSize: '0.95rem', marginBottom: '8px' }}>
              Stock Adjust: {selectedStockItem.name}
            </h4>
            <form onSubmit={handleStockUpdate} style={{ display: 'flex', gap: '8px' }}>
              <input
                type="number"
                step="0.5"
                className="form-input"
                placeholder="+ Add ya - Minus"
                value={stockDelta}
                onChange={(e) => setStockDelta(e.target.value)}
                required
                autoFocus
              />
              <button type="submit" className="big-btn" style={{ width: 'auto', minWidth: '100px', height: '48px', minHeight: '48px' }}>
                Save
              </button>
              <button
                type="button"
                className="btn-secondary-action"
                style={{ width: 'auto', height: '48px', minHeight: '48px' }}
                onClick={() => setSelectedStockItem(null)}
              >
                Cancel
              </button>
            </form>
          </div>
        )}
      </section>

      {/* 5. Data Backup & Export */}
      <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        <div className="section-header" style={{ marginBottom: '2px' }}>
          <span>💾 Data Backup & Suraksha</span>
        </div>
        <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
          Apne sabhi grahak khata, pending boris, aur hisab kitab ka safe backup file download karein.
        </p>
        <button
          type="button"
          onClick={handleExportBackup}
          className="btn-secondary-action"
          style={{ height: '48px', minHeight: '48px' }}
        >
          <span>📥</span>
          <span>Download JSON Backup</span>
        </button>
      </div>
    </div>
  );
}
