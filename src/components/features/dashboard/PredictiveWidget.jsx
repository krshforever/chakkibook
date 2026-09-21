import React, { useMemo } from 'react';
import { TrendingUp, Calendar, AlertTriangle, ArrowUpRight, DollarSign } from 'lucide-react';
import { generatePredictions } from '../../../services/predictive';
import { useStore } from '../../../store/useStore';
import Card from '../../ui/Card';

export default function PredictiveWidget() {
  const boris = useStore((state) => state.boris);
  const customers = useStore((state) => state.customers);
  const inventory = useStore((state) => state.inventory);

  const predictions = useMemo(() => {
    return generatePredictions({ boris, customers, inventory });
  }, [boris, customers, inventory]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
      {/* Demand Forecast & Revenue Projection Banner */}
      <Card variant="flat" style={{ backgroundColor: 'hsl(var(--surface-2))', borderColor: 'hsl(var(--line))' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', color: 'var(--primary-color)' }}>
            <TrendingUp size={16} />
            <span style={{ fontSize: '13px', fontWeight: '700' }}>AI Demand & Revenue Forecast</span>
          </div>

          <span style={{ fontSize: '11px', color: 'hsl(var(--ink-3))' }}>
            {predictions.seasonalInsights.season}
          </span>
        </div>

        <p style={{ fontSize: '13px', color: 'hsl(var(--ink))', fontWeight: '600', marginBottom: '0.5rem' }}>
          {predictions.demandForecast.message}
        </p>

        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            paddingTop: '0.5rem',
            borderTop: '1px solid hsl(var(--line))'
          }}
        >
          <span style={{ fontSize: '12px', color: 'hsl(var(--ink-2))' }}>
            Month-End Projected Revenue:
          </span>
          <span className="numeral-serif" style={{ fontSize: '1rem', fontWeight: '800', color: 'hsl(var(--status-healthy-text))' }}>
            ₹{predictions.revenueProjection.projectedTotal.toLocaleString('en-IN')}
          </span>
        </div>
      </Card>

      {/* Customer Churn Risk Alert */}
      {predictions.churnRisk.count > 0 && (
        <div
          style={{
            padding: '0.75rem 1rem',
            backgroundColor: 'hsl(var(--risk-udhar-bg))',
            border: '1px solid rgba(185, 45, 21, 0.2)',
            borderRadius: 'var(--radius-md)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <AlertTriangle size={16} style={{ color: 'hsl(var(--risk-udhar-text))' }} />
            <span style={{ fontSize: '12px', fontWeight: '600', color: 'hsl(var(--risk-udhar-text))' }}>
              {predictions.churnRisk.message}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
