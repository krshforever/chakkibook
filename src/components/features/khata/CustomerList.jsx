import React from 'react';
import { Phone, MapPin, ChevronRight, UserPlus } from 'lucide-react';
import Avatar from '../../ui/Avatar';
import Badge from '../../ui/Badge';
import Button from '../../ui/Button';

export default function CustomerList({
  customers = [],
  onSelectCustomer,
  onAddCustomer
}) {
  if (!customers || customers.length === 0) {
    return (
      <div
        style={{
          padding: '2.5rem 1rem',
          textAlign: 'center',
          backgroundColor: 'hsl(var(--surface))',
          border: '1px solid hsl(var(--line))',
          borderRadius: 'var(--radius-md)'
        }}
      >
        <p style={{ fontSize: '15px', fontWeight: '600', color: 'hsl(var(--ink))' }}>
          Koi grahak nahi mila
        </p>
        <p style={{ fontSize: '13px', color: 'hsl(var(--ink-2))', marginTop: '4px', marginBottom: '1.25rem' }}>
          Naya grahak jodne ke liye neeche button dabayein.
        </p>
        <Button variant="brand" icon={UserPlus} onClick={onAddCustomer}>
          + Naya Grahak Jodein
        </Button>
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
      {customers.map((c, index) => {
        const hasUdhar = Number(c.balance || 0) > 0;

        return (
          <div
            key={c.id}
            onClick={() => onSelectCustomer?.(c)}
            className="tap-effect"
            style={{
              padding: '0.875rem 1rem',
              borderBottom: index === customers.length - 1 ? 'none' : '1px solid hsl(var(--line))',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              cursor: 'pointer'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <Avatar name={c.name} size={42} />

              <div>
                <h3 style={{ fontSize: '15px', fontWeight: '700', color: 'hsl(var(--ink))' }}>
                  {c.name}
                </h3>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '2px' }}>
                  {c.village && (
                    <span style={{ fontSize: '12px', color: 'hsl(var(--ink-2))', display: 'flex', alignItems: 'center', gap: '2px' }}>
                      <MapPin size={12} />
                      {c.village}
                    </span>
                  )}
                  {c.phone && (
                    <span style={{ fontSize: '12px', color: 'hsl(var(--ink-3))' }}>
                      • {c.phone}
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Right side: Balance badge ONLY earned if udhar/risk exists */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <div style={{ textAlign: 'right' }}>
                {hasUdhar ? (
                  <>
                    <span className="numeral-serif" style={{ fontSize: '1.125rem', fontWeight: '800', color: 'hsl(var(--risk-udhar-text))', display: 'block' }}>
                      ₹{c.balance.toLocaleString('en-IN')}
                    </span>
                    <Badge variant="udhar" size="sm">
                      Udhar Dues
                    </Badge>
                  </>
                ) : (
                  <span style={{ fontSize: '13px', fontWeight: '600', color: 'hsl(var(--ink-3))' }}>
                    Hisab Clear
                  </span>
                )}
              </div>

              <ChevronRight size={18} style={{ color: 'hsl(var(--ink-3))' }} />
            </div>
          </div>
        );
      })}
    </div>
  );
}
