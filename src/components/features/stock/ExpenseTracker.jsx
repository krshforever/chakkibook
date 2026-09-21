import React, { useState, useMemo } from 'react';
import { DollarSign, Plus, TrendingUp, TrendingDown, PieChart } from 'lucide-react';
import { useStore } from '../../../store/useStore';
import Card from '../../ui/Card';
import Button from '../../ui/Button';
import Input from '../../ui/Input';
import Modal from '../../ui/Modal';

export default function ExpenseTracker({ todayEarnings = 0 }) {
  const expenses = useStore((state) => state.expenses || []);
  const addExpense = useStore((state) => state.addExpense);
  const getProfitLoss = useStore((state) => state.getProfitLoss);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [form, setForm] = useState({ category: 'Bijli', amount: '', description: '' });

  const pnl = useMemo(() => getProfitLoss(todayEarnings), [todayEarnings, expenses, getProfitLoss]);

  const handleAddExpense = () => {
    if (!form.amount) return;
    addExpense({
      category: form.category,
      amount: Number(form.amount),
      description: form.description || form.category
    });
    setForm({ category: 'Bijli', amount: '', description: '' });
    setIsModalOpen(false);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
      {/* P&L Financial Card */}
      <Card variant="flat" style={{ backgroundColor: 'hsl(var(--surface-2))', borderColor: 'hsl(var(--line))' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.625rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', color: 'hsl(var(--ink))' }}>
            <PieChart size={16} />
            <span style={{ fontSize: '13px', fontWeight: '700' }}>Profit & Loss Statement (P&L)</span>
          </div>

          <Button variant="brand" size="sm" icon={Plus} onClick={() => setIsModalOpen(true)}>
            + Kharcha (Expense)
          </Button>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.5rem', textAlign: 'center' }}>
          <div style={{ padding: '0.5rem', backgroundColor: 'hsl(var(--surface))', borderRadius: 'var(--radius-sm)', border: '1px solid hsl(var(--line))' }}>
            <span style={{ fontSize: '11px', color: 'hsl(var(--ink-3))', display: 'block' }}>Revenue</span>
            <span className="numeral-serif" style={{ fontSize: '1.125rem', fontWeight: '800', color: 'hsl(var(--status-healthy-text))' }}>
              ₹{pnl.revenue.toLocaleString('en-IN')}
            </span>
          </div>

          <div style={{ padding: '0.5rem', backgroundColor: 'hsl(var(--surface))', borderRadius: 'var(--radius-sm)', border: '1px solid hsl(var(--line))' }}>
            <span style={{ fontSize: '11px', color: 'hsl(var(--ink-3))', display: 'block' }}>Expenses</span>
            <span className="numeral-serif" style={{ fontSize: '1.125rem', fontWeight: '800', color: 'hsl(var(--risk-udhar-text))' }}>
              ₹{pnl.totalExpenses.toLocaleString('en-IN')}
            </span>
          </div>

          <div style={{ padding: '0.5rem', backgroundColor: 'hsl(var(--surface))', borderRadius: 'var(--radius-sm)', border: '1px solid hsl(var(--line))' }}>
            <span style={{ fontSize: '11px', color: 'hsl(var(--ink-3))', display: 'block' }}>Net Profit</span>
            <span className="numeral-serif" style={{ fontSize: '1.125rem', fontWeight: '800', color: pnl.netProfit >= 0 ? 'hsl(var(--status-healthy-text))' : 'hsl(var(--risk-udhar-text))' }}>
              ₹{pnl.netProfit.toLocaleString('en-IN')}
            </span>
          </div>
        </div>
      </Card>

      {/* Add Expense Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Dukaan Ka Kharcha Entry"
        subtitle="Record electricity, machine repair, salary, or transport expense"
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div>
            <label style={{ fontSize: '13px', fontWeight: '600', color: 'hsl(var(--ink-2))', display: 'block', marginBottom: '4px' }}>
              Expense Category
            </label>
            <select
              value={form.category}
              onChange={(e) => setForm({ ...form, category: e.target.value })}
              style={{
                width: '100%',
                minHeight: '48px',
                padding: '0 0.875rem',
                borderRadius: 'var(--radius-sm)',
                border: '1px solid hsl(var(--line))',
                backgroundColor: 'hsl(var(--surface))',
                fontSize: '15px',
                fontWeight: '600',
                color: 'hsl(var(--ink))'
              }}
            >
              <option value="Bijli">⚡ Bijli / Power Bill</option>
              <option value="Machine Repair">🔧 Machine Repair / Stone Dressing</option>
              <option value="Staff Salary">👷 Staff / Operator Salary</option>
              <option value="Transport">🚚 Transport & Diesel</option>
              <option value="Other">📦 Other Shop Expense</option>
            </select>
          </div>

          <Input
            label="Kharcha Rakam (Amount in ₹)"
            placeholder="e.g. 500"
            type="number"
            value={form.amount}
            onChange={(e) => setForm({ ...form, amount: e.target.value })}
            required
          />

          <Input
            label="Details / Notes"
            placeholder="e.g. Diesel for generator"
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
          />

          <Button variant="brand" fullWidth onClick={handleAddExpense}>
            Save Expense
          </Button>
        </div>
      </Modal>
    </div>
  );
}
