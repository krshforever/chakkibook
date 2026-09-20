import React, { useState } from 'react';
import { useStore } from '../store/useStore';
import { logoutUser } from '../firebase/auth';
import { useTranslation } from '../utils/translations';
import { 
  ChevronDown,
  ChevronUp,
  Settings as SettingsIcon, 
  User, 
  LogOut, 
  Globe, 
  Languages, 
  MessageSquare, 
  MessageSquareText, 
  Users, 
  UserPlus, 
  Trash2, 
  Wheat, 
  Droplet, 
  Flame, 
  Store, 
  Save, 
  Download, 
  Check, 
  X, 
  Wrench, 
  Zap, 
  Gauge, 
  Activity, 
  Sliders, 
  ShieldAlert, 
  ShieldCheck, 
  FileText, 
  HardDrive,
  Cpu,
  Layers,
  CircleDollarSign
} from 'lucide-react';

export default function Settings() {
  const { t } = useTranslation();
  const shop = useStore((state) => state.shop || {});
  const userRole = useStore((state) => state.userRole || 'owner');
  const currentUser = useStore((state) => state.currentUser);
  const members = useStore((state) => state.members || []);
  const hasPermission = useStore((state) => state.hasPermission);
  const updateShopRates = useStore((state) => state.updateShopRates);
  const updateShopInfo = useStore((state) => state.updateShopInfo);
  const updateSmsSettings = useStore((state) => state.updateSmsSettings);
  const addTeamMember = useStore((state) => state.addTeamMember);
  const removeTeamMember = useStore((state) => state.removeTeamMember);
  const inventory = useStore((state) => state.inventory || []);
  const updateStock = useStore((state) => state.updateStock);
  const logout = useStore((state) => state.logout);
  const language = useStore((state) => state.language || 'hinglish');
  const setLanguage = useStore((state) => state.setLanguage);
  const machineLogs = useStore((state) => state.machineLogs || []);
  const addMachineLog = useStore((state) => state.addMachineLog);
  const fullStore = useStore((state) => state);

  // Form State: Rates for Primary Grains
  const [rateGehun, setRateGehun] = useState(shop.chakkiRates?.grainRates?.gehun ?? shop.chakkiRates?.pisai ?? 4);
  const [rateBajra, setRateBajra] = useState(shop.chakkiRates?.grainRates?.bajra ?? 4.5);
  const [rateMakka, setRateMakka] = useState(shop.chakkiRates?.grainRates?.makka ?? 4.5);
  const [rateChana, setRateChana] = useState(shop.chakkiRates?.grainRates?.chana ?? 5.5);

  const [kaddaGehun, setKaddaGehun] = useState(shop.chakkiRates?.kadda?.gehun ?? shop.chakkiRates?.kadda?.wheat ?? 1);
  const [kaddaBajra, setKaddaBajra] = useState(shop.chakkiRates?.kadda?.bajra ?? 1);
  const [kaddaMakka, setKaddaMakka] = useState(shop.chakkiRates?.kadda?.makka ?? shop.chakkiRates?.kadda?.maize ?? 1.25);
  const [kaddaChana, setKaddaChana] = useState(shop.chakkiRates?.kadda?.chana ?? shop.chakkiRates?.kadda?.dana ?? 1.5);
  const [kaddaPer, setKaddaPer] = useState(shop.chakkiRates?.kaddaPer || 40);

  const [piraiRate, setPiraiRate] = useState(shop.spellarRates?.pirai || 12);
  const [khariRate, setKhariRate] = useState(shop.spellarRates?.khari || 35);
  const [oilRate, setOilRate] = useState(shop.spellarRates?.oil || 140);

  // Form State: Shop Info
  const [shopName, setShopName] = useState(shop.name || 'Vanshu Atta Chakki & Oil Mill');
  const [shopPhone, setShopPhone] = useState(shop.phone || '9876543210');
  const [ownerName, setOwnerName] = useState(shop.ownerName || 'Bhaiya');
  const [shopAddress, setShopAddress] = useState(shop.address || 'Main Market Road, Ward 4');

  // Form State: Team Member Add
  const [newMemberName, setNewMemberName] = useState('');
  const [newMemberPhone, setNewMemberPhone] = useState('');
  const [newMemberRole, setNewMemberRole] = useState('operator');

  // Modal States
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [showMaintenanceModal, setShowMaintenanceModal] = useState(false);

  // Machine Log Form State
  const [motorTemp, setMotorTemp] = useState('42°C Normal');
  const [beltTension, setBeltTension] = useState('OK');
  const [stoneWearPercent, setStoneWearPercent] = useState('15');
  const [electricityUnits, setElectricityUnits] = useState('45');
  const [dieselLitres, setDieselLitres] = useState('0');
  const [maintenanceNotes, setMaintenanceNotes] = useState('');

  // Stock Adjustment State
  const [selectedStockItem, setSelectedStockItem] = useState(null);
  const [stockDelta, setStockDelta] = useState('');

  const [savedAlert, setSavedAlert] = useState(false);

  // Accordion Collapsible Sections State
  const [openSections, setOpenSections] = useState({
    language: true,      // Language selection open by default
    chakkiRates: true,   // Chakki rates open by default
    spellarRates: false, // Spellar rates
    shopProfile: false,  // Shop info
    maintenance: false,  // Maintenance log
    team: false,         // Team members
    sms: false,          // SMS settings
    backup: false        // Data backup
  });

  const toggleSection = (key) => {
    setOpenSections((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  // Save Rates & Shop Profile
  const handleSaveRates = (e) => {
    e.preventDefault();
    if (!hasPermission('changeRates')) return;

    updateShopRates({
      chakkiRates: {
        pisai: parseFloat(rateGehun) || 4,
        grainRates: {
          gehun: parseFloat(rateGehun) || 4,
          bajra: parseFloat(rateBajra) || 4.5,
          makka: parseFloat(rateMakka) || 4.5,
          chana: parseFloat(rateChana) || 5.5,
          multigrain: 5
        },
        kadda: {
          gehun: parseFloat(kaddaGehun) || 1,
          bajra: parseFloat(kaddaBajra) || 1,
          makka: parseFloat(kaddaMakka) || 1.25,
          chana: parseFloat(kaddaChana) || 1.5,
          wheat: parseFloat(kaddaGehun) || 1,
          dana: parseFloat(kaddaChana) || 1.5,
          maize: parseFloat(kaddaMakka) || 1.25
        },
        kaddaPer: parseFloat(kaddaPer) || 40,
      },
      spellarRates: {
        pirai: parseFloat(piraiRate) || 12,
        khari: parseFloat(khariRate) || 35,
        oil: parseFloat(oilRate) || 140
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

  // Save Machine Log
  const handleSaveMachineLog = (e) => {
    e.preventDefault();
    addMachineLog({
      motorTemp: motorTemp.trim() || '40°C',
      beltTension: beltTension.trim() || 'OK',
      stoneWearPercent: Number(stoneWearPercent) || 0,
      electricityUnits: Number(electricityUnits) || 0,
      dieselLitres: Number(dieselLitres) || 0,
      notes: maintenanceNotes.trim() || 'Routine checkup'
    });
    setMaintenanceNotes('');
    setShowMaintenanceModal(false);
  };

  // Confirmation Logout Handler
  const handleConfirmLogout = async () => {
    await logoutUser();
    logout();
    setShowLogoutModal(false);
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
      {/* TOP SHOP PROFILE & SAFE LOGOUT CARD */}
      <div 
        style={{
          backgroundColor: 'var(--card-bg)',
          border: '1.5px solid var(--card-border)',
          borderRadius: 'var(--radius)',
          padding: '1.25rem',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          boxShadow: 'var(--shadow-sm)'
        }}
      >
        <div>
          <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '6px' }}>
            <User size={14} style={{ color: 'var(--primary)' }} />
            <span>{t('settings.activeAccount')} ({userRole})</span>
          </div>
          <h3 style={{ fontSize: '1.2rem', fontWeight: 900, color: 'var(--text-main)', margin: '4px 0 0 0' }}>
            {shop.name || 'Atta Chakki Dukan'}
          </h3>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600, marginTop: '2px' }}>
            {t('settings.mobile')} {shop.phone || '9876543210'}
          </div>
        </div>

        <button
          type="button"
          onClick={() => setShowLogoutModal(true)}
          style={{
            minHeight: '44px',
            padding: '0 16px',
            borderRadius: '0.75rem',
            backgroundColor: 'rgba(239, 68, 68, 0.1)',
            color: '#ef4444',
            border: '1.5px solid #ef4444',
            fontSize: '0.88rem',
            fontWeight: 800,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            transition: 'all 0.2s ease'
          }}
        >
          <LogOut size={16} />
          <span>{t('settings.logoutBtn')}</span>
        </button>
      </div>

      <div className="section-header" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <SettingsIcon size={18} style={{ color: 'var(--primary)' }} />
        <span>{t('settings.title')}</span>
        <span className="section-badge">{userRole} mode</span>
      </div>

      {savedAlert && (
        <div
          style={{
            background: 'var(--success-bg)',
            color: 'var(--success)',
            padding: '12px 16px',
            borderRadius: 'var(--radius)',
            fontWeight: 800,
            textAlign: 'center',
            fontSize: '0.9rem',
            border: '1px solid var(--success)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px'
          }}
        >
          <Check size={18} />
          <span>{t('settings.settingsSaved')}</span>
        </div>
      )}

      {/* 1. 3-OPTION LANGUAGE SELECTOR RADIO CARD (Collapsible) */}
      <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: openSections.language ? '12px' : '0' }}>
        <button
          type="button"
          onClick={() => toggleSection('language')}
          style={{
            background: 'none',
            border: 'none',
            padding: 0,
            width: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            cursor: 'pointer',
            textAlign: 'left'
          }}
        >
          <div className="section-header" style={{ marginBottom: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Languages size={18} style={{ color: 'var(--primary)' }} />
            <span>{t('settings.languageSelection')}</span>
            <span className="section-badge" style={{ background: 'var(--primary)', color: '#fff' }}>
              {language === 'hinglish' ? 'Hinglish' : language === 'hi' ? 'शुद्ध हिंदी' : 'English'}
            </span>
          </div>
          {openSections.language ? <ChevronUp size={18} style={{ color: 'var(--text-muted)' }} /> : <ChevronDown size={18} style={{ color: 'var(--text-muted)' }} />}
        </button>

        {openSections.language && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px', paddingTop: '4px' }}>
            {[
              { id: 'hinglish', label: 'Hinglish', sub: '(Default / भाषा)', icon: MessageSquare },
              { id: 'hi', label: 'शुद्ध हिंदी', sub: '(Pure Hindi)', icon: Globe },
              { id: 'en', label: 'English', sub: '(Export / Formal)', icon: Languages }
            ].map((langOpt) => {
              const isSelected = language === langOpt.id;
              const IconComponent = langOpt.icon;
              return (
                <label
                  key={langOpt.id}
                  onClick={() => setLanguage(langOpt.id)}
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: '12px 8px',
                    borderRadius: '0.75rem',
                    border: isSelected ? '2px solid var(--primary)' : '1.5px solid var(--card-border)',
                    backgroundColor: isSelected ? 'var(--bg-elevated)' : 'var(--card-bg)',
                    cursor: 'pointer',
                    textAlign: 'center',
                    boxShadow: isSelected ? '0 2px 8px rgba(217, 119, 6, 0.15)' : 'none',
                    transition: 'all 0.15s ease'
                  }}
                >
                  <input
                    type="radio"
                    name="language"
                    value={langOpt.id}
                    checked={isSelected}
                    onChange={() => setLanguage(langOpt.id)}
                    style={{ marginBottom: '6px', accentColor: 'var(--primary)', width: '16px', height: '16px' }}
                  />
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: isSelected ? 'var(--primary)' : 'var(--text-main)' }}>
                    <IconComponent size={14} />
                    <strong style={{ fontSize: '0.88rem', fontWeight: 800 }}>
                      {langOpt.label}
                    </strong>
                  </div>
                  <span style={{ fontSize: '0.72rem', color: isSelected ? 'var(--primary-dark)' : 'var(--text-muted)', marginTop: '2px', fontWeight: 600 }}>
                    {langOpt.sub}
                  </span>
                </label>
              );
            })}
          </div>
        )}
      </div>

      {/* 2. MACHINE MAINTENANCE & ELECTRICITY METER TRACKER TRIGGER & MODAL (Collapsible) */}
      <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: openSections.maintenance ? '12px' : '0' }}>
        <button
          type="button"
          onClick={() => toggleSection('maintenance')}
          style={{
            background: 'none',
            border: 'none',
            padding: 0,
            width: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            cursor: 'pointer',
            textAlign: 'left'
          }}
        >
          <div className="section-header" style={{ marginBottom: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Wrench size={18} style={{ color: 'var(--primary)' }} />
            <span>{t('settings.machineMaintenanceTitle')}</span>
            <span className="section-badge">{machineLogs.length} logs</span>
          </div>
          {openSections.maintenance ? <ChevronUp size={18} style={{ color: 'var(--text-muted)' }} /> : <ChevronDown size={18} style={{ color: 'var(--text-muted)' }} />}
        </button>

        {openSections.maintenance && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', paddingTop: '4px' }}>
            <button
              type="button"
              onClick={() => setShowMaintenanceModal(true)}
              className="big-btn"
              style={{ 
                minHeight: '48px', 
                fontSize: '0.95rem', 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center', 
                gap: '8px' 
              }}
            >
              <Activity size={18} />
              <span>{t('settings.openMaintenanceModal')}</span>
            </button>

            {/* Recent Machine Maintenance Logs List */}
            {machineLogs.length > 0 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '4px' }}>
                <span style={{ fontSize: '0.8rem', fontWeight: 800, color: 'var(--text-muted)' }}>
                  {t('settings.recentLogs')}
                </span>

                {machineLogs.slice(0, 3).map((log) => (
                  <div 
                    key={log.id} 
                    style={{ 
                      background: 'var(--bg-elevated)', 
                      padding: '10px 12px', 
                      borderRadius: '0.5rem', 
                      border: '1px solid var(--card-border)',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center'
                    }}
                  >
                    <div>
                      <div style={{ fontWeight: 800, fontSize: '0.88rem', color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <Cpu size={14} style={{ color: 'var(--primary)' }} />
                        <span>{log.notes || 'Routine Log'}</span>
                      </div>
                      <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                        {new Date(log.date).toLocaleDateString('en-IN')} • Temp: {log.motorTemp} • Wear: {log.stoneWearPercent}%
                      </div>
                    </div>

                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontWeight: 800, fontSize: '0.9rem', color: 'var(--primary)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <Zap size={14} />
                        <span>{log.electricityUnits} kWh</span>
                      </div>
                      {log.dieselLitres > 0 && (
                        <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                          Diesel: {log.dieselLitres}L
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* 3. GRAIN RATE & KADDA MATRIX GRID */}
      {hasPermission('changeRates') && (
        <form onSubmit={handleSaveRates} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {/* Chakki Rates Card (Collapsible) */}
          <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: openSections.chakkiRates ? '14px' : '0' }}>
            <button
              type="button"
              onClick={() => toggleSection('chakkiRates')}
              style={{
                background: 'none',
                border: 'none',
                padding: 0,
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                cursor: 'pointer',
                textAlign: 'left'
              }}
            >
              <div className="section-header" style={{ marginBottom: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Wheat size={18} style={{ color: '#f59e0b' }} />
                <span>{t('settings.chakkiRatesTitle')}</span>
              </div>
              {openSections.chakkiRates ? <ChevronUp size={18} style={{ color: 'var(--text-muted)' }} /> : <ChevronDown size={18} style={{ color: 'var(--text-muted)' }} />}
            </button>

            {openSections.chakkiRates && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', paddingTop: '4px' }}>
                <div>
                  <label className="input-label" style={{ fontWeight: 800 }}>{t('settings.kaddaBase')}</label>
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
                    {t('settings.kaddaBaseNotice')}
                  </span>
                </div>

                {/* Primary Grains Rate & Kadda Matrix Grid */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  <span style={{ fontSize: '0.88rem', fontWeight: 800, color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Layers size={15} style={{ color: 'var(--primary)' }} />
                    <span>{t('settings.primaryGrains')} ({kaddaPer}kg Base)</span>
                  </span>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px' }}>
                    {/* Gehun / Wheat */}
                    <div style={{ background: 'var(--bg-elevated)', padding: '12px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--card-border)' }}>
                      <strong style={{ fontSize: '0.9rem', color: '#f59e0b', display: 'flex', alignItems: 'center', gap: '5px' }}>
                        <Wheat size={15} />
                        <span>Gehun (गेहूँ)</span>
                      </strong>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px', marginTop: '8px' }}>
                        <div>
                          <label style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 700 }}>Rate (₹/kg)</label>
                          <input
                            type="number"
                            step="0.5"
                            className="form-input"
                            value={rateGehun}
                            onChange={(e) => setRateGehun(e.target.value)}
                            required
                          />
                        </div>
                        <div>
                          <label style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 700 }}>Kadda (kg)</label>
                          <input
                            type="number"
                            step="0.1"
                            className="form-input"
                            value={kaddaGehun}
                            onChange={(e) => setKaddaGehun(e.target.value)}
                            required
                          />
                        </div>
                      </div>
                    </div>

                    {/* Bajra / Millet */}
                    <div style={{ background: 'var(--bg-elevated)', padding: '12px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--card-border)' }}>
                      <strong style={{ fontSize: '0.9rem', color: '#f59e0b', display: 'flex', alignItems: 'center', gap: '5px' }}>
                        <Wheat size={15} />
                        <span>Bajra (बाजरा)</span>
                      </strong>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px', marginTop: '8px' }}>
                        <div>
                          <label style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 700 }}>Rate (₹/kg)</label>
                          <input
                            type="number"
                            step="0.5"
                            className="form-input"
                            value={rateBajra}
                            onChange={(e) => setRateBajra(e.target.value)}
                            required
                          />
                        </div>
                        <div>
                          <label style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 700 }}>Kadda (kg)</label>
                          <input
                            type="number"
                            step="0.1"
                            className="form-input"
                            value={kaddaBajra}
                            onChange={(e) => setKaddaBajra(e.target.value)}
                            required
                          />
                        </div>
                      </div>
                    </div>

                    {/* Makka / Maize */}
                    <div style={{ background: 'var(--bg-elevated)', padding: '12px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--card-border)' }}>
                      <strong style={{ fontSize: '0.9rem', color: '#f59e0b', display: 'flex', alignItems: 'center', gap: '5px' }}>
                        <Wheat size={15} />
                        <span>Makka (मक्का)</span>
                      </strong>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px', marginTop: '8px' }}>
                        <div>
                          <label style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 700 }}>Rate (₹/kg)</label>
                          <input
                            type="number"
                            step="0.5"
                            className="form-input"
                            value={rateMakka}
                            onChange={(e) => setRateMakka(e.target.value)}
                            required
                          />
                        </div>
                        <div>
                          <label style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 700 }}>Kadda (kg)</label>
                          <input
                            type="number"
                            step="0.1"
                            className="form-input"
                            value={kaddaMakka}
                            onChange={(e) => setKaddaMakka(e.target.value)}
                            required
                          />
                        </div>
                      </div>
                    </div>

                    {/* Chana / Besan */}
                    <div style={{ background: 'var(--bg-elevated)', padding: '12px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--card-border)' }}>
                      <strong style={{ fontSize: '0.9rem', color: '#f59e0b', display: 'flex', alignItems: 'center', gap: '5px' }}>
                        <Wheat size={15} />
                        <span>Chana (चना / बेसन)</span>
                      </strong>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px', marginTop: '8px' }}>
                        <div>
                          <label style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 700 }}>Rate (₹/kg)</label>
                          <input
                            type="number"
                            step="0.5"
                            className="form-input"
                            value={rateChana}
                            onChange={(e) => setRateChana(e.target.value)}
                            required
                          />
                        </div>
                        <div>
                          <label style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 700 }}>Kadda (kg)</label>
                          <input
                            type="number"
                            step="0.1"
                            className="form-input"
                            value={kaddaChana}
                            onChange={(e) => setKaddaChana(e.target.value)}
                            required
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* 4. SPELLAR PRESSING & KHALI RATE ADMIN CARDS (Collapsible) */}
          <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: openSections.spellarRates ? '12px' : '0' }}>
            <button
              type="button"
              onClick={() => toggleSection('spellarRates')}
              style={{
                background: 'none',
                border: 'none',
                padding: 0,
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                cursor: 'pointer',
                textAlign: 'left'
              }}
            >
              <div className="section-header" style={{ marginBottom: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Droplet size={18} style={{ color: '#3b82f6' }} />
                <span>{t('settings.spellarRatesTitle')}</span>
              </div>
              {openSections.spellarRates ? <ChevronUp size={18} style={{ color: 'var(--text-muted)' }} /> : <ChevronDown size={18} style={{ color: 'var(--text-muted)' }} />}
            </button>

            {openSections.spellarRates && (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px', paddingTop: '4px' }}>
                <div>
                  <label className="input-label" style={{ fontSize: '0.75rem' }}>{t('settings.piraiChargeLabel')}</label>
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
                  <label className="input-label" style={{ fontSize: '0.75rem' }}>{t('settings.khariRateLabel')}</label>
                  <input
                    type="number"
                    step="0.5"
                    className="form-input"
                    value={khariRate}
                    onChange={(e) => setKhariRate(e.target.value)}
                    required
                  />
                </div>

                <div>
                  <label className="input-label" style={{ fontSize: '0.75rem' }}>{t('settings.oilRateLabel')}</label>
                  <input
                    type="number"
                    step="1"
                    className="form-input"
                    value={oilRate}
                    onChange={(e) => setOilRate(e.target.value)}
                    required
                  />
                </div>
              </div>
            )}
          </div>

          {/* 5. SHOP PROFILE (Collapsible) */}
          <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: openSections.shopProfile ? '10px' : '0' }}>
            <button
              type="button"
              onClick={() => toggleSection('shopProfile')}
              style={{
                background: 'none',
                border: 'none',
                padding: 0,
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                cursor: 'pointer',
                textAlign: 'left'
              }}
            >
              <div className="section-header" style={{ marginBottom: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Store size={18} style={{ color: 'var(--primary)' }} />
                <span>{t('settings.shopProfileTitle')}</span>
              </div>
              {openSections.shopProfile ? <ChevronUp size={18} style={{ color: 'var(--text-muted)' }} /> : <ChevronDown size={18} style={{ color: 'var(--text-muted)' }} />}
            </button>

            {openSections.shopProfile && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', paddingTop: '4px' }}>
                <div>
                  <label className="input-label">{t('settings.shopNameLabel')}</label>
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
                    <label className="input-label">{t('settings.ownerNameLabel')}</label>
                    <input
                      type="text"
                      className="form-input"
                      value={ownerName}
                      onChange={(e) => setOwnerName(e.target.value)}
                    />
                  </div>

                  <div>
                    <label className="input-label">{t('settings.mobileNumberLabel')}</label>
                    <input
                      type="tel"
                      className="form-input"
                      value={shopPhone}
                      onChange={(e) => setShopPhone(e.target.value)}
                    />
                  </div>
                </div>
              </div>
            )}
          </div>

          <button 
            type="submit" 
            className="big-btn"
            style={{ 
              minHeight: '50px', 
              fontSize: '1rem', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center', 
              gap: '8px' 
            }}
          >
            <Save size={18} />
            <span>{t('settings.saveAllSettings')}</span>
          </button>
        </form>
      )}

      {/* 6. TEAM MEMBERS & OPERATORS (Owner Only - Collapsible) */}
      {hasPermission('manageMembers') && (
        <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: openSections.team ? '12px' : '0' }}>
          <button
            type="button"
            onClick={() => toggleSection('team')}
            style={{
              background: 'none',
              border: 'none',
              padding: 0,
              width: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              cursor: 'pointer',
              textAlign: 'left'
            }}
          >
            <div className="section-header" style={{ marginBottom: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Users size={18} style={{ color: 'var(--primary)' }} />
              <span>{t('settings.teamMembers')}</span>
              <span className="section-badge">{members.length + 1} {t('settings.membersCount')}</span>
            </div>
            {openSections.team ? <ChevronUp size={18} style={{ color: 'var(--text-muted)' }} /> : <ChevronDown size={18} style={{ color: 'var(--text-muted)' }} />}
          </button>

          {openSections.team && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', paddingTop: '4px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 12px', background: 'var(--bg-elevated)', borderRadius: '0.5rem', border: '1px solid var(--card-border)' }}>
                  <div>
                    <strong style={{ fontSize: '0.92rem' }}>{shop.ownerName || 'Owner'} (Owner)</strong>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{shop.phone} • Owner</div>
                  </div>
                  <span className="section-badge" style={{ background: '#eab308', color: '#000', alignSelf: 'center' }}>
                    {t('settings.ownerBadge')}
                  </span>
                </div>

                {members.map((m) => (
                  <div key={m.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 12px', background: 'var(--bg-elevated)', borderRadius: '0.5rem', border: '1px solid var(--card-border)' }}>
                    <div>
                      <strong style={{ fontSize: '0.92rem' }}>{m.name}</strong>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{m.phone} • {m.role}</div>
                    </div>
                    <button
                      type="button"
                      onClick={() => removeTeamMember(m.id)}
                      style={{ 
                        background: 'rgba(239, 68, 68, 0.1)', 
                        color: '#ef4444', 
                        border: '1px solid #ef4444', 
                        borderRadius: '0.4rem', 
                        padding: '6px 10px', 
                        fontSize: '0.75rem', 
                        cursor: 'pointer',
                        fontWeight: 700,
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px'
                      }}
                    >
                      <Trash2 size={13} />
                      <span>{t('settings.removeBtn')}</span>
                    </button>
                  </div>
                ))}
              </div>

              {/* Add Member Form */}
              <form onSubmit={handleAddMember} style={{ borderTop: '1px solid var(--card-border)', paddingTop: '10px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <span style={{ fontSize: '0.85rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <UserPlus size={15} style={{ color: 'var(--primary)' }} />
                  <span>{t('settings.addMemberTitle')}</span>
                </span>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                  <input
                    type="text"
                    placeholder={t('settings.memberNamePlaceholder')}
                    value={newMemberName}
                    onChange={(e) => setNewMemberName(e.target.value)}
                    className="form-input"
                    required
                  />
                  <input
                    type="tel"
                    placeholder={t('settings.memberPhonePlaceholder')}
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
                  <button type="submit" className="big-btn" style={{ width: 'auto', minWidth: '110px', minHeight: '44px', fontSize: '0.88rem' }}>
                    {t('settings.addMemberBtn')}
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>
      )}

      {/* 7. SMS SETTINGS (Collapsible) */}
      {hasPermission('smsSettings') && (
        <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: openSections.sms ? '10px' : '0' }}>
          <button
            type="button"
            onClick={() => toggleSection('sms')}
            style={{
              background: 'none',
              border: 'none',
              padding: 0,
              width: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              cursor: 'pointer',
              textAlign: 'left'
            }}
          >
            <div className="section-header" style={{ marginBottom: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
              <MessageSquareText size={18} style={{ color: 'var(--primary)' }} />
              <span>{t('settings.smsSettingsTitle')}</span>
              <span className="section-badge" style={{ background: '#22c55e', color: '#fff' }}>{t('settings.freeNative')}</span>
            </div>
            {openSections.sms ? <ChevronUp size={18} style={{ color: 'var(--text-muted)' }} /> : <ChevronDown size={18} style={{ color: 'var(--text-muted)' }} />}
          </button>

          {openSections.sms && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', paddingTop: '4px' }}>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: 0 }}>
                {t('settings.smsNotice')}
              </p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '2px' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '0.92rem', fontWeight: 800, cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={shop.smsSettings?.enabled ?? true}
                    onChange={() => handleSmsToggle('enabled')}
                    style={{ width: '18px', height: '18px', accentColor: 'var(--primary)' }}
                  />
                  <span>{t('settings.masterSms')}</span>
                </label>

                <div style={{ paddingLeft: '1.75rem', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.85rem', cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      disabled={!shop.smsSettings?.enabled}
                      checked={shop.smsSettings?.onDropOff ?? true}
                      onChange={() => handleSmsToggle('onDropOff')}
                    />
                    <span>{t('settings.dropoffSms')}</span>
                  </label>

                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.85rem', cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      disabled={!shop.smsSettings?.enabled}
                      checked={shop.smsSettings?.onDone ?? true}
                      onChange={() => handleSmsToggle('onDone')}
                    />
                    <span>{t('settings.doneSms')}</span>
                  </label>

                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.85rem', cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      disabled={!shop.smsSettings?.enabled}
                      checked={shop.smsSettings?.onPickedUp ?? true}
                      onChange={() => handleSmsToggle('onPickedUp')}
                    />
                    <span>{t('settings.pickupSms')}</span>
                  </label>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* 8. DATA BACKUP (Collapsible) */}
      {hasPermission('exportBackup') && (
        <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: openSections.backup ? '10px' : '0' }}>
          <button
            type="button"
            onClick={() => toggleSection('backup')}
            style={{
              background: 'none',
              border: 'none',
              padding: 0,
              width: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              cursor: 'pointer',
              textAlign: 'left'
            }}
          >
            <div className="section-header" style={{ marginBottom: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
              <HardDrive size={18} style={{ color: 'var(--primary)' }} />
              <span>{t('settings.backupTitle')}</span>
            </div>
            {openSections.backup ? <ChevronUp size={18} style={{ color: 'var(--text-muted)' }} /> : <ChevronDown size={18} style={{ color: 'var(--text-muted)' }} />}
          </button>

          {openSections.backup && (
            <div style={{ paddingTop: '4px' }}>
              <button
                type="button"
                onClick={handleExportBackup}
                className="btn-secondary-action"
                style={{ 
                  height: '48px', 
                  minHeight: '48px',
                  width: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  fontWeight: 800
                }}
              >
                <Download size={18} />
                <span>{t('settings.downloadBackupBtn')}</span>
              </button>
            </div>
          )}
        </div>
      )}

      {/* CONFIRMATION LOGOUT MODAL */}
      {showLogoutModal && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.65)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
            padding: '16px'
          }}
        >
          <div
            className="card"
            style={{
              width: '100%',
              maxWidth: '400px',
              padding: '20px',
              borderRadius: 'var(--radius)',
              background: 'var(--bg-elevated)',
              boxShadow: 'var(--shadow-lg)',
              border: '2px solid #ef4444'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
              <ShieldAlert size={22} style={{ color: '#ef4444' }} />
              <h3 style={{ fontSize: '1.15rem', margin: 0, fontWeight: 900, color: 'var(--text-main)' }}>
                {t('settings.logoutConfirmTitle')}
              </h3>
            </div>

            <p style={{ fontSize: '0.88rem', color: 'var(--text-muted)', lineHeight: '1.5', margin: '0 0 16px 0' }}>
              {t('settings.logoutConfirmText')}
            </p>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
              <button
                type="button"
                onClick={handleConfirmLogout}
                style={{
                  minHeight: '46px',
                  borderRadius: '0.75rem',
                  backgroundColor: '#ef4444',
                  color: '#ffffff',
                  border: 'none',
                  fontSize: '0.88rem',
                  fontWeight: 900,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px'
                }}
              >
                <LogOut size={16} />
                <span>{t('settings.confirmLogout')}</span>
              </button>

              <button
                type="button"
                onClick={() => setShowLogoutModal(false)}
                className="btn-secondary-action"
                style={{
                  minHeight: '46px',
                  height: '46px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px',
                  fontWeight: 800
                }}
              >
                <X size={16} />
                <span>{t('settings.cancelLogout')}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MACHINE MAINTENANCE & POWER METER TRACKER MODAL */}
      {showMaintenanceModal && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.65)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
            padding: '16px'
          }}
        >
          <div
            className="card"
            style={{
              width: '100%',
              maxWidth: '480px',
              padding: '20px',
              borderRadius: 'var(--radius)',
              background: 'var(--bg-elevated)',
              boxShadow: 'var(--shadow-lg)',
              border: '2px solid var(--primary)',
              maxHeight: '90vh',
              overflowY: 'auto'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Wrench size={20} style={{ color: 'var(--primary)' }} />
                <h3 style={{ fontSize: '1.1rem', margin: 0, fontWeight: 900, color: 'var(--text-main)' }}>
                  {t('settings.machineMaintenanceTitle')}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowMaintenanceModal(false)}
                style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSaveMachineLog} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div>
                  <label className="input-label" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <Cpu size={14} style={{ color: 'var(--primary)' }} />
                    <span>{t('settings.motorTemp')}</span>
                  </label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="e.g. 42°C Normal"
                    value={motorTemp}
                    onChange={(e) => setMotorTemp(e.target.value)}
                    required
                  />
                </div>

                <div>
                  <label className="input-label" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <Activity size={14} style={{ color: 'var(--primary)' }} />
                    <span>{t('settings.beltTension')}</span>
                  </label>
                  <select
                    className="form-input"
                    value={beltTension}
                    onChange={(e) => setBeltTension(e.target.value)}
                  >
                    <option value="OK">OK (Normal)</option>
                    <option value="Tight">Tight</option>
                    <option value="Needs Adjustment">Needs Adjustment</option>
                    <option value="Replaced">Replaced New Belt</option>
                  </select>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div>
                  <label className="input-label" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <Gauge size={14} style={{ color: 'var(--primary)' }} />
                    <span>{t('settings.stoneWear')}</span>
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    className="form-input"
                    placeholder="e.g. 15"
                    value={stoneWearPercent}
                    onChange={(e) => setStoneWearPercent(e.target.value)}
                    required
                  />
                </div>

                <div>
                  <label className="input-label" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <Zap size={14} style={{ color: 'var(--primary)' }} />
                    <span>{t('settings.kwhUnits')}</span>
                  </label>
                  <input
                    type="number"
                    step="1"
                    className="form-input"
                    placeholder="e.g. 45"
                    value={electricityUnits}
                    onChange={(e) => setElectricityUnits(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div>
                <label className="input-label">{t('settings.dieselLitres')}</label>
                <input
                  type="number"
                  step="0.5"
                  className="form-input"
                  placeholder="e.g. 0 (Generator backup)"
                  value={dieselLitres}
                  onChange={(e) => setDieselLitres(e.target.value)}
                />
              </div>

              <div>
                <label className="input-label">Maintenance Notes / Remarks</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="e.g. Subah 8 baje stone cleaning and bearing lubrication"
                  value={maintenanceNotes}
                  onChange={(e) => setMaintenanceNotes(e.target.value)}
                />
              </div>

              <div style={{ display: 'flex', gap: '8px', marginTop: '6px' }}>
                <button
                  type="submit"
                  className="big-btn"
                  style={{ flex: 1, minHeight: '46px', fontSize: '0.92rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
                >
                  <Check size={16} />
                  <span>{t('settings.saveLogBtn')}</span>
                </button>
                <button
                  type="button"
                  className="btn-secondary-action"
                  onClick={() => setShowMaintenanceModal(false)}
                  style={{ width: 'auto', minHeight: '46px', padding: '0 16px' }}
                >
                  {t('inventory.cancel')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
