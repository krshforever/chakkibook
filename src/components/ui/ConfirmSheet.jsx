import React from 'react';
import Modal from './Modal';
import Button from './Button';

export default function ConfirmSheet({
  isOpen,
  onClose,
  onConfirm,
  title = 'Kya aap pakka karna chahte hain?',
  subtitle = 'Yeh action undo ho sakta hai.',
  confirmText = 'Haan, Pakka Karein',
  cancelText = 'Radd Karein',
  variant = 'brand', // 'brand' | 'danger'
  loading = false
}) {
  if (!isOpen) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title} subtitle={subtitle}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', paddingTop: '0.5rem' }}>
        <p style={{ fontSize: '0.9rem', color: 'hsl(var(--ink-2))', margin: 0 }}>
          {subtitle}
        </p>

        <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.5rem' }}>
          <Button
            variant={variant === 'danger' ? 'danger' : 'brand'}
            fullWidth
            onClick={onConfirm}
            disabled={loading}
          >
            {loading ? 'Processing...' : confirmText}
          </Button>

          <Button
            variant="quiet"
            fullWidth
            onClick={onClose}
            disabled={loading}
          >
            {cancelText}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
