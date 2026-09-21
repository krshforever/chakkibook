import { create } from 'zustand';
import { 
  updateInventoryItemInFirestore, 
  subscribeToInventory 
} from '../../firebase/firestore';

const now = new Date();
const todayISO = now.toISOString();
const yesterdayISO = new Date(Date.now() - 86400000 * 1).toISOString();

const initialInventory = [
  { id: 'inv1', shopId: 'shop_default_1', name: 'Sarson Seeds (Mustard)', category: 'seed', stock: 450, unit: 'kg', lowAlert: 100, avgCost: 55 },
  { id: 'inv2', shopId: 'shop_default_1', name: 'Mustard Oil (Sarson Tel)', category: 'oil', stock: 120, unit: 'litre', lowAlert: 30, avgCost: 140 },
  { id: 'inv3', shopId: 'shop_default_1', name: 'Khali / Mustard Cake', category: 'khari', stock: 280, unit: 'kg', lowAlert: 50, avgCost: 35 },
  { id: 'inv4', shopId: 'shop_default_1', name: 'Atta / Wheat Flour', category: 'flour', stock: 80, unit: 'kg', lowAlert: 40, avgCost: 30 }
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

const initialExpenses = [
  { id: 'e1', category: 'Bijli', amount: 1500, description: 'Chakki Power Bill', date: todayISO },
  { id: 'e2', category: 'Machine Repair', amount: 450, description: 'Stone dressing & belt tighten', date: yesterdayISO }
];

const initialVendors = [
  { id: 'v1', name: 'Alwar Seed Mandi Trader', phone: '9829012345', item: 'Sarson Seeds', balance: 0, city: 'Alwar' },
  { id: 'v2', name: 'Bharatpur Grain Wholesaler', phone: '9828054321', item: 'Gehun / Wheat', balance: 4500, city: 'Bharatpur' }
];

export const useStockStore = create((set, get) => ({
  inventory: initialInventory,
  stockEntries: initialStockEntries,
  expenses: initialExpenses,
  vendors: initialVendors,
  expenseCategories: ['Bijli', 'Machine Repair', 'Staff Salary', 'Transport', 'Other'],
  machineLogs: [
    { id: 'm1', date: todayISO, motorTemp: '42°C (Normal)', stoneWearPercent: 15, beltTension: 'OK', electricityUnits: 45, dieselLitres: 0, notes: 'Subah 8 baje stone cleaning ki' },
    { id: 'm2', date: yesterdayISO, motorTemp: '45°C (Warm)', stoneWearPercent: 14, beltTension: 'OK', electricityUnits: 52, dieselLitres: 5, notes: 'Light jane par diesel generator chalaya' }
  ],

  subscribeInventory: (shopId) => {
    return subscribeToInventory(shopId, (invData) => {
      if (invData && invData.length > 0) {
        set({ inventory: invData });
      }
    });
  },

  getValuation: () => {
    const inv = get().inventory || [];
    return inv.reduce((sum, item) => {
      const price = item.avgCost || (item.category === 'oil' ? 140 : item.category === 'seed' ? 55 : 35);
      return sum + (Number(item.stock || 0) * price);
    }, 0);
  },

  getLowStockAlerts: () => {
    const inv = get().inventory || [];
    return inv.filter((item) => Number(item.stock) <= Number(item.lowAlert || 0));
  },

  addStockEntry: (entry) => {
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

  updateStock: async (itemId, deltaQty, shopId = 'shop_default_1') => {
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
        await updateInventoryItemInFirestore(shopId, itemId, { stock: updatedItem.stock });
      } catch (e) {
        console.warn('Firestore updateStock error:', e);
      }
    }
  },

  // Expense & P&L Operations
  addExpense: (expense) => {
    const newE = {
      id: `e_${Date.now()}`,
      date: new Date().toISOString(),
      ...expense
    };
    set((state) => ({ expenses: [newE, ...state.expenses] }));
    return newE;
  },

  getProfitLoss: (totalRevenue = 0) => {
    const expenses = get().expenses || [];
    const totalExpenses = expenses.reduce((sum, e) => sum + (Number(e.amount) || 0), 0);
    const netProfit = totalRevenue - totalExpenses;
    const margin = totalRevenue > 0 ? ((netProfit / totalRevenue) * 100).toFixed(1) : 0;

    return {
      revenue: totalRevenue,
      totalExpenses,
      netProfit,
      margin
    };
  },

  // Vendor / Supplier Management
  addVendor: (vendor) => {
    const newV = {
      id: `v_${Date.now()}`,
      balance: 0,
      ...vendor
    };
    set((state) => ({ vendors: [newV, ...state.vendors] }));
    return newV;
  }
}));
