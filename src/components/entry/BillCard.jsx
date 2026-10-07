import React from 'react';

export default function BillCard({ kaddaDeduction = 0, kaddaRate = 1.25, kaddaPer = 40, totalAmount = 0 }) {
  return (
    <div
      style={{
        padding: '1rem',
        backgroundColor: 'hsl(var(--surface-2))',
        border: '1px solid hsl(var(--line))',
        borderRadius: 'var(--radius-md)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between'
      }}
    >
      <div>
        <span style={{ fontSize: '12px', color: 'hsl(var(--ink-2))', display: 'block' }}>
          Kadda Deducted ({kaddaRate}kg / {kaddaPer}kg)
        </span>
        <span style={{ fontSize: '14px', fontWeight: '700', color: 'hsl(var(--ink-2))' }}>
          {Number(kaddaDeduction).toFixed(2)} kg
        </span>
      </div>

      <div style={{ textAlign: 'right' }}>
        <span style={{ fontSize: '12px', color: 'hsl(var(--ink-2))', display: 'block' }}>TOTAL BILL</span>
        <span className="numeral-serif" style={{ fontSize: '1.5rem', fontWeight: '800', color: 'hsl(var(--ink-1))' }}>
          ₹{Number(totalAmount).toLocaleString('en-IN')}
        </span>
      </div>
    </div>
  );
}
