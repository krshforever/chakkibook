import React from 'react';
import { ArrowLeft, PlusCircle, IndianRupee } from 'lucide-react';
import Avatar from '../ui/Avatar';
import CreditScoreBadge from '../features/khata/CreditScoreBadge';
import TransactionTimeline from '../features/khata/TransactionTimeline';
import WhatsAppReminder from '../features/khata/WhatsAppReminder';
import PDFExport from '../features/khata/PDFExport';
import AccountingExportButton from '../features/khata/AccountingExportButton';

export default function CustomerDetail({
  customer,
  transactions = [],
  onBack,
  onCollectPayment,
  onNewEntry
}) {
  if (!customer) return null;

  return (
    <div style={{ padding: '1rem 1rem 5rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <button
          type="button"
          onClick={onBack}
          style={{ display: 'inline-flex', alignItems: 'center', gap: '0.375rem', background: 'none', border: 'none', color: 'hsl(var(--ink-1))', fontSize: '14px', fontWeight: '600', cursor: 'pointer' }}
        >
          <ArrowLeft size={18} />
          <span>Grahak List</span>
        </button>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <PDFExport customer={customer} transactions={transactions} />
          <AccountingExportButton customer={customer} transactions={transactions} />
        </div>
      </div>

      <div style={{ padding: '1.25rem', backgroundColor: 'hsl(var(--ink-1))', color: '#ffffff', borderRadius: 'var(--radius-lg)', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <Avatar name={customer.name} size="md" />
            <div>
              <h2 style={{ fontSize: '1.25rem', fontWeight: '800', color: '#ffffff', margin: 0 }}>
                {customer.name}
              </h2>
              <span style={{ fontSize: '0.8rem', color: '#94a3b8', fontWeight: '500' }}>
                {customer.village || 'Main Village'} {customer.phone ? `• ${customer.phone}` : ''}
              </span>
            </div>
          </div>
          <CreditScoreBadge balance={customer.balance} />
        </div>

        <div style={{ borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '0.875rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <span style={{ fontSize: '0.75rem', color: '#94a3b8', display: 'block', textTransform: 'uppercase' }}>Kul Bakaya Dues</span>
            <span className="numeral-serif" style={{ fontSize: '1.75rem', fontWeight: '800', color: customer.balance > 0 ? 'hsl(var(--red-600))' : '#4ade80' }}>
              ₹{customer.balance?.toLocaleString('en-IN')}
            </span>
          </div>

          <button
            type="button"
            onClick={onCollectPayment}
            style={{ height: '42px', padding: '0 16px', borderRadius: 'var(--radius-pill)', backgroundColor: 'hsl(var(--brand-500))', color: '#ffffff', border: 'none', fontWeight: '700', fontSize: '13px', display: 'inline-flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}
          >
            <IndianRupee size={16} />
            <span>Jama Record</span>
          </button>
        </div>
      </div>

      <WhatsAppReminder customer={customer} />

      <div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
          <h3 style={{ fontSize: '15px', fontWeight: '700', color: 'hsl(var(--ink-1))', margin: 0 }}>
            Purana Hisab & Transactions ({transactions.length})
          </h3>
          <button
            type="button"
            onClick={onNewEntry}
            style={{ background: 'none', border: 'none', color: 'hsl(var(--brand-600))', fontSize: '13px', fontWeight: '700', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
          >
            <PlusCircle size={15} />
            <span>Nayi Bori</span>
          </button>
        </div>
        <TransactionTimeline transactions={transactions} />
      </div>
    </div>
  );
}
