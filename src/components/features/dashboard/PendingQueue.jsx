import React from 'react';
import { CheckCircle2, Clock, Phone, MapPin, ChevronRight, Check } from 'lucide-react';
import Badge from '../../ui/Badge';
import Button from '../../ui/Button';

export default function PendingQueue({
  items = [],
  onMarkDone,
  onMarkPickedUp,
  onSelectCustomer
}) {
  if (!items || items.length === 0) {
    return (
      <div
        style={{
          padding: '2rem 1rem',
          textAlign: 'center',
          backgroundColor: 'hsl(var(--surface))',
          border: '1px solid hsl(var(--line))',
          borderRadius: 'var(--radius-md)'
        }}
      >
        <CheckCircle2 size={32} style={{ color: 'hsl(var(--status-healthy-text))', marginBottom: '0.5rem' }} />
        <p style={{ fontSize: '14px', fontWeight: '600', color: 'hsl(var(--ink))' }}>
          Sabhi bori complete hain!
        </p>
        <p style={{ fontSize: '12px', color: 'hsl(var(--ink-3))', marginTop: '2px' }}>
          Koi pending order queue me nahi hai.
        </p>
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
      {items.map((item, index) => (
        <div
          key={item.id}
          style={{
            padding: '1rem',
            borderBottom: index === items.length - 1 ? 'none' : '1px solid hsl(var(--line))',
            display: 'flex',
            flexDirection: 'column',
            gap: '0.625rem'
          }}
        >
          {/* Row 1: Customer info & grain status */}
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <h3
                  onClick={() => onSelectCustomer?.({ id: item.customerId, name: item.customerName })}
                  style={{
                    fontSize: '15px',
                    fontWeight: '700',
                    color: 'hsl(var(--ink))',
                    cursor: 'pointer'
                  }}
                >
                  {item.customerName}
                </h3>

                {item.customerVillage && (
                  <span style={{ fontSize: '12px', color: 'hsl(var(--ink-2))', display: 'flex', alignItems: 'center', gap: '2px' }}>
                    <MapPin size={12} />
                    {item.customerVillage}
                  </span>
                )}
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '3px' }}>
                <span style={{ fontSize: '13px', fontWeight: '600', color: 'hsl(var(--ink-2))' }}>
                  {item.grainType} ({item.inputWeight} kg)
                </span>
                <span style={{ color: 'hsl(var(--line-2))' }}>•</span>
                <span style={{ fontSize: '13px', color: 'hsl(var(--ink-3))' }}>
                  Output: {item.outputType || 'Atta'}
                </span>
              </div>
            </div>

            {/* Numerals shout in Fraunces serif */}
            <div style={{ textAlign: 'right' }}>
              <span className="numeral-serif" style={{ fontSize: '1.125rem', fontWeight: '800', color: 'hsl(var(--ink))' }}>
                ₹{item.amount || 0}
              </span>
              <div>
                <Badge variant={item.paymentMode === 'credit' ? 'udhar' : 'healthy'} size="sm">
                  {item.paymentMode === 'credit' ? 'Udhar' : 'Nokad'}
                </Badge>
              </div>
            </div>
          </div>

          {/* Row 2: One-tap action buttons with 48px touch targets */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: '0.25rem' }}>
            <span style={{ fontSize: '12px', color: 'hsl(var(--ink-3))', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <Clock size={12} />
              {item.notes || 'Normal grinding'}
            </span>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              {item.status === 'pending' && (
                <Button
                  variant="brand"
                  size="sm"
                  icon={Check}
                  onClick={() => onMarkDone?.(item.id)}
                >
                  Done Karein
                </Button>
              )}

              {item.status === 'done' && (
                <Button
                  variant="quiet"
                  size="sm"
                  icon={CheckCircle2}
                  onClick={() => onMarkPickedUp?.(item.id)}
                >
                  Pickup Done
                </Button>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
