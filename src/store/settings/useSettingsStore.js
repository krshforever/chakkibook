import { create } from 'zustand';
import { 
  getShopDoc, 
  createShopDoc, 
  saveShopConfigToFirestore, 
  subscribeToShopConfig, 
  subscribeToMembers,
  addMemberToFirestore,
  removeMemberFromFirestore
} from '../../firebase/firestore';

const initialShopState = {
  id: 'shop_default_1',
  name: 'Vanshu Atta Chakki & Oil Mill',
  address: 'Main Market Road, Ward 4',
  phone: '9876543210',
  ownerName: 'Bhaiya',
  chakkiRates: {
    pisai: 4,
    grainRates: {
      gehun: 4,
      bajra: 4.5,
      makka: 4.5,
      chana: 5.5,
      multigrain: 5
    },
    kadda: {
      gehun: 1,
      bajra: 1,
      makka: 1.25,
      chana: 1.5,
      multigrain: 1.25
    },
    kaddaPer: 40
  },
  spellarRates: {
    pirai: 12,
    khari: 35
  },
  smsSettings: {
    enabled: true,
    onDropOff: true,
    onDone: true,
    onPickedUp: true
  },
  aiEnabled: true,
  aiFeatures: {
    dailySummary: true,
    demandPrediction: true,
    customerInsights: true
  }
};

const initialLanguage = (typeof localStorage !== 'undefined' && localStorage.getItem('chakkibook_language')) || 'hinglish';

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

export const useSettingsStore = create((set, get) => ({
  activeMode: 'chakki',
  theme: 'light',
  language: initialLanguage,
  currentUser: {
    uid: 'user_9876543210',
    email: '9876543210@chakkibook.local',
    isFallback: true
  },
  userRole: 'owner',
  shopId: 'shop_default_1',
  shop: initialShopState,
  members: [],

  // Multi-Mill / Multi-Location Enterprise Support
  mills: [
    { id: 'mill_1', name: 'Main Branch (Market Road)', address: 'Main Market Road, Ward 4', phone: '9876543210' },
    { id: 'mill_2', name: 'Branch 2 (Station Road)', address: 'Near Station Road, Ward 1', phone: '9812300000' }
  ],
  activeMillId: 'mill_1',

  switchMill: (millId) => {
    const targetMill = get().mills.find((m) => m.id === millId);
    if (targetMill) {
      set((state) => ({
        activeMillId: millId,
        shop: {
          ...state.shop,
          id: targetMill.id,
          name: targetMill.name,
          address: targetMill.address,
          phone: targetMill.phone
        }
      }));
    }
  },

  addMill: (millData) => {
    const newMill = {
      id: `mill_${Date.now()}`,
      name: millData.name || 'New Mill Branch',
      address: millData.address || '',
      phone: millData.phone || ''
    };
    set((state) => ({ mills: [...state.mills, newMill] }));
    return newMill;
  },

  setLanguage: (lang) => {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem('chakkibook_language', lang);
    }
    set({ language: lang });
  },

  setActiveMode: (mode) => {
    setDomMode(mode);
    set({ activeMode: mode });
  },

  setTheme: (theme) => {
    setDomTheme(theme);
    set({ theme });
  },

  setAuthUser: async (user, shopId = 'shop_default_1', role = 'owner') => {
    set({ currentUser: user, shopId, userRole: role });

    if (shopId) {
      const shopDoc = await getShopDoc(shopId);
      if (shopDoc) {
        set((state) => ({ shop: { ...state.shop, ...shopDoc } }));
      }

      subscribeToMembers(shopId, (membData) => {
        set({ members: membData });
      });

      subscribeToShopConfig(shopId, (configData) => {
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
    }
  },

  logout: () => {
    set({ currentUser: null, shopId: 'shop_default_1', userRole: 'owner' });
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

    try {
      await saveShopConfigToFirestore(get().shopId, {
        chakkiRates: updatedShop.chakkiRates,
        spellarRates: updatedShop.spellarRates
      });
    } catch (e) {
      console.warn('Firestore rates update notice:', e);
    }
  },

  updateShopInfo: async (info) => {
    if (!get().hasPermission('changeRates')) return;

    set((state) => ({ shop: { ...state.shop, ...info } }));
    try {
      await createShopDoc(get().shopId, info);
    } catch (e) {
      console.warn('Firestore shop info update notice:', e);
    }
  },

  updateSmsSettings: async (smsSettings) => {
    if (!get().hasPermission('smsSettings')) return;

    const updated = { ...get().shop.smsSettings, ...smsSettings };
    set((state) => ({ shop: { ...state.shop, smsSettings: updated } }));

    try {
      await saveShopConfigToFirestore(get().shopId, { smsSettings: updated });
    } catch (e) {
      console.warn('Firestore SMS settings update notice:', e);
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

    set((state) => ({ members: state.members.filter((m) => m.id !== memberId) }));
    try {
      await removeMemberFromFirestore(get().shopId, memberId);
    } catch (e) {
      console.warn('Failed to remove team member:', e);
    }
  },

  hasPermission: (action) => {
    const role = get().userRole || 'owner';
    if (['viewDashboard', 'viewKhata', 'viewStock'].includes(action)) return true;
    if (['addBori', 'markDone', 'addCustomer', 'collectPayment', 'adjustStock'].includes(action)) {
      return role === 'owner' || role === 'operator';
    }
    return role === 'owner';
  },

  getGrainSettings: (grainKey) => {
    const key = (grainKey || 'gehun').toLowerCase();
    const chakkiRates = get().shop?.chakkiRates || {};

    const normalizedKey = key === 'wheat' ? 'gehun' : key === 'maize' ? 'makka' : key;

    const rate = chakkiRates.grainRates?.[normalizedKey] ?? chakkiRates.pisai ?? 4;
    const kadda = chakkiRates.kadda?.[normalizedKey] ?? chakkiRates.kadda?.[key] ?? 1;
    const kaddaPer = chakkiRates.kaddaPer ?? 40;

    return { rate, kadda, kaddaPer };
  }
}));
