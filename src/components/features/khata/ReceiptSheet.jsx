import React from 'react';
import { Share2, CheckCircle2, MessageSquare } from 'lucide-react';
import Modal from '../../ui/Modal';
import Button from '../../ui/Button';

export default function ReceiptSheet({
  isOpen,
  onClose,
  bori,
  shopName = 'Vanshu Atta Chakki'
}) {
  if (!isOpen || !bori) return null;

  const handleSendWhatsApp = () => {
    const text = `*${shopName} — Receipt*\n\n` +
      `Grahak: *${bori.customerName}*\n` +
      `Grain: ${bori.inputWeight} kg ${bori.grainType || 'Milling'}\n` +
      `Rakam: ₹${bori.amount}\n` +
      `Status: ${bori.paymentMode === 'credit' ? 'Udhar' : 'Nokad Paid'}\n\n` +
      `Chakkibook se bhej gaya receipt. Dhanyawad!`;
    
    const phone = bori.customerPhone ? bori.customerPhone.replace(/\D/g, '') : '';
    const url = phone ? `https://wa.me/91${phone}?text=${encodeURIComponent(text)}` : `https://wa.me/?text=${encodeURIComponent(text)}`;
    window.open(url, '_blank');
    onClose?.();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Receipt Tayar Hai! 🧾" subtitle="Grahak ko WhatsApp par raseed bhejein">
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', paddingTop: '0.5rem' }}>
        {/* Receipt Card Preview */}
        <div style={{ background: 'var(--surface)', border: '1px solid hsl(var(--line))', borderRadius: '16px', padding: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px', color: 'hsl(var(--green-700))', font: '700 13px var(--fb)' }}>
            <CheckCircle2 size={18} />
            <span>Entry Save Ho Gayi</span>
          </div>
          <div style={{ font: '700 16px var(--fb)', color: 'hsl(var(--ink-1))', marginBottom: '4px' }}>
            {bori.customerName} ({bori.customerVillage || 'Main'})
          </div>
          <div style={{ font: '500 13px var(--fb)', color: 'hsl(var(--ink-2))', marginBottom: '12px' }}>
            {bori.inputWeight} kg {bori.grainType || 'Grain'} · {bori.outputType || 'Atta'}
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid hsl(var(--line))', paddingTop: '10px' }}>
            <span style={{ font: '500 13px var(--fb)', color: 'hsl(var(--ink-2))' }}>Milling Charge:</span>
            <span style={{ font: '700 18px var(--fd)', color: 'hsl(var(--ink-1))' }}>₹{bori.amount}</span>
          </div>
        </div>

        {/* Action Buttons */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <Button variant="brand" fullWidth onClick={handleSendWhatsApp}>
            <MessageSquare size={18} /> WhatsApp Par Bhejein
          </Button>
          <Button variant="quiet" fullWidth onClick={onClose}>
            Baad Mein
          </Button>
        </div>
      </div>
    </Modal>
  );
}
