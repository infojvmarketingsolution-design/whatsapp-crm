import React, { useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useAuthStore } from '../store/authStore';

import AuthStack from './AuthStack';
import MainTabs from './MainTabs';
import SplashScreen from '../screens/SplashScreen';
import ChatScreen from '../screens/main/ChatScreen';

const Stack = createNativeStackNavigator();

export default function RootNavigator() {
  const { token, isLoading, restoreToken } = useAuthStore();

  useEffect(() => {
    restoreToken();
  }, []);

  if (isLoading) {
    return <SplashScreen />;
  }

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {token == null ? (
          <Stack.Screen name="Auth" component={AuthStack} />
        ) : (
          <>
            <Stack.Screen name="Main" component={MainTabs} />
            <Stack.Screen name="ChatScreen" component={ChatScreen} options={{ headerShown: false }} />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}
