import React, { useState } from 'react';
import { MessageSquare, Send } from 'lucide-react';
import Button from '../../ui/Button';

export default function WhatsAppReminder({ customer, shopName = 'Vanshu Atta Chakki' }) {
  const [selectedTemplate, setSelectedTemplate] = useState('polite');

  if (!customer || !customer.phone) return null;

  const templates = {
    polite: `Ram Ram ${customer.name} ji, ${shopName} se bol rahe hain. Aapka kul baki udhar ₹${customer.balance} hai. Kripya samay par jama karayein. Dhanyawad!`,
    firm: `Hello ${customer.name}, ${shopName} par aapka ₹${customer.balance} baki hai. Kripya aaj hi account clear karein. Shukriya!`,
    detailed: `Aapka ${shopName} par kul hisab: ₹${customer.balance} baki hai. UPI / Cash me bhugtan kar sakte hain.`
  };

  const currentMessage = templates[selectedTemplate];

  const handleSendWhatsApp = () => {
    let cleanPhone = customer.phone.replace(/\D/g, '');
    if (cleanPhone.length === 10) cleanPhone = `91${cleanPhone}`;
    const encodedText = encodeURIComponent(currentMessage);
    window.open(`https://wa.me/${cleanPhone}?text=${encodedText}`, '_blank');
  };

  return (
    <div
      style={{
        padding: '1rem',
        backgroundColor: 'hsl(var(--surface-2))',
        border: '1px solid hsl(var(--line))',
        borderRadius: 'var(--radius-md)',
        marginTop: '1rem'
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
        <MessageSquare size={18} style={{ color: 'hsl(142 60% 35%)' }} />
        <h4 style={{ fontSize: '14px', fontWeight: '700', color: 'hsl(var(--ink))' }}>
          WhatsApp Payment Reminder (1-Tap Send)
        </h4>
      </div>

      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.75rem' }}>
        <button
          type="button"
          onClick={() => setSelectedTemplate('polite')}
          style={{
            flex: 1,
            padding: '0.375rem 0.5rem',
            borderRadius: 'var(--radius-sm)',
            fontSize: '12px',
            fontWeight: '600',
            backgroundColor: selectedTemplate === 'polite' ? 'var(--primary-light)' : 'hsl(var(--surface))',
            color: selectedTemplate === 'polite' ? 'var(--primary-dark)' : 'hsl(var(--ink-2))',
            border: selectedTemplate === 'polite' ? '1px solid var(--primary-color)' : '1px solid hsl(var(--line))',
            cursor: 'pointer'
          }}
        >
          Namaste Template
        </button>

        <button
          type="button"
          onClick={() => setSelectedTemplate('firm')}
          style={{
            flex: 1,
            padding: '0.375rem 0.5rem',
            borderRadius: 'var(--radius-sm)',
            fontSize: '12px',
            fontWeight: '600',
            backgroundColor: selectedTemplate === 'firm' ? 'var(--primary-light)' : 'hsl(var(--surface))',
            color: selectedTemplate === 'firm' ? 'var(--primary-dark)' : 'hsl(var(--ink-2))',
            border: selectedTemplate === 'firm' ? '1px solid var(--primary-color)' : '1px solid hsl(var(--line))',
            cursor: 'pointer'
          }}
        >
          Urgent Reminder
        </button>
      </div>

      <div
        style={{
          padding: '0.75rem',
          backgroundColor: 'hsl(var(--surface))',
          border: '1px dashed hsl(var(--line-2))',
          borderRadius: 'var(--radius-sm)',
          fontSize: '13px',
          color: 'hsl(var(--ink))',
          marginBottom: '0.75rem',
          lineHeight: '1.4'
        }}
      >
        "{currentMessage}"
      </div>

      <Button
        variant="brand"
        fullWidth
        icon={Send}
        onClick={handleSendWhatsApp}
        style={{ backgroundColor: '#25D366' }}
      >
        WhatsApp Par Bhejein
      </Button>
    </div>
  );
}
