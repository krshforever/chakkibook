import React, { useState, useMemo } from 'react';
import { 
  Wheat, 
  Droplets, 
  Clock, 
  CheckCircle2, 
  PlusCircle, 
  Search, 
  BookOpen, 
  ChevronRight,
  ChevronLeft,
  MapPin, 
  Package, 
  Scale,
  Sparkles,
  TrendingUp,
  TrendingDown,
  AlertCircle,
  IndianRupee,
  Users,
  Zap,
  X,
  ArrowUpRight,
  Filter,
  Calendar,
  Layers,
  FileText
} from 'lucide-react';
import { useStore } from '../store/useStore';
import { useTranslation } from '../utils/translations';
import GaonSelector from '../components/GaonSelector';

export default function Dashboard({ setActiveTab, onSelectCustomer }) {
  const { t } = useTranslation();
  const activeMode = useStore((state) => state.activeMode || 'chakki');
  const boris = useStore((state) => state.boris || []);
  const customers = useStore((state) => state.customers || []);
  const markBoriDone = useStore((state) => state.markBoriDone);
  const selectedVillage = useStore((state) => state.selectedVillage || 'all');
  const setSelectedVillage = useStore((state) => state.setSelectedVillage);
  const getVillageStats = useStore((state) => state.getVillageStats);

  const [searchQuery, setSearchQuery] = useState('');
  const [dateFilter, setDateFilter] = useState('aaj'); // 'aaj' | 'kal' | 'hafta' | 'mahina'
  const [activeInsightIndex, setActiveInsightIndex] = useState(0);

  // Relative time helper without emojis
  const getRelativeTime = (dateStr) => {
    if (!dateStr) return 'Kuch der pehle';
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now - date;
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffHours < 1) return 'Abhi abhi';
    if (diffHours < 4) return `${diffHours}h pehle`;
    if (diffHours < 14) return 'Aaj subah';
    if (diffDays === 1) return t('dashboard.yesterday');
    if (diffDays > 1) return `${diffDays}d pehle`;
    return t('dashboard.today');
  };

  const now = useMemo(() => new Date(), []);
  const todayStr = useMemo(() => now.toISOString().split('T')[0], [now]);
  const yesterdayStr = useMemo(() => {
    const d = new Date(now.getTime() - 86400000);
    return d.toISOString().split('T')[0];
  }, [now]);

  // Mode-filtered boris
  const modeBoris = useMemo(() => boris.filter((b) => b.mode === activeMode), [boris, activeMode]);
  const query = searchQuery.trim().toLowerCase();

  // Village matching helper
  const matchesVillage = (b) => {
    if (selectedVillage === 'all') return true;
    const vTarget = selectedVillage.trim().toLowerCase();
    const bV = (b.customerVillage || '').trim().toLowerCase();
    if (bV) return bV === vTarget;
    const cust = customers.find(c => c.id === b.customerId || c.name === b.customerName);
    return (cust?.village || '').trim().toLowerCase() === vTarget;
  };

  // Search matching helper
  const matchesSearch = (b) => {
    if (!query) return true;
    return (
      b.customerName?.toLowerCase().includes(query) ||
      b.grainType?.toLowerCase().includes(query) ||
      b.outputType?.toLowerCase().includes(query) ||
      b.customerVillage?.toLowerCase().includes(query) ||
      b.customerPhone?.includes(query) ||
      b.notes?.toLowerCase().includes(query)
    );
  };

  // 1. Pending Boris in current mode (filtered by selected village & search)
  const pendingBoris = useMemo(() => {
    return modeBoris
      .filter((b) => b.status === 'pending')
      .filter(matchesVillage)
      .filter(matchesSearch)
      .sort((a, b) => new Date(a.dropOffDate || a.createdAt).getTime() - new Date(b.dropOffDate || b.createdAt).getTime());
  }, [modeBoris, selectedVillage, query, customers]);

  // Date Filter Logic for completed entries & calculations
  const isDateInFilter = (dateISO) => {
    if (!dateISO) return false;
    const dStr = dateISO.split('T')[0];

    if (dateFilter === 'aaj') return dStr === todayStr;
    if (dateFilter === 'kal') return dStr === yesterdayStr;
    if (dateFilter === 'hafta') {
      const dMs = new Date(dateISO).getTime();
      return dMs >= now.getTime() - 86400000 * 7;
    }
    if (dateFilter === 'mahina') {
      const dMs = new Date(dateISO).getTime();
      return dMs >= now.getTime() - 86400000 * 30;
    }
    return true;
  };

  // Previous Period Date Filter Logic for Trend Calculations
  const isDateInPrevPeriod = (dateISO) => {
    if (!dateISO) return false;
    const dMs = new Date(dateISO).getTime();
    const nowMs = now.getTime();

    if (dateFilter === 'aaj') {
      const dStr = dateISO.split('T')[0];
      return dStr === yesterdayStr;
    }
    if (dateFilter === 'kal') {
      const dayBeforeYesterdayStr = new Date(nowMs - 86400000 * 2).toISOString().split('T')[0];
      return dateISO.split('T')[0] === dayBeforeYesterdayStr;
    }
    if (dateFilter === 'hafta') {
      return dMs >= nowMs - 86400000 * 14 && dMs < nowMs - 86400000 * 7;
    }
    if (dateFilter === 'mahina') {
      return dMs >= nowMs - 86400000 * 60 && dMs < nowMs - 86400000 * 30;
    }
    return false;
  };

  // 2. Completed Register Entries (filtered by selected village, date, & search)
  const filteredCompletedBoris = useMemo(() => {
    return modeBoris
      .filter((b) => b.status === 'done' || b.status === 'picked_up')
      .filter((b) => isDateInFilter(b.doneDate || b.createdAt))
      .filter(matchesVillage)
      .filter(matchesSearch)
      .sort((a, b) => new Date(b.doneDate || b.createdAt).getTime() - new Date(a.doneDate || a.createdAt).getTime());
  }, [modeBoris, dateFilter, selectedVillage, query, customers]);

  // Current period completed boris for stats summary
  const currentPeriodDone = useMemo(() => {
    return modeBoris
      .filter((b) => b.status === 'done' || b.status === 'picked_up')
      .filter((b) => isDateInFilter(b.doneDate || b.createdAt))
      .filter(matchesVillage);
  }, [modeBoris, dateFilter, selectedVillage, customers]);

  // Previous period completed boris for trend comparison
  const prevPeriodDone = useMemo(() => {
    return modeBoris
      .filter((b) => b.status === 'done' || b.status === 'picked_up')
      .filter((b) => isDateInPrevPeriod(b.doneDate || b.createdAt))
      .filter(matchesVillage);
  }, [modeBoris, dateFilter, selectedVillage, customers]);

  // Executive KPI summary numbers
  const totalKg = currentPeriodDone.reduce((sum, b) => sum + (Number(b.inputWeight) || 0), 0);
  const totalKamai = currentPeriodDone.reduce((sum, b) => sum + (Number(b.amount) || 0), 0);
  
  const prevKg = prevPeriodDone.reduce((sum, b) => sum + (Number(b.inputWeight) || 0), 0);
  const prevKamai = prevPeriodDone.reduce((sum, b) => sum + (Number(b.amount) || 0), 0);

  // Revenue trend calculation
  const revTrendPct = useMemo(() => {
    if (prevKamai === 0) return totalKamai > 0 ? 100 : 0;
    return Math.round(((totalKamai - prevKamai) / prevKamai) * 100);
  }, [totalKamai, prevKamai]);

  // Volume trend calculation
  const volTrendPct = useMemo(() => {
    if (prevKg === 0) return totalKg > 0 ? 100 : 0;
    return Math.round(((totalKg - prevKg) / prevKg) * 100);
  }, [totalKg, prevKg]);

  // Outstanding Dues for village filter scope
  const villageStats = getVillageStats ? getVillageStats(selectedVillage) : { totalDues: 0 };
  const totalUdhar = villageStats.totalDues || 0;

  // Customers with dues in current scope
  const duesCustomers = useMemo(() => {
    return customers
      .filter(c => {
        if (c.balance <= 0) return false;
        if (selectedVillage === 'all') return true;
        return (c.village || '').trim().toLowerCase() === selectedVillage.trim().toLowerCase();
      })
      .sort((a, b) => b.balance - a.balance);
  }, [customers, selectedVillage]);

  // Total pending weight across queue
  const totalPendingKg = pendingBoris.reduce((sum, b) => sum + (Number(b.inputWeight) || 0), 0);

  // Ready boris awaiting customer pickup
  const readyForPickupBoris = useMemo(() => {
    return modeBoris
      .filter(b => b.status === 'done')
      .filter(matchesVillage);
  }, [modeBoris, selectedVillage, customers]);

  // AI Smart Insights generator
  const aiInsights = useMemo(() => {
    const insights = [];

    // Insight 1: Milling Surge / Queue Window
    if (pendingBoris.length > 0) {
      insights.push({
        id: 'milling_surge',
        type: 'warning',
        title: t('dashboard.millingSurge') || 'Optimal Milling Window',
        description: `${pendingBoris.length} pending ${activeMode === 'chakki' ? 'bags' : 'lots'} (${totalPendingKg} kg) awaiting processing. Optimal window: Complete before afternoon pickup surge.`,
        badgeText: 'Milling Surge',
        actionLabel: 'View Queue',
        actionTab: 'queue'
      });
    } else {
      insights.push({
        id: 'milling_clear',
        type: 'success',
        title: 'Milling Queue Clear',
        description: `All incoming ${activeMode === 'chakki' ? 'flour mill' : 'oil expeller'} orders are processed. Ready for new drop-offs.`,
        badgeText: 'Optimal Capacity',
        actionLabel: '+ Nayi Entry',
        actionTab: 'entry'
      });
    }

    // Insight 2: Dues Recovery Alert
    if (duesCustomers.length > 0) {
      const topCust = duesCustomers[0];
      insights.push({
        id: 'dues_alert',
        type: 'danger',
        title: t('dashboard.duesRecovery') || 'Dues Recovery Alert',
        description: `₹${totalUdhar} outstanding dues across ${duesCustomers.length} customers${selectedVillage !== 'all' ? ` in ${selectedVillage}` : ''}. Top balance: ${topCust.name} (₹${topCust.balance}).`,
        badgeText: 'Udhar Alert',
        actionLabel: t('dashboard.grahakKhata') || 'Open Khata',
        actionTab: 'khata',
        customer: topCust
      });
    } else {
      insights.push({
        id: 'dues_clear',
        type: 'success',
        title: 'Zero Outstanding Dues',
        description: `All customer accounts${selectedVillage !== 'all' ? ` in ${selectedVillage}` : ''} are fully settled with zero balance!`,
        badgeText: 'Ledger Clear',
        actionLabel: 'Open Khata',
        actionTab: 'khata'
      });
    }

    // Insight 3: Customer Pickup Surge
    if (readyForPickupBoris.length > 0) {
      insights.push({
        id: 'pickup_ready',
        type: 'info',
        title: t('dashboard.pickupReady') || 'Orders Ready for Pickup',
        description: `${readyForPickupBoris.length} orders completed and ready for customer pickup. SMS drop-off notifications sent.`,
        badgeText: 'Pickup Surge',
        actionLabel: 'View Register',
        actionTab: 'register'
      });
    }

    return insights;
  }, [pendingBoris, totalPendingKg, activeMode, duesCustomers, totalUdhar, selectedVillage, readyForPickupBoris, t]);

  const currentInsight = aiInsights[activeInsightIndex % aiInsights.length] || aiInsights[0];

  const handleInsightAction = () => {
    if (!currentInsight) return;
    if (currentInsight.actionTab === 'entry') setActiveTab('entry');
    else if (currentInsight.actionTab === 'khata') {
      if (currentInsight.customer && onSelectCustomer) {
        onSelectCustomer(currentInsight.customer);
      }
      setActiveTab('khata');
    }
  };

  const handleCustomerClick = (customerId, customerName) => {
    const cust = customers.find((c) => c.id === customerId || c.name === customerName);
    if (cust && onSelectCustomer) {
      onSelectCustomer(cust);
      setActiveTab('khata');
    } else {
      setActiveTab('khata');
    }
  };

  return (
    <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '16px', maxWidth: '640px', margin: '0 auto' }}>
      
      {/* 1. Executive Hero KPI Banner */}
      <section style={{
        backgroundColor: '#ffffff',
        border: '1.5px solid #cbd5e1',
        borderRadius: '1rem',
        padding: '1.25rem',
        boxShadow: '0 4px 16px rgba(15, 23, 42, 0.05)',
        boxSizing: 'border-box'
      }}>
        {/* Banner Header Info */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.15rem' }}>
          <div>
            <div style={{ fontSize: '0.75rem', fontWeight: 800, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
              {dateFilter === 'aaj' ? t('dashboard.todaySummary') : (dateFilter === 'kal' ? t('dashboard.yesterdaySummary') : t('dashboard.summary'))}
              {selectedVillage !== 'all' && (
                <span style={{ color: '#d97706', marginLeft: '6px', fontWeight: 800 }}>• {selectedVillage}</span>
              )}
            </div>
          </div>
          
          <div style={{
            fontSize: '0.75rem',
            fontWeight: 800,
            color: activeMode === 'chakki' ? '#d97706' : '#059669',
            backgroundColor: activeMode === 'chakki' ? '#fef3c7' : '#dcfce7',
            padding: '3px 10px',
            borderRadius: '9999px',
            border: activeMode === 'chakki' ? '1px solid #fde68a' : '1px solid #bbf7d0',
            display: 'flex',
            alignItems: 'center',
            gap: '5px'
          }}>
            {activeMode === 'chakki' ? <Wheat size={14} /> : <Droplets size={14} />}
            <span>{activeMode === 'chakki' ? t('dashboard.grainsSubtitleChakki') : t('dashboard.grainsSubtitleSpellar')}</span>
          </div>
        </div>

        {/* 3-KPI Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px', textAlign: 'left' }}>
          {/* KPI 1: Revenue */}
          <div style={{
            backgroundColor: '#f8fafc',
            border: '1px solid #e2e8f0',
            borderRadius: '0.75rem',
            padding: '12px 10px',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between'
          }}>
            <div>
              <div style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.02em', marginBottom: '4px' }}>
                {t('dashboard.totalIncome')}
              </div>
              <div style={{
                fontSize: '1.45rem',
                fontWeight: 800,
                color: '#0f172a',
                fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif",
                fontVariantNumeric: 'tabular-nums',
                lineHeight: '1.1'
              }}>
                ₹ {totalKamai.toLocaleString('en-IN')}
              </div>
            </div>

            {/* Revenue Trend Badge */}
            <div style={{ marginTop: '8px' }}>
              <span style={{
                fontSize: '0.68rem',
                fontWeight: 800,
                padding: '2px 6px',
                borderRadius: '9999px',
                backgroundColor: revTrendPct >= 0 ? '#dcfce7' : '#fee2e2',
                color: revTrendPct >= 0 ? '#15803d' : '#b91c1c',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '3px'
              }}>
                {revTrendPct >= 0 ? <TrendingUp size={11} /> : <TrendingDown size={11} />}
                {revTrendPct >= 0 ? `+${revTrendPct}%` : `${revTrendPct}%`}
              </span>
            </div>
          </div>

          {/* KPI 2: Volume (kg) */}
          <div style={{
            backgroundColor: '#f8fafc',
            border: '1px solid #e2e8f0',
            borderRadius: '0.75rem',
            padding: '12px 10px',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between'
          }}>
            <div>
              <div style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.02em', marginBottom: '4px' }}>
                {activeMode === 'chakki' ? t('dashboard.grinding') : t('dashboard.pressing')}
              </div>
              <div style={{
                fontSize: '1.45rem',
                fontWeight: 800,
                color: '#0f172a',
                fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif",
                fontVariantNumeric: 'tabular-nums',
                lineHeight: '1.1'
              }}>
                {totalKg.toLocaleString('en-IN')} <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748b' }}>kg</span>
              </div>
            </div>

            {/* Volume Trend Badge */}
            <div style={{ marginTop: '8px' }}>
              <span style={{
                fontSize: '0.68rem',
                fontWeight: 800,
                padding: '2px 6px',
                borderRadius: '9999px',
                backgroundColor: volTrendPct >= 0 ? '#e0f2fe' : '#fee2e2',
                color: volTrendPct >= 0 ? '#0369a1' : '#b91c1c',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '3px'
              }}>
                <Zap size={11} />
                {volTrendPct >= 0 ? `+${volTrendPct}%` : `${volTrendPct}%`}
              </span>
            </div>
          </div>

          {/* KPI 3: Outstanding Dues */}
          <div style={{
            backgroundColor: '#fff5f5',
            border: '1px solid #fecdd3',
            borderRadius: '0.75rem',
            padding: '12px 10px',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between'
          }}>
            <div>
              <div style={{ fontSize: '0.72rem', color: '#be123c', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.02em', marginBottom: '4px' }}>
                {t('dashboard.remainingDues')}
              </div>
              <div style={{
                fontSize: '1.45rem',
                fontWeight: 800,
                color: '#be123c',
                fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif",
                fontVariantNumeric: 'tabular-nums',
                lineHeight: '1.1'
              }}>
                ₹ {totalUdhar.toLocaleString('en-IN')}
              </div>
            </div>

            {/* Dues Alert Badge */}
            <div style={{ marginTop: '8px' }}>
              <span style={{
                fontSize: '0.68rem',
                fontWeight: 800,
                padding: '2px 6px',
                borderRadius: '9999px',
                backgroundColor: totalUdhar > 0 ? '#ffe4e6' : '#dcfce7',
                color: totalUdhar > 0 ? '#9f1239' : '#15803d',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '3px'
              }}>
                {totalUdhar > 0 ? <AlertCircle size={11} /> : <CheckCircle2 size={11} />}
                {totalUdhar > 0 ? `${duesCustomers.length} Dues` : 'Clear'}
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* 2. AI Insights Smart Banner */}
      {currentInsight && (
        <section style={{
          backgroundColor: currentInsight.type === 'danger' ? '#fff1f2' : (currentInsight.type === 'warning' ? '#fffbeb' : '#f0fdf4'),
          border: `1.5px solid ${currentInsight.type === 'danger' ? '#fecdd3' : (currentInsight.type === 'warning' ? '#fde68a' : '#bbf7d0')}`,
          borderRadius: '1rem',
          padding: '1rem 1.15rem',
          boxShadow: '0 2px 8px rgba(0,0,0,0.03)',
          boxSizing: 'border-box',
          position: 'relative'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <div style={{
                width: '24px',
                height: '24px',
                borderRadius: '50%',
                backgroundColor: currentInsight.type === 'danger' ? '#ffe4e6' : (currentInsight.type === 'warning' ? '#fef3c7' : '#dcfce7'),
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <Sparkles size={14} color={currentInsight.type === 'danger' ? '#e11d48' : (currentInsight.type === 'warning' ? '#d97706' : '#16a34a')} />
              </div>
              <span style={{
                fontSize: '0.72rem',
                fontWeight: 800,
                color: currentInsight.type === 'danger' ? '#9f1239' : (currentInsight.type === 'warning' ? '#92400e' : '#166534'),
                textTransform: 'uppercase',
                letterSpacing: '0.05em'
              }}>
                {t('dashboard.aiCoPilot') || 'AI Mill Co-Pilot'}
              </span>
              <span style={{
                fontSize: '0.65rem',
                fontWeight: 800,
                padding: '1px 6px',
                borderRadius: '9999px',
                backgroundColor: 'rgba(255,255,255,0.7)',
                color: '#475569'
              }}>
                {currentInsight.badgeText}
              </span>
            </div>

            {/* Carousel Controls */}
            {aiInsights.length > 1 && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <button
                  type="button"
                  onClick={() => setActiveInsightIndex((prev) => (prev - 1 + aiInsights.length) % aiInsights.length)}
                  style={{
                    border: 'none',
                    background: 'rgba(255,255,255,0.8)',
                    borderRadius: '50%',
                    width: '24px',
                    height: '24px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    color: '#475569'
                  }}
                >
                  <ChevronLeft size={14} />
                </button>
                <span style={{ fontSize: '0.7rem', fontWeight: 800, color: '#64748b' }}>
                  {activeInsightIndex + 1}/{aiInsights.length}
                </span>
                <button
                  type="button"
                  onClick={() => setActiveInsightIndex((prev) => (prev + 1) % aiInsights.length)}
                  style={{
                    border: 'none',
                    background: 'rgba(255,255,255,0.8)',
                    borderRadius: '50%',
                    width: '24px',
                    height: '24px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    color: '#475569'
                  }}
                >
                  <ChevronRight size={14} />
                </button>
              </div>
            )}
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px' }}>
            <div>
              <h4 style={{ fontSize: '0.9rem', fontWeight: 800, color: '#0f172a', margin: '0 0 2px 0' }}>
                {currentInsight.title}
              </h4>
              <p style={{ fontSize: '0.82rem', color: '#334155', margin: 0, fontWeight: 600, lineHeight: 1.35 }}>
                {currentInsight.description}
              </p>
            </div>

            {currentInsight.actionLabel && (
              <button
                type="button"
                onClick={handleInsightAction}
                style={{
                  height: '36px',
                  padding: '0 12px',
                  backgroundColor: currentInsight.type === 'danger' ? '#be123c' : (currentInsight.type === 'warning' ? '#d97706' : '#15803d'),
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '0.5rem',
                  fontSize: '0.78rem',
                  fontWeight: 800,
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                  flexShrink: 0,
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px',
                  boxShadow: '0 2px 6px rgba(0,0,0,0.1)'
                }}
              >
                <span>{currentInsight.actionLabel}</span>
                <ArrowUpRight size={14} />
              </button>
            )}
          </div>
        </section>
      )}

      {/* 3. Quick Action Grid - 52px Touch Targets with Spring Dynamics */}
      <section style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
        <button
          type="button"
          onClick={() => setActiveTab('entry')}
          style={{
            height: '52px',
            minHeight: '52px',
            backgroundColor: '#d97706',
            backgroundImage: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
            color: '#ffffff',
            border: 'none',
            borderRadius: '0.75rem',
            fontSize: '0.95rem',
            fontWeight: 800,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            boxShadow: '0 4px 14px rgba(217, 119, 6, 0.35)',
            transition: 'transform 0.15s cubic-bezier(0.34, 1.56, 0.64, 1), box-shadow 0.15s ease'
          }}
          onMouseDown={(e) => { e.currentTarget.style.transform = 'scale(0.97)'; }}
          onMouseUp={(e) => { e.currentTarget.style.transform = 'scale(1)'; }}
          onMouseLeave={(e) => { e.currentTarget.style.transform = 'scale(1)'; }}
          onTouchStart={(e) => { e.currentTarget.style.transform = 'scale(0.97)'; }}
          onTouchEnd={(e) => { e.currentTarget.style.transform = 'scale(1)'; }}
        >
          <PlusCircle size={20} />
          <span>{t('dashboard.newBoriEntry')}</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('khata')}
          style={{
            height: '52px',
            minHeight: '52px',
            backgroundColor: '#ffffff',
            color: '#0f172a',
            border: '1.5px solid #cbd5e1',
            borderRadius: '0.75rem',
            fontSize: '0.95rem',
            fontWeight: 800,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            boxShadow: '0 2px 6px rgba(0,0,0,0.04)',
            transition: 'transform 0.15s cubic-bezier(0.34, 1.56, 0.64, 1), border-color 0.15s ease'
          }}
          onMouseDown={(e) => { e.currentTarget.style.transform = 'scale(0.97)'; }}
          onMouseUp={(e) => { e.currentTarget.style.transform = 'scale(1)'; }}
          onMouseLeave={(e) => { e.currentTarget.style.transform = 'scale(1)'; }}
          onTouchStart={(e) => { e.currentTarget.style.transform = 'scale(0.97)'; }}
          onTouchEnd={(e) => { e.currentTarget.style.transform = 'scale(1)'; }}
        >
          <BookOpen size={20} color="#475569" />
          <span>{t('dashboard.grahakKhata')}</span>
        </button>
      </section>

      {/* 4. Integrated GaonSelector (1-Tap Multi-Village Filter for Queue & Stats) */}
      <GaonSelector
        selectedVillage={selectedVillage}
        onSelectVillage={(v) => setSelectedVillage(v)}
        badgeType="pending"
        allLabel={t('common.allVillages')}
      />

      {/* 5. Search & Filter Bar */}
      <section style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        <div style={{ position: 'relative', width: '100%' }}>
          <Search size={18} color="#64748b" style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)' }} />
          <input
            type="text"
            placeholder={t('dashboard.searchPlaceholder')}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              width: '100%',
              height: '48px',
              padding: '0 38px 0 42px',
              borderRadius: '0.75rem',
              border: '1.5px solid #cbd5e1',
              backgroundColor: '#ffffff',
              fontSize: '0.92rem',
              color: '#0f172a',
              fontWeight: 600,
              outline: 'none',
              boxSizing: 'border-box'
            }}
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              style={{
                position: 'absolute',
                right: '12px',
                top: '50%',
                transform: 'translateY(-50%)',
                background: 'none',
                border: 'none',
                color: '#64748b',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '4px'
              }}
            >
              <X size={16} />
            </button>
          )}
        </div>

        {/* Date Filter Pills - 44px Touch Target height */}
        <div style={{
          display: 'flex',
          gap: '8px',
          overflowX: 'auto',
          paddingBottom: '2px',
          scrollbarWidth: 'none'
        }}>
          {[
            { id: 'aaj', label: t('dashboard.today') },
            { id: 'kal', label: t('dashboard.yesterday') },
            { id: 'hafta', label: t('dashboard.days7') },
            { id: 'mahina', label: t('dashboard.thisMonth') }
          ].map((tab) => {
            const isActive = dateFilter === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setDateFilter(tab.id)}
                style={{
                  minHeight: '44px',
                  height: '44px',
                  padding: '0 16px',
                  borderRadius: '9999px',
                  border: isActive ? '2px solid #d97706' : '1.5px solid #cbd5e1',
                  backgroundColor: isActive ? '#fef3c7' : '#ffffff',
                  color: isActive ? '#b45309' : '#475569',
                  fontSize: '0.85rem',
                  fontWeight: isActive ? 800 : 600,
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  transition: 'all 0.15s ease',
                  flexShrink: 0
                }}
              >
                <Calendar size={13} style={{ opacity: isActive ? 1 : 0.6 }} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </section>

      {/* 6. Pending Bori Queue */}
      <section style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2 style={{ fontSize: '0.95rem', fontWeight: 800, color: '#0f172a', margin: 0, display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Clock size={18} color="#d97706" />
            <span>{t('dashboard.pendingQueue')} ({pendingBoris.length})</span>
          </h2>
          {totalPendingKg > 0 && (
            <span style={{ fontSize: '0.78rem', fontWeight: 800, color: '#64748b', fontVariantNumeric: 'tabular-nums' }}>
              {totalPendingKg} kg total
            </span>
          )}
        </div>

        {pendingBoris.length === 0 ? (
          <div style={{
            backgroundColor: '#ffffff',
            border: '1.5px solid #cbd5e1',
            borderRadius: '0.85rem',
            padding: '1.5rem',
            textAlign: 'center',
            color: '#64748b',
            fontSize: '0.88rem',
            fontWeight: 600
          }}>
            {t('dashboard.noPending')}
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {pendingBoris.map((b) => (
              <div
                key={b.id}
                style={{
                  backgroundColor: '#ffffff',
                  border: '1.5px solid #cbd5e1',
                  borderLeft: '5px solid #f59e0b',
                  borderRadius: '0.75rem',
                  padding: '14px 16px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  boxShadow: '0 2px 6px rgba(0,0,0,0.03)'
                }}
              >
                <div style={{ flex: 1, paddingRight: '12px' }}>
                  {/* Customer Name & Village Tag */}
                  <div
                    onClick={() => handleCustomerClick(b.customerId, b.customerName)}
                    style={{ fontSize: '1rem', fontWeight: 800, color: '#0f172a', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}
                  >
                    <span>{b.customerName}</span>
                    {b.customerVillage && (
                      <span style={{ 
                        fontSize: '0.72rem', 
                        backgroundColor: '#f1f5f9', 
                        color: '#475569', 
                        padding: '2px 8px', 
                        borderRadius: '9999px', 
                        fontWeight: 700,
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '3px',
                        border: '1px solid #e2e8f0'
                      }}>
                        <MapPin size={10} />
                        {b.customerVillage}
                      </span>
                    )}
                    <ChevronRight size={16} color="#64748b" />
                  </div>

                  {/* Grain/Output Badges, Weight, Amount, Relative Time */}
                  <div style={{ fontSize: '0.82rem', color: '#475569', marginTop: '4px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                    <span style={{ fontWeight: 800, color: '#0f172a', fontVariantNumeric: 'tabular-nums' }}>{b.inputWeight} kg</span>
                    
                    <span style={{
                      fontSize: '0.72rem',
                      fontWeight: 800,
                      padding: '1px 7px',
                      borderRadius: '9999px',
                      backgroundColor: '#fef3c7',
                      color: '#b45309',
                      border: '1px solid #fde68a'
                    }}>
                      {b.grainType}
                    </span>

                    {b.outputType && (
                      <span style={{
                        fontSize: '0.72rem',
                        fontWeight: 800,
                        padding: '1px 7px',
                        borderRadius: '9999px',
                        backgroundColor: '#e0f2fe',
                        color: '#0369a1',
                        border: '1px solid #bae6fd'
                      }}>
                        {b.outputType}
                      </span>
                    )}

                    <span style={{ fontVariantNumeric: 'tabular-nums', fontWeight: 700, color: '#0f172a' }}>
                      • ₹ {b.amount}
                    </span>

                    <span style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 500 }}>
                      ({getRelativeTime(b.createdAt || b.dropOffDate)})
                    </span>
                  </div>
                </div>

                {/* Done Trigger - 48px Inviolable Touch Target */}
                <button
                  type="button"
                  onClick={() => markBoriDone(b.id)}
                  style={{
                    height: '48px',
                    minHeight: '48px',
                    minWidth: '96px',
                    backgroundColor: '#16a34a',
                    backgroundImage: 'linear-gradient(135deg, #22c55e 0%, #16a34a 100%)',
                    color: '#ffffff',
                    border: 'none',
                    borderRadius: '0.65rem',
                    padding: '0 16px',
                    fontSize: '0.88rem',
                    fontWeight: 800,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px',
                    boxShadow: '0 3px 10px rgba(22, 163, 74, 0.3)',
                    transition: 'transform 0.15s cubic-bezier(0.34, 1.56, 0.64, 1), box-shadow 0.15s ease',
                    flexShrink: 0
                  }}
                  onMouseDown={(e) => { e.currentTarget.style.transform = 'scale(0.95)'; }}
                  onMouseUp={(e) => { e.currentTarget.style.transform = 'scale(1)'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.transform = 'scale(1)'; }}
                  onTouchStart={(e) => { e.currentTarget.style.transform = 'scale(0.95)'; }}
                  onTouchEnd={(e) => { e.currentTarget.style.transform = 'scale(1)'; }}
                >
                  <CheckCircle2 size={18} />
                  <span>{t('dashboard.done')}</span>
                </button>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* 7. Completed Register */}
      <section style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        <h2 style={{ fontSize: '0.95rem', fontWeight: 800, color: '#0f172a', margin: 0, display: 'flex', alignItems: 'center', gap: '6px' }}>
          <CheckCircle2 size={18} color="#16a34a" />
          <span>{t('dashboard.completedRegister')} ({filteredCompletedBoris.length})</span>
        </h2>

        {filteredCompletedBoris.length === 0 ? (
          <div style={{ backgroundColor: '#ffffff', border: '1.5px solid #cbd5e1', borderRadius: '0.85rem', padding: '1.25rem', textAlign: 'center', color: '#64748b', fontSize: '0.85rem', fontWeight: 600 }}>
            {t('dashboard.noCompleted')}
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {filteredCompletedBoris.map((b) => (
              <div
                key={b.id}
                style={{
                  backgroundColor: '#ffffff',
                  border: '1.5px solid #e2e8f0',
                  borderRadius: '0.75rem',
                  padding: '12px 14px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}
              >
                <div>
                  <div
                    onClick={() => handleCustomerClick(b.customerId, b.customerName)}
                    style={{ fontSize: '0.92rem', fontWeight: 700, color: '#0f172a', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}
                  >
                    <span>{b.customerName}</span>
                    {b.customerVillage && (
                      <span style={{ fontSize: '0.7rem', color: '#64748b', fontWeight: 600 }}>
                        ({b.customerVillage})
                      </span>
                    )}
                  </div>
                  <div style={{ fontSize: '0.78rem', color: '#475569', fontWeight: 500, display: 'flex', alignItems: 'center', gap: '4px', flexWrap: 'wrap', marginTop: '2px' }}>
                    <span style={{ fontVariantNumeric: 'tabular-nums', fontWeight: 700 }}>{b.inputWeight} kg</span>
                    <span>{b.grainType}</span>
                    {b.outputType && <span style={{ fontWeight: 700, color: '#d97706' }}>[{b.outputType}]</span>}
                    <span>• {b.date || getRelativeTime(b.doneDate || b.createdAt)}</span>
                  </div>
                </div>

                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '0.95rem', fontWeight: 800, color: '#0f172a', fontVariantNumeric: 'tabular-nums' }}>
                    ₹ {b.amount}
                  </div>

                  {/* Payment Mode Chip */}
                  <div style={{ marginTop: '2px' }}>
                    {b.paymentMode === 'credit' ? (
                      <span style={{
                        fontSize: '0.7rem',
                        fontWeight: 800,
                        padding: '2px 7px',
                        borderRadius: '9999px',
                        backgroundColor: '#fee2e2',
                        color: '#b91c1c',
                        border: '1px solid #fecdd3',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '3px'
                      }}>
                        <AlertCircle size={10} />
                        {t('common.udhar')}
                      </span>
                    ) : (
                      <span style={{
                        fontSize: '0.7rem',
                        fontWeight: 800,
                        padding: '2px 7px',
                        borderRadius: '9999px',
                        backgroundColor: '#dcfce7',
                        color: '#15803d',
                        border: '1px solid #bbf7d0',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '3px'
                      }}>
                        <CheckCircle2 size={10} />
                        {t('common.paid')}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
