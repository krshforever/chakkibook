import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

const initialShopState = {
  id: 'shop_default_1',
  name: 'Vanshu Atta Chakki & Oil Mill',
  address: 'Main Market Road, Ward 4',
  phone: '9876543210',
  ownerName: 'Bhaiya',
  chakkiRates: {
    pisai: 4,          // ₹/kg grinding charge
    kadda: {           // flour deduction per grain type
      wheat: 1,        // 1kg kadda per 40kg
      dana: 1.5,       // 1.5kg kadda per 40kg
      maize: 1,        // 1kg kadda per 40kg
    },
    kaddaPer: 40,      // kadda is per X kg (default 40kg = 1 Mann)
  },
  spellarRates: {
    pirai: 12,         // ₹/kg pressing charge
    khari: 35,         // ₹/kg khali selling rate
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
  // Pending Boris (Queue)
  {
    id: 'b_pend_1',
    shopId: 'shop_default_1',
    customerId: 'c1',
    customerName: 'Ramesh Kumar',
    mode: 'chakki',
    type: 'pisai',
    status: 'pending',
    dropOffDate: threeDaysAgoISO,
    doneDate: null,
    pickupDate: null,
    grainType: 'Wheat',
    inputWeight: 50,
    kaddaDeducted: 1.25,
    outputWeight: 48.75,
    oilOutput: 0,
    khaliOutput: 0,
    rate: 4,
    amount: 200,
    paymentMode: 'credit',
    notes: 'Fine grind',
    createdAt: threeDaysAgoISO,
  },
  {
    id: 'b_pend_2',
    shopId: 'shop_default_1',
    customerId: 'c2',
    customerName: 'Sunita Devi',
    mode: 'chakki',
    type: 'pisai',
    status: 'pending',
    dropOffDate: todayISO,
    doneDate: null,
    pickupDate: null,
    grainType: 'Dana',
    inputWeight: 40,
    kaddaDeducted: 1.5,
    outputWeight: 38.5,
    oilOutput: 0,
    khaliOutput: 0,
    rate: 4,
    amount: 160,
    paymentMode: 'credit',
    notes: 'Aaj subah aayi',
    createdAt: todayISO,
  },
  {
    id: 'b_pend_3',
    shopId: 'shop_default_1',
    customerId: 'c3',
    customerName: 'Geeta Devi',
    mode: 'chakki',
    type: 'pisai',
    status: 'pending',
    dropOffDate: yesterdayISO,
    doneDate: null,
    pickupDate: null,
    grainType: 'Maize',
    inputWeight: 35,
    kaddaDeducted: 0.88,
    outputWeight: 34.12,
    oilOutput: 0,
    khaliOutput: 0,
    rate: 4,
    amount: 140,
    paymentMode: 'cash',
    notes: 'Makka mota daliya',
    createdAt: yesterdayISO,
  },
  // Today's Completed Boris
  {
    id: 'b_done_1',
    shopId: 'shop_default_1',
    customerId: 'c5',
    customerName: 'Suresh Sharma',
    mode: 'chakki',
    type: 'pisai',
    status: 'done',
    dropOffDate: todayISO,
    doneDate: todayISO,
    pickupDate: null,
    grainType: 'Wheat',
    inputWeight: 60,
    kaddaDeducted: 1.5,
    outputWeight: 58.5,
    oilOutput: 0,
    khaliOutput: 0,
    rate: 4,
    amount: 240,
    paymentMode: 'cash',
    notes: '',
    createdAt: todayISO,
  },
  {
    id: 'b_done_2',
    shopId: 'shop_default_1',
    customerId: 'c4',
    customerName: 'Mohan Lal',
    mode: 'chakki',
    type: 'pisai',
    status: 'done',
    dropOffDate: todayISO,
    doneDate: todayISO,
    pickupDate: null,
    grainType: 'Dana',
    inputWeight: 40,
    kaddaDeducted: 1.5,
    outputWeight: 38.5,
    oilOutput: 0,
    khaliOutput: 0,
    rate: 4,
    amount: 160,
    paymentMode: 'credit',
    notes: '',
    createdAt: todayISO,
  },
  {
    id: 'b_done_3',
    shopId: 'shop_default_1',
    customerId: 'c3',
    customerName: 'Geeta Devi',
    mode: 'chakki',
    type: 'pisai',
    status: 'done',
    dropOffDate: todayISO,
    doneDate: todayISO,
    pickupDate: null,
    grainType: 'Wheat',
    inputWeight: 80,
    kaddaDeducted: 2.0,
    outputWeight: 78.0,
    oilOutput: 0,
    khaliOutput: 0,
    rate: 4,
    amount: 320,
    paymentMode: 'credit',
    notes: '',
    createdAt: todayISO,
  },
  {
    id: 'b_done_4',
    shopId: 'shop_default_1',
    customerId: 'c5',
    customerName: 'Suresh Sharma',
    mode: 'spellar',
    type: 'pirai',
    status: 'done',
    dropOffDate: todayISO,
    doneDate: todayISO,
    pickupDate: todayISO,
    grainType: 'Sarson',
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
  },
  // Khata Historical Statements
  {
    id: 'b_hist_1',
    shopId: 'shop_default_1',
    customerId: 'c1',
    customerName: 'Ramesh Kumar',
    mode: 'chakki',
    type: 'pisai',
    status: 'done',
    dropOffDate: fiveDaysAgoISO,
    doneDate: fiveDaysAgoISO,
    pickupDate: fiveDaysAgoISO,
    grainType: 'Wheat',
    inputWeight: 50,
    kaddaDeducted: 1.25,
    outputWeight: 48.75,
    rate: 4,
    amount: 200,
    paymentMode: 'credit',
    notes: '',
    createdAt: fiveDaysAgoISO,
  },
  {
    id: 'b_hist_2',
    shopId: 'shop_default_1',
    customerId: 'c1',
    customerName: 'Ramesh Kumar',
    mode: 'chakki',
    type: 'pisai',
    status: 'done',
    dropOffDate: new Date(Date.now() - 86400000 * 8).toISOString(),
    doneDate: new Date(Date.now() - 86400000 * 8).toISOString(),
    pickupDate: new Date(Date.now() - 86400000 * 8).toISOString(),
    grainType: 'Wheat',
    inputWeight: 40,
    kaddaDeducted: 1.0,
    outputWeight: 39.0,
    rate: 4,
    amount: 160,
    paymentMode: 'credit',
    notes: '',
    createdAt: new Date(Date.now() - 86400000 * 8).toISOString(),
  },
  {
    id: 'b_hist_3',
    shopId: 'shop_default_1',
    customerId: 'c1',
    customerName: 'Ramesh Kumar',
    mode: 'chakki',
    type: 'payment',
    status: 'done',
    dropOffDate: tenDaysAgoISO,
    doneDate: tenDaysAgoISO,
    pickupDate: null,
    grainType: '',
    inputWeight: 0,
    kaddaDeducted: 0,
    outputWeight: 0,
    rate: 0,
    amount: 120,
    paymentMode: 'cash',
    notes: 'Jama cash payment',
    createdAt: tenDaysAgoISO,
  },
  {
    id: 'b_hist_4',
    shopId: 'shop_default_1',
    customerId: 'c1',
    customerName: 'Ramesh Kumar',
    mode: 'chakki',
    type: 'pisai',
    status: 'done',
    dropOffDate: new Date(Date.now() - 86400000 * 12).toISOString(),
    doneDate: new Date(Date.now() - 86400000 * 12).toISOString(),
    pickupDate: new Date(Date.now() - 86400000 * 12).toISOString(),
    grainType: 'Dana',
    inputWeight: 30,
    kaddaDeducted: 1.12,
    outputWeight: 28.88,
    rate: 5,
    amount: 150,
    paymentMode: 'credit',
    notes: '',
    createdAt: new Date(Date.now() - 86400000 * 12).toISOString(),
  },
  {
    id: 'b_hist_5',
    shopId: 'shop_default_1',
    customerId: 'c1',
    customerName: 'Ramesh Kumar',
    mode: 'spellar',
    type: 'pirai',
    status: 'done',
    dropOffDate: new Date(Date.now() - 86400000 * 15).toISOString(),
    doneDate: new Date(Date.now() - 86400000 * 15).toISOString(),
    pickupDate: new Date(Date.now() - 86400000 * 15).toISOString(),
    grainType: 'Sarson',
    inputWeight: 70,
    kaddaDeducted: 0,
    outputWeight: 0,
    oilOutput: 23,
    khaliOutput: 44,
    rate: 12,
    amount: 840,
    paymentMode: 'credit',
    notes: '70kg Sarson pirai',
    createdAt: new Date(Date.now() - 86400000 * 15).toISOString(),
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
  },
  {
    id: 'st_3',
    type: 'khari_sale',
    item: 'Khali / Cake',
    weight: 50,
    unit: 'kg',
    rate: 35,
    amount: 1750,
    date: todayISO,
    notes: 'Direct farm buyer'
  }
];

const initialInventory = [
  { id: 'inv1', shopId: 'shop_default_1', name: 'Sarson Seeds (Mustard)', category: 'seed', stock: 450, unit: 'kg', lowAlert: 100 },
  { id: 'inv2', shopId: 'shop_default_1', name: 'Mustard Oil (Sarson Tel)', category: 'oil', stock: 120, unit: 'litre', lowAlert: 30 },
  { id: 'inv3', shopId: 'shop_default_1', name: 'Khali / Mustard Cake', category: 'khari', stock: 280, unit: 'kg', lowAlert: 50 },
];

const initialExpenses = [
  { id: 'e1', shopId: 'shop_default_1', category: 'Electricity', amount: 1500, description: 'Chakki Power Bill', date: todayISO },
  { id: 'e2', shopId: 'shop_default_1', category: 'Maintenance', amount: 350, description: 'Belt Replacement', date: yesterdayISO }
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

// Initial setup
setDomMode('chakki');
setDomTheme('light');

export const useStore = create(
  persist(
    (set, get) => ({
      activeMode: 'chakki', // 'chakki' | 'spellar'
      theme: 'light',
      shop: initialShopState,
      customers: initialCustomers,
      boris: initialBoris,
      stockEntries: initialStockEntries,
      inventory: initialInventory,
      expenses: initialExpenses,

      // Actions
      setActiveMode: (mode) => {
        setDomMode(mode);
        set({ activeMode: mode });
      },

      setTheme: (theme) => {
        setDomTheme(theme);
        set({ theme });
      },

      updateShopRates: (newRates) => {
        set((state) => ({
          shop: {
            ...state.shop,
            chakkiRates: {
              ...state.shop.chakkiRates,
              ...(newRates.chakkiRates || {})
            },
            spellarRates: {
              ...state.shop.spellarRates,
              ...(newRates.spellarRates || {})
            }
          }
        }));
      },

      updateShopInfo: (info) => {
        set((state) => ({
          shop: {
            ...state.shop,
            ...info
          }
        }));
      },

      addCustomer: (customer) => {
        const newC = {
          id: `c_${Date.now()}`,
          shopId: get().shop.id,
          name: customer.name || '',
          phone: customer.phone || '',
          village: customer.village || '',
          balance: Number(customer.balance) || 0,
          notes: customer.notes || ''
        };
        set((state) => ({ customers: [newC, ...state.customers] }));
        return newC;
      },

      updateCustomerBalance: (customerId, deltaAmount) => {
        set((state) => ({
          customers: state.customers.map((c) =>
            c.id === customerId ? { ...c, balance: (c.balance || 0) + deltaAmount } : c
          )
        }));
      },

      addBori: (boriData) => {
        const id = `b_${Date.now()}`;
        const createdDate = new Date().toISOString();
        const newBori = {
          id,
          shopId: get().shop.id,
          createdAt: createdDate,
          dropOffDate: boriData.dropOffDate || createdDate,
          doneDate: boriData.status === 'done' ? (boriData.doneDate || createdDate) : null,
          pickupDate: boriData.pickupDate || null,
          mode: boriData.mode || get().activeMode,
          status: boriData.status || 'pending',
          ...boriData
        };

        // If payment mode is credit (udhar), add amount to customer dues
        if (newBori.paymentMode === 'credit' && newBori.customerId) {
          get().updateCustomerBalance(newBori.customerId, newBori.amount);
        }

        // If transaction is a payment received from customer against khata
        if (newBori.type === 'payment' && newBori.customerId) {
          get().updateCustomerBalance(newBori.customerId, -newBori.amount);
        }

        set((state) => ({ boris: [newBori, ...state.boris] }));
        return newBori;
      },

      markBoriDone: (boriId) => {
        const doneISO = new Date().toISOString();
        set((state) => {
          const updatedBoris = state.boris.map((b) => {
            if (b.id === boriId) {
              return {
                ...b,
                status: 'done',
                doneDate: doneISO
              };
            }
            return b;
          });
          return { boris: updatedBoris };
        });
      },

      markBoriPickedUp: (boriId) => {
        const pickupISO = new Date().toISOString();
        set((state) => {
          const updatedBoris = state.boris.map((b) => {
            if (b.id === boriId) {
              return {
                ...b,
                status: 'picked_up',
                pickupDate: pickupISO
              };
            }
            return b;
          });
          return { boris: updatedBoris };
        });
      },

      addStockEntry: (entry) => {
        const id = `st_${Date.now()}`;
        const newEntry = {
          id,
          date: new Date().toISOString(),
          ...entry
        };

        // Update inventory numbers based on entry type
        if (entry.type === 'purchase') {
          // adding raw seed stock
          get().updateStock('inv1', Number(entry.weight) || 0);
        } else if (entry.type === 'oil_sale') {
          // reducing oil stock
          get().updateStock('inv2', -(Number(entry.weight) || 0));
        } else if (entry.type === 'khari_sale') {
          // reducing khali stock
          get().updateStock('inv3', -(Number(entry.weight) || 0));
        }

        set((state) => ({ stockEntries: [newEntry, ...state.stockEntries] }));
        return newEntry;
      },

      updateStock: (itemId, deltaQty) => {
        set((state) => ({
          inventory: state.inventory.map((inv) =>
            inv.id === itemId ? { ...inv, stock: Math.max(0, Number(inv.stock) + Number(deltaQty)) } : inv
          )
        }));
      },

      addExpense: (expense) => {
        const newExp = {
          id: `e_${Date.now()}`,
          shopId: get().shop.id,
          date: new Date().toISOString(),
          ...expense
        };
        set((state) => ({ expenses: [newExp, ...state.expenses] }));
      }
    }),
    {
      name: 'chakkibook-store-v2',
      storage: createJSONStorage(() => localStorage),
      onRehydrateStorage: () => (state) => {
        if (state?.activeMode) {
          setDomMode(state.activeMode);
        }
        if (state?.theme) {
          setDomTheme(state.theme);
        }
      }
    }
  )
);
