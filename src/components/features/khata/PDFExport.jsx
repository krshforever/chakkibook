import React, { useState } from 'react';
import { Download, Loader2 } from 'lucide-react';
import Button from '../../ui/Button';

export default function PDFExport({ customer, transactions = [], shopName = 'Vanshu Atta Chakki' }) {
  const [loading, setLoading] = useState(false);
  if (!customer) return null;

  const generatePDF = async () => {
    try {
      setLoading(true);
      const { jsPDF } = await import('jspdf');
      const doc = new jsPDF();

      // Title & Header
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(18);
      doc.text(shopName, 14, 20);

      doc.setFontSize(12);
      doc.setFont('helvetica', 'normal');
      doc.text(`Grahak Khata Statement: ${customer.name}`, 14, 28);
      doc.text(`Mobile: ${customer.phone || 'N/A'} | Gaon: ${customer.village || 'N/A'}`, 14, 35);
      doc.text(`Tareekh: ${new Date().toLocaleDateString('en-IN')}`, 14, 42);

      doc.line(14, 46, 196, 46);

      // Table Header
      let y = 54;
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(10);
      doc.text('Tareekh', 14, y);
      doc.text('Vivaran (Type)', 50, y);
      doc.text('Rakam (Amount)', 120, y);
      doc.text('Status', 160, y);

      doc.line(14, y + 2, 196, y + 2);

      // Table Rows
      doc.setFont('helvetica', 'normal');
      transactions.forEach((tx) => {
        y += 8;
        if (y > 270) {
          doc.addPage();
          y = 20;
        }
        const dateStr = tx.dropOffDate ? new Date(tx.dropOffDate).toLocaleDateString('en-IN') : 'Today';
        const typeStr = (tx.tx_kind === 'payment' || tx.type === 'payment' || !tx.grainType) ? 'Jama Payment' : `${tx.grainType} (${tx.inputWeight}kg)`;
        const amountStr = `Rs. ${tx.amount}`;
        const statusStr = tx.paymentMode === 'credit' ? 'Udhar' : 'Nokad';

        doc.text(dateStr, 14, y);
        doc.text(typeStr, 50, y);
        doc.text(amountStr, 120, y);
        doc.text(statusStr, 160, y);
      });

      doc.line(14, y + 4, 196, y + 4);
      y += 12;

      // Summary Dues
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(12);
      doc.text(`Kul Baki Udhar (Total Dues): Rs. ${customer.balance || 0}`, 14, y);

      doc.save(`Khata_${customer.name.replace(/\s+/g, '_')}.pdf`);
    } catch (e) {
      console.warn('PDF export error:', e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button
      variant="quiet"
      size="sm"
      icon={loading ? Loader2 : Download}
      disabled={loading}
      onClick={generatePDF}
    >
      {loading ? 'Generating PDF...' : 'Download PDF Hisab'}
    </Button>
  );
}
