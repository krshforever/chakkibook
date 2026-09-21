import React from 'react';
import { ArrowDownLeft, ArrowUpRight, Calendar, FileText } from 'lucide-react';
import Badge from '../../ui/Badge';

export default function TransactionTimeline({ transactions = [] }) {
  if (!transactions || transactions.length === 0) {
    return (
      <div style={{ padding: '1.5rem', textAlign: 'center', color: 'hsl(var(--ink-3))', fontSize: '13px' }}>
        Is grahak ki koi purani entry nahi milis.
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.625rem' }}>
      {transactions.map((tx) => {
        const isCredit = tx.paymentMode === 'credit';
        const isPayment = tx.type === 'payment';

        return (
          <div
            key={tx.id}
            style={{
              padding: '0.875rem 1rem',
              backgroundColor: 'hsl(var(--surface))',
              border: '1px solid hsl(var(--line))',
              borderRadius: 'var(--radius-sm)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <div
                style={{
                  width: '34px',
                  height: '34px',
                  borderRadius: '50%',
                  backgroundColor: isPayment
                    ? 'hsl(var(--status-healthy-bg))'
                    : isCredit
                    ? 'hsl(var(--risk-udhar-bg))'
                    : 'hsl(var(--surface-2))',
                  color: isPayment
                    ? 'hsl(var(--status-healthy-text))'
                    : isCredit
                    ? 'hsl(var(--risk-udhar-text))'
                    : 'hsl(var(--ink-2))',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0
                }}
              >
                {isPayment ? <ArrowDownLeft size={18} /> : <ArrowUpRight size={18} />}
              </div>

              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <span style={{ fontSize: '14px', fontWeight: '700', color: 'hsl(var(--ink))' }}>
                    {tx.grainType ? `${tx.grainType} (${tx.inputWeight}kg)` : isPayment ? 'Jama Bhugtan' : 'Pisai Seva'}
                  </span>
                </div>
                <span style={{ fontSize: '12px', color: 'hsl(var(--ink-3))', marginTop: '1px', display: 'block' }}>
                  {tx.dropOffDate ? new Date(tx.dropOffDate).toLocaleDateString('en-IN') : 'Aaj'} {tx.notes ? `• ${tx.notes}` : ''}
                </span>
              </div>
            </div>

            {/* Numerals shout in Fraunces serif */}
            <div style={{ textAlign: 'right' }}>
              <span
                className="numeral-serif"
                style={{
                  fontSize: '1.125rem',
                  fontWeight: '800',
                  color: isPayment
                    ? 'hsl(var(--status-healthy-text))'
                    : isCredit
                    ? 'hsl(var(--risk-udhar-text))'
                    : 'hsl(var(--ink))'
                }}
              >
                {isPayment ? '-' : '+'}₹{tx.amount}
              </span>
              <div>
                <Badge variant={isCredit ? 'udhar' : 'healthy'} size="sm">
                  {isPayment ? 'Jama' : isCredit ? 'Udhar' : 'Nokad'}
                </Badge>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
