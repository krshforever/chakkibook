import React, { useState } from 'react';
import { FileCode, Download, Table } from 'lucide-react';
import { useStore } from '../../../store/useStore';
import { exportToTallyXML, exportToZohoCSV, downloadFile } from '../../../services/accountingExport';
import Button from '../../ui/Button';

export default function AccountingExportButton() {
  const customers = useStore((state) => state.customers);
  const boris = useStore((state) => state.boris);
  const [showOptions, setShowOptions] = useState(false);

  const handleExportTally = () => {
    const xml = exportToTallyXML(customers, boris);
    downloadFile(xml, `Tally_Import_${new Date().toISOString().slice(0, 10)}.xml`, 'text/xml');
    setShowOptions(false);
  };

  const handleExportZoho = () => {
    const csv = exportToZohoCSV(customers, boris);
    downloadFile(csv, `Zoho_Ledger_${new Date().toISOString().slice(0, 10)}.csv`, 'text/csv');
    setShowOptions(false);
  };

  return (
    <div style={{ position: 'relative' }}>
      <Button
        variant="quiet"
        size="sm"
        icon={FileCode}
        onClick={() => setShowOptions(!showOptions)}
      >
        Export Tally / Zoho
      </Button>

      {showOptions && (
        <div
          style={{
            position: 'absolute',
            top: '42px',
            right: 0,
            zIndex: 100,
            backgroundColor: 'hsl(var(--surface))',
            border: '1px solid hsl(var(--line))',
            borderRadius: 'var(--radius-sm)',
            boxShadow: '0 4px 16px rgba(33, 26, 18, 0.12)',
            padding: '0.5rem',
            display: 'flex',
            flexDirection: 'column',
            gap: '0.375rem',
            width: '180px'
          }}
        >
          <button
            type="button"
            onClick={handleExportTally}
            style={{
              padding: '0.4rem 0.6rem',
              borderRadius: 'var(--radius-xs)',
              fontSize: '12px',
              fontWeight: '600',
              textAlign: 'left',
              backgroundColor: 'hsl(var(--surface-2))',
              color: 'hsl(var(--ink))',
              border: 'none',
              cursor: 'pointer'
            }}
          >
            📄 Tally XML Format
          </button>

          <button
            type="button"
            onClick={handleExportZoho}
            style={{
              padding: '0.4rem 0.6rem',
              borderRadius: 'var(--radius-xs)',
              fontSize: '12px',
              fontWeight: '600',
              textAlign: 'left',
              backgroundColor: 'hsl(var(--surface-2))',
              color: 'hsl(var(--ink))',
              border: 'none',
              cursor: 'pointer'
            }}
          >
            📊 Zoho Books CSV
          </button>
        </div>
      )}
    </div>
  );
}
