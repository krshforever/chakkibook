import { create } from 'zustand';
import { 
  subscribeToBoris, 
  subscribeToCustomers, 
  subscribeToInventory, 
  subscribeToMembers, 
  subscribeToShopConfig,
  addBoriToFirestore,
  updateBoriInFirestore,
  deleteBoriInFirestore,
  addCustomerToFirestore,
  updateCustomerInFirestore,
  saveShopConfigToFirestore,
  addMemberToFirestore,
  removeMemberFromFirestore,
  updateInventoryItemInFirestore,
  createShopDoc,
  getShopDoc
} from '../firebase/firestore';
import { sendBoriSMS } from '../services/sms';

const initialShopState = {
  id: 'shop_default_1',
  name: 'Vanshu Atta Chakki & Oil Mill',
  address: 'Main Market Road, Ward 4',
  phone: '9876543210',
  ownerName: 'Bhaiya',
  chakkiRates: {
    pisai: 4,          // ₹/kg grinding charge fallback
    grainRates: {      // ₹/kg per primary grain type
      gehun: 4,
      bajra: 4.5,
      makka: 4.5,
      chana: 5.5,
      multigrain: 5
    },
    kadda: {           // flour deduction per 40kg (1 Mann)
      gehun: 1,        // 1kg kadda per 40kg
      bajra: 1,        // 1kg kadda per 40kg
      makka: 1.25,     // 1.25kg kadda per 40kg
      chana: 1.5,      // 1.5kg kadda per 40kg
      wheat: 1,        // legacy alias
      dana: 1.5,       // legacy alias
      maize: 1.25,     // legacy alias
      multigrain: 1.25
    },
    kaddaPer: 40,      // kadda is per X kg (default 40kg = 1 Mann)
  },
  spellarRates: {
    pirai: 12,         // ₹/kg pressing charge
    khari: 35,         // ₹/kg khali selling rate
  },
  smsSettings: {
    enabled: true,
    onDropOff: true,
    onDone: true,
    onPickedUp: true
  },
  aiEnabled: false,
  aiFeatures: {
    dailySummary: false,
    demandPrediction: false,
    customerInsights: false
  }
};

const initialCustomers = [
  { id: 'c1', name: 'Ramesh Kumar', phone: '9812345678', village: 'Rampur', balance: 1240, shopId: 'shop_default_1', notes: 'Gali No 2' },
  { id: 'c2', name: 'Sunita Devi', phone: '9834567890', village: 'Rampur', balance: 890, shopId: 'shop_default_1', notes: '' },
  { id: 'c3', name: 'Geeta Devi', phone: '9856789012', village: 'Shiv Nagar', balance: 320, shopId: 'shop_default_1', notes: 'Near Temple' },
  { id: 'c4', name: 'Mohan Lal', phone: '9845678901', village: 'Kisan Basti', balance: 0, shopId: 'shop_default_1', notes: 'Clear account' },
  { id: 'c5', name: 'Suresh Sharma', phone: '9823456789', village: 'Shiv Nagar', balance: 0, shopId: 'shop_default_1', notes: 'Hotel owner' },
];

const now = new Date();
const todayISO = now.toISOString();
const threeDaysAgoISO = new Date(Date.now() - 86400000 * 3).toISOString();
const yesterdayISO = new Date(Date.now() - 86400000 * 1).toISOString();
const fiveDaysAgoISO = new Date(Date.now() - 86400000 * 5).toISOString();
const tenDaysAgoISO = new Date(Date.now() - 86400000 * 10).toISOString();

const initialBoris = [
  {
    id: 'b_pend_1',
    shopId: 'shop_default_1',
    customerId: 'c1',
    customerName: 'Ramesh Kumar',
    customerPhone: '9812345678',
    customerVillage: 'Rampur',
    mode: 'chakki',
    type: 'pisai',
    status: 'pending',
    dropOffDate: threeDaysAgoISO,
    doneDate: null,
    pickupDate: null,
    grainType: 'Gehun',
    outputType: 'Atta',
    inputWeight: 50,
    kaddaDeducted: 1.25,
    outputWeight: 48.75,
    oilOutput: 0,
    khaliOutput: 0,
    rate: 4,
    amount: 200,
    paymentMode: 'credit',
    notes: 'Barik atta',
    createdAt: threeDaysAgoISO,
    dayOfWeek: new Date(threeDaysAgoISO).getDay(),
    hourOfDay: 10,
    aiInsights: null,
    predictedPickup: null
  },
  {
    id: 'b_pend_2',
    shopId: 'shop_default_1',
    customerId: 'c2',
    customerName: 'Sunita Devi',
    customerPhone: '9834567890',
    customerVillage: 'Rampur',
    mode: 'chakki',
    type: 'pisai',
    status: 'pending',
    dropOffDate: todayISO,
    doneDate: null,
    pickupDate: null,
    grainType: 'Bajra',
    outputType: 'Dana',
    inputWeight: 40,
    kaddaDeducted: 1.0,
    outputWeight: 39.0,
    oilOutput: 0,
    khaliOutput: 0,
    rate: 4.5,
    amount: 180,
    paymentMode: 'credit',
    notes: 'Pashu daliya dana',
    createdAt: todayISO,
    dayOfWeek: now.getDay(),
    hourOfDay: 9,
    aiInsights: null,
    predictedPickup: null
  },
  {
    id: 'b_pend_3',
    shopId: 'shop_default_1',
    customerId: 'c3',
    customerName: 'Geeta Devi',
    customerPhone: '9856789012',
    customerVillage: 'Shiv Nagar',
    mode: 'chakki',
    type: 'pisai',
    status: 'pending',
    dropOffDate: yesterdayISO,
    doneDate: null,
    pickupDate: null,
    grainType: 'Makka',
    outputType: 'Mota Dana',
    inputWeight: 35,
    kaddaDeducted: 1.09,
    outputWeight: 33.91,
    oilOutput: 0,
    khaliOutput: 0,
    rate: 4.5,
    amount: 157.5,
    paymentMode: 'cash',
    notes: 'Makka mota daliya',
    createdAt: yesterdayISO,
    dayOfWeek: new Date(yesterdayISO).getDay(),
    hourOfDay: 14,
    aiInsights: null,
    predictedPickup: null
  },
  {
    id: 'b_done_1',
    shopId: 'shop_default_1',
    customerId: 'c5',
    customerName: 'Suresh Sharma',
    customerPhone: '9823456789',
    customerVillage: 'Shiv Nagar',
    mode: 'chakki',
    type: 'pisai',
    status: 'done',
    dropOffDate: todayISO,
    doneDate: todayISO,
    pickupDate: null,
    grainType: 'Gehun',
    outputType: 'Atta',
    inputWeight: 60,
    kaddaDeducted: 1.5,
    outputWeight: 58.5,
    oilOutput: 0,
    khaliOutput: 0,
    rate: 4,
    amount: 240,
    paymentMode: 'cash',
    notes: 'Hotel supply atta',
    createdAt: todayISO,
    dayOfWeek: now.getDay(),
    hourOfDay: 8,
    aiInsights: null,
    predictedPickup: null
  },
  {
    id: 'b_done_2',
    shopId: 'shop_default_1',
    customerId: 'c4',
    customerName: 'Mohan Lal',
    customerPhone: '9845678901',
    customerVillage: 'Kisan Basti',
    mode: 'spellar',
    type: 'pirai',
    status: 'done',
    dropOffDate: todayISO,
    doneDate: todayISO,
    pickupDate: todayISO,
    grainType: 'Sarson',
    outputType: 'Tel',
    inputWeight: 80,
    kaddaDeducted: 0,
    outputWeight: 0,
    oilOutput: 26,
    khaliOutput: 50,
    rate: 12,
    amount: 960,
    paymentMode: 'cash',
    notes: '80kg yellow sarson -> 26L pure oil',
    createdAt: todayISO,
    dayOfWeek: now.getDay(),
    hourOfDay: 11,
    aiInsights: null,
    predictedPickup: null
  }
];

const initialStockEntries = [
  {
    id: 'st_1',
    type: 'purchase',
    item: 'Sarson Seeds',
    weight: 500,
    unit: 'kg',
    rate: 55,
    amount: 27500,
    date: yesterdayISO,
    notes: 'Mandi purchase batch #12'
  },
  {
    id: 'st_2',
    type: 'oil_sale',
    item: 'Mustard Oil',
    weight: 15,
    unit: 'litre',
    rate: 140,
    amount: 2100,
    date: todayISO,
    notes: 'Loose oil sale'
  }
];

const initialInventory = [
  { id: 'inv1', shopId: 'shop_default_1', name: 'Sarson Seeds (Mustard)', category: 'seed', stock: 450, unit: 'kg', lowAlert: 100 },
  { id: 'inv2', shopId: 'shop_default_1', name: 'Mustard Oil (Sarson Tel)', category: 'oil', stock: 120, unit: 'litre', lowAlert: 30 },
  { id: 'inv3', shopId: 'shop_default_1', name: 'Khali / Mustard Cake', category: 'khari', stock: 280, unit: 'kg', lowAlert: 50 },
];

const initialExpenses = [
  { id: 'e1', shopId: 'shop_default_1', category: 'Electricity', amount: 1500, description: 'Chakki Power Bill', date: todayISO }
];

// Helper to set DOM data-mode attribute
const setDomMode = (mode) => {
  if (typeof document !== 'undefined' && document.documentElement) {
    document.documentElement.setAttribute('data-mode', mode || 'chakki');
  }
};

const setDomTheme = (theme) => {
  if (typeof document !== 'undefined' && document.documentElement) {
    document.documentElement.setAttribute('data-theme', theme || 'light');
  }
};

setDomMode('chakki');
setDomTheme('light');

// Subscriptions cleanup storage
let unsubscribers = [];

export const useStore = create((set, get) => ({
  activeMode: 'chakki', // 'chakki' | 'spellar'
  theme: 'light',
  currentUser: null,
  userRole: 'owner', // 'owner' | 'operator' | 'viewer'
  shopId: 'shop_default_1',
  shop: initialShopState,
  members: [],
  customers: initialCustomers,
  boris: initialBoris,
  stockEntries: initialStockEntries,
  inventory: initialInventory,
  expenses: initialExpenses,

  // Village State & Filter
  selectedVillage: 'all', // 'all' | string
  setSelectedVillage: (village) => set({ selectedVillage: village }),

  // Derived Village Directory with Metrics
  getVillages: () => {
    const customers = get().customers || [];
    const boris = get().boris || [];
    const villageMap = new Map();

    // Aggregate from customers
    customers.forEach((c) => {
      const v = (c.village || '').trim();
      if (!v) return;
      if (!villageMap.has(v)) {
        villageMap.set(v, { name: v, customerCount: 0, pendingCount: 0, totalDues: 0 });
      }
      const item = villageMap.get(v);
      item.customerCount += 1;
      item.totalDues += (c.balance > 0 ? c.balance : 0);
    });

    // Aggregate pending boris from current mode
    boris.forEach((b) => {
      if (b.status === 'pending' && b.mode === get().activeMode) {
        let v = (b.customerVillage || '').trim();
        if (!v && b.customerId) {
          const cust = customers.find(c => c.id === b.customerId);
          if (cust && cust.village) v = cust.village.trim();
        }
        if (v) {
          if (!villageMap.has(v)) {
            villageMap.set(v, { name: v, customerCount: 0, pendingCount: 0, totalDues: 0 });
          }
          villageMap.get(v).pendingCount += 1;
        }
      }
    });

    return Array.from(villageMap.values()).sort((a, b) => a.name.localeCompare(b.name));
  },

  // Village Stats Calculator Helper
  getVillageStats: (villageName) => {
    const customers = get().customers || [];
    const boris = get().boris || [];
    const activeMode = get().activeMode;

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

  // Grain Setting Lookup Helper
  getGrainSettings: (grainKey) => {
    const key = (grainKey || 'gehun').toLowerCase();
    const chakkiRates = get().shop.chakkiRates || {};
    
    // Map aliases
    const normalizedKey = 
      key === 'wheat' ? 'gehun' :
      key === 'maize' ? 'makka' :
      key;

    const rate = chakkiRates.grainRates?.[normalizedKey] ?? chakkiRates.pisai ?? 4;
    const kadda = chakkiRates.kadda?.[normalizedKey] ?? chakkiRates.kadda?.[key] ?? 1;
    const kaddaPer = chakkiRates.kaddaPer ?? 40;

    return { rate, kadda, kaddaPer };
  },

  // Permission Matrix Helper
  hasPermission: (action) => {
    const role = get().userRole || 'owner';
    
    // View actions allowed for everyone
    if (['viewDashboard', 'viewKhata', 'viewStock'].includes(action)) return true;

    // Operator & Owner write actions
    if (['addBori', 'markDone', 'addCustomer', 'collectPayment', 'adjustStock'].includes(action)) {
      return role === 'owner' || role === 'operator';
    }

    // Owner ONLY actions
    if (['changeRates', 'changeKadda', 'manageMembers', 'deleteEntries', 'exportBackup', 'smsSettings'].includes(action)) {
      return role === 'owner';
    }

    return role === 'owner';
  },

  // Auth & Shop Initialization
  setAuthUser: async (user, shopId = 'shop_default_1', role = 'owner') => {
    set({ currentUser: user, shopId, userRole: role });

    // Clean existing listeners
    unsubscribers.forEach(unsub => unsub && unsub());
    unsubscribers = [];

    if (shopId) {
      // Fetch shop details
      const shopDoc = await getShopDoc(shopId);
      if (shopDoc) {
        set((state) => ({ shop: { ...state.shop, ...shopDoc } }));
      }

      // Attach Firestore real-time snapshot listeners
      const unsubBoris = subscribeToBoris(shopId, (borisData) => {
        if (borisData && borisData.length > 0) set({ boris: borisData });
      });

      const unsubCust = subscribeToCustomers(shopId, (custData) => {
        if (custData && custData.length > 0) set({ customers: custData });
      });

      const unsubInv = subscribeToInventory(shopId, (invData) => {
        if (invData && invData.length > 0) set({ inventory: invData });
      });

      const unsubMemb = subscribeToMembers(shopId, (membData) => {
        set({ members: membData });
      });

      const unsubConf = subscribeToShopConfig(shopId, (configData) => {
        if (configData) {
          set((state) => ({
            shop: {
              ...state.shop,
              chakkiRates: configData.chakkiRates || state.shop.chakkiRates,
              spellarRates: configData.spellarRates || state.shop.spellarRates,
              smsSettings: configData.smsSettings || state.shop.smsSettings
            }
          }));
        }
      });

      unsubscribers.push(unsubBoris, unsubCust, unsubInv, unsubMemb, unsubConf);
    }
  },

  logout: () => {
    unsubscribers.forEach(unsub => unsub && unsub());
    unsubscribers = [];
    set({ currentUser: null, shopId: 'shop_default_1', userRole: 'owner' });
  },

  setActiveMode: (mode) => {
    setDomMode(mode);
    set({ activeMode: mode });
  },

  setTheme: (theme) => {
    setDomTheme(theme);
    set({ theme });
  },

  updateShopRates: async (newRates) => {
    if (!get().hasPermission('changeRates')) return;

    const updatedShop = {
      ...get().shop,
      chakkiRates: {
        ...get().shop.chakkiRates,
        ...(newRates.chakkiRates || {})
      },
      spellarRates: {
        ...get().shop.spellarRates,
        ...(newRates.spellarRates || {})
      }
    };

    set({ shop: updatedShop });

    // Sync to Firestore
    try {
      await saveShopConfigToFirestore(get().shopId, {
        chakkiRates: updatedShop.chakkiRates,
        spellarRates: updatedShop.spellarRates
      });
    } catch (e) {
      console.warn('Firestore rates update failed:', e);
    }
  },

  updateShopInfo: async (info) => {
    if (!get().hasPermission('changeRates')) return;

    set((state) => ({ shop: { ...state.shop, ...info } }));
    try {
      await createShopDoc(get().shopId, info);
    } catch (e) {
      console.warn('Firestore shop info update failed:', e);
    }
  },

  updateSmsSettings: async (smsSettings) => {
    if (!get().hasPermission('smsSettings')) return;

    const updated = { ...get().shop.smsSettings, ...smsSettings };
    set((state) => ({ shop: { ...state.shop, smsSettings: updated } }));

    try {
      await saveShopConfigToFirestore(get().shopId, { smsSettings: updated });
    } catch (e) {
      console.warn('Firestore SMS settings update failed:', e);
    }
  },

  addCustomer: async (customer) => {
    if (!get().hasPermission('addCustomer')) return null;

    const newC = {
      id: `c_${Date.now()}`,
      shopId: get().shopId,
      name: customer.name || '',
      phone: customer.phone || '',
      village: customer.village || '',
      balance: Number(customer.balance) || 0,
      notes: customer.notes || ''
    };

    set((state) => ({ customers: [newC, ...state.customers] }));

    try {
      await addCustomerToFirestore(get().shopId, newC);
    } catch (e) {
      console.warn('Firestore customer add failed:', e);
    }

    return newC;
  },

  updateCustomerBalance: async (customerId, deltaAmount) => {
    const updatedCustomers = get().customers.map((c) => {
      if (c.id === customerId) {
        const newBalance = (c.balance || 0) + deltaAmount;
        // Async update to Firestore
        updateCustomerInFirestore(get().shopId, customerId, { balance: newBalance }).catch(e => console.warn(e));
        return { ...c, balance: newBalance };
      }
      return c;
    });

    set({ customers: updatedCustomers });
  },

  addBori: async (boriData) => {
    if (!get().hasPermission('addBori')) return null;

    const id = `b_${Date.now()}`;
    const createdDate = new Date().toISOString();
    const curDate = new Date();

    // Resolve customer village snapshot
    const targetCust = get().customers.find(
      (c) => c.id === boriData.customerId || c.name === boriData.customerName
    );
    const customerVillage = (boriData.customerVillage || targetCust?.village || '').trim();

    const newBori = {
      id,
      shopId: get().shopId,
      createdAt: createdDate,
      createdBy: get().currentUser?.uid || 'local',
      dropOffDate: boriData.dropOffDate || createdDate,
      doneDate: boriData.status === 'done' ? (boriData.doneDate || createdDate) : null,
      pickupDate: boriData.pickupDate || null,
      mode: boriData.mode || get().activeMode,
      status: boriData.status || 'pending',
      customerPhone: boriData.customerPhone || '',
      customerVillage,
      grainType: boriData.grainType || 'Gehun',
      outputType: boriData.outputType || 'Atta',
      // Track 8: AI-ready & Analytics Fields
      dayOfWeek: curDate.getDay(),
      hourOfDay: curDate.getHours(),
      aiInsights: null,
      predictedPickup: null,
      qualityNotes: null,
      seasonTag: null,
      weatherContext: null,
      ...boriData
    };

    // Customer balance update for credit / payment
    if (newBori.paymentMode === 'credit' && newBori.customerId) {
      get().updateCustomerBalance(newBori.customerId, newBori.amount);
    }
    if (newBori.type === 'payment' && newBori.customerId) {
      get().updateCustomerBalance(newBori.customerId, -newBori.amount);
    }

    set((state) => ({ boris: [newBori, ...state.boris] }));

    // Send native SMS trigger
    const smsSettings = get().shop.smsSettings || {};
    sendBoriSMS(newBori.status === 'done' ? 'done' : 'dropOff', newBori, get().shop.name, smsSettings);

    // Sync to Firestore
    try {
      await addBoriToFirestore(get().shopId, newBori);
    } catch (e) {
      console.warn('Firestore bori add failed:', e);
    }

    return newBori;
  },

  markBoriDone: async (boriId) => {
    if (!get().hasPermission('markDone')) return;

    const doneISO = new Date().toISOString();
    let targetBori = null;

    set((state) => {
      const updatedBoris = state.boris.map((b) => {
        if (b.id === boriId) {
          targetBori = { ...b, status: 'done', doneDate: doneISO };
          return targetBori;
        }
        return b;
      });
      return { boris: updatedBoris };
    });

    if (targetBori) {
      const smsSettings = get().shop.smsSettings || {};
      sendBoriSMS('done', targetBori, get().shop.name, smsSettings);

      try {
        await updateBoriInFirestore(get().shopId, boriId, { status: 'done', doneDate: doneISO });
      } catch (e) {
        console.warn('Firestore bori markDone failed:', e);
      }
    }
  },

  markBoriPickedUp: async (boriId) => {
    if (!get().hasPermission('markDone')) return;

    const pickupISO = new Date().toISOString();
    let targetBori = null;

    set((state) => {
      const updatedBoris = state.boris.map((b) => {
        if (b.id === boriId) {
          targetBori = { ...b, status: 'picked_up', pickupDate: pickupISO };
          return targetBori;
        }
        return b;
      });
      return { boris: updatedBoris };
    });

    if (targetBori) {
      const smsSettings = get().shop.smsSettings || {};
      sendBoriSMS('pickedUp', targetBori, get().shop.name, smsSettings);

      try {
        await updateBoriInFirestore(get().shopId, boriId, { status: 'picked_up', pickupDate: pickupISO });
      } catch (e) {
        console.warn('Firestore bori markPickedUp failed:', e);
      }
    }
  },

  addStockEntry: (entry) => {
    if (!get().hasPermission('adjustStock')) return null;

    const id = `st_${Date.now()}`;
    const newEntry = {
      id,
      date: new Date().toISOString(),
      ...entry
    };

    if (entry.type === 'purchase') {
      get().updateStock('inv1', Number(entry.weight) || 0);
    } else if (entry.type === 'oil_sale') {
      get().updateStock('inv2', -(Number(entry.weight) || 0));
    } else if (entry.type === 'khari_sale') {
      get().updateStock('inv3', -(Number(entry.weight) || 0));
    }

    set((state) => ({ stockEntries: [newEntry, ...state.stockEntries] }));
    return newEntry;
  },

  updateStock: async (itemId, deltaQty) => {
    if (!get().hasPermission('adjustStock')) return;

    let updatedItem = null;
    set((state) => {
      const updatedInv = state.inventory.map((inv) => {
        if (inv.id === itemId) {
          updatedItem = { ...inv, stock: Math.max(0, Number(inv.stock) + Number(deltaQty)) };
          return updatedItem;
        }
        return inv;
      });
      return { inventory: updatedInv };
    });

    if (updatedItem) {
      try {
        await updateInventoryItemInFirestore(get().shopId, itemId, { stock: updatedItem.stock });
      } catch (e) {
        console.warn('Firestore stock update failed:', e);
      }
    }
  },

  addTeamMember: async (phone, name, role = 'operator') => {
    if (!get().hasPermission('manageMembers')) return;

    const newMember = {
      phone,
      name,
      role,
      addedBy: get().currentUser?.uid || 'owner'
    };

    try {
      const memberId = await addMemberToFirestore(get().shopId, newMember);
      set((state) => ({ members: [...state.members, { id: memberId, ...newMember }] }));
    } catch (e) {
      console.warn('Failed to add team member:', e);
    }
  },

  removeTeamMember: async (memberId) => {
    if (!get().hasPermission('manageMembers')) return;

    set((state) => ({ members: state.members.filter(m => m.id !== memberId) }));
    try {
      await removeMemberFromFirestore(get().shopId, memberId);
    } catch (e) {
      console.warn('Failed to remove team member:', e);
    }
  },

  machineLogs: [
    { id: 'm1', date: todayISO, motorTemp: '42°C (Normal)', stoneWearPercent: 15, beltTension: 'OK', electricityUnits: 45, dieselLitres: 0, notes: 'Subah 8 baje stone cleaning ki' },
    { id: 'm2', date: yesterdayISO, motorTemp: '45°C (Warm)', stoneWearPercent: 14, beltTension: 'OK', electricityUnits: 52, dieselLitres: 5, notes: 'Light jane par diesel generator chalaya' }
  ],

  // Backup & Restore Utilities
  exportBackupJSON: () => {
    const data = {
      version: 'V4.0-ULTRA',
      exportDate: new Date().toISOString(),
      shop: get().shop,
      customers: get().customers,
      boris: get().boris,
      inventory: get().inventory,
      stockEntries: get().stockEntries,
      expenses: get().expenses,
      machineLogs: get().machineLogs
    };
    return JSON.stringify(data, null, 2);
  },

  restoreBackupJSON: (jsonString) => {
    try {
      const data = JSON.parse(jsonString);
      if (data.customers) set({ customers: data.customers });
      if (data.boris) set({ boris: data.boris });
      if (data.inventory) set({ inventory: data.inventory });
      if (data.stockEntries) set({ stockEntries: data.stockEntries });
      if (data.expenses) set({ expenses: data.expenses });
      if (data.machineLogs) set({ machineLogs: data.machineLogs });
      if (data.shop) set((state) => ({ shop: { ...state.shop, ...data.shop } }));
      return { success: true, message: 'Data successfully restored!' };
    } catch (e) {
      return { success: false, message: 'Invalid JSON backup file format.' };
    }
  },

  addInventoryItem: async (item) => {
    const newItem = {
      id: `inv_${Date.now()}`,
      shopId: get().shopId,
      name: item.name,
      category: item.category || 'other',
      stock: Number(item.stock) || 0,
      unit: item.unit || 'kg',
      lowAlert: Number(item.lowAlert) || 20,
      pricePerUnit: Number(item.pricePerUnit) || 0
    };
    set((state) => ({ inventory: [...state.inventory, newItem] }));
    return newItem;
  },

  addMachineLog: (log) => {
    const newLog = {
      id: `m_${Date.now()}`,
      date: new Date().toISOString(),
      ...log
    };
    set((state) => ({ machineLogs: [newLog, ...state.machineLogs] }));
    return newLog;
  },

  buildMarker: 'V4.0-ULTRA-BUILD-20260919-02',

  addExpense: (expense) => {
    const newExp = {
      id: `e_${Date.now()}`,
      shopId: get().shopId,
      date: new Date().toISOString(),
      ...expense
    };
    set((state) => ({ expenses: [newExp, ...state.expenses] }));
    return newExp;
  },

  deleteExpense: (expenseId) => {
    set((state) => ({ expenses: state.expenses.filter(e => e.id !== expenseId) }));
  }
}));
