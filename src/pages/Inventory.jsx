import React, { useState } from 'react';
import { PlusCircle, Package, PieChart } from 'lucide-react';
import { useStockStore } from '../store/stock/useStockStore';
import { useDashboardStore } from '../store/dashboard/useDashboardStore';
import StockHero from '../components/features/stock/StockHero';
import StockList from '../components/features/stock/StockList';
import StockAlerts from '../components/features/stock/StockAlerts';
import MandiPriceWidget from '../components/features/stock/MandiPriceWidget';
import ExpenseTracker from '../components/features/stock/ExpenseTracker';
import Section from '../components/layout/Section';
import Modal from '../components/ui/Modal';
import Input from '../components/ui/Input';
import Button from '../components/ui/Button';

export default function Inventory() {
  const inventory = useStockStore((state) => state.inventory);
  const getLowStockAlerts = useStockStore((state) => state.getLowStockAlerts);
  const updateStock = useStockStore((state) => state.updateStock);
  const addStockEntry = useStockStore((state) => state.addStockEntry);
  const boris = useDashboardStore((state) => state.boris || []);

  const [isAddEntryOpen, setIsAddEntryOpen] = useState(false);
  const [entryForm, setEntryForm] = useState({ type: 'purchase', item: 'Sarson Seeds', weight: '', rate: '', amount: '' });

  const lowAlerts = getLowStockAlerts();

  // Total earnings for P&L calculator
  const totalEarnings = boris.reduce((sum, b) => sum + (Number(b.amount) || 0), 0);

  const handleCreateStockEntry = () => {
    if (!entryForm.weight) return;
    addStockEntry({
      type: entryForm.type,
      item: entryForm.item,
      weight: Number(entryForm.weight),
      rate: Number(entryForm.rate) || 0,
      amount: Number(entryForm.amount) || (Number(entryForm.weight) * (Number(entryForm.rate) || 0))
    });
    setEntryForm({ type: 'purchase', item: 'Sarson Seeds', weight: '', rate: '', amount: '' });
    setIsAddEntryOpen(false);
  };

  return (
    <div style={{ padding: '1rem 1rem 5rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      {/* Rule 5: One Dark Moment Per Screen — StockHero dark valuation card */}
      <StockHero />

      {/* Real-Time Mandi Price Feed & Rate Recommendation Widget */}
      <MandiPriceWidget />

      {/* Low Stock Alerts Widget */}
      <StockAlerts alerts={lowAlerts} onRestock={(id, qty) => updateStock(id, qty)} />

      {/* Profit & Loss (P&L) Statement & Shop Expense Tracker */}
      <ExpenseTracker todayEarnings={totalEarnings} />

      {/* Main Stock List */}
      <Section
        title={`Current Inventory (${inventory.length} Items)`}
        action={
          <Button variant="brand" size="sm" icon={PlusCircle} onClick={() => setIsAddEntryOpen(true)}>
            + Stock Action
          </Button>
        }
      >
        <StockList inventory={inventory} onUpdateStock={updateStock} />
      </Section>

      {/* Add Stock Entry Modal */}
      <Modal
        isOpen={isAddEntryOpen}
        onClose={() => setIsAddEntryOpen(false)}
        title="Nayi Stock Entry / Sale"
        subtitle="Purchase, Oil Sale, or Khali record"
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div>
            <label style={{ fontSize: '13px', fontWeight: '600', color: 'hsl(var(--ink-2))', display: 'block', marginBottom: '4px' }}>
              Entry Type
            </label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.5rem' }}>
              <button
                type="button"
                onClick={() => setEntryForm({ ...entryForm, type: 'purchase', item: 'Sarson Seeds' })}
                style={{
                  padding: '0.5rem',
                  borderRadius: 'var(--radius-sm)',
                  fontSize: '12px',
                  fontWeight: '600',
                  backgroundColor: entryForm.type === 'purchase' ? 'var(--primary-light)' : 'hsl(var(--surface-2))',
                  color: entryForm.type === 'purchase' ? 'var(--primary-dark)' : 'hsl(var(--ink-2))',
                  border: entryForm.type === 'purchase' ? '1px solid var(--primary-color)' : '1px solid hsl(var(--line))',
                  cursor: 'pointer'
                }}
              >
                Sarson Purchase
              </button>
              <button
                type="button"
                onClick={() => setEntryForm({ ...entryForm, type: 'oil_sale', item: 'Mustard Oil' })}
                style={{
                  padding: '0.5rem',
                  borderRadius: 'var(--radius-sm)',
                  fontSize: '12px',
                  fontWeight: '600',
                  backgroundColor: entryForm.type === 'oil_sale' ? 'var(--primary-light)' : 'hsl(var(--surface-2))',
                  color: entryForm.type === 'oil_sale' ? 'var(--primary-dark)' : 'hsl(var(--ink-2))',
                  border: entryForm.type === 'oil_sale' ? '1px solid var(--primary-color)' : '1px solid hsl(var(--line))',
                  cursor: 'pointer'
                }}
              >
                Oil Sale
              </button>
              <button
                type="button"
                onClick={() => setEntryForm({ ...entryForm, type: 'khari_sale', item: 'Khali / Mustard Cake' })}
                style={{
                  padding: '0.5rem',
                  borderRadius: 'var(--radius-sm)',
                  fontSize: '12px',
                  fontWeight: '600',
                  backgroundColor: entryForm.type === 'khari_sale' ? 'var(--primary-light)' : 'hsl(var(--surface-2))',
                  color: entryForm.type === 'khari_sale' ? 'var(--primary-dark)' : 'hsl(var(--ink-2))',
                  border: entryForm.type === 'khari_sale' ? '1px solid var(--primary-color)' : '1px solid hsl(var(--line))',
                  cursor: 'pointer'
                }}
              >
                Khali Sale
              </button>
            </div>
          </div>

          <Input
            label="Vazan / Quantity (Kg / Litre)"
            placeholder="e.g. 50"
            type="number"
            value={entryForm.weight}
            onChange={(e) => setEntryForm({ ...entryForm, weight: e.target.value })}
            required
          />

          <Input
            label="Rate (₹ per unit)"
            placeholder="e.g. 55"
            type="number"
            value={entryForm.rate}
            onChange={(e) => setEntryForm({ ...entryForm, rate: e.target.value })}
          />

          <Button variant="brand" fullWidth onClick={handleCreateStockEntry}>
            Save Stock Entry
          </Button>
        </div>
      </Modal>
    </div>
  );
}
