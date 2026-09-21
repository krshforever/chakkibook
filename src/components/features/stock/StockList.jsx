import React from 'react';
import { Package, Plus, Minus } from 'lucide-react';
import Button from '../../ui/Button';

export default function StockList({ inventory = [], onUpdateStock }) {
  if (!inventory || inventory.length === 0) {
    return (
      <div style={{ padding: '2rem', textAlign: 'center', color: 'hsl(var(--ink-3))', fontSize: '14px' }}>
        Koi stock item registered nahi hai.
      </div>
    );
  }

  return (
    <div
      style={{
        backgroundColor: 'hsl(var(--surface))',
        border: '1px solid hsl(var(--line))',
        borderRadius: 'var(--radius-md)',
        overflow: 'hidden'
      }}
    >
      {inventory.map((item, index) => {
        const isLow = Number(item.stock) <= Number(item.lowAlert || 0);
        const maxCapacity = Math.max(500, Number(item.stock) * 1.5);
        const percent = Math.min(100, Math.round((Number(item.stock) / maxCapacity) * 100));

        return (
          <div
            key={item.id}
            style={{
              padding: '1rem',
              borderBottom: index === inventory.length - 1 ? 'none' : '1px solid hsl(var(--line))',
              display: 'flex',
              flexDirection: 'column',
              gap: '0.625rem'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <h3 style={{ fontSize: '15px', fontWeight: '700', color: 'hsl(var(--ink))' }}>
                  {item.name}
                </h3>
                <span style={{ fontSize: '12px', color: 'hsl(var(--ink-2))' }}>
                  Category: {item.category} • Low alert below {item.lowAlert}{item.unit}
                </span>
              </div>

              {/* Numerals in Fraunces serif */}
              <div style={{ textAlign: 'right' }}>
                <span
                  className="numeral-serif"
                  style={{
                    fontSize: '1.25rem',
                    fontWeight: '800',
                    color: isLow ? 'hsl(var(--risk-udhar-text))' : 'hsl(var(--ink))'
                  }}
                >
                  {item.stock} <span style={{ fontSize: '13px', fontWeight: '600' }}>{item.unit}</span>
                </span>
              </div>
            </div>

            {/* Visual Stock Progress Bar */}
            <div style={{ width: '100%', backgroundColor: 'hsl(var(--surface-2))', height: '6px', borderRadius: '999px', overflow: 'hidden' }}>
              <div
                style={{
                  width: `${percent}%`,
                  height: '100%',
                  backgroundColor: isLow ? 'hsl(var(--risk-udhar-text))' : 'var(--primary-color)',
                  borderRadius: '999px',
                  transition: 'width 0.3s ease'
                }}
              />
            </div>

            {/* Quick stock adjustment actions */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '0.5rem', paddingTop: '0.25rem' }}>
              <Button
                variant="quiet"
                size="sm"
                icon={Minus}
                onClick={() => onUpdateStock?.(item.id, -10)}
              >
                -10 {item.unit}
              </Button>

              <Button
                variant="quiet"
                size="sm"
                icon={Plus}
                onClick={() => onUpdateStock?.(item.id, 10)}
              >
                +10 {item.unit}
              </Button>
            </div>
          </div>
        );
      })}
    </div>
  );
}
