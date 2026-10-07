import React, { useState, useMemo } from 'react';
import { UserPlus } from 'lucide-react';
import { useStore } from '../store/useStore';
import CustomerList from '../components/features/khata/CustomerList';
import CustomerDetail from '../components/khata/CustomerDetail';
import PaymentCollector from '../components/khata/PaymentCollector';
import GaonSelector from '../components/shared/GaonSelector';
import SearchBar from '../components/shared/SearchBar';
import Modal from '../components/ui/Modal';
import Input from '../components/ui/Input';
import Button from '../components/ui/Button';
import AccountingExportButton from '../components/features/khata/AccountingExportButton';
import { calculateTotalDues, filterDebtors } from '../utils/ledger';

export default function Khata({ selectedCustomer: externalSelectedCustomer, onClearSelectedCustomer, onOpenNewEntry }) {
  const customers = useStore((state) => state.customers || []);
  const boris = useStore((state) => state.boris || []);
  const addCustomer = useStore((state) => state.addCustomer);
  const updateCustomerBalance = useStore((state) => state.updateCustomerBalance);
  const assignCustomerToBori = useStore((state) => state.assignCustomerToBori);

  const reviewBoris = useMemo(() => boris.filter(b => b.needsReview || !b.customerId || b.customerId === 'c_temp'), [boris]);

  const [internalSelectedCustomer, setInternalSelectedCustomer] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedVillage, setSelectedVillage] = useState('all');

  const [isAddCustomerOpen, setIsAddCustomerOpen] = useState(false);
  const [isCollectPaymentOpen, setIsCollectPaymentOpen] = useState(false);
  const [newCustomerForm, setNewCustomerForm] = useState({ name: '', phone: '', village: '', initialBalance: '' });

  const currentCustomer = externalSelectedCustomer || internalSelectedCustomer;

  const handleSelectCustomer = (c) => setInternalSelectedCustomer(c);
  const handleBackToList = () => {
    setInternalSelectedCustomer(null);
    onClearSelectedCustomer?.();
  };

  const filteredCustomers = useMemo(() => {
    return filterDebtors(customers, selectedVillage, searchQuery);
  }, [customers, searchQuery, selectedVillage]);

  const totalDues = useMemo(() => calculateTotalDues(customers), [customers]);

  const customerTransactions = useMemo(() => {
    if (!currentCustomer) return [];
    return boris.filter((b) => b.customerId === currentCustomer.id);
  }, [boris, currentCustomer]);

  const handleCreateCustomer = async () => {
    if (!newCustomerForm.name.trim()) return;
    const created = await addCustomer({
      name: newCustomerForm.name.trim(),
      phone: newCustomerForm.phone.trim(),
      village: newCustomerForm.village.trim(),
      balance: Number(newCustomerForm.initialBalance) || 0
    });
    setNewCustomerForm({ name: '', phone: '', village: '', initialBalance: '' });
    setIsAddCustomerOpen(false);
    if (created) handleSelectCustomer(created);
  };

  if (currentCustomer) {
    return (
      <>
        <CustomerDetail
          customer={currentCustomer}
          transactions={customerTransactions}
          onBack={handleBackToList}
          onCollectPayment={() => setIsCollectPaymentOpen(true)}
          onNewEntry={onOpenNewEntry}
        />
        <PaymentCollector
          isOpen={isCollectPaymentOpen}
          onClose={() => setIsCollectPaymentOpen(false)}
          customer={currentCustomer}
          onSubmitPayment={(amt) => updateCustomerBalance(currentCustomer.id, -amt)}
        />
      </>
    );
  }

  return (
    <div style={{ padding: '1rem 1rem 5rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      <SearchBar
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        onClear={() => setSearchQuery('')}
        placeholder="Grahak naam, mobile ya village search karein..."
      />

      {reviewBoris.length > 0 && (
        <div style={{ background: 'var(--surface)', border: '1px solid hsl(var(--line))', borderLeft: '4px solid hsl(var(--brand-500))', borderRadius: '14px', padding: '12px 14px' }}>
          <div style={{ font: '700 13px var(--fb)', color: 'hsl(var(--brand-600))', marginBottom: '8px' }}>
            ⚠️ Review Pending ({reviewBoris.length} entries need customer assignment)
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {reviewBoris.map((rb) => (
              <div key={rb.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px', fontSize: '12px', background: 'var(--bg-main)', padding: '8px 10px', borderRadius: '8px' }}>
                <div><strong>{rb.customerName}</strong> ({rb.inputWeight}kg {rb.grainType || 'Milling'}) - ₹{rb.amount}</div>
                <select
                  defaultValue=""
                  onChange={(e) => e.target.value && assignCustomerToBori(rb.id, e.target.value)}
                  style={{ fontSize: '12px', padding: '4px 8px', borderRadius: '6px', border: '1px solid hsl(var(--line))', background: 'var(--surface)' }}
                >
                  <option value="" disabled>Grahak Chunye...</option>
                  {customers.map((c) => (
                    <option key={c.id} value={c.id}>{c.name} ({c.village || 'Main'})</option>
                  ))}
                </select>
              </div>
            ))}
          </div>
        </div>
      )}

      <GaonSelector selectedVillage={selectedVillage} onSelectVillage={setSelectedVillage} />

      <div style={{ padding: '1rem 1.25rem', backgroundColor: 'hsl(var(--surface-2))', border: '1px solid hsl(var(--line))', borderRadius: 'var(--radius-md)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <span style={{ fontSize: '12px', color: 'hsl(var(--ink-2))', display: 'block', textTransform: 'uppercase' }}>KUL KISAN BAKAYA (DUES)</span>
          <span className="numeral-serif" style={{ fontSize: '1.75rem', fontWeight: '800', color: 'hsl(var(--red-600))' }}>
            ₹{totalDues.toLocaleString('en-IN')}
          </span>
        </div>
        <AccountingExportButton customers={customers} boris={boris} />
      </div>

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <h2 style={{ fontSize: '16px', fontWeight: '700', color: 'hsl(var(--ink-1))', margin: 0 }}>
          Kisan Khata Register ({filteredCustomers.length})
        </h2>
        <Button variant="brand" size="sm" icon={UserPlus} onClick={() => setIsAddCustomerOpen(true)}>
          Naya Grahak
        </Button>
      </div>

      <CustomerList customers={filteredCustomers} onSelectCustomer={handleSelectCustomer} />

      <Modal isOpen={isAddCustomerOpen} onClose={() => setIsAddCustomerOpen(false)} title="Naya Grahak Account" subtitle="Enter customer contact details">
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', paddingTop: '0.5rem' }}>
          <Input label="Grahak Ka Naam" placeholder="e.g. Ramesh Kumar" value={newCustomerForm.name} onChange={(e) => setNewCustomerForm({ ...newCustomerForm, name: e.target.value })} required />
          <Input label="Mobile Number" placeholder="e.g. 9812345678" type="tel" value={newCustomerForm.phone} onChange={(e) => setNewCustomerForm({ ...newCustomerForm, phone: e.target.value })} />
          <Input label="Gaon / Village Name" placeholder="e.g. Rampur" value={newCustomerForm.village} onChange={(e) => setNewCustomerForm({ ...newCustomerForm, village: e.target.value })} />
          <Input label="Purana Bakaya Dues (₹)" placeholder="0" type="number" value={newCustomerForm.initialBalance} onChange={(e) => setNewCustomerForm({ ...newCustomerForm, initialBalance: e.target.value })} />
          <Button variant="brand" fullWidth onClick={handleCreateCustomer}>Save Grahak Account</Button>
        </div>
      </Modal>
    </div>
  );
}
