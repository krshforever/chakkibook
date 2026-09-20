import React, { useState, useMemo, useEffect } from 'react';
import jsPDF from 'jspdf';
import { 
  BookOpen, 
  UserPlus, 
  Search, 
  Phone, 
  MapPin, 
  Coins, 
  Download, 
  Share2, 
  CheckCircle2, 
  ArrowUpRight, 
  ArrowDownLeft, 
  X, 
  Plus,
  UserCheck,
  ArrowLeft,
  FileText,
  Printer,
  MessageSquare,
  Send,
  Copy,
  Check,
  Sparkles,
  Filter,
  Clock,
  CreditCard,
  Banknote,
  Calendar,
  Building,
  ChevronRight,
  AlertCircle,
  Users,
  Wallet,
  RotateCcw,
  TrendingUp,
  TrendingDown
} from 'lucide-react';
import { useStore } from '../store/useStore';
import { useTranslation } from '../utils/translations';
import GaonSelector from '../components/GaonSelector';

export default function Khata({ selectedCustomer: initialSelectedCustomer, onClearSelectedCustomer }) {
  const { t } = useTranslation();
  const customers = useStore((state) => state.customers || []);
  const boris = useStore((state) => state.boris || []);
  const addBori = useStore((state) => state.addBori);
  const addCustomer = useStore((state) => state.addCustomer);
  const shop = useStore((state) => state.shop || {});
  const selectedVillage = useStore((state) => state.selectedVillage || 'all');
  const setSelectedVillage = useStore((state) => state.setSelectedVillage);
  const getVillages = useStore((state) => state.getVillages);

  // Search & Tab Filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [filterTab, setFilterTab] = useState('all'); // 'all' | 'dues' | 'cleared'
  const [activeCustomerId, setActiveCustomerId] = useState(
    initialSelectedCustomer ? initialSelectedCustomer.id : null
  );

  // Sync if initialSelectedCustomer prop changes
  useEffect(() => {
    if (initialSelectedCustomer && initialSelectedCustomer.id) {
      setActiveCustomerId(initialSelectedCustomer.id);
    }
  }, [initialSelectedCustomer]);

  // Payment Collector state
  const [payAmount, setPayAmount] = useState('');
  const [payMode, setPayMode] = useState('cash'); // 'cash' | 'upi'
  const [payNotes, setPayNotes] = useState('');
  const [jamaFeedback, setJamaFeedback] = useState(false);

  // Modal control states
  const [showAddCust, setShowAddCust] = useState(false);
  const [showPdfModal, setShowPdfModal] = useState(false);
  const [showWhatsappModal, setShowWhatsappModal] = useState(false);

  // Add Customer form state
  const [custName, setCustName] = useState('');
  const [custVillage, setCustVillage] = useState('');
  const [custPhone, setCustPhone] = useState('');
  const [custBalance, setCustBalance] = useState('');
  const [custNotes, setCustNotes] = useState('');

  // WhatsApp reminder state
  const [reminderTemplate, setReminderTemplate] = useState('polite'); // 'polite' | 'urgent' | 'detailed'
  const [customMsgText, setCustomMsgText] = useState('');
  const [copiedToast, setCopiedToast] = useState(false);

  // Helper for safe date string formatting
  const formatDateStr = (b) => {
    if (!b) return '';
    const raw = b.date || b.createdAt || b.dropOffDate || '';
    if (typeof raw === 'string') {
      return raw.split('T')[0];
    }
    if (typeof raw === 'number' || raw instanceof Date) {
      try {
        return new Date(raw).toISOString().split('T')[0];
      } catch (e) {
        return '';
      }
    }
    return '';
  };

  // 1. Filter customers by village safely
  const villageFilteredCustomers = useMemo(() => {
    if (!customers || !Array.isArray(customers)) return [];
    const vTarget = String(selectedVillage || 'all').trim().toLowerCase();
    if (!vTarget || vTarget === 'all') return customers.filter(Boolean);
    return customers.filter((c) => c && String(c.village || '').trim().toLowerCase() === vTarget);
  }, [customers, selectedVillage]);

  // 2. Metrics for Hero Banner safely
  const heroMetrics = useMemo(() => {
    const list = villageFilteredCustomers || [];
    const debtorsList = list.filter((c) => c && Number(c.balance || 0) > 0);
    const totalDues = debtorsList.reduce((sum, c) => sum + Number(c.balance || 0), 0);
    const debtorCount = debtorsList.length;
    const avgDebt = debtorCount > 0 ? Math.round(totalDues / debtorCount) : 0;
    
    const topDebtor = debtorsList.length > 0 
      ? [...debtorsList].sort((a, b) => Number(b.balance || 0) - Number(a.balance || 0))[0] 
      : null;

    return {
      totalDues,
      debtorCount,
      totalCustomers: list.length,
      avgDebt,
      topDebtor
    };
  }, [villageFilteredCustomers]);

  // 3. Search & Tab Filtered Customers safely
  const sortedCustomers = useMemo(() => {
    const q = String(searchQuery || '').toLowerCase().trim();
    let list = villageFilteredCustomers || [];

    if (filterTab === 'dues') {
      list = list.filter((c) => c && Number(c.balance || 0) > 0);
    } else if (filterTab === 'cleared') {
      list = list.filter((c) => c && Number(c.balance || 0) <= 0);
    }

    if (q) {
      list = list.filter((c) => c && (
        String(c.name || '').toLowerCase().includes(q) ||
        String(c.phone || '').includes(q) ||
        String(c.village || '').toLowerCase().includes(q)
      ));
    }

    return [...list].sort((a, b) => Number(b.balance || 0) - Number(a.balance || 0));
  }, [villageFilteredCustomers, filterTab, searchQuery]);

  // Active customer object safely
  const activeCustomer = useMemo(() => {
    if (!activeCustomerId || !customers || !Array.isArray(customers)) return null;
    return customers.find((c) => c && String(c.id) === String(activeCustomerId)) || null;
  }, [customers, activeCustomerId]);

  // Active customer transactions with calculated running balance safely
  const activeCustomerTimeline = useMemo(() => {
    if (!activeCustomer || !activeCustomer.id || !boris || !Array.isArray(boris)) return [];

    const rawBoris = boris.filter(
      (b) => b && (
        String(b.customerId) === String(activeCustomer.id) ||
        (b.customerName && activeCustomer.name && String(b.customerName).toLowerCase() === String(activeCustomer.name).toLowerCase())
      )
    );

    // Sort chronologically ascending to compute running balance from scratch
    const sortedAsc = [...rawBoris].sort((a, b) => {
      const timeA = new Date(a?.createdAt || a?.date || a?.dropOffDate || 0).getTime();
      const timeB = new Date(b?.createdAt || b?.date || b?.dropOffDate || 0).getTime();
      return timeA - timeB;
    });

    let runningBal = 0;
    const timelineWithBal = sortedAsc.map((item) => {
      if (!item) return { runningBal };
      const isJama = item.grainType === 'Jama Payment' || item.type === 'payment';
      const isCredit = item.paymentMode === 'credit';
      
      let amountChange = 0;
      if (isJama) {
        amountChange = -Number(item.amount || 0);
      } else if (isCredit) {
        amountChange = Number(item.amount || 0);
      }

      runningBal += amountChange;
      return {
        ...item,
        runningBal
      };
    });

    // Reverse for latest first display
    return timelineWithBal.reverse();
  }, [boris, activeCustomer]);

  // Sync WhatsApp template text when template or active customer changes
  useEffect(() => {
    if (!activeCustomer || !activeCustomer.name) return;
    const shopName = shop?.name || 'Atta Chakki';
    const bal = activeCustomer.balance || 0;
    const phone = shop?.phone || '';

    let text = '';
    if (reminderTemplate === 'urgent') {
      text = `Namaste ${activeCustomer.name} ji,\n\nKripya dhayan dein ki ${shopName} par aapka ₹${bal} ka udhar kafi samay se baki hai.\nKripya is hafte tak bhugtan karke apna khata saaf karein.\n\nShop Contact: ${phone}\nDhanyawad!`;
    } else if (reminderTemplate === 'detailed') {
      const unpaid = (activeCustomerTimeline || [])
        .filter((b) => b && b.paymentMode === 'credit')
        .slice(0, 4)
        .map((b) => `• ${b.grainType || 'Pisai'} (${b.inputWeight || 0}kg) - ₹${b.amount || 0}`)
        .join('\n');

      text = `Namaste ${activeCustomer.name} ji,\n\n${shopName} Khata Statement:\nKul Baki Udhar: ₹${bal}\n\nRecent Credit Entries:\n${unpaid || '• Credit transactions'}\n\nKripya samay par bhugtan karein.\nContact: ${phone}\nDhanyawad!`;
    } else {
      text = `Namaste ${activeCustomer.name} ji,\n\n${shopName} par aapka kul baki udhar ₹${bal} hai.\nKripya samay par aane par ya online UPI dwara bhugtan karein.\n\nShop Contact: ${phone}\nDhanyawad!`;
    }
    setCustomMsgText(text);
  }, [activeCustomer, reminderTemplate, activeCustomerTimeline, shop]);

  // Payment submission
  const handlePaymentSubmit = (e) => {
    e.preventDefault();
    const amt = Number(payAmount);
    if (!amt || amt <= 0 || !activeCustomer) return;

    addBori({
      mode: 'chakki',
      type: 'payment',
      customerId: activeCustomer.id,
      customerName: activeCustomer.name,
      customerPhone: activeCustomer.phone,
      customerVillage: activeCustomer.village || '',
      grainType: 'Jama Payment',
      outputType: '',
      inputWeight: 0,
      rate: 0,
      amount: amt,
      status: 'done',
      paymentMode: payMode === 'cash' ? 'cash' : 'upi',
      notes: payNotes ? `Jama (${payNotes})` : 'Jama Payment'
    });

    setPayAmount('');
    setPayNotes('');
    setJamaFeedback(true);
    setTimeout(() => setJamaFeedback(false), 2500);
  };

  // Preset payment chip handler
  const handleQuickPreset = (val) => {
    if (!activeCustomer) return;
    if (val === 'full') {
      setPayAmount(String(activeCustomer.balance > 0 ? activeCustomer.balance : 0));
    } else {
      setPayAmount(String(val));
    }
  };

  // Customer onboarding
  const handleCreateCustomer = (e) => {
    e.preventDefault();
    if (!custName.trim()) return;

    const initialBal = Number(custBalance) || 0;
    const newCust = addCustomer({
      name: custName.trim(),
      village: custVillage.trim(),
      phone: custPhone.trim(),
      balance: initialBal,
      notes: custNotes.trim()
    });

    setCustName('');
    setCustVillage('');
    setCustPhone('');
    setCustBalance('');
    setCustNotes('');
    setShowAddCust(false);

    if (newCust && newCust.id) {
      setActiveCustomerId(newCust.id);
    }
  };

  // Trigger WhatsApp action
  const handleOpenWhatsApp = (cust, msg) => {
    if (!cust || !cust.phone) {
      alert(t('khata.mobileNumber') + ' not available');
      return;
    }
    const cleanPhone = cust.phone.replace(/\D/g, '');
    const phoneWithCountry = cleanPhone.length === 10 ? `91${cleanPhone}` : cleanPhone;
    const url = `https://wa.me/${phoneWithCountry}?text=${encodeURIComponent(msg)}`;
    window.open(url, '_blank');
  };

  // Copy message to clipboard
  const handleCopyText = (txt) => {
    navigator.clipboard.writeText(txt);
    setCopiedToast(true);
    setTimeout(() => setCopiedToast(false), 2000);
  };

  // PDF Export via jsPDF
  const generatePDFStatement = () => {
    if (!activeCustomer) return;
    const doc = new jsPDF();
    
    // Header Banner
    doc.setFillColor(153, 27, 27); // Maroon #991b1b
    doc.rect(0, 0, 210, 28, 'F');
    
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text((shop.name || 'ChakkiBook Ledger').toUpperCase(), 14, 15);
    
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.text(`Phone: ${shop.phone || 'N/A'}  |  Address: ${shop.address || 'Main Market'}`, 14, 22);

    // Customer Detail Box
    doc.setFillColor(248, 250, 252);
    doc.roundedRect(14, 34, 182, 28, 3, 3, 'F');
    doc.setDrawColor(226, 232, 240);
    doc.roundedRect(14, 34, 182, 28, 3, 3, 'S');

    doc.setTextColor(15, 23, 42);
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text(`Customer Statement: ${activeCustomer.name}`, 20, 43);

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(`Village: ${activeCustomer.village || 'N/A'}`, 20, 50);
    doc.text(`Mobile: ${activeCustomer.phone || 'N/A'}`, 20, 56);

    doc.setFont('helvetica', 'bold');
    doc.text(`Date: ${new Date().toLocaleDateString('en-IN')}`, 130, 43);
    const bal = Number(activeCustomer.balance || 0);
    doc.setTextColor(bal > 0 ? 220 : 22, bal > 0 ? 38 : 163, bal > 0 ? 38 : 74);
    doc.text(`Current Dues: Rs ${bal}`, 130, 50);

    // Table Header
    let y = 70;
    doc.setFillColor(241, 245, 249);
    doc.rect(14, y, 182, 8, 'F');
    doc.setDrawColor(203, 213, 225);
    doc.line(14, y + 8, 196, y + 8);

    doc.setTextColor(51, 65, 85);
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.text('DATE', 18, y + 6);
    doc.text('ITEM / GRAIN', 48, y + 6);
    doc.text('MODE', 120, y + 6);
    doc.text('AMOUNT', 150, y + 6);
    doc.text('BALANCE', 174, y + 6);

    y += 14;
    doc.setFont('helvetica', 'normal');

    activeCustomerTimeline.forEach((b) => {
      if (y > 270) {
        doc.addPage();
        y = 20;
      }
      const dateStr = formatDateStr(b);
      const itemDesc = b.grainType === 'Jama Payment'
        ? `Jama Payment${b.notes ? ` (${b.notes})` : ''}`
        : `${b.grainType}${b.outputType ? ` (${b.outputType})` : ''} - ${b.inputWeight || 0}kg`;
      
      const isCredit = b.paymentMode === 'credit';
      const isJama = b.grainType === 'Jama Payment' || b.type === 'payment';

      doc.setTextColor(15, 23, 42);
      doc.text(String(dateStr), 18, y);
      doc.text(String(itemDesc).substring(0, 36), 48, y);
      doc.text(isJama ? 'Jama' : isCredit ? 'Udhar' : 'Paid', 120, y);
      
      doc.setTextColor(isJama ? 22 : isCredit ? 220 : 100, isJama ? 163 : isCredit ? 38 : 100, isJama ? 74 : isCredit ? 38 : 100);
      doc.text(`${isJama ? '-' : isCredit ? '+' : ''}Rs ${b.amount || 0}`, 150, y);
      
      doc.setTextColor(15, 23, 42);
      doc.text(`Rs ${b.runningBal ?? 0}`, 174, y);

      y += 8;
    });

    // Summary line
    doc.setDrawColor(203, 213, 225);
    doc.line(14, y + 2, 196, y + 2);
    y += 10;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(15, 23, 42);
    doc.text(`Net Outstanding Balance: Rs ${activeCustomer.balance || 0}`, 14, y);

    doc.save(`Khata_Statement_${activeCustomer.name.replace(/\s+/g, '_')}.pdf`);
  };

  return (
    <div className="khata-ledger-page" style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '16px', maxWidth: '800px', margin: '0 auto', width: '100%', boxSizing: 'border-box' }}>
      
      {/* 1. VILLAGE DUES HERO BANNER */}
      <section style={{
        background: 'linear-gradient(135deg, #7f1d1d 0%, #991b1b 50%, #450a0a 100%)',
        color: '#ffffff',
        borderRadius: '1.25rem',
        padding: '1.25rem 1.5rem',
        boxShadow: '0 10px 25px rgba(153, 27, 27, 0.3)',
        display: 'flex',
        flexDirection: 'column',
        gap: '16px',
        position: 'relative',
        overflow: 'hidden'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', zIndex: 1 }}>
          <div>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '0.75rem', fontWeight: 800, color: '#fca5a5', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
              <BookOpen size={14} />
              <span>
                {selectedVillage === 'all' 
                  ? t('khata.totalDuesAll') 
                  : `${selectedVillage} ${t('khata.totalDuesVillage')}`}
              </span>
            </div>
            
            <div style={{ fontSize: '2.2rem', fontWeight: 900, color: '#ffffff', marginTop: '4px', letterSpacing: '-0.02em', fontFamily: "'Outfit', sans-serif" }}>
              ₹{heroMetrics.totalDues.toLocaleString('en-IN')}
            </div>
          </div>

          <button
            type="button"
            onClick={() => setShowAddCust(true)}
            style={{
              backgroundColor: '#ffffff',
              color: '#991b1b',
              border: 'none',
              borderRadius: '0.85rem',
              padding: '10px 16px',
              fontSize: '0.85rem',
              fontWeight: 800,
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              boxShadow: '0 4px 14px rgba(0,0,0,0.15)',
              transition: 'transform 0.15s ease'
            }}
          >
            <UserPlus size={16} />
            <span>{t('khata.newCustomer')}</span>
          </button>
        </div>

        {/* Sub-Metrics Pill Bar */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(110px, 1fr))',
          gap: '10px',
          paddingTop: '12px',
          borderTop: '1px solid rgba(255,255,255,0.15)',
          zIndex: 1
        }}>
          <div style={{ backgroundColor: 'rgba(255,255,255,0.1)', padding: '8px 12px', borderRadius: '0.75rem' }}>
            <div style={{ fontSize: '0.7rem', color: '#fca5a5', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '4px' }}>
              <Users size={12} />
              <span>{t('khata.debtors')}</span>
            </div>
            <div style={{ fontSize: '1rem', fontWeight: 800, color: '#ffffff', marginTop: '2px' }}>
              {heroMetrics.debtorCount} / {heroMetrics.totalCustomers}
            </div>
          </div>

          <div style={{ backgroundColor: 'rgba(255,255,255,0.1)', padding: '8px 12px', borderRadius: '0.75rem' }}>
            <div style={{ fontSize: '0.7rem', color: '#fca5a5', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '4px' }}>
              <Wallet size={12} />
              <span>Avg Debt</span>
            </div>
            <div style={{ fontSize: '1rem', fontWeight: 800, color: '#ffffff', marginTop: '2px' }}>
              ₹{heroMetrics.avgDebt.toLocaleString('en-IN')}
            </div>
          </div>

          {heroMetrics.topDebtor && (
            <button
              type="button"
              onClick={() => setActiveCustomerId(heroMetrics.topDebtor.id)}
              style={{
                backgroundColor: 'rgba(255,255,255,0.15)',
                border: '1px solid rgba(255,255,255,0.25)',
                padding: '8px 12px',
                borderRadius: '0.75rem',
                textAlign: 'left',
                cursor: 'pointer',
                color: '#ffffff'
              }}
            >
              <div style={{ fontSize: '0.68rem', color: '#fef08a', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '4px' }}>
                <AlertCircle size={12} />
                <span>Top Debtor</span>
              </div>
              <div style={{ fontSize: '0.85rem', fontWeight: 800, color: '#ffffff', marginTop: '2px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {heroMetrics.topDebtor.name} (₹{heroMetrics.topDebtor.balance})
              </div>
            </button>
          )}
        </div>
      </section>

      {/* 2. INTEGRATED GAON SELECTOR PILL BAR */}
      <section style={{ width: '100%' }}>
        <GaonSelector
          selectedVillage={selectedVillage}
          onSelectVillage={(v) => setSelectedVillage(v)}
          badgeType="dues"
          allLabel={t('common.allVillages')}
        />
      </section>

      {/* 3. SEARCH & TAB FILTER BAR */}
      <section style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        <div style={{ position: 'relative', width: '100%' }}>
          <Search size={18} color="#94a3b8" style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)' }} />
          <input
            type="text"
            placeholder={t('khata.searchPlaceholder')}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              width: '100%',
              height: '46px',
              padding: '0 40px 0 42px',
              borderRadius: '0.85rem',
              border: '1.5px solid #cbd5e1',
              backgroundColor: 'var(--bg-card, #ffffff)',
              fontSize: '0.9rem',
              color: 'var(--text-main, #0f172a)',
              outline: 'none',
              boxSizing: 'border-box'
            }}
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8' }}
            >
              <X size={16} />
            </button>
          )}
        </div>

        {/* Segmented Filter Pills */}
        <div style={{ display: 'flex', gap: '6px', overflowX: 'auto', paddingBottom: '2px' }}>
          <button
            type="button"
            onClick={() => setFilterTab('all')}
            style={{
              padding: '6px 14px',
              borderRadius: '20px',
              border: filterTab === 'all' ? '1.5px solid var(--primary, #d97706)' : '1px solid #cbd5e1',
              backgroundColor: filterTab === 'all' ? '#fef3c7' : '#ffffff',
              color: filterTab === 'all' ? '#92400e' : '#475569',
              fontSize: '0.8rem',
              fontWeight: 700,
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px'
            }}
          >
            <Filter size={13} />
            <span>{t('khata.allFilter')}</span>
            <span style={{ fontSize: '0.7rem', opacity: 0.8 }}>({villageFilteredCustomers.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setFilterTab('dues')}
            style={{
              padding: '6px 14px',
              borderRadius: '20px',
              border: filterTab === 'dues' ? '1.5px solid #ef4444' : '1px solid #cbd5e1',
              backgroundColor: filterTab === 'dues' ? '#fee2e2' : '#ffffff',
              color: filterTab === 'dues' ? '#991b1b' : '#475569',
              fontSize: '0.8rem',
              fontWeight: 700,
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px'
            }}
          >
            <Coins size={13} color="#dc2626" />
            <span>{t('khata.duesOnlyFilter')}</span>
            <span style={{ fontSize: '0.7rem', opacity: 0.8 }}>({heroMetrics.debtorCount})</span>
          </button>

          <button
            type="button"
            onClick={() => setFilterTab('cleared')}
            style={{
              padding: '6px 14px',
              borderRadius: '20px',
              border: filterTab === 'cleared' ? '1.5px solid #16a34a' : '1px solid #cbd5e1',
              backgroundColor: filterTab === 'cleared' ? '#dcfce7' : '#ffffff',
              color: filterTab === 'cleared' ? '#14532d' : '#475569',
              fontSize: '0.8rem',
              fontWeight: 700,
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px'
            }}
          >
            <CheckCircle2 size={13} color="#16a34a" />
            <span>{t('khata.clearedFilter')}</span>
          </button>
        </div>
      </section>

      {/* 4. MAIN CONTENT AREA */}
      <section>
        {activeCustomer ? (
          /* ================= 1-TAP CUSTOMER DETAIL VIEW ================= */
          <div style={{
            backgroundColor: '#ffffff',
            border: '1px solid #e2e8f0',
            borderRadius: '1.25rem',
            padding: '1.25rem',
            boxShadow: '0 4px 20px rgba(0,0,0,0.06)',
            display: 'flex',
            flexDirection: 'column',
            gap: '16px'
          }}>
            {/* Customer Detail Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px' }}>
              <div>
                <button
                  type="button"
                  onClick={() => {
                    setActiveCustomerId(null);
                    if (onClearSelectedCustomer) onClearSelectedCustomer();
                  }}
                  style={{
                    background: '#f1f5f9',
                    border: '1px solid #cbd5e1',
                    borderRadius: '0.65rem',
                    padding: '6px 12px',
                    fontSize: '0.78rem',
                    fontWeight: 700,
                    color: '#334155',
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    marginBottom: '10px'
                  }}
                >
                  <ArrowLeft size={14} />
                  <span>{t('khata.backToList')}</span>
                </button>

                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div style={{
                    width: '44px',
                    height: '44px',
                    borderRadius: '50%',
                    backgroundColor: (activeCustomer.balance || 0) > 0 ? '#fee2e2' : '#dcfce7',
                    color: (activeCustomer.balance || 0) > 0 ? '#991b1b' : '#14532d',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: 900,
                    fontSize: '1.1rem'
                  }}>
                    {(activeCustomer?.name ? String(activeCustomer.name).substring(0, 2).toUpperCase() : 'CU')}
                  </div>
                  <div>
                    <h2 style={{ fontSize: '1.3rem', fontWeight: 800, color: '#0f172a', margin: 0 }}>
                      {activeCustomer.name}
                    </h2>
                    <div style={{ fontSize: '0.82rem', color: '#64748b', marginTop: '2px', display: 'flex', flexWrap: 'wrap', gap: '12px' }}>
                      {activeCustomer.village && (
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                          <MapPin size={13} color="#94a3b8" />
                          {activeCustomer.village}
                        </span>
                      )}
                      {activeCustomer.phone && (
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                          <Phone size={13} color="#94a3b8" />
                          {activeCustomer.phone}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              <div style={{ textAlign: 'right', background: (activeCustomer.balance || 0) > 0 ? '#fff5f5' : '#f0fdf4', padding: '10px 14px', borderRadius: '0.85rem', border: (activeCustomer.balance || 0) > 0 ? '1px solid #fecaca' : '1px solid #bbf7d0' }}>
                <div style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: 800, textTransform: 'uppercase' }}>
                  {t('khata.balance')}
                </div>
                <div style={{
                  fontSize: '1.6rem',
                  fontWeight: 900,
                  color: (activeCustomer.balance || 0) > 0 ? '#dc2626' : '#16a34a',
                  fontFamily: "'Outfit', sans-serif"
                }}>
                  ₹{(activeCustomer.balance || 0).toLocaleString('en-IN')}
                </div>
              </div>
            </div>

            {/* Actions Bar: Statement & WhatsApp Reminders */}
            <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
              <button
                type="button"
                onClick={() => setShowPdfModal(true)}
                style={{
                  flex: 1,
                  minWidth: '140px',
                  padding: '10px 14px',
                  backgroundColor: '#f8fafc',
                  border: '1.5px solid #cbd5e1',
                  borderRadius: '0.75rem',
                  fontSize: '0.82rem',
                  fontWeight: 800,
                  color: '#334155',
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px'
                }}
              >
                <FileText size={16} color="#475569" />
                <span>{t('khata.pdfStatement')}</span>
              </button>

              <button
                type="button"
                onClick={() => setShowWhatsappModal(true)}
                style={{
                  flex: 1,
                  minWidth: '140px',
                  padding: '10px 14px',
                  backgroundColor: '#f0fdf4',
                  border: '1.5px solid #bbf7d0',
                  borderRadius: '0.75rem',
                  fontSize: '0.82rem',
                  fontWeight: 800,
                  color: '#16a34a',
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px'
                }}
              >
                <MessageSquare size={16} color="#16a34a" />
                <span>{t('khata.whatsappHisab')}</span>
              </button>
            </div>

            {/* QUICK PAYMENT COLLECTOR CARD (JAMA RAKAM) */}
            <form onSubmit={handlePaymentSubmit} style={{
              backgroundColor: '#fffbeb',
              border: '1.5px solid #fde68a',
              borderRadius: '1rem',
              padding: '1.1rem',
              display: 'flex',
              flexDirection: 'column',
              gap: '12px',
              boxShadow: '0 2px 8px rgba(217, 119, 6, 0.08)'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ fontSize: '0.9rem', fontWeight: 800, color: '#92400e', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Coins size={18} color="#d97706" />
                  <span>{t('khata.paymentCollector')}</span>
                </div>
                {jamaFeedback && (
                  <div style={{ fontSize: '0.78rem', fontWeight: 800, color: '#16a34a', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <CheckCircle2 size={14} />
                    <span>Jama Recorded!</span>
                  </div>
                )}
              </div>

              {/* Quick Preset Chips */}
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                {['100', '200', '500', 'full'].map((chip) => {
                  const label = chip === 'full' ? `${t('khata.fullBalance')} (₹${activeCustomer.balance || 0})` : `+₹${chip}`;
                  return (
                    <button
                      key={chip}
                      type="button"
                      onClick={() => handleQuickPreset(chip)}
                      style={{
                        padding: '6px 12px',
                        borderRadius: '20px',
                        border: '1px solid #fcd34d',
                        backgroundColor: '#ffffff',
                        color: '#92400e',
                        fontSize: '0.78rem',
                        fontWeight: 800,
                        cursor: 'pointer',
                        transition: 'all 0.15s ease'
                      }}
                    >
                      {label}
                    </button>
                  );
                })}
              </div>

              {/* Amount & Mode Selector Input */}
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                <div style={{ position: 'relative', flex: 1, minWidth: '140px' }}>
                  <span style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', fontWeight: 800, color: '#92400e' }}>₹</span>
                  <input
                    type="number"
                    placeholder={t('khata.amountPlaceholder')}
                    value={payAmount}
                    onChange={(e) => setPayAmount(e.target.value)}
                    required
                    style={{
                      width: '100%',
                      height: '44px',
                      padding: '0 12px 0 28px',
                      borderRadius: '0.75rem',
                      border: '1.5px solid #cbd5e1',
                      fontSize: '1.05rem',
                      fontWeight: 800,
                      outline: 'none',
                      boxSizing: 'border-box'
                    }}
                  />
                </div>

                <select
                  value={payMode}
                  onChange={(e) => setPayMode(e.target.value)}
                  style={{
                    height: '44px',
                    padding: '0 12px',
                    borderRadius: '0.75rem',
                    border: '1.5px solid #cbd5e1',
                    fontSize: '0.85rem',
                    fontWeight: 700,
                    backgroundColor: '#ffffff',
                    color: '#0f172a'
                  }}
                >
                  <option value="cash">{t('common.cash')}</option>
                  <option value="upi">{t('common.upi')}</option>
                </select>

                <button
                  type="submit"
                  style={{
                    height: '44px',
                    padding: '0 20px',
                    backgroundColor: '#d97706',
                    color: '#ffffff',
                    border: 'none',
                    borderRadius: '0.75rem',
                    fontSize: '0.9rem',
                    fontWeight: 800,
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    boxShadow: '0 2px 8px rgba(217, 119, 6, 0.25)'
                  }}
                >
                  <Coins size={16} />
                  <span>{t('khata.jamaBtn')}</span>
                </button>
              </div>

              {/* Optional Notes */}
              <input
                type="text"
                placeholder={t('khata.notes')}
                value={payNotes}
                onChange={(e) => setPayNotes(e.target.value)}
                style={{
                  width: '100%',
                  height: '38px',
                  padding: '0 12px',
                  borderRadius: '0.65rem',
                  border: '1px solid #fcd34d',
                  fontSize: '0.82rem',
                  outline: 'none',
                  backgroundColor: '#ffffff',
                  boxSizing: 'border-box'
                }}
              />
            </form>

            {/* TRANSACTION TIMELINE WITH RUNNING BALANCE */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                <div style={{ fontSize: '0.9rem', fontWeight: 800, color: '#0f172a', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Clock size={16} color="#64748b" />
                  <span>{t('khata.transactionHistory')}</span>
                  <span style={{ fontSize: '0.78rem', color: '#64748b', fontWeight: 600 }}>({activeCustomerTimeline.length})</span>
                </div>
              </div>

              {activeCustomerTimeline.length === 0 ? (
                <div style={{ backgroundColor: '#f8fafc', padding: '1.5rem', borderRadius: '0.85rem', textAlign: 'center', color: '#94a3b8', fontSize: '0.85rem' }}>
                  {t('khata.noTransactions')}
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {activeCustomerTimeline.map((b) => {
                    const isJama = b.grainType === 'Jama Payment' || b.type === 'payment';
                    const isCredit = b.paymentMode === 'credit';
                    const dateStr = formatDateStr(b);

                    return (
                      <div
                        key={b.id}
                        style={{
                          padding: '12px 14px',
                          borderRadius: '0.85rem',
                          border: isJama ? '1px solid #bbf7d0' : isCredit ? '1px solid #fecaca' : '1px solid #e2e8f0',
                          backgroundColor: isJama ? '#f0fdf4' : isCredit ? '#fff5f5' : '#f8fafc',
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          gap: '12px'
                        }}
                      >
                        <div style={{ flex: 1 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                            <span style={{ fontSize: '0.88rem', fontWeight: 800, color: '#0f172a' }}>
                              {b.grainType === 'Jama Payment' ? 'Jama Payment' : `${b.grainType}${b.outputType ? ` (${b.outputType})` : ''}`}
                            </span>
                            {b.inputWeight > 0 && (
                              <span style={{ fontSize: '0.75rem', fontWeight: 700, padding: '2px 6px', borderRadius: '6px', backgroundColor: '#e2e8f0', color: '#334155' }}>
                                {b.inputWeight} kg
                              </span>
                            )}
                          </div>

                          <div style={{ fontSize: '0.74rem', color: '#64748b', marginTop: '4px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <span>{dateStr}</span>
                            <span>•</span>
                            <span style={{
                              fontWeight: 700,
                              color: isJama ? '#16a34a' : isCredit ? '#dc2626' : '#475569'
                            }}>
                              {isJama ? 'Jama Payment' : isCredit ? t('common.udhar') : t('common.paid')}
                            </span>
                            {b.notes && (
                              <>
                                <span>•</span>
                                <span style={{ fontStyle: 'italic' }}>{b.notes}</span>
                              </>
                            )}
                          </div>
                        </div>

                        {/* Amount & Running Balance */}
                        <div style={{ textAlign: 'right' }}>
                          <div style={{
                            fontSize: '1rem',
                            fontWeight: 900,
                            color: isJama ? '#16a34a' : isCredit ? '#dc2626' : '#334155',
                            fontFamily: "'Outfit', sans-serif"
                          }}>
                            {isJama ? `-₹${b.amount}` : isCredit ? `+₹${b.amount}` : `₹${b.amount}`}
                          </div>
                          
                          <div style={{ fontSize: '0.7rem', color: '#64748b', fontWeight: 700, marginTop: '2px' }}>
                            {t('khata.runningBalance')}: ₹{b.runningBal}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        ) : (
          /* ================= CUSTOMER LIST VIEW ================= */
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {sortedCustomers.length === 0 ? (
              <div style={{ backgroundColor: '#ffffff', padding: '2rem', borderRadius: '1.25rem', border: '1px solid #e2e8f0', textAlign: 'center', color: '#64748b' }}>
                <Users size={36} color="#cbd5e1" style={{ marginBottom: '8px' }} />
                <div style={{ fontWeight: 700, fontSize: '0.95rem' }}>{t('khata.noCustomers')}</div>
              </div>
            ) : (
              sortedCustomers.map((c) => {
                const hasDues = (c.balance || 0) > 0;
                return (
                  <div
                    key={c.id}
                    onClick={() => setActiveCustomerId(c.id)}
                    style={{
                      backgroundColor: '#ffffff',
                      border: '1.5px solid #e2e8f0',
                      borderRadius: '0.9rem',
                      padding: '12px 16px',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      cursor: 'pointer',
                      boxShadow: '0 2px 6px rgba(0,0,0,0.02)',
                      transition: 'all 0.15s ease'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <div style={{
                        width: '40px',
                        height: '40px',
                        borderRadius: '50%',
                        backgroundColor: hasDues ? '#fee2e2' : '#dcfce7',
                        color: hasDues ? '#991b1b' : '#14532d',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontWeight: 900,
                        fontSize: '0.95rem'
                      }}>
                        {(c?.name ? String(c.name).substring(0, 2).toUpperCase() : 'CU')}
                      </div>

                      <div>
                        <div style={{ fontSize: '0.98rem', fontWeight: 800, color: '#0f172a' }}>
                          {c.name}
                        </div>
                        <div style={{ fontSize: '0.78rem', color: '#64748b', marginTop: '2px', display: 'flex', gap: '8px', alignItems: 'center' }}>
                          {c.village && (
                            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '3px' }}>
                              <MapPin size={12} color="#94a3b8" />
                              {c.village}
                            </span>
                          )}
                          {c.phone && <span>• {c.phone}</span>}
                        </div>
                      </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: '0.68rem', color: '#94a3b8', fontWeight: 700, textTransform: 'uppercase' }}>
                          {t('khata.balance')}
                        </div>
                        <div style={{
                          fontSize: '1.15rem',
                          fontWeight: 900,
                          color: hasDues ? '#dc2626' : '#16a34a',
                          fontFamily: "'Outfit', sans-serif"
                        }}>
                          ₹{(c.balance || 0).toLocaleString('en-IN')}
                        </div>
                      </div>

                      <ChevronRight size={18} color="#94a3b8" />
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}
      </section>

      {/* ================= MODAL 1: NEW CUSTOMER ONBOARDING ================= */}
      {showAddCust && (
        <div style={{
          position: 'fixed',
          inset: 0,
          backgroundColor: 'rgba(15, 23, 42, 0.6)',
          backdropFilter: 'blur(4px)',
          zIndex: 300,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '16px'
        }}>
          <div style={{
            width: '100%',
            maxWidth: '420px',
            backgroundColor: '#ffffff',
            borderRadius: '1.25rem',
            padding: '1.5rem',
            boxShadow: '0 20px 40px rgba(0,0,0,0.25)',
            display: 'flex',
            flexDirection: 'column',
            gap: '14px'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ fontSize: '1.1rem', fontWeight: 800, color: '#0f172a', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <UserPlus size={20} color="#d97706" />
                <span>{t('khata.newCustomer')}</span>
              </div>
              <button
                type="button"
                onClick={() => setShowAddCust(false)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b' }}
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleCreateCustomer} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: '#334155', marginBottom: '4px' }}>
                  {t('khata.grahakKaNaam')} *
                </label>
                <input
                  type="text"
                  placeholder="e.g. Ramesh Kumar"
                  value={custName}
                  onChange={(e) => setCustName(e.target.value)}
                  required
                  style={{
                    width: '100%',
                    height: '44px',
                    padding: '0 12px',
                    borderRadius: '0.75rem',
                    border: '1.5px solid #cbd5e1',
                    fontSize: '0.95rem',
                    outline: 'none',
                    boxSizing: 'border-box'
                  }}
                />
              </div>

              {/* Village selector chips */}
              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: '#334155', marginBottom: '4px' }}>
                  {t('khata.gaonAddress')}
                </label>
                {getVillages && getVillages().length > 0 && (
                  <div style={{ display: 'flex', gap: '6px', overflowX: 'auto', marginBottom: '8px', paddingBottom: '2px' }}>
                    {getVillages().map((v) => {
                      const isSelected = custVillage.trim().toLowerCase() === v.name.toLowerCase();
                      return (
                        <button
                          key={v.name}
                          type="button"
                          onClick={() => setCustVillage(v.name)}
                          style={{
                            padding: '4px 10px',
                            borderRadius: '20px',
                            border: isSelected ? '1.5px solid #d97706' : '1px solid #cbd5e1',
                            backgroundColor: isSelected ? '#fef3c7' : '#f8fafc',
                            color: isSelected ? '#92400e' : '#334155',
                            fontSize: '0.75rem',
                            fontWeight: 700,
                            cursor: 'pointer',
                            whiteSpace: 'nowrap'
                          }}
                        >
                          {v.name}
                        </button>
                      );
                    })}
                  </div>
                )}
                <input
                  type="text"
                  placeholder="e.g. Rampur"
                  value={custVillage}
                  onChange={(e) => setCustVillage(e.target.value)}
                  style={{
                    width: '100%',
                    height: '44px',
                    padding: '0 12px',
                    borderRadius: '0.75rem',
                    border: '1.5px solid #cbd5e1',
                    fontSize: '0.95rem',
                    outline: 'none',
                    boxSizing: 'border-box'
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: '#334155', marginBottom: '4px' }}>
                  {t('khata.mobileNumber')}
                </label>
                <input
                  type="tel"
                  placeholder="9876543210"
                  maxLength="10"
                  value={custPhone}
                  onChange={(e) => setCustPhone(e.target.value)}
                  style={{
                    width: '100%',
                    height: '44px',
                    padding: '0 12px',
                    borderRadius: '0.75rem',
                    border: '1.5px solid #cbd5e1',
                    fontSize: '0.95rem',
                    outline: 'none',
                    boxSizing: 'border-box'
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: '#334155', marginBottom: '4px' }}>
                  {t('khata.openingBalance')} (₹)
                </label>
                <input
                  type="number"
                  placeholder="0"
                  value={custBalance}
                  onChange={(e) => setCustBalance(e.target.value)}
                  style={{
                    width: '100%',
                    height: '44px',
                    padding: '0 12px',
                    borderRadius: '0.75rem',
                    border: '1.5px solid #cbd5e1',
                    fontSize: '0.95rem',
                    outline: 'none',
                    boxSizing: 'border-box'
                  }}
                />
              </div>

              <button
                type="submit"
                style={{
                  width: '100%',
                  height: '48px',
                  backgroundColor: '#d97706',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '0.75rem',
                  fontSize: '1rem',
                  fontWeight: 800,
                  cursor: 'pointer',
                  marginTop: '6px',
                  boxShadow: '0 4px 12px rgba(217, 119, 6, 0.25)'
                }}
              >
                {t('khata.saveCustomerBtn')}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ================= MODAL 2: PRINTABLE PDF STATEMENT MODAL ================= */}
      {showPdfModal && activeCustomer && (
        <div style={{
          position: 'fixed',
          inset: 0,
          backgroundColor: 'rgba(15, 23, 42, 0.6)',
          backdropFilter: 'blur(4px)',
          zIndex: 300,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '16px'
        }}>
          <div style={{
            width: '100%',
            maxWidth: '650px',
            maxHeight: '90vh',
            backgroundColor: '#ffffff',
            borderRadius: '1.25rem',
            padding: '1.5rem',
            boxShadow: '0 20px 40px rgba(0,0,0,0.25)',
            display: 'flex',
            flexDirection: 'column',
            gap: '14px',
            overflowY: 'auto'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ fontSize: '1.1rem', fontWeight: 800, color: '#0f172a', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <FileText size={20} color="#d97706" />
                <span>{t('khata.statementTitle')}</span>
              </div>
              <button
                type="button"
                onClick={() => setShowPdfModal(false)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b' }}
              >
                <X size={20} />
              </button>
            </div>

            {/* Live Statement Preview Sheet */}
            <div className="printable-statement" style={{
              border: '1px solid #cbd5e1',
              borderRadius: '0.85rem',
              padding: '1.25rem',
              backgroundColor: '#ffffff',
              display: 'flex',
              flexDirection: 'column',
              gap: '14px'
            }}>
              {/* Header */}
              <div style={{ borderBottom: '2px solid #7f1d1d', paddingBottom: '10px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <h1 style={{ fontSize: '1.2rem', fontWeight: 900, color: '#7f1d1d', margin: 0 }}>
                    {shop.name || 'ChakkiBook Ledger'}
                  </h1>
                  <div style={{ fontSize: '0.78rem', color: '#475569', marginTop: '2px' }}>
                    {shop.address || 'Main Market Road'} • Ph: {shop.phone || 'N/A'}
                  </div>
                </div>
                <div style={{ textAlign: 'right', fontSize: '0.75rem', color: '#64748b' }}>
                  <div>Date: {new Date().toLocaleDateString('en-IN')}</div>
                  <div style={{ fontWeight: 800, color: '#0f172a' }}>Statement #ST-{Date.now().toString().slice(-5)}</div>
                </div>
              </div>

              {/* Customer Info */}
              <div style={{ backgroundColor: '#f8fafc', padding: '10px 14px', borderRadius: '0.65rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ fontSize: '0.95rem', fontWeight: 800, color: '#0f172a' }}>{activeCustomer.name}</div>
                  <div style={{ fontSize: '0.78rem', color: '#64748b' }}>
                    {activeCustomer.village} {activeCustomer.phone ? `• ${activeCustomer.phone}` : ''}
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '0.7rem', color: '#64748b', fontWeight: 700 }}>NET DUES</div>
                  <div style={{ fontSize: '1.2rem', fontWeight: 900, color: (activeCustomer.balance || 0) > 0 ? '#dc2626' : '#16a34a' }}>
                    ₹{activeCustomer.balance || 0}
                  </div>
                </div>
              </div>

              {/* Table */}
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8rem' }}>
                <thead>
                  <tr style={{ backgroundColor: '#f1f5f9', color: '#334155', textAlign: 'left' }}>
                    <th style={{ padding: '8px', borderRadius: '4px 0 0 4px' }}>Date</th>
                    <th style={{ padding: '8px' }}>Details</th>
                    <th style={{ padding: '8px' }}>Mode</th>
                    <th style={{ padding: '8px', textAlign: 'right' }}>Amount</th>
                    <th style={{ padding: '8px', textAlign: 'right', borderRadius: '0 4px 4px 0' }}>Balance</th>
                  </tr>
                </thead>
                <tbody>
                  {activeCustomerTimeline.map((b) => {
                    const isJama = b.grainType === 'Jama Payment' || b.type === 'payment';
                    const isCredit = b.paymentMode === 'credit';
                    const dateStr = formatDateStr(b);

                    return (
                      <tr key={b.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                        <td style={{ padding: '8px', color: '#475569' }}>{dateStr}</td>
                        <td style={{ padding: '8px', fontWeight: 700, color: '#0f172a' }}>
                          {b.grainType === 'Jama Payment' ? 'Jama Payment' : `${b.grainType} (${b.inputWeight || 0}kg)`}
                        </td>
                        <td style={{ padding: '8px', color: isJama ? '#16a34a' : isCredit ? '#dc2626' : '#475569', fontWeight: 700 }}>
                          {isJama ? 'Jama' : isCredit ? 'Udhar' : 'Paid'}
                        </td>
                        <td style={{ padding: '8px', textAlign: 'right', fontWeight: 800, color: isJama ? '#16a34a' : isCredit ? '#dc2626' : '#334155' }}>
                          {isJama ? `-₹${b.amount}` : isCredit ? `+₹${b.amount}` : `₹${b.amount}`}
                        </td>
                        <td style={{ padding: '8px', textAlign: 'right', fontWeight: 800, color: '#0f172a' }}>
                          ₹{b.runningBal}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>

              {/* Signature Footer */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', paddingTop: '16px' }}>
                <div style={{ fontSize: '0.72rem', color: '#94a3b8' }}>
                  Computer Generated Statement • ChakkiBook System
                </div>
                <div style={{ textAlign: 'center', borderTop: '1px solid #cbd5e1', paddingTop: '4px', width: '140px', fontSize: '0.75rem', fontWeight: 700, color: '#475569' }}>
                  Authorized Sign
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div style={{ display: 'flex', gap: '10px' }}>
              <button
                type="button"
                onClick={() => window.print()}
                style={{
                  flex: 1,
                  padding: '12px',
                  backgroundColor: '#f1f5f9',
                  border: '1.5px solid #cbd5e1',
                  borderRadius: '0.75rem',
                  fontSize: '0.88rem',
                  fontWeight: 800,
                  color: '#334155',
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px'
                }}
              >
                <Printer size={16} />
                <span>{t('khata.printStatement')}</span>
              </button>

              <button
                type="button"
                onClick={generatePDFStatement}
                style={{
                  flex: 1,
                  padding: '12px',
                  backgroundColor: '#d97706',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '0.75rem',
                  fontSize: '0.88rem',
                  fontWeight: 800,
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px',
                  boxShadow: '0 4px 12px rgba(217, 119, 6, 0.25)'
                }}
              >
                <Download size={16} />
                <span>{t('khata.downloadPDF')}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================= MODAL 3: WHATSAPP REMINDER BUILDER ================= */}
      {showWhatsappModal && activeCustomer && (
        <div style={{
          position: 'fixed',
          inset: 0,
          backgroundColor: 'rgba(15, 23, 42, 0.6)',
          backdropFilter: 'blur(4px)',
          zIndex: 300,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '16px'
        }}>
          <div style={{
            width: '100%',
            maxWidth: '460px',
            backgroundColor: '#ffffff',
            borderRadius: '1.25rem',
            padding: '1.5rem',
            boxShadow: '0 20px 40px rgba(0,0,0,0.25)',
            display: 'flex',
            flexDirection: 'column',
            gap: '14px'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ fontSize: '1.1rem', fontWeight: 800, color: '#0f172a', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <MessageSquare size={20} color="#16a34a" />
                <span>{t('khata.reminderBuilder')}</span>
              </div>
              <button
                type="button"
                onClick={() => setShowWhatsappModal(false)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b' }}
              >
                <X size={20} />
              </button>
            </div>

            {/* Template Selector Chips */}
            <div>
              <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: '#475569', marginBottom: '6px' }}>
                {t('khata.reminderTemplate')}
              </label>
              <div style={{ display: 'flex', gap: '6px', overflowX: 'auto', paddingBottom: '2px' }}>
                <button
                  type="button"
                  onClick={() => setReminderTemplate('polite')}
                  style={{
                    padding: '6px 12px',
                    borderRadius: '20px',
                    border: reminderTemplate === 'polite' ? '1.5px solid #16a34a' : '1px solid #cbd5e1',
                    backgroundColor: reminderTemplate === 'polite' ? '#dcfce7' : '#ffffff',
                    color: reminderTemplate === 'polite' ? '#14532d' : '#475569',
                    fontSize: '0.78rem',
                    fontWeight: 800,
                    cursor: 'pointer',
                    whiteSpace: 'nowrap'
                  }}
                >
                  {t('khata.politeTemplate')}
                </button>

                <button
                  type="button"
                  onClick={() => setReminderTemplate('urgent')}
                  style={{
                    padding: '6px 12px',
                    borderRadius: '20px',
                    border: reminderTemplate === 'urgent' ? '1.5px solid #dc2626' : '1px solid #cbd5e1',
                    backgroundColor: reminderTemplate === 'urgent' ? '#fee2e2' : '#ffffff',
                    color: reminderTemplate === 'urgent' ? '#991b1b' : '#475569',
                    fontSize: '0.78rem',
                    fontWeight: 800,
                    cursor: 'pointer',
                    whiteSpace: 'nowrap'
                  }}
                >
                  {t('khata.urgentTemplate')}
                </button>

                <button
                  type="button"
                  onClick={() => setReminderTemplate('detailed')}
                  style={{
                    padding: '6px 12px',
                    borderRadius: '20px',
                    border: reminderTemplate === 'detailed' ? '1.5px solid #d97706' : '1px solid #cbd5e1',
                    backgroundColor: reminderTemplate === 'detailed' ? '#fef3c7' : '#ffffff',
                    color: reminderTemplate === 'detailed' ? '#92400e' : '#475569',
                    fontSize: '0.78rem',
                    fontWeight: 800,
                    cursor: 'pointer',
                    whiteSpace: 'nowrap'
                  }}
                >
                  {t('khata.detailedTemplate')}
                </button>
              </div>
            </div>

            {/* Editable Message Textarea */}
            <div>
              <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: '#475569', marginBottom: '4px' }}>
                Preview & Edit Message:
              </label>
              <textarea
                rows={6}
                value={customMsgText}
                onChange={(e) => setCustomMsgText(e.target.value)}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  borderRadius: '0.75rem',
                  border: '1.5px solid #cbd5e1',
                  fontSize: '0.85rem',
                  color: '#0f172a',
                  outline: 'none',
                  backgroundColor: '#f8fafc',
                  boxSizing: 'border-box',
                  fontFamily: 'inherit'
                }}
              />
            </div>

            {/* Action Buttons */}
            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                type="button"
                onClick={() => handleCopyText(customMsgText)}
                style={{
                  padding: '12px',
                  backgroundColor: '#f1f5f9',
                  border: '1.5px solid #cbd5e1',
                  borderRadius: '0.75rem',
                  fontSize: '0.85rem',
                  fontWeight: 800,
                  color: '#334155',
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px'
                }}
              >
                {copiedToast ? <Check size={16} color="#16a34a" /> : <Copy size={16} />}
                <span>{copiedToast ? t('khata.copied') : t('khata.copyText')}</span>
              </button>

              <button
                type="button"
                onClick={() => handleOpenWhatsApp(activeCustomer, customMsgText)}
                style={{
                  flex: 1,
                  padding: '12px',
                  backgroundColor: '#16a34a',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '0.75rem',
                  fontSize: '0.9rem',
                  fontWeight: 800,
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px',
                  boxShadow: '0 4px 12px rgba(22, 163, 74, 0.25)'
                }}
              >
                <Send size={16} />
                <span>{t('khata.openWhatsApp')}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
