import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

const initialShopState = {
  id: 'shop_default_1',
  name: 'Vanshu Atta Chakki & Oil Mill',
  address: 'Main Market Road, Ward 4',
  phone: '9876543210',
  ownerName: 'Bhaiya',
  rates: {
    pisai: 4,      /* ₹4/kg wheat grinding */
    pirai: 12,     /* ₹12/kg mustard oil pressing */
    khari: 35,     /* ₹35/kg mustard cake selling */
    dana: 5        /* ₹5/kg pulse grinding */
  }
};

const initialCustomers = [
  { id: 'c1', name: 'Ramesh Kumar', phone: '9812345678', balance: 240, shopId: 'shop_default_1', notes: 'Gali No 2' },
  { id: 'c2', name: 'Suresh Sharma', phone: '9823456789', balance: 0, shopId: 'shop_default_1', notes: 'Hotel owner' },
  { id: 'c3', name: 'Sunita Devi', phone: '9834567890', balance: 110, shopId: 'shop_default_1', notes: '' },
];

const initialTransactions = [
  {
    id: 't1',
    shopId: 'shop_default_1',
    customerId: 'c1',
    customerName: 'Ramesh Kumar',
    type: 'pisai',
    grainType: 'Wheat (Gehun)',
    weight: 50,
    rate: 4,
    amount: 200,
    paymentMode: 'credit',
    date: new Date(Date.now() - 3600000 * 2).toISOString(),
    notes: 'Aata Medium Pisai'
  },
  {
    id: 't2',
    shopId: 'shop_default_1',
    customerId: 'c2',
    customerName: 'Suresh Sharma',
    type: 'pirai',
    grainType: 'Mustard (Sarson)',
    weight: 20,
    rate: 12,
    amount: 240,
    paymentMode: 'cash',
    date: new Date(Date.now() - 3600000 * 5).toISOString(),
    notes: '20kg Sarson pirai -> 6.5L tel output'
  },
  {
    id: 't3',
    shopId: 'shop_default_1',
    customerId: 'c3',
    customerName: 'Sunita Devi',
    type: 'khari_sale',
    weight: 5,
    rate: 35,
    amount: 175,
    paymentMode: 'credit',
    date: new Date(Date.now() - 3600000 * 24).toISOString(),
    notes: 'Khali for cows'
  }
];

const initialInventory = [
  { id: 'inv1', shopId: 'shop_default_1', name: 'Mustard Seeds (Sarson)', category: 'seed', stock: 450, unit: 'kg', lowAlert: 100 },
  { id: 'inv2', shopId: 'shop_default_1', name: 'Mustard Oil (Sarson Tel)', category: 'oil', stock: 120, unit: 'litre', lowAlert: 30 },
  { id: 'inv3', shopId: 'shop_default_1', name: 'Mustard Cake (Khari/Khali)', category: 'khari', stock: 280, unit: 'kg', lowAlert: 50 },
];

const initialExpenses = [
  { id: 'e1', shopId: 'shop_default_1', category: 'Electricity', amount: 1500, description: 'Chakki Power Bill', date: new Date().toISOString() },
  { id: 'e2', shopId: 'shop_default_1', category: 'Maintenance', amount: 350, description: 'Belt Replacement', date: new Date(Date.now() - 86400000 * 2).toISOString() }
];

export const useStore = create(
  persist(
    (set, get) => ({
      shop: initialShopState,
      customers: initialCustomers,
      transactions: initialTransactions,
      inventory: initialInventory,
      expenses: initialExpenses,
      user: { name: 'Owner', role: 'owner', shopId: 'shop_default_1' },
      theme: 'light',
      activeMode: 'all', // 'all' | 'atta' | 'sarson'

      // Actions
      setTheme: (theme) => set({ theme }),
      setActiveMode: (mode) => set({ activeMode: mode }),

      updateShopRates: (newRates) => set((state) => ({
        shop: { ...state.shop, rates: { ...state.shop.rates, ...newRates } }
      })),

      addCustomer: (customer) => {
        const newC = {
          id: `c_${Date.now()}`,
          shopId: get().shop.id,
          balance: 0,
          ...customer
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

      addTransaction: (txn) => {
        const id = `t_${Date.now()}`;
        const newTxn = {
          id,
          shopId: get().shop.id,
          date: new Date().toISOString(),
          ...txn
        };

        // If payment mode is credit (udhar), increase customer balance
        if (txn.paymentMode === 'credit' && txn.customerId) {
          get().updateCustomerBalance(txn.customerId, txn.amount);
        }

        // If payment mode is payment received against khata, decrease customer balance
        if (txn.type === 'payment' && txn.customerId) {
          get().updateCustomerBalance(txn.customerId, -txn.amount);
        }

        set((state) => ({ transactions: [newTxn, ...state.transactions] }));
        return newTxn;
      },

      addExpense: (expense) => {
        const newExp = {
          id: `e_${Date.now()}`,
          shopId: get().shop.id,
          date: new Date().toISOString(),
          ...expense
        };
        set((state) => ({ expenses: [newExp, ...state.expenses] }));
      },

      updateStock: (itemId, deltaQty) => {
        set((state) => ({
          inventory: state.inventory.map((inv) =>
            inv.id === itemId ? { ...inv, stock: Math.max(0, inv.stock + deltaQty) } : inv
          )
        }));
      }
    }),
    {
      name: 'chakkibook-store-v1',
      storage: createJSONStorage(() => localStorage),
    }
  )
);
