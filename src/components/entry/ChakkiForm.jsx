import React from 'react';
import Section from '../layout/Section';
import Input from '../ui/Input';

export default function ChakkiForm({
  grainType,
  setGrainType,
  weight,
  setWeight,
  rate,
  setRate
}) {
  return (
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
              backgroundColor: grainType === g ? 'hsl(var(--brand-500))' : 'hsl(var(--surface))',
              color: grainType === g ? '#FFFFFF' : 'hsl(var(--ink-1))',
              border: '1px solid hsl(var(--line))',
              cursor: 'pointer'
            }}
          >
            {g}
          </button>
        ))}
      </div>

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
              backgroundColor: weight === String(w) ? 'hsl(var(--ink-1))' : 'hsl(var(--surface-2))',
              color: weight === String(w) ? '#FFFFFF' : 'hsl(var(--ink-1))',
              border: weight === String(w) ? '1px solid hsl(var(--ink-1))' : '1px solid hsl(var(--line))',
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
  );
}
