import { create } from 'zustand';
import { 
  addBoriToFirestore, 
  updateBoriInFirestore, 
  subscribeToBoris 
} from '../../firebase/firestore';
import { sendBoriSMS } from '../../services/sms';

const now = new Date();
const todayISO = now.toISOString();
const yesterdayISO = new Date(Date.now() - 86400000 * 1).toISOString();
const threeDaysAgoISO = new Date(Date.now() - 86400000 * 3).toISOString();

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
    createdAt: threeDaysAgoISO
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
    createdAt: todayISO
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
    createdAt: yesterdayISO
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
    createdAt: todayISO
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
    createdAt: todayISO
  }
];

export const useDashboardStore = create((set, get) => ({
  boris: initialBoris,
  selectedVillage: 'all',
  dateFilter: 'aaj', // 'aaj' | 'kal' | 'hafta' | 'mahina'
  searchQuery: '',
  aiInsights: [
    { id: '1', title: 'Subah Peak Window', desc: '10:00 AM se 1:00 PM tak gehun pisai volume 40% high rehta hai.' },
    { id: '2', title: 'Udhar Warning', desc: 'Rampur village se 2 grahako ka Total ₹2,130 udhar 7 din se baki hai.' }
  ],

  setSelectedVillage: (village) => set({ selectedVillage: village }),
  setDateFilter: (filter) => set({ dateFilter: filter }),
  setSearchQuery: (query) => set({ searchQuery: query }),

  subscribeBoris: (shopId) => {
    return subscribeToBoris(shopId, (borisData) => {
      if (borisData && borisData.length > 0) {
        set({ boris: borisData });
      }
    });
  },

  addBori: async (boriData, shopId = 'shop_default_1', shopName = 'Vanshu Atta Chakki') => {
    const id = `b_${Date.now()}`;
    const createdDate = new Date().toISOString();

    const newBori = {
      id,
      shopId,
      createdAt: createdDate,
      dropOffDate: boriData.dropOffDate || createdDate,
      doneDate: boriData.status === 'done' ? (boriData.doneDate || createdDate) : null,
      pickupDate: boriData.pickupDate || null,
      mode: boriData.mode || 'chakki',
      status: boriData.status || 'pending',
      customerPhone: boriData.customerPhone || '',
      customerVillage: boriData.customerVillage || '',
      grainType: boriData.grainType || 'Gehun',
      outputType: boriData.outputType || 'Atta',
      ...boriData
    };

    set((state) => ({ boris: [newBori, ...state.boris] }));
    sendBoriSMS(newBori.status === 'done' ? 'done' : 'dropOff', newBori, shopName, { enabled: true });

    try {
      await addBoriToFirestore(shopId, newBori);
    } catch (e) {
      console.warn('Firestore addBori error:', e);
    }
    return newBori;
  },

  markBoriDone: async (boriId, shopId = 'shop_default_1', shopName = 'Vanshu Atta Chakki') => {
    const doneISO = new Date().toISOString();
    let target = null;

    set((state) => {
      const updatedBoris = state.boris.map((b) => {
        if (b.id === boriId) {
          target = { ...b, status: 'done', doneDate: doneISO };
          return target;
        }
        return b;
      });
      return { boris: updatedBoris };
    });

    if (target) {
      sendBoriSMS('done', target, shopName, { enabled: true });
      try {
        await updateBoriInFirestore(shopId, boriId, { status: 'done', doneDate: doneISO });
      } catch (e) {
        console.warn('Firestore markBoriDone error:', e);
      }
    }
  },

  markBoriPickedUp: async (boriId, shopId = 'shop_default_1', shopName = 'Vanshu Atta Chakki') => {
    const pickupISO = new Date().toISOString();
    let target = null;

    set((state) => {
      const updatedBoris = state.boris.map((b) => {
        if (b.id === boriId) {
          target = { ...b, status: 'picked_up', pickupDate: pickupISO };
          return target;
        }
        return b;
      });
      return { boris: updatedBoris };
    });

    if (target) {
      sendBoriSMS('pickedUp', target, shopName, { enabled: true });
      try {
        await updateBoriInFirestore(shopId, boriId, { status: 'picked_up', pickupDate: pickupISO });
      } catch (e) {
        console.warn('Firestore markBoriPickedUp error:', e);
      }
    }
  }
}));
