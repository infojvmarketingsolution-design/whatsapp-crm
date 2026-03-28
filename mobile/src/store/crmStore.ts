import { create } from 'zustand';
import { crmApi, apiClient } from '../services/api';

interface CrmState {
  waitingCount: number;
  agents: any[];
  stats: any;
  loading: boolean;
  fcmToken: string | null;
  setWaitingCount: (count: number) => void;
  incrementWaiting: () => void;
  decrementWaiting: () => void;
  fetchAgents: () => Promise<void>;
  fetchStats: () => Promise<void>;
  setFcmToken: (token: string | null) => void;
  syncTokenWithBackend: (action: 'register' | 'unregister') => Promise<void>;
}

export const useCrmStore = create<CrmState>((set, get) => ({
  waitingCount: 0,
  agents: [],
  stats: {
    leads: 0,
    activeChats: 0,
    campaigns: 0,
    qualifiedLeads: 0,
    waitingForAgent: 0
  },
  loading: false,
  fcmToken: null,
  setWaitingCount: (count) => set({ waitingCount: count }),
  incrementWaiting: () => set((state) => ({ waitingCount: state.waitingCount + 1 })),
  decrementWaiting: () => set((state) => ({ waitingCount: Math.max(0, state.waitingCount - 1) })),
  
  fetchAgents: async () => {
    try {
      const res = await crmApi.getAgents();
      set({ agents: res.data });
    } catch (e) {
      console.warn('Failed to fetch agents globally', e);
    }
  },

  fetchStats: async () => {
    try {
      set({ loading: true });
      const res = await apiClient.get('/chat/stats');
      set({ stats: res.data, waitingCount: res.data.waitingForAgent, loading: false });
    } catch (e) {
      console.warn('Failed to fetch stats globally', e);
      set({ loading: false });
    }
  },

  setFcmToken: (token) => set({ fcmToken: token }),

  syncTokenWithBackend: async (action) => {
    const { fcmToken } = get();
    if (!fcmToken) return;
    try {
      await crmApi.updatePushToken(fcmToken, action);
    } catch (e) {
      console.warn('Failed to sync push token with backend', e);
    }
  }
}));
