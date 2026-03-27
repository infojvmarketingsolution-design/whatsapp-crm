import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { socketService } from '../services/socket';

interface AuthState {
  token: string | null;
  user: any | null;
  isLoading: boolean;
  login: (token: string, user: any) => Promise<void>;
  logout: () => Promise<void>;
  restoreToken: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  token: null,
  user: null,
  isLoading: true,
  login: async (token, user) => {
    await AsyncStorage.setItem('userToken', token);
    await AsyncStorage.setItem('userData', JSON.stringify(user));
    socketService.connect(token);
    set({ token, user, isLoading: false });
  },
  logout: async () => {
    await AsyncStorage.removeItem('userToken');
    await AsyncStorage.removeItem('userData');
    socketService.disconnect();
    set({ token: null, user: null, isLoading: false });
  },
  restoreToken: async () => {
    try {
      const token = await AsyncStorage.getItem('userToken');
      const userStr = await AsyncStorage.getItem('userData');
      if (token && userStr) {
        socketService.connect(token);
        set({ token, user: JSON.parse(userStr), isLoading: false });
      } else {
        set({ isLoading: false });
      }
    } catch (e) {
      set({ isLoading: false });
    }
  },
}));
