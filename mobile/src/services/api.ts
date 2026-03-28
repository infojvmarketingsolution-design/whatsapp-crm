import axios from 'axios';
import { API_URL } from '@env';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const apiClient = axios.create({
  baseURL: API_URL || 'https://wapipulse.com/api',
  timeout: 15000,
});

apiClient.interceptors.request.use(async (config) => {
  const token = await AsyncStorage.getItem('userToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
}, (error) => Promise.reject(error));

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Setup logout event emit
    }
    return Promise.reject(error);
  }
);

export const crmApi = {
  getAgents: () => apiClient.get('/chat/agents'),
  performAction: (contactId: string, action: string, payload: any) => 
    apiClient.put(`/chat/contacts/${contactId}/action`, { action, payload }),
  updatePushToken: (token: string, action: 'register' | 'unregister') => 
    apiClient.post('/chat/fcm-token', { token, action }),
};
