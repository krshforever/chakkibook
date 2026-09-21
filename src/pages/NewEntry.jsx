import React, { useState, useEffect, useMemo } from 'react';
import { Wheat, Droplets, Mic, CheckCircle2, ArrowLeft, Camera } from 'lucide-react';
import { useStore } from '../store/useStore';
import Input from '../components/ui/Input';
import Button from '../components/ui/Button';
import Section from '../components/layout/Section';
import VoiceInput from '../components/features/ai/VoiceInput';
import GrainQualityScanner from '../components/features/ai/GrainQualityScanner';

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

  // Milling specifics
  const [grainType, setGrainType] = useState('Gehun');
  const [outputType, setOutputType] = useState('Atta');
  const [weight, setWeight] = useState('50');
  const [paymentMode, setPaymentMode] = useState('credit');
  const [boriStatus, setBoriStatus] = useState('pending');
  const [notes, setNotes] = useState('');

  // Grain Scanner Modal
  const [isScannerOpen, setIsScannerOpen] = useState(false);

  // Rate overrides
  const grainConfig = useMemo(() => getGrainSettings(grainType), [grainType, getGrainSettings]);
  const [rate, setRate] = useState(grainConfig.rate || 4);

  useEffect(() => {
    setRate(grainConfig.rate || 4);
  }, [grainConfig]);

  const handleSelectCustomerChange = (id) => {
    if (id === 'new') {
      setIsNewCustomer(true);
      setSelectedCustomerId('');
      setCustomerName('');
      setCustomerPhone('');
      setCustomerVillage('');
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
  const kaddaDeduction = mode === 'chakki' ? (weightNum / grainConfig.kaddaPer) * grainConfig.kadda : 0;
  const expectedOutputWeight = Math.max(0, weightNum - kaddaDeduction);
  const totalAmount = weightNum * (Number(rate) || 4);

  const handleVoiceFill = (transcript) => {
    const weightMatch = transcript.match(/(\d+)\s*(kg|kilo|kilo gram)/i) || transcript.match(/(\d+)/);
    if (weightMatch) {
      setWeight(weightMatch[1]);
    }
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
        name: customerName.trim(),
        phone: customerPhone.trim(),
        village: customerVillage.trim(),
        balance: 0
      });
      if (created) {
        finalCustId = created.id;
        finalCustName = created.name;
      }
    }

    await addBori({
      mode,
      customerId: finalCustId,
      customerName: finalCustName || 'General Customer',
      customerPhone,
      customerVillage,
      grainType,
      outputType,
      inputWeight: weightNum,
      kaddaDeducted: Number(kaddaDeduction.toFixed(2)),
      outputWeight: Number(expectedOutputWeight.toFixed(2)),
      rate: Number(rate),
      amount: totalAmount,
      paymentMode,
      status: boriStatus,
      notes
    });

    setActiveTab('dashboard');
  };

  return (
    <div style={{ padding: '1rem 1rem 5rem', maxWidth: '540px', margin: '0 auto' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
        <button
          type="button"
          onClick={() => setActiveTab('dashboard')}
          className="tap-effect"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.375rem',
            background: 'none',
            border: 'none',
            color: 'hsl(var(--ink))',
            fontSize: '14px',
            fontWeight: '600',
            cursor: 'pointer'
          }}
        >
          <ArrowLeft size={18} />
          <span>Dashboard</span>
        </button>

        <h2 style={{ fontSize: '16px', fontWeight: '700', color: 'hsl(var(--ink))' }}>
          Nayi Bori Entry
        </h2>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <button
            type="button"
            onClick={() => setIsScannerOpen(true)}
            className="tap-effect"
            style={{
              width: '40px',
              height: '40px',
              borderRadius: '50%',
              backgroundColor: 'var(--primary-light)',
              color: 'var(--primary-color)',
              border: '1px solid var(--primary-color)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer'
            }}
            title="Scan Grain Photo Quality"
          >
            <Camera size={20} />
          </button>
          <VoiceInput onSpeechResult={handleVoiceFill} />
        </div>
      </div>

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
        {/* Mode Selector */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
          <button
            type="button"
            onClick={() => setMode('chakki')}
            style={{
              minHeight: '48px',
              borderRadius: 'var(--radius-sm)',
              border: mode === 'chakki' ? '2px solid var(--brand-500)' : '1px solid hsl(var(--line))',
              backgroundColor: mode === 'chakki' ? 'var(--primary-light)' : 'hsl(var(--surface))',
              color: mode === 'chakki' ? 'var(--primary-dark)' : 'hsl(var(--ink-2))',
              fontWeight: '700',
              fontSize: '14px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.5rem',
              cursor: 'pointer'
            }}
          >
            <Wheat size={18} />
            <span>Chakki (Pisai)</span>
          </button>

          <button
            type="button"
            onClick={() => setMode('spellar')}
            style={{
              minHeight: '48px',
              borderRadius: 'var(--radius-sm)',
              border: mode === 'spellar' ? '2px solid var(--spellar-500)' : '1px solid hsl(var(--line))',
              backgroundColor: mode === 'spellar' ? 'var(--spellar-light)' : 'hsl(var(--surface))',
              color: mode === 'spellar' ? 'var(--spellar-700)' : 'hsl(var(--ink-2))',
              fontWeight: '700',
              fontSize: '14px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.5rem',
              cursor: 'pointer'
            }}
          >
            <Droplets size={18} />
            <span>Spellar (Pirai)</span>
          </button>
        </div>

        {/* Customer Selector */}
        <Section title="Grahak Details (1 Tap)">
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <select
              value={isNewCustomer ? 'new' : selectedCustomerId}
              onChange={(e) => handleSelectCustomerChange(e.target.value)}
              style={{
                width: '100%',
                minHeight: '48px',
                padding: '0 0.875rem',
                borderRadius: 'var(--radius-sm)',
                border: '1px solid hsl(var(--line))',
                backgroundColor: 'hsl(var(--surface))',
                fontSize: '15px',
                fontWeight: '600',
                color: 'hsl(var(--ink))',
                outline: 'none'
              }}
            >
              <option value="">Select Existing Grahak...</option>
              {customers.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} ({c.village || 'No Village'}) - Udhar: ₹{c.balance}
                </option>
              ))}
              <option value="new">+ Naya Grahak Jodein</option>
            </select>

            {isNewCustomer && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', paddingTop: '0.25rem' }}>
                <Input
                  label="Grahak Ka Naam"
                  placeholder="e.g. Ramesh Kumar"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  required
                />
                <Input
                  label="Mobile Number"
                  placeholder="e.g. 9812345678"
                  type="tel"
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                />
                <Input
                  label="Gaon / Village Name"
                  placeholder="e.g. Rampur"
                  value={customerVillage}
                  onChange={(e) => setCustomerVillage(e.target.value)}
                />
              </div>
            )}
          </div>
        </Section>

        {/* Grain & Preset Weight Selection */}
        <Section title="Anaj & Weight Presets">
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.5rem', marginBottom: '0.75rem' }}>
            {['Gehun', 'Bajra', 'Makka', 'Sarson'].map((g) => (
              <button
                key={g}
                type="button"
                onClick={() => setGrainType(g)}
                style={{
                  minHeight: '42px',
                  borderRadius: 'var(--radius-sm)',
                  fontSize: '13px',
                  fontWeight: '600',
                  backgroundColor: grainType === g ? 'var(--primary-color)' : 'hsl(var(--surface))',
                  color: grainType === g ? '#FFFFFF' : 'hsl(var(--ink))',
                  border: '1px solid hsl(var(--line))',
                  cursor: 'pointer'
                }}
              >
                {g}
              </button>
            ))}
          </div>

          {/* Prominent Weight Preset Chips */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.5rem', marginBottom: '0.75rem' }}>
            {[10, 20, 40, 50].map((w) => (
              <button
                key={w}
                type="button"
                onClick={() => setWeight(String(w))}
                style={{
                  padding: '0.5rem',
                  borderRadius: 'var(--radius-sm)',
                  fontSize: '13px',
                  fontWeight: '700',
                  backgroundColor: weight === String(w) ? 'hsl(var(--surface-dark))' : 'hsl(var(--surface-2))',
                  color: weight === String(w) ? '#FFFFFF' : 'hsl(var(--ink))',
                  border: weight === String(w) ? '1px solid hsl(var(--surface-dark))' : '1px solid hsl(var(--line))',
                  cursor: 'pointer'
                }}
              >
                {w} kg
              </button>
            ))}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
            <Input
              label="Weight / Vazan (Kg)"
              type="number"
              value={weight}
              onChange={(e) => setWeight(e.target.value)}
              required
            />
            <Input
              label="Pisai Rate (₹/kg)"
              type="number"
              value={rate}
              onChange={(e) => setRate(e.target.value)}
              required
            />
          </div>
        </Section>

        {/* Live Bill Card */}
        <div
          style={{
            padding: '1rem',
            backgroundColor: 'hsl(var(--surface-2))',
            border: '1px solid hsl(var(--line))',
            borderRadius: 'var(--radius-md)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}
        >
          <div>
            <span style={{ fontSize: '12px', color: 'hsl(var(--ink-3))', display: 'block' }}>
              Kadda Deducted ({grainConfig.kadda}kg / {grainConfig.kaddaPer}kg)
            </span>
            <span style={{ fontSize: '14px', fontWeight: '700', color: 'hsl(var(--ink-2))' }}>
              {kaddaDeduction.toFixed(2)} kg
            </span>
          </div>

          <div style={{ textAlign: 'right' }}>
            <span style={{ fontSize: '12px', color: 'hsl(var(--ink-3))', display: 'block' }}>TOTAL BILL</span>
            <span className="numeral-serif" style={{ fontSize: '1.5rem', fontWeight: '800', color: 'hsl(var(--ink))' }}>
              ₹{totalAmount.toLocaleString('en-IN')}
            </span>
          </div>
        </div>

        {/* Payment & Status */}
        <Section title="Payment Mode & Status">
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.5rem', marginBottom: '0.75rem' }}>
            {[
              { id: 'credit', label: 'Udhar (Dues)' },
              { id: 'cash', label: 'Nokad (Cash)' },
              { id: 'upi', label: 'UPI Online' }
            ].map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => setPaymentMode(p.id)}
                style={{
                  minHeight: '42px',
                  borderRadius: 'var(--radius-sm)',
                  fontSize: '13px',
                  fontWeight: '600',
                  backgroundColor: paymentMode === p.id ? 'hsl(var(--surface-dark))' : 'hsl(var(--surface))',
                  color: paymentMode === p.id ? '#FFFFFF' : 'hsl(var(--ink))',
                  border: '1px solid hsl(var(--line))',
                  cursor: 'pointer'
                }}
              >
                {p.label}
              </button>
            ))}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
            <button
              type="button"
              onClick={() => setBoriStatus('pending')}
              style={{
                minHeight: '44px',
                borderRadius: 'var(--radius-sm)',
                fontSize: '13px',
                fontWeight: '600',
                backgroundColor: boriStatus === 'pending' ? 'hsl(var(--status-pending-bg))' : 'hsl(var(--surface))',
                color: boriStatus === 'pending' ? 'hsl(var(--status-pending-text))' : 'hsl(var(--ink-2))',
                border: boriStatus === 'pending' ? '1px solid rgba(153, 77, 0, 0.3)' : '1px solid hsl(var(--line))',
                cursor: 'pointer'
              }}
            >
              Bori Queue (Pending)
            </button>

            <button
              type="button"
              onClick={() => setBoriStatus('done')}
              style={{
                minHeight: '44px',
                borderRadius: 'var(--radius-sm)',
                fontSize: '13px',
                fontWeight: '600',
                backgroundColor: boriStatus === 'done' ? 'hsl(var(--status-healthy-bg))' : 'hsl(var(--surface))',
                color: boriStatus === 'done' ? 'hsl(var(--status-healthy-text))' : 'hsl(var(--ink-2))',
                border: boriStatus === 'done' ? '1px solid rgba(27, 105, 57, 0.3)' : '1px solid hsl(var(--line))',
                cursor: 'pointer'
              }}
            >
              Abhi Pisai Done
            </button>
          </div>
        </Section>

        {/* Submit Button */}
        <Button variant="brand" fullWidth size="lg" type="submit" icon={CheckCircle2}>
          SAVE BORI ENTRY
        </Button>
      </form>

      {/* Grain Photo Quality Scanner Modal */}
      <GrainQualityScanner
        isOpen={isScannerOpen}
        onClose={() => setIsScannerOpen(false)}
      />
    </div>
  );
}
