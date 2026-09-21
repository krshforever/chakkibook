import { create } from 'zustand';
import { 
  addCustomerToFirestore, 
  updateCustomerInFirestore, 
  subscribeToCustomers 
} from '../../firebase/firestore';

const initialCustomers = [
  { id: 'c1', name: 'Ramesh Kumar', phone: '9812345678', village: 'Rampur', balance: 1240, shopId: 'shop_default_1', notes: 'Gali No 2' },
  { id: 'c2', name: 'Sunita Devi', phone: '9834567890', village: 'Rampur', balance: 890, shopId: 'shop_default_1', notes: '' },
  { id: 'c3', name: 'Geeta Devi', phone: '9856789012', village: 'Shiv Nagar', balance: 320, shopId: 'shop_default_1', notes: 'Near Temple' },
  { id: 'c4', name: 'Mohan Lal', phone: '9845678901', village: 'Kisan Basti', balance: 0, shopId: 'shop_default_1', notes: 'Clear account' },
  { id: 'c5', name: 'Suresh Sharma', phone: '9823456789', village: 'Shiv Nagar', balance: 0, shopId: 'shop_default_1', notes: 'Hotel owner' }
];

export const useKhataStore = create((set, get) => ({
  customers: initialCustomers,
  selectedCustomer: null,
  customerSearch: '',
  selectedVillageFilter: 'all',

  setSelectedCustomer: (customer) => set({ selectedCustomer: customer }),
  clearSelectedCustomer: () => set({ selectedCustomer: null }),
  setCustomerSearch: (query) => set({ customerSearch: query }),
  setSelectedVillageFilter: (v) => set({ selectedVillageFilter: v }),

  subscribeCustomers: (shopId) => {
    return subscribeToCustomers(shopId, (custData) => {
      if (custData && custData.length > 0) {
        set({ customers: custData });
      }
    });
  },

  addCustomer: async (customerData, shopId = 'shop_default_1') => {
    const newC = {
      id: `c_${Date.now()}`,
      shopId,
      name: customerData.name || '',
      phone: customerData.phone || '',
      village: customerData.village || '',
      balance: Number(customerData.balance) || 0,
      notes: customerData.notes || ''
    };

    set((state) => ({ customers: [newC, ...state.customers] }));

    try {
      await addCustomerToFirestore(shopId, newC);
    } catch (e) {
      console.warn('Firestore addCustomer error:', e);
    }

    return newC;
  },

  updateCustomerBalance: async (customerId, deltaAmount, shopId = 'shop_default_1') => {
    set((state) => {
      const updated = state.customers.map((c) => {
        if (c.id === customerId) {
          const newBal = (c.balance || 0) + deltaAmount;
          updateCustomerInFirestore(shopId, customerId, { balance: newBal }).catch((e) => console.warn(e));
          return { ...c, balance: newBal };
        }
        return c;
      });
      return { customers: updated };
    });
  }
}));
