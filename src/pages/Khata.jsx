import React, { useState, useMemo } from 'react';
import { UserPlus, ArrowLeft, PlusCircle, IndianRupee } from 'lucide-react';
import { useStore } from '../store/useStore';
import CustomerList from '../components/features/khata/CustomerList';
import TransactionTimeline from '../components/features/khata/TransactionTimeline';
import WhatsAppReminder from '../components/features/khata/WhatsAppReminder';
import PDFExport from '../components/features/khata/PDFExport';
import CreditScoreBadge from '../components/features/khata/CreditScoreBadge';
import AccountingExportButton from '../components/features/khata/AccountingExportButton';
import GaonSelector from '../components/shared/GaonSelector';
import SearchBar from '../components/shared/SearchBar';
import Modal from '../components/ui/Modal';
import Input from '../components/ui/Input';
import Button from '../components/ui/Button';
import Section from '../components/layout/Section';
import Avatar from '../components/ui/Avatar';

export default function Khata({ selectedCustomer: externalSelectedCustomer, onClearSelectedCustomer, onOpenNewEntry }) {
  const customers = useStore((state) => state.customers || []);
  const boris = useStore((state) => state.boris || []);
  const shop = useStore((state) => state.shop);
  const addCustomer = useStore((state) => state.addCustomer);
  const updateCustomerBalance = useStore((state) => state.updateCustomerBalance);

  const [internalSelectedCustomer, setInternalSelectedCustomer] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedVillage, setSelectedVillage] = useState('all');

  // Modal States
  const [isAddCustomerOpen, setIsAddCustomerOpen] = useState(false);
  const [isCollectPaymentOpen, setIsCollectPaymentOpen] = useState(false);

  // New Customer Form State
  const [newCustomerForm, setNewCustomerForm] = useState({ name: '', phone: '', village: '', initialBalance: '' });
  const [paymentAmount, setPaymentAmount] = useState('');

  const currentCustomer = externalSelectedCustomer || internalSelectedCustomer;

  const handleSelectCustomer = (c) => {
    setInternalSelectedCustomer(c);
  };

  const handleBackToList = () => {
    setInternalSelectedCustomer(null);
    onClearSelectedCustomer?.();
  };

  // Filtered Customer List
  const filteredCustomers = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    return customers.filter((c) => {
      const matchesSearch = !query || c.name?.toLowerCase().includes(query) || c.phone?.includes(query) || c.village?.toLowerCase().includes(query);
      const matchesV = selectedVillage === 'all' || (c.village || '').trim().toLowerCase() === selectedVillage.trim().toLowerCase();
      return matchesSearch && matchesV;
    });
  }, [customers, searchQuery, selectedVillage]);

  // Total Dues Calculation
  const totalDues = useMemo(() => {
    return customers.reduce((sum, c) => sum + (Number(c.balance || 0) > 0 ? Number(c.balance) : 0), 0);
  }, [customers]);

  // Transactions for selected customer
  const customerTransactions = useMemo(() => {
    if (!currentCustomer) return [];
    return boris.filter((b) => b.customerId === currentCustomer.id || b.customerName === currentCustomer.name);
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

  const handleCollectPaymentSubmit = () => {
    const amt = Number(paymentAmount);
    if (!amt || !currentCustomer) return;
    updateCustomerBalance(currentCustomer.id, -amt);
    setPaymentAmount('');
    setIsCollectPaymentOpen(false);
  };

  // Customer Detail View
  if (currentCustomer) {
    return (
      <div style={{ padding: '1rem 1rem 5rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
        {/* Back Button & Header Actions */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <button
            type="button"
            onClick={handleBackToList}
            className="tap-effect"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.375rem',
              background: 'none',
              border: 'none',
              color: 'hsl(var(--ink))',
              fontSize: '14px',
              fontWeight: '600',
              cursor: 'pointer'
            }}
          >
            <ArrowLeft size={18} />
            <span>Wapas List Par</span>
          </button>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <PDFExport customer={currentCustomer} transactions={customerTransactions} shopName={shop?.name} />
          </div>
        </div>

        {/* Customer Header Card with Credit Score */}
        <div
          style={{
            padding: '1.25rem',
            backgroundColor: 'hsl(var(--surface))',
            border: '1px solid hsl(var(--line))',
            borderRadius: 'var(--radius-md)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.875rem' }}>
            <Avatar name={currentCustomer.name} size={48} />
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <h2 style={{ fontSize: '18px', fontWeight: '700', color: 'hsl(var(--ink))' }}>
                  {currentCustomer.name}
                </h2>
                <CreditScoreBadge customer={currentCustomer} />
              </div>
              <span style={{ fontSize: '13px', color: 'hsl(var(--ink-2))', marginTop: '2px', display: 'block' }}>
                {currentCustomer.village || 'No Village'} • {currentCustomer.phone || 'No Phone'}
              </span>
            </div>
          </div>

          <div style={{ textAlign: 'right' }}>
            <span style={{ fontSize: '11px', color: 'hsl(var(--ink-3))', display: 'block' }}>Kul Baki Udhar</span>
            <span className="numeral-serif" style={{ fontSize: '1.5rem', fontWeight: '800', color: currentCustomer.balance > 0 ? 'hsl(var(--risk-udhar-text))' : 'hsl(var(--status-healthy-text))' }}>
              ₹{currentCustomer.balance || 0}
            </span>
          </div>
        </div>

        {/* Payment Action Buttons */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
          <Button variant="brand" icon={IndianRupee} onClick={() => setIsCollectPaymentOpen(true)}>
            Jama Bhugtan (Payment)
          </Button>
          <Button variant="quiet" icon={PlusCircle} onClick={onOpenNewEntry}>
            + Nayi Bori Entry
          </Button>
        </div>

        {/* WhatsApp Reminder Widget */}
        {currentCustomer.balance > 0 && (
          <WhatsAppReminder customer={currentCustomer} shopName={shop?.name} />
        )}

        {/* Transaction Ledger History */}
        <Section title="Khata History (Ledger Register)">
          <TransactionTimeline transactions={customerTransactions} />
        </Section>

        {/* Collect Payment Modal with Preset Chips */}
        <Modal
          isOpen={isCollectPaymentOpen}
          onClose={() => setIsCollectPaymentOpen(false)}
          title="Jama Payment Entry"
          subtitle={`${currentCustomer.name} se mila hua cash/UPI record karein`}
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {/* Quick Amount Preset Chips */}
            <div>
              <label style={{ fontSize: '13px', fontWeight: '600', color: 'hsl(var(--ink-2))', display: 'block', marginBottom: '4px' }}>
                Quick Preset Amount (1 Tap)
              </label>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.5rem' }}>
                {[100, 200, 500, currentCustomer.balance || 0].map((amt, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setPaymentAmount(String(amt))}
                    style={{
                      padding: '0.5rem',
                      borderRadius: 'var(--radius-sm)',
                      fontSize: '12px',
                      fontWeight: '700',
                      backgroundColor: paymentAmount === String(amt) ? 'var(--primary-light)' : 'hsl(var(--surface-2))',
                      color: paymentAmount === String(amt) ? 'var(--primary-dark)' : 'hsl(var(--ink))',
                      border: paymentAmount === String(amt) ? '1px solid var(--primary-color)' : '1px solid hsl(var(--line))',
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
            <Button variant="brand" fullWidth onClick={handleCollectPaymentSubmit}>
              Jama Confirm Karein
            </Button>
          </div>
        </Modal>
      </div>
    );
  }

  // Customer List View
  return (
    <div style={{ padding: '1rem 1rem 5rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      {/* Search Bar */}
      <SearchBar
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        onClear={() => setSearchQuery('')}
        placeholder="Grahak naam, mobile ya village search karein..."
      />

      {/* Village Chips */}
      <GaonSelector
        selectedVillage={selectedVillage}
        onSelectVillage={setSelectedVillage}
      />

      {/* Total Udhar Dues Card Header with Tally/Zoho Export */}
      <div
        style={{
          padding: '1rem 1.25rem',
          backgroundColor: 'hsl(var(--surface-2))',
          border: '1px solid hsl(var(--line))',
          borderRadius: 'var(--radius-md)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}
      >
        <div>
          <span style={{ fontSize: '13px', fontWeight: '600', color: 'hsl(var(--ink-2))' }}>
            Kul Baki Udhar (Total Dues)
          </span>
          <span className="numeral-serif" style={{ fontSize: '1.5rem', fontWeight: '800', color: 'hsl(var(--risk-udhar-text))', display: 'block' }}>
            ₹{totalDues.toLocaleString('en-IN')}
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <AccountingExportButton />
          <Button variant="brand" size="sm" icon={UserPlus} onClick={() => setIsAddCustomerOpen(true)}>
            + Naya Grahak
          </Button>
        </div>
      </div>

      {/* Customer List */}
      <Section title={`Grahak List (${filteredCustomers.length})`}>
        <CustomerList
          customers={filteredCustomers}
          onSelectCustomer={handleSelectCustomer}
          onAddCustomer={() => setIsAddCustomerOpen(true)}
        />
      </Section>

      {/* Add Customer Modal */}
      <Modal
        isOpen={isAddCustomerOpen}
        onClose={() => setIsAddCustomerOpen(false)}
        title="Naya Grahak Jodein"
        subtitle="Customer contact & village details"
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <Input
            label="Grahak Ka Naam (Name)"
            placeholder="e.g. Ramesh Kumar"
            value={newCustomerForm.name}
            onChange={(e) => setNewCustomerForm({ ...newCustomerForm, name: e.target.value })}
            required
          />
          <Input
            label="Mobile Number"
            placeholder="e.g. 9812345678"
            type="tel"
            value={newCustomerForm.phone}
            onChange={(e) => setNewCustomerForm({ ...newCustomerForm, phone: e.target.value })}
          />
          <Input
            label="Gaon / Village Name"
            placeholder="e.g. Rampur"
            value={newCustomerForm.village}
            onChange={(e) => setNewCustomerForm({ ...newCustomerForm, village: e.target.value })}
          />
          <Input
            label="Puraana Udhar (Initial Dues ₹ if any)"
            placeholder="0"
            type="number"
            value={newCustomerForm.initialBalance}
            onChange={(e) => setNewCustomerForm({ ...newCustomerForm, initialBalance: e.target.value })}
          />
          <Button variant="brand" fullWidth onClick={handleCreateCustomer}>
            Save Grahak
          </Button>
        </div>
      </Modal>
    </div>
  );
}
