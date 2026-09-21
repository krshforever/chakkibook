import { create } from 'zustand';
import { useSettingsStore } from './settings/useSettingsStore';
import { useDashboardStore } from './dashboard/useDashboardStore';
import { useKhataStore } from './khata/useKhataStore';
import { useStockStore } from './stock/useStockStore';
import { useAIStore } from './ai/useAIStore';

export { useSettingsStore } from './settings/useSettingsStore';
export { useDashboardStore } from './dashboard/useDashboardStore';
export { useKhataStore } from './khata/useKhataStore';
export { useStockStore } from './stock/useStockStore';
export { useAIStore } from './ai/useAIStore';

// Unified Store Facade to ensure full compatibility across components
export const useStore = create((set, get) => ({
  // Settings & Multi-Mill Location Slice
  get activeMode() { return useSettingsStore.getState().activeMode; },
  get theme() { return useSettingsStore.getState().theme; },
  get language() { return useSettingsStore.getState().language; },
  get currentUser() { return useSettingsStore.getState().currentUser; },
  get userRole() { return useSettingsStore.getState().userRole; },
  get shopId() { return useSettingsStore.getState().shopId; },
  get shop() { return useSettingsStore.getState().shop; },
  get members() { return useSettingsStore.getState().members; },
  get mills() { return useSettingsStore.getState().mills; },
  get activeMillId() { return useSettingsStore.getState().activeMillId; },
  switchMill: (id) => useSettingsStore.getState().switchMill(id),
  addMill: (m) => useSettingsStore.getState().addMill(m),
  setLanguage: (lang) => useSettingsStore.getState().setLanguage(lang),
  setActiveMode: (mode) => useSettingsStore.getState().setActiveMode(mode),
  setTheme: (theme) => useSettingsStore.getState().setTheme(theme),
  setAuthUser: (...args) => useSettingsStore.getState().setAuthUser(...args),
  logout: () => useSettingsStore.getState().logout(),
  updateShopRates: (rates) => useSettingsStore.getState().updateShopRates(rates),
  updateShopInfo: (info) => useSettingsStore.getState().updateShopInfo(info),
  updateSmsSettings: (settings) => useSettingsStore.getState().updateSmsSettings(settings),
  addTeamMember: (...args) => useSettingsStore.getState().addTeamMember(...args),
  removeTeamMember: (...args) => useSettingsStore.getState().removeTeamMember(...args),
  hasPermission: (action) => useSettingsStore.getState().hasPermission(action),
  getGrainSettings: (key) => useSettingsStore.getState().getGrainSettings(key),

  // Dashboard Slice
  get boris() { return useDashboardStore.getState().boris; },
  get selectedVillage() { return useDashboardStore.getState().selectedVillage; },
  get dateFilter() { return useDashboardStore.getState().dateFilter; },
  get searchQuery() { return useDashboardStore.getState().searchQuery; },
  setSelectedVillage: (v) => useDashboardStore.getState().setSelectedVillage(v),
  setDateFilter: (f) => useDashboardStore.getState().setDateFilter(f),
  setSearchQuery: (q) => useDashboardStore.getState().setSearchQuery(q),
  addBori: (data) => useDashboardStore.getState().addBori(data, useSettingsStore.getState().shopId, useSettingsStore.getState().shop.name),
  markBoriDone: (id) => useDashboardStore.getState().markBoriDone(id, useSettingsStore.getState().shopId, useSettingsStore.getState().shop.name),
  markBoriPickedUp: (id) => useDashboardStore.getState().markBoriPickedUp(id, useSettingsStore.getState().shopId, useSettingsStore.getState().shop.name),

  // Khata Slice
  get customers() { return useKhataStore.getState().customers; },
  get selectedCustomer() { return useKhataStore.getState().selectedCustomer; },
  setSelectedCustomer: (c) => useKhataStore.getState().setSelectedCustomer(c),
  clearSelectedCustomer: () => useKhataStore.getState().clearSelectedCustomer(),
  addCustomer: (data) => useKhataStore.getState().addCustomer(data, useSettingsStore.getState().shopId),
  updateCustomerBalance: (id, delta) => useKhataStore.getState().updateCustomerBalance(id, delta, useSettingsStore.getState().shopId),

  // Stock, Expenses, & Vendors Slice
  get inventory() { return useStockStore.getState().inventory; },
  get stockEntries() { return useStockStore.getState().stockEntries; },
  get machineLogs() { return useStockStore.getState().machineLogs; },
  get expenses() { return useStockStore.getState().expenses; },
  get vendors() { return useStockStore.getState().vendors; },
  getValuation: () => useStockStore.getState().getValuation(),
  getLowStockAlerts: () => useStockStore.getState().getLowStockAlerts(),
  addStockEntry: (entry) => useStockStore.getState().addStockEntry(entry),
  updateStock: (id, delta) => useStockStore.getState().updateStock(id, delta, useSettingsStore.getState().shopId),
  addExpense: (e) => useStockStore.getState().addExpense(e),
  getProfitLoss: (rev) => useStockStore.getState().getProfitLoss(rev),
  addVendor: (v) => useStockStore.getState().addVendor(v),

  // AI Slice
  get isAISheetOpen() { return useAIStore.getState().isAISheetOpen; },
  get isVoiceListening() { return useAIStore.getState().isVoiceListening; },
  get chatHistory() { return useAIStore.getState().chatHistory; },
  toggleAISheet: () => useAIStore.getState().toggleAISheet(),
  openAISheet: () => useAIStore.getState().openAISheet(),
  closeAISheet: () => useAIStore.getState().closeAISheet(),
  setVoiceListening: (l) => useAIStore.getState().setVoiceListening(l),
  addChatMessage: (msg) => useAIStore.getState().addChatMessage(msg),

  // Helper Village Directory Stats
  getVillages: () => {
    const customers = useKhataStore.getState().customers || [];
    const boris = useDashboardStore.getState().boris || [];
    const activeMode = useSettingsStore.getState().activeMode || 'chakki';
    const villageMap = new Map();

    customers.forEach((c) => {
      if (!c) return;
      const v = String(c.village || '').trim();
      if (!v) return;
      if (!villageMap.has(v)) {
        villageMap.set(v, { name: v, customerCount: 0, pendingCount: 0, totalDues: 0 });
      }
      const item = villageMap.get(v);
      item.customerCount += 1;
      item.totalDues += (Number(c.balance || 0) > 0 ? Number(c.balance) : 0);
    });

    boris.forEach((b) => {
      if (b && b.status === 'pending' && b.mode === activeMode) {
        let v = String(b.customerVillage || '').trim();
        if (!v && b.customerId) {
          const cust = customers.find(c => c && String(c.id) === String(b.customerId));
          if (cust && cust.village) v = String(cust.village).trim();
        }
        if (v) {
          if (!villageMap.has(v)) {
            villageMap.set(v, { name: v, customerCount: 0, pendingCount: 0, totalDues: 0 });
          }
          villageMap.get(v).pendingCount += 1;
        }
      }
    });

    return Array.from(villageMap.values()).sort((a, b) => String(a.name || '').localeCompare(String(b.name || '')));
  },

  getVillageStats: (villageName) => {
    const customers = useKhataStore.getState().customers || [];
    const boris = useDashboardStore.getState().boris || [];
    const activeMode = useSettingsStore.getState().activeMode || 'chakki';

    if (!villageName || villageName === 'all') {
      const totalDues = customers.reduce((sum, c) => sum + (c.balance > 0 ? c.balance : 0), 0);
      const pendingBoris = boris.filter(b => b.status === 'pending' && b.mode === activeMode).length;
      return { customerCount: customers.length, totalDues, pendingBoris };
    }

    const targetV = villageName.trim().toLowerCase();
    const vCustomers = customers.filter(c => (c.village || '').trim().toLowerCase() === targetV);
    const totalDues = vCustomers.reduce((sum, c) => sum + (c.balance > 0 ? c.balance : 0), 0);

    const pendingBoris = boris.filter(b => {
      if (b.status !== 'pending' || b.mode !== activeMode) return false;
      const bV = (b.customerVillage || '').trim().toLowerCase();
      if (bV) return bV === targetV;
      const cust = customers.find(c => c.id === b.customerId);
      return (cust?.village || '').trim().toLowerCase() === targetV;
    }).length;

    return { customerCount: vCustomers.length, totalDues, pendingBoris };
  },

  exportBackupJSON: () => {
    return JSON.stringify({
      version: 'V2.0-ENTERPRISE',
      exportDate: new Date().toISOString(),
      shop: useSettingsStore.getState().shop,
      mills: useSettingsStore.getState().mills,
      customers: useKhataStore.getState().customers,
      boris: useDashboardStore.getState().boris,
      inventory: useStockStore.getState().inventory,
      stockEntries: useStockStore.getState().stockEntries,
      expenses: useStockStore.getState().expenses,
      vendors: useStockStore.getState().vendors,
      machineLogs: useStockStore.getState().machineLogs
    }, null, 2);
  }
}));
