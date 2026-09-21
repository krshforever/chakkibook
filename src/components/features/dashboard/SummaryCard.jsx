import React from 'react';
import { IndianRupee, Wheat, Droplets, TrendingUp } from 'lucide-react';
import { useStore } from '../../../store/useStore';
import Card from '../../ui/Card';

export default function SummaryCard({ todayEarnings = 0, pendingCount = 0, completedCount = 0 }) {
  const activeMode = useStore((state) => state.activeMode);

  return (
    <Card variant="flat" style={{ backgroundColor: 'hsl(var(--surface-2))', borderColor: 'hsl(var(--line))' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <div
            style={{
              width: '28px',
              height: '28px',
              borderRadius: '50%',
              backgroundColor: 'var(--primary-light)',
              color: 'var(--primary-color)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            {activeMode === 'chakki' ? <Wheat size={16} /> : <Droplets size={16} />}
          </div>
          <span style={{ fontSize: '13px', fontWeight: '600', color: 'hsl(var(--ink-2))' }}>
            Aaj Ka Summary ({activeMode === 'chakki' ? 'Pisai' : 'Pirai'})
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', fontSize: '12px', color: 'hsl(var(--status-healthy-text))', fontWeight: '600' }}>
          <TrendingUp size={14} />
          <span>Live Active</span>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '1rem', alignItems: 'baseline' }}>
        {/* Numerals shout in Fraunces serif */}
        <div>
          <span style={{ fontSize: '12px', color: 'hsl(var(--ink-3))', display: 'block', fontWeight: '500' }}>
            Kul Kamai (Earnings)
          </span>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '2px', marginTop: '2px' }}>
            <span style={{ fontSize: '1.25rem', fontWeight: '700', color: 'hsl(var(--ink))', fontFamily: 'var(--font-serif)' }}>₹</span>
            <span className="numeral-serif" style={{ fontSize: '2rem', fontWeight: '800', color: 'hsl(var(--ink))', lineHeight: 1 }}>
              {todayEarnings.toLocaleString('en-IN')}
            </span>
          </div>
        </div>

        <div style={{ borderLeft: '1px solid hsl(var(--line))', paddingLeft: '1rem' }}>
          <div style={{ marginBottom: '0.5rem' }}>
            <span style={{ fontSize: '11px', color: 'hsl(var(--ink-3))', display: 'block' }}>Pending Bori</span>
            <span className="numeral-serif" style={{ fontSize: '1.25rem', fontWeight: '700', color: 'hsl(var(--status-pending-text))' }}>
              {pendingCount}
            </span>
          </div>
          <div>
            <span style={{ fontSize: '11px', color: 'hsl(var(--ink-3))', display: 'block' }}>Complete Today</span>
            <span className="numeral-serif" style={{ fontSize: '1.25rem', fontWeight: '700', color: 'hsl(var(--status-healthy-text))' }}>
              {completedCount}
            </span>
          </div>
        </div>
      </div>
    </Card>
  );
}
