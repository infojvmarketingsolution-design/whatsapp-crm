import messaging from '@react-native-firebase/messaging';
import { apiClient } from './api';

export async function requestUserPermission() {
  const authStatus = await messaging().requestPermission();
  const enabled =
    authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
    authStatus === messaging.AuthorizationStatus.PROVISIONAL;

  if (enabled) {
    console.log('Authorization status:', authStatus);
    return getFcmToken();
  }
}

const getFcmToken = async () => {
  try {
    const token = await messaging().getToken();
    console.log('FCM Token:', token);
    
    // Send token to backend
    // await apiClient.post('/users/device-token', { token });
  } catch (error) {
    console.warn('Failed to get FCM token', error);
  }
};

export function setupForegroundHandler() {
  return messaging().onMessage(async remoteMessage => {
    console.log('A new FCM message arrived!', JSON.stringify(remoteMessage));
    // Trigger local notification or Redux update here
  });
}

// Background handler (Must be placed in index.js)
// messaging().setBackgroundMessageHandler(async remoteMessage => {
//   console.log('Message handled in the background!', remoteMessage);
// });
