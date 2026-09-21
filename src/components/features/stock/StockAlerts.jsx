import React from 'react';
import { AlertTriangle, Plus } from 'lucide-react';
import Badge from '../../ui/Badge';
import Button from '../../ui/Button';

export default function StockAlerts({ alerts = [], onRestock }) {
  if (!alerts || alerts.length === 0) return null;

  return (
    <div
      style={{
        padding: '1rem',
        backgroundColor: 'hsl(var(--risk-udhar-bg))',
        border: '1px solid rgba(185, 45, 21, 0.2)',
        borderRadius: 'var(--radius-md)',
        marginBottom: '1rem'
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
        <AlertTriangle size={18} style={{ color: 'hsl(var(--risk-udhar-text))' }} />
        <h4 style={{ fontSize: '14px', fontWeight: '700', color: 'hsl(var(--risk-udhar-text))' }}>
          Low Stock Warning Alert ({alerts.length} Items)
        </h4>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
        {alerts.map((item) => (
          <div
            key={item.id}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '0.5rem 0.75rem',
              backgroundColor: 'hsl(var(--surface))',
              borderRadius: 'var(--radius-sm)',
              border: '1px solid hsl(var(--line))'
            }}
          >
            <div>
              <span style={{ fontSize: '13px', fontWeight: '700', color: 'hsl(var(--ink))' }}>
                {item.name}
              </span>
              <span style={{ fontSize: '12px', color: 'hsl(var(--risk-udhar-text))', display: 'block' }}>
                Sirf {item.stock} {item.unit} bacha hai!
              </span>
            </div>

            <Button
              variant="brand"
              size="sm"
              icon={Plus}
              onClick={() => onRestock?.(item.id, 100)}
            >
              +100 {item.unit} Restock
            </Button>
          </div>
        ))}
      </div>
    </div>
  );
}
