import React, { useMemo } from 'react';
import { TrendingUp, ArrowUpRight, Lightbulb } from 'lucide-react';
import { fetchMandiPrices, recommendOptimalRate } from '../../../services/mandiPrices';
import { useStore } from '../../../store/useStore';
import Card from '../../ui/Card';

export default function MandiPriceWidget() {
  const activeMode = useStore((state) => state.activeMode);
  const grainType = activeMode === 'chakki' ? 'Gehun' : 'Sarson';
  const shop = useStore((state) => state.shop);
  const currentRate = shop?.chakkiRates?.pisai || 4;

  const mandi = useMemo(() => fetchMandiPrices(grainType), [grainType]);
  const rateRec = useMemo(() => recommendOptimalRate(grainType, currentRate), [grainType, currentRate]);

  return (
    <Card variant="flat" style={{ backgroundColor: 'hsl(var(--surface-2))', borderColor: 'hsl(var(--line))' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.375rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', color: 'var(--primary-color)' }}>
          <TrendingUp size={16} />
          <span style={{ fontSize: '13px', fontWeight: '700' }}>Live Regional Mandi Feed</span>
        </div>

        <span style={{ fontSize: '11px', color: 'hsl(var(--status-healthy-text))', fontWeight: '700' }}>
          {mandi.changePercent}
        </span>
      </div>

      <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
        <div>
          <span style={{ fontSize: '14px', fontWeight: '700', color: 'hsl(var(--ink))' }}>
            {mandi.grainType} Rate ({mandi.market})
          </span>
        </div>

        <span className="numeral-serif" style={{ fontSize: '1.25rem', fontWeight: '800', color: 'hsl(var(--ink))' }}>
          ₹{mandi.modalPrice.toLocaleString('en-IN')} <span style={{ fontSize: '12px', fontWeight: '500', color: 'hsl(var(--ink-3))' }}>/Qtl</span>
        </span>
      </div>

      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.375rem',
          paddingTop: '0.375rem',
          borderTop: '1px solid hsl(var(--line))',
          fontSize: '12px',
          color: 'hsl(var(--ink-2))'
        }}
      >
        <Lightbulb size={14} style={{ color: 'var(--primary-color)', flexShrink: 0 }} />
        <span>{rateRec.reason}</span>
      </div>
    </Card>
  );
}
