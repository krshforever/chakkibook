import React, { useState } from 'react';
import Modal from '../ui/Modal';
import Input from '../ui/Input';
import Button from '../ui/Button';

export default function PaymentCollector({
  isOpen,
  onClose,
  customer,
  onSubmitPayment
}) {
  const [paymentAmount, setPaymentAmount] = useState('');

  if (!isOpen || !customer) return null;

  const handleSubmit = () => {
    const amt = Number(paymentAmount);
    if (!amt) return;
    onSubmitPayment(amt);
    setPaymentAmount('');
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Jama Rakam — ${customer.name}`} subtitle={`Kul Bakaya: ₹${customer.balance}`}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', paddingTop: '0.5rem' }}>
        <div>
          <span style={{ fontSize: '12px', color: 'hsl(var(--ink-2))', display: 'block', marginBottom: '6px' }}>
            Quick Amount Presets:
          </span>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.5rem' }}>
            {[100, 200, 500, customer.balance].map((amt, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => setPaymentAmount(String(amt))}
                style={{
                  height: '38px',
                  borderRadius: 'var(--radius-sm)',
                  fontSize: '12px',
                  fontWeight: '700',
                  backgroundColor: paymentAmount === String(amt) ? 'hsl(var(--brand-tint))' : 'hsl(var(--surface-2))',
                  color: paymentAmount === String(amt) ? 'hsl(var(--brand-600))' : 'hsl(var(--ink-1))',
                  border: paymentAmount === String(amt) ? '1px solid hsl(var(--brand-500))' : '1px solid hsl(var(--line))',
                  cursor: 'pointer'
                }}
              >
                {idx === 3 ? 'Full' : `+₹${amt}`}
              </button>
            ))}
          </div>
        </div>

        <Input
          label="Rakam (Amount in ₹)"
          placeholder="e.g. 500"
          type="number"
          value={paymentAmount}
          onChange={(e) => setPaymentAmount(e.target.value)}
          required
        />
        <Button variant="brand" fullWidth onClick={handleSubmit}>
          Jama Confirm Karein
        </Button>
      </div>
    </Modal>
  );
}
