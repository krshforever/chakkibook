import React, { useState } from 'react';
import { useStore } from '../store/useStore';
import { logoutUser } from '../firebase/auth';

export default function Settings() {
  const shop = useStore((state) => state.shop);
  const userRole = useStore((state) => state.userRole);
  const currentUser = useStore((state) => state.currentUser);
  const members = useStore((state) => state.members || []);
  const hasPermission = useStore((state) => state.hasPermission);
  const updateShopRates = useStore((state) => state.updateShopRates);
  const updateShopInfo = useStore((state) => state.updateShopInfo);
  const updateSmsSettings = useStore((state) => state.updateSmsSettings);
  const addTeamMember = useStore((state) => state.addTeamMember);
  const removeTeamMember = useStore((state) => state.removeTeamMember);
  const inventory = useStore((state) => state.inventory);
  const updateStock = useStore((state) => state.updateStock);
  const logout = useStore((state) => state.logout);
  const fullStore = useStore((state) => state);

  // Form State: Rates
  const [pisaiRate, setPisaiRate] = useState(shop.chakkiRates?.pisai || 4);
  const [kaddaWheat, setKaddaWheat] = useState(shop.chakkiRates?.kadda?.wheat || 1);
  const [kaddaDana, setKaddaDana] = useState(shop.chakkiRates?.kadda?.dana || 1.5);
  const [kaddaMaize, setKaddaMaize] = useState(shop.chakkiRates?.kadda?.maize || 1);
  const [kaddaPer, setKaddaPer] = useState(shop.chakkiRates?.kaddaPer || 40);

  const [piraiRate, setPiraiRate] = useState(shop.spellarRates?.pirai || 12);
  const [khariRate, setKhariRate] = useState(shop.spellarRates?.khari || 35);

  // Form State: Shop Info
  const [shopName, setShopName] = useState(shop.name || 'Vanshu Atta Chakki & Oil Mill');
  const [shopPhone, setShopPhone] = useState(shop.phone || '9876543210');
  const [ownerName, setOwnerName] = useState(shop.ownerName || 'Bhaiya');
  const [shopAddress, setShopAddress] = useState(shop.address || 'Main Market Road, Ward 4');

  // Form State: Team Member Add
  const [newMemberName, setNewMemberName] = useState('');
  const [newMemberPhone, setNewMemberPhone] = useState('');
  const [newMemberRole, setNewMemberRole] = useState('operator');

  // Stock Adjustment State
  const [selectedStockItem, setSelectedStockItem] = useState(null);
  const [stockDelta, setStockDelta] = useState('');

  const [savedAlert, setSavedAlert] = useState(false);

  // Save Rates
  const handleSaveRates = (e) => {
    e.preventDefault();
    if (!hasPermission('changeRates')) return;

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

  // Add Member
  const handleAddMember = (e) => {
    e.preventDefault();
    if (!newMemberPhone || !newMemberName) return;
    addTeamMember(newMemberPhone.replace(/\D/g, ''), newMemberName.trim(), newMemberRole);
    setNewMemberName('');
    setNewMemberPhone('');
  };

  // SMS Settings Toggle
  const handleSmsToggle = (key) => {
    if (!hasPermission('smsSettings')) return;
    const cur = shop.smsSettings || {};
    updateSmsSettings({
      [key]: !cur[key]
    });
  };

  // Stock Adjustment
  const handleStockUpdate = (e) => {
    e.preventDefault();
    if (!selectedStockItem || !stockDelta) return;
    updateStock(selectedStockItem.id, parseFloat(stockDelta) || 0);
    setSelectedStockItem(null);
    setStockDelta('');
  };

  // Logout Handler
  const handleLogout = async () => {
    if (window.confirm('Kya aap logout karna chahte hain?')) {
      await logoutUser();
      logout();
    }
  };

  // Export JSON Backup
  const handleExportBackup = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(fullStore, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `chakkibook_backup_${new Date().toISOString().split('T')[0]}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  return (
    <div className="app-container">
      {/* Top Profile & Logout Card */}
      <div style={{
        backgroundColor: '#ffffff',
        border: '1.5px solid #cbd5e1',
        borderRadius: '1rem',
        padding: '1.25rem',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        boxShadow: '0 2px 6px rgba(0,0,0,0.03)'
      }}>
        <div>
          <div style={{ fontSize: '0.78rem', color: '#64748b', fontWeight: 600 }}>
            Active Shop Account ({userRole || 'owner'})
          </div>
          <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: '#020617', margin: '2px 0 0 0' }}>
            {shop.name || 'Atta Chakki Dukan'}
          </h3>
          <div style={{ fontSize: '0.8rem', color: '#475569', fontWeight: 500, marginTop: '2px' }}>
            Mobile: {shop.phone || '9876543210'}
          </div>
        </div>
        <button
          type="button"
          onClick={handleLogout}
          style={{
            minHeight: '48px',
            padding: '0 16px',
            borderRadius: '0.75rem',
            backgroundColor: '#fee2e2',
            color: '#dc2626',
            border: '1.5px solid #fca5a5',
            fontSize: '0.88rem',
            fontWeight: 800,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '6px'
          }}
        >
          🚪 Logout Karein
        </button>
      </div>

      <div className="section-header">
        <span>⚙️ Settings & Team Control</span>
        <span className="section-badge">{userRole} mode</span>
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
          ✅ Settings Save ho gaye!
        </div>
      )}

      {/* 1. SMS Settings */}
      {hasPermission('smsSettings') && (
        <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <div className="section-header" style={{ marginBottom: '2px' }}>
            <span>📱 SMS Auto-Notifications</span>
            <span className="section-badge" style={{ background: '#22c55e', color: '#fff' }}>Free Native</span>
          </div>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: 0 }}>
            Jab bori jama ho ya pisai complete ho, aapke phone se customer ko auto SMS composer trigger hoga.
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '6px' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '0.95rem', fontWeight: '700', cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={shop.smsSettings?.enabled ?? true}
                onChange={() => handleSmsToggle('enabled')}
                style={{ width: '20px', height: '20px' }}
              />
              <span>📱 Master SMS Enable (All Notifications)</span>
            </label>

            <div style={{ paddingLeft: '1.75rem', display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.88rem', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  disabled={!shop.smsSettings?.enabled}
                  checked={shop.smsSettings?.onDropOff ?? true}
                  onChange={() => handleSmsToggle('onDropOff')}
                />
                <span>🌾 Bori Jama Hone Par (Drop-off)</span>
              </label>

              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.88rem', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  disabled={!shop.smsSettings?.enabled}
                  checked={shop.smsSettings?.onDone ?? true}
                  onChange={() => handleSmsToggle('onDone')}
                />
                <span>✅ Pisai/Pirai Complete Hone Par (Done)</span>
              </label>

              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.88rem', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  disabled={!shop.smsSettings?.enabled}
                  checked={shop.smsSettings?.onPickedUp ?? true}
                  onChange={() => handleSmsToggle('onPickedUp')}
                />
                <span>🧾 Maal Le Jaane Par (Picked Up)</span>
              </label>
            </div>
          </div>
        </div>
      )}

      {/* 2. Team Control / Operators (Owner Only) */}
      {hasPermission('manageMembers') && (
        <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div className="section-header" style={{ marginBottom: '2px' }}>
            <span>👥 Team Members & Operators</span>
            <span className="section-badge">{members.length + 1} members</span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 12px', background: 'rgba(255,255,255,0.05)', borderRadius: '0.5rem' }}>
              <div>
                <strong>{shop.ownerName || 'Owner'} (Aap)</strong>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{shop.phone} • Owner</div>
              </div>
              <span className="section-badge" style={{ background: '#eab308', color: '#000' }}>OWNER</span>
            </div>

            {members.map((m) => (
              <div key={m.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 12px', background: 'rgba(255,255,255,0.03)', borderRadius: '0.5rem' }}>
                <div>
                  <strong>{m.name}</strong>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{m.phone} • {m.role}</div>
                </div>
                <button
                  type="button"
                  onClick={() => removeTeamMember(m.id)}
                  style={{ background: '#991b1b', color: '#fff', border: 'none', borderRadius: '0.35rem', padding: '4px 8px', fontSize: '0.75rem', cursor: 'pointer' }}
                >
                  🗑️ Hataayein
                </button>
              </div>
            ))}
          </div>

          {/* Add Member Form */}
          <form onSubmit={handleAddMember} style={{ borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '10px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <span style={{ fontSize: '0.85rem', fontWeight: '700' }}>➕ Naya Operator/Member Jodein</span>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
              <input
                type="text"
                placeholder="Naam (e.g. Raju)"
                value={newMemberName}
                onChange={(e) => setNewMemberName(e.target.value)}
                className="form-input"
                required
              />
              <input
                type="tel"
                placeholder="10-digit Mobile"
                maxLength="10"
                value={newMemberPhone}
                onChange={(e) => setNewMemberPhone(e.target.value)}
                className="form-input"
                required
              />
            </div>
            <div style={{ display: 'flex', gap: '8px' }}>
              <select
                value={newMemberRole}
                onChange={(e) => setNewMemberRole(e.target.value)}
                className="form-input"
                style={{ flex: 1 }}
              >
                <option value="operator">Operator (Add & Finish Entries)</option>
                <option value="viewer">Viewer (Only View Data)</option>
              </select>
              <button type="submit" className="big-btn" style={{ width: 'auto', minWidth: '100px', minHeight: '44px' }}>
                + Add Member
              </button>
            </div>
          </form>
        </div>
      )}

      {/* 3. Rates Form */}
      {hasPermission('changeRates') && (
        <form onSubmit={handleSaveRates} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {/* Chakki Rates */}
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
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px' }}>
              <div>
                <label className="input-label" style={{ fontSize: '0.75rem' }}>Gehun (Wheat)</label>
                <input
                  type="number"
                  step="0.1"
                  className="form-input"
                  value={kaddaWheat}
                  onChange={(e) => setKaddaWheat(e.target.value)}
                  required
                />
              </div>

              <div>
                <label className="input-label" style={{ fontSize: '0.75rem' }}>Dana (Chana)</label>
                <input
                  type="number"
                  step="0.1"
                  className="form-input"
                  value={kaddaDana}
                  onChange={(e) => setKaddaDana(e.target.value)}
                  required
                />
              </div>

              <div>
                <label className="input-label" style={{ fontSize: '0.75rem' }}>Makka (Maize)</label>
                <input
                  type="number"
                  step="0.1"
                  className="form-input"
                  value={kaddaMaize}
                  onChange={(e) => setKaddaMaize(e.target.value)}
                  required
                />
              </div>
            </div>
          </div>

          {/* Spellar Rates */}
          <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div className="section-header" style={{ marginBottom: '2px' }}>
              <span>🫒 Spellar Rates (Pirai & Khali)</span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
              <div>
                <label className="input-label">Pirai Charge (₹/kg)</label>
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
                <label className="input-label">Khari Bikri Rate (₹/kg)</label>
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

          {/* Shop Profile */}
          <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <div className="section-header" style={{ marginBottom: '2px' }}>
              <span>🏪 Shop Profile</span>
            </div>

            <div>
              <label className="input-label">Dukan ka Naam</label>
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
          </div>

          <button type="submit" className="big-btn">
            <span>💾 SAVE ALL SETTINGS</span>
          </button>
        </form>
      )}

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
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Unit: {item.unit}</div>
              </div>

              <div style={{ textAlign: 'right', display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div className="big-number" style={{ fontSize: '1.4rem' }}>
                  {item.stock} <span style={{ fontSize: '0.8rem', fontWeight: 600 }}>{item.unit}</span>
                </div>
                {hasPermission('adjustStock') && (
                  <button
                    type="button"
                    className="btn-secondary-action"
                    style={{ width: 'auto', padding: '4px 10px', height: '36px', minHeight: '36px', fontSize: '0.8rem' }}
                    onClick={() => setSelectedStockItem(item)}
                  >
                    ✏️ Adjust
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>

        {selectedStockItem && (
          <div className="card" style={{ marginTop: '10px', background: 'var(--primary-light)' }}>
            <h4 style={{ fontSize: '0.95rem', marginBottom: '8px' }}>Stock Adjust: {selectedStockItem.name}</h4>
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

      {/* Backup */}
      {hasPermission('exportBackup') && (
        <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <div className="section-header" style={{ marginBottom: '2px' }}>
            <span>💾 Data Backup & Suraksha</span>
          </div>
          <button
            type="button"
            onClick={handleExportBackup}
            className="btn-secondary-action"
            style={{ height: '48px', minHeight: '48px' }}
          >
            <span>📥 Download JSON Backup</span>
          </button>
        </div>
      )}
    </div>
  );
}
