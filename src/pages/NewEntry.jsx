import React, { useState, useEffect, useMemo } from 'react';
import { Wheat, Droplets, ArrowLeft, Camera, CheckCircle2 } from 'lucide-react';
import { useStore } from '../store/useStore';
import Input from '../components/ui/Input';
import Button from '../components/ui/Button';
import Section from '../components/layout/Section';
import VoiceInput from '../components/features/ai/VoiceInput';
import GrainQualityScanner from '../components/features/ai/GrainQualityScanner';
import ReceiptSheet from '../components/features/khata/ReceiptSheet';
import BillCard from '../components/entry/BillCard';
import ChakkiForm from '../components/entry/ChakkiForm';
import { calculateKaddaDeduction, calculateExpectedOutput, calculateTotalBill } from '../utils/billing';

export default function NewEntry({ setActiveTab, initialCustomerId }) {
  const activeMode = useStore((state) => state.activeMode);
  const customers = useStore((state) => state.customers || []);
  const addBori = useStore((state) => state.addBori);
  const addCustomer = useStore((state) => state.addCustomer);
  const getGrainSettings = useStore((state) => state.getGrainSettings);

  const [mode, setMode] = useState(activeMode || 'chakki');
  const [selectedCustomerId, setSelectedCustomerId] = useState(initialCustomerId || '');
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerVillage, setCustomerVillage] = useState('');
  const [isNewCustomer, setIsNewCustomer] = useState(false);

  const [grainType, setGrainType] = useState('Gehun');
  const [outputType, setOutputType] = useState('Atta');
  const [weight, setWeight] = useState('50');
  const [paymentMode, setPaymentMode] = useState('credit');
  const [boriStatus, setBoriStatus] = useState('pending');
  const [notes, setNotes] = useState('');
  const [savedBori, setSavedBori] = useState(null);
  const [isScannerOpen, setIsScannerOpen] = useState(false);

  const grainConfig = useMemo(() => getGrainSettings(grainType), [grainType, getGrainSettings]);
  const [rate, setRate] = useState(grainConfig.rate || 4);

  useEffect(() => { setRate(grainConfig.rate || 4); }, [grainConfig]);

  const handleSelectCustomerChange = (id) => {
    if (id === 'new') {
      setIsNewCustomer(true);
      setSelectedCustomerId('');
      setCustomerName(''); setCustomerPhone(''); setCustomerVillage('');
    } else {
      setIsNewCustomer(false);
      setSelectedCustomerId(id);
      const cust = customers.find((c) => c.id === id);
      if (cust) {
        setCustomerName(cust.name);
        setCustomerPhone(cust.phone || '');
        setCustomerVillage(cust.village || '');
      }
    }
  };

  const weightNum = Number(weight) || 0;
  const kaddaDeduction = calculateKaddaDeduction(weightNum, grainConfig.kadda, grainConfig.kaddaPer);
  const expectedOutputWeight = calculateExpectedOutput(weightNum, kaddaDeduction);
  const totalAmount = calculateTotalBill(weightNum, rate);

  const handleVoiceFill = (transcript) => {
    const weightMatch = transcript.match(/(\d+)\s*(kg|kilo|kilo gram)/i) || transcript.match(/(\d+)/);
    if (weightMatch) setWeight(weightMatch[1]);
    if (transcript.toLowerCase().includes('bajra')) setGrainType('Bajra');
    if (transcript.toLowerCase().includes('makka')) setGrainType('Makka');
    if (transcript.toLowerCase().includes('gehun')) setGrainType('Gehun');
    if (transcript.toLowerCase().includes('nokad') || transcript.toLowerCase().includes('cash')) setPaymentMode('cash');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    let finalCustId = selectedCustomerId;
    let finalCustName = customerName;

    if (isNewCustomer && customerName.trim()) {
      const created = await addCustomer({
        name: customerName.trim(), phone: customerPhone.trim(), village: customerVillage.trim(), balance: 0
      });
      if (created) { finalCustId = created.id; finalCustName = created.name; }
    }

    const createdBori = await addBori({
      mode, customerId: finalCustId, customerName: finalCustName || 'General Customer',
      customerPhone, customerVillage, grainType, outputType, inputWeight: weightNum,
      kaddaDeducted: kaddaDeduction, outputWeight: expectedOutputWeight, rate: Number(rate),
      amount: totalAmount, paymentMode, status: boriStatus, notes
    });
    setSavedBori(createdBori);
  };

  return (
    <div style={{ padding: '1rem 1rem 5rem', maxWidth: '540px', margin: '0 auto' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
        <button
          type="button"
          onClick={() => setActiveTab('dashboard')}
          style={{ display: 'inline-flex', alignItems: 'center', gap: '0.375rem', background: 'none', border: 'none', color: 'hsl(var(--ink-1))', fontSize: '14px', fontWeight: '600', cursor: 'pointer' }}
        >
          <ArrowLeft size={18} />
          <span>Dashboard</span>
        </button>
        <h2 style={{ fontSize: '16px', fontWeight: '700', color: 'hsl(var(--ink-1))', margin: 0 }}>Nayi Bori Entry</h2>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <button
            type="button"
            onClick={() => setIsScannerOpen(true)}
            style={{ width: '40px', height: '40px', borderRadius: '50%', backgroundColor: 'hsl(var(--brand-tint))', color: 'hsl(var(--brand-600))', border: '1px solid hsl(var(--brand-line))', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
          >
            <Camera size={20} />
          </button>
          <VoiceInput onSpeechResult={handleVoiceFill} />
        </div>
      </div>

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
          <button
            type="button"
            onClick={() => setMode('chakki')}
            style={{ minHeight: '48px', borderRadius: 'var(--radius-sm)', border: mode === 'chakki' ? '2px solid hsl(var(--brand-500))' : '1px solid hsl(var(--line))', backgroundColor: mode === 'chakki' ? 'hsl(var(--brand-tint))' : 'hsl(var(--surface))', color: mode === 'chakki' ? 'hsl(var(--brand-600))' : 'hsl(var(--ink-2))', fontWeight: '700', fontSize: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', cursor: 'pointer' }}
          >
            <Wheat size={18} /><span>Chakki (Pisai)</span>
          </button>
          <button
            type="button"
            onClick={() => setMode('spellar')}
            style={{ minHeight: '48px', borderRadius: 'var(--radius-sm)', border: mode === 'spellar' ? '2px solid hsl(var(--spellar-500))' : '1px solid hsl(var(--line))', backgroundColor: mode === 'spellar' ? 'hsl(var(--spellar-light))' : 'hsl(var(--surface))', color: mode === 'spellar' ? 'hsl(var(--spellar-700))' : 'hsl(var(--ink-2))', fontWeight: '700', fontSize: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', cursor: 'pointer' }}
          >
            <Droplets size={18} /><span>Spellar (Pirai)</span>
          </button>
        </div>

        <Section title="Grahak Details">
          <select
            value={isNewCustomer ? 'new' : selectedCustomerId}
            onChange={(e) => handleSelectCustomerChange(e.target.value)}
            style={{ width: '100%', minHeight: '48px', padding: '0 0.875rem', borderRadius: 'var(--radius-sm)', border: '1px solid hsl(var(--line))', backgroundColor: 'hsl(var(--surface))', fontSize: '15px', fontWeight: '600', color: 'hsl(var(--ink-1))', outline: 'none' }}
          >
            <option value="">Select Existing Grahak...</option>
            {customers.map((c) => (
              <option key={c.id} value={c.id}>{c.name} ({c.village || 'No Village'}) - Udhar: ₹{c.balance}</option>
            ))}
            <option value="new">+ Naya Grahak Jodein</option>
          </select>
          {isNewCustomer && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', paddingTop: '0.75rem' }}>
              <Input label="Grahak Ka Naam" placeholder="e.g. Ramesh Kumar" value={customerName} onChange={(e) => setCustomerName(e.target.value)} required />
              <Input label="Mobile Number" placeholder="e.g. 9812345678" type="tel" value={customerPhone} onChange={(e) => setCustomerPhone(e.target.value)} />
              <Input label="Gaon / Village" placeholder="e.g. Rampur" value={customerVillage} onChange={(e) => setCustomerVillage(e.target.value)} />
            </div>
          )}
        </Section>

        <ChakkiForm grainType={grainType} setGrainType={setGrainType} weight={weight} setWeight={setWeight} rate={rate} setRate={setRate} />
        <BillCard kaddaDeduction={kaddaDeduction} kaddaRate={grainConfig.kadda} kaddaPer={grainConfig.kaddaPer} totalAmount={totalAmount} />

        <Section title="Payment Mode">
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.5rem' }}>
            {[{ id: 'credit', label: 'Udhar' }, { id: 'cash', label: 'Nokad' }, { id: 'upi', label: 'UPI' }].map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => setPaymentMode(p.id)}
                style={{ minHeight: '42px', borderRadius: 'var(--radius-sm)', fontSize: '13px', fontWeight: '600', backgroundColor: paymentMode === p.id ? 'hsl(var(--ink-1))' : 'hsl(var(--surface))', color: paymentMode === p.id ? '#FFFFFF' : 'hsl(var(--ink-1))', border: '1px solid hsl(var(--line))', cursor: 'pointer' }}
              >
                {p.label}
              </button>
            ))}
          </div>
        </Section>

        <Button variant="brand" fullWidth size="lg" type="submit" icon={CheckCircle2}>
          SAVE BORI ENTRY
        </Button>
      </form>

      <GrainQualityScanner isOpen={isScannerOpen} onClose={() => setIsScannerOpen(false)} />
      <ReceiptSheet isOpen={!!savedBori} onClose={() => { setSavedBori(null); setActiveTab('dashboard'); }} bori={savedBori} />
    </div>
  );
}
