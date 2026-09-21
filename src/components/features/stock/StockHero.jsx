import React from 'react';
import { Package, TrendingUp, AlertTriangle } from 'lucide-react';
import { useStockStore } from '../../../store/stock/useStockStore';
import Card from '../../ui/Card';

export default function StockHero() {
  const getValuation = useStockStore((state) => state.getValuation);
  const getLowStockAlerts = useStockStore((state) => state.getLowStockAlerts);
  const inventory = useStockStore((state) => state.inventory);

  const totalValuation = getValuation();
  const lowAlerts = getLowStockAlerts();

  return (
    /* Rule 5: One Dark Moment Per Screen — Maximum ONE ink/dark hero card per view for focal contrast */
    <Card variant="dark" style={{ position: 'relative', overflow: 'hidden' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.875rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Package size={18} style={{ color: 'var(--brand-500)' }} />
          <span style={{ fontSize: '13px', fontWeight: '600', color: 'rgba(255, 255, 255, 0.7)' }}>
            Kul Stock Valuation
          </span>
        </div>

        {lowAlerts.length > 0 && (
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.25rem',
              padding: '0.2rem 0.6rem',
              borderRadius: 'var(--radius-pill)',
              backgroundColor: 'rgba(232, 139, 0, 0.2)',
              color: '#FFB84D',
              fontSize: '11px',
              fontWeight: '700'
            }}
          >
            <AlertTriangle size={12} />
            <span>{lowAlerts.length} Low Stock</span>
          </div>
        )}
      </div>

      {/* Numerals shout in Fraunces serif */}
      <div style={{ marginBottom: '1rem' }}>
        <span style={{ fontSize: '1.25rem', fontWeight: '700', color: '#FFFFFF', fontFamily: 'var(--font-serif)' }}>₹</span>
        <span className="numeral-serif" style={{ fontSize: '2.25rem', fontWeight: '800', color: '#FFFFFF', lineHeight: 1 }}>
          {totalValuation.toLocaleString('en-IN')}
        </span>
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: '0.5rem',
          paddingTop: '0.875rem',
          borderTop: '1px solid rgba(255, 255, 255, 0.12)'
        }}
      >
        {inventory.slice(0, 3).map((item) => (
          <div key={item.id}>
            <span style={{ fontSize: '11px', color: 'rgba(255, 255, 255, 0.6)', display: 'block', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {item.name.split(' ')[0]}
            </span>
            <span className="numeral-serif" style={{ fontSize: '1rem', fontWeight: '700', color: '#FFFFFF' }}>
              {item.stock} <span style={{ fontSize: '11px', fontWeight: '400', opacity: 0.7 }}>{item.unit}</span>
            </span>
          </div>
        ))}
      </div>
    </Card>
  );
}
