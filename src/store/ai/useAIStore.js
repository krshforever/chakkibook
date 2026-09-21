import { create } from 'zustand';

export const useAIStore = create((set, get) => ({
  isAISheetOpen: false,
  isVoiceListening: false,
  chatHistory: [
    {
      id: 'welcome_1',
      sender: 'ai',
      text: 'Ram Ram Bhaiya! Main aapka Chakki Co-Pilot hoon. Aaj 45 bori pisai baaki hai. Kuch bhi poochhein ya bolo!',
      timestamp: new Date().toISOString()
    }
  ],
  predictions: {
    peakMillingHour: '11:00 AM',
    expectedGrainArrivalKg: 350,
    duesRiskCount: 2
  },

  openAISheet: () => set({ isAISheetOpen: true }),
  closeAISheet: () => set({ isAISheetOpen: false }),
  toggleAISheet: () => set((state) => ({ isAISheetOpen: !state.isAISheetOpen })),
  setVoiceListening: (listening) => set({ isVoiceListening: listening }),

  addChatMessage: (message) => {
    const newMsg = {
      id: `msg_${Date.now()}`,
      timestamp: new Date().toISOString(),
      ...message
    };
    set((state) => ({ chatHistory: [...state.chatHistory, newMsg] }));
    return newMsg;
  },

  clearChat: () => {
    set({
      chatHistory: [
        {
          id: `welcome_${Date.now()}`,
          sender: 'ai',
          text: 'Ram Ram Bhaiya! Main aapka Chakki Co-Pilot hoon. Kaise madad karun?',
          timestamp: new Date().toISOString()
        }
      ]
    });
  }
}));
