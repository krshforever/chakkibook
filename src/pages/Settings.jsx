import React, { useState } from 'react';
import { Settings as SettingsIcon, Save, Download, LogOut, Users, MessageSquare, ShieldCheck } from 'lucide-react';
import { useStore } from '../store/useStore';
import Input from '../components/ui/Input';
import Button from '../components/ui/Button';
import Section from '../components/layout/Section';
import Card from '../components/ui/Card';

export default function Settings({ onClose }) {
  const shop = useStore((state) => state.shop);
  const currentUser = useStore((state) => state.currentUser);
  const userRole = useStore((state) => state.userRole);
  const updateShopRates = useStore((state) => state.updateShopRates);
  const updateShopInfo = useStore((state) => state.updateShopInfo);
  const updateSmsSettings = useStore((state) => state.updateSmsSettings);
  const exportBackupJSON = useStore((state) => state.exportBackupJSON);
  const logout = useStore((state) => state.logout);

  const [shopName, setShopName] = useState(shop?.name || '');
  const [phone, setPhone] = useState(shop?.phone || '');
  const [pisaiRate, setPisaiRate] = useState(shop?.chakkiRates?.pisai || 4);
  const [piraiRate, setPiraiRate] = useState(shop?.spellarRates?.pirai || 12);
  const [savedToast, setSavedToast] = useState(false);

  const handleSaveSettings = () => {
    updateShopInfo({ name: shopName, phone });
    updateShopRates({
      chakkiRates: { pisai: Number(pisaiRate) },
      spellarRates: { pirai: Number(piraiRate) }
    });
    setSavedToast(true);
    setTimeout(() => setSavedToast(false), 2500);
  };

  const handleDownloadBackup = () => {
    const jsonStr = exportBackupJSON();
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Chakkibook_Backup_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div style={{ padding: '1rem 1rem 5rem', maxWidth: '540px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      {/* Profile Header */}
      <Card variant="flat" style={{ backgroundColor: 'hsl(var(--surface-2))' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.875rem' }}>
          <div
            style={{
              width: '48px',
              height: '48px',
              borderRadius: '50%',
              backgroundColor: 'var(--primary-color)',
              color: '#FFFFFF',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: '800',
              fontSize: '18px'
            }}
          >
            {shop?.ownerName ? shop.ownerName.slice(0, 2).toUpperCase() : 'BH'}
          </div>

          <div>
            <h2 style={{ fontSize: '16px', fontWeight: '700', color: 'hsl(var(--ink))' }}>
              {shop?.ownerName || 'Bhaiya'} ({userRole.toUpperCase()})
            </h2>
            <span style={{ fontSize: '13px', color: 'hsl(var(--ink-2))' }}>
              {currentUser?.email || shop?.phone}
            </span>
          </div>
        </div>
      </Card>

      {/* Shop Information */}
      <Section title="Dukaan Ka Naam & Contact">
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
          <Input
            label="Dukaan / Mill Ka Naam"
            value={shopName}
            onChange={(e) => setShopName(e.target.value)}
          />
          <Input
            label="Mobile Number"
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
          />
        </div>
      </Section>

      {/* Rate Settings */}
      <Section title="Pisai & Pirai Rate Settings (₹/kg)">
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
          <Input
            label="Gehun Pisai Rate (₹/kg)"
            type="number"
            value={pisaiRate}
            onChange={(e) => setPisaiRate(e.target.value)}
          />
          <Input
            label="Sarson Pirai Rate (₹/kg)"
            type="number"
            value={piraiRate}
            onChange={(e) => setPiraiRate(e.target.value)}
          />
        </div>
      </Section>

      {/* Save Settings Action */}
      <Button variant="brand" fullWidth icon={Save} onClick={handleSaveSettings}>
        {savedToast ? 'Settings Saved Successfully!' : 'Save Settings Changes'}
      </Button>

      {/* Data Backup & Export */}
      <Section title="Data Safety & Backup">
        <Card variant="flat" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <h4 style={{ fontSize: '14px', fontWeight: '700', color: 'hsl(var(--ink))' }}>
              Full Ledger Backup (JSON)
            </h4>
            <p style={{ fontSize: '12px', color: 'hsl(var(--ink-2))', marginTop: '1px' }}>
              Offline backup file for safe keeping
            </p>
          </div>

          <Button variant="quiet" size="sm" icon={Download} onClick={handleDownloadBackup}>
            Download
          </Button>
        </Card>
      </Section>

      {/* Logout */}
      <Button variant="danger" fullWidth icon={LogOut} onClick={logout}>
        Logout From Chakkibook
      </Button>
    </div>
  );
}
