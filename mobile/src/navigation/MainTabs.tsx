import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

import DashboardScreen from '../screens/main/DashboardScreen';
import ChatListScreen from '../screens/main/ChatListScreen';
import ContactsScreen from '../screens/main/ContactsScreen';
import CampaignsScreen from '../screens/main/CampaignsScreen';

import { Colors } from '../theme/colors';

import { useCrmStore } from '../store/crmStore';

const Tab = createBottomTabNavigator();

export default function MainTabs() {
  const waitingCount = useCrmStore(state => state.waitingCount);

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: true,
        headerStyle: { backgroundColor: Colors.primary },
        headerTintColor: '#fff',
        tabBarActiveTintColor: Colors.primary,
        tabBarInactiveTintColor: Colors.textMuted,
        tabBarIcon: ({ focused, color, size }) => {
          let iconName = 'view-dashboard';
          if (route.name === 'Dashboard') iconName = focused ? 'view-dashboard' : 'view-dashboard-outline';
          else if (route.name === 'Chats') iconName = focused ? 'message-text' : 'message-text-outline';
          else if (route.name === 'Contacts') iconName = focused ? 'account-group' : 'account-group-outline';
          else if (route.name === 'Campaigns') iconName = focused ? 'bullhorn' : 'bullhorn-outline';
          
          return <Icon name={iconName} size={size} color={color} />;
        },
      })}
    >
      <Tab.Screen name="Dashboard" component={DashboardScreen} />
      <Tab.Screen 
        name="Chats" 
        component={ChatListScreen} 
        options={{ 
          tabBarBadge: waitingCount > 0 ? waitingCount : undefined,
          tabBarBadgeStyle: { backgroundColor: '#ff9800' }
        }} 
      />
      <Tab.Screen name="Contacts" component={ContactsScreen} />
      <Tab.Screen name="Campaigns" component={CampaignsScreen} />
    </Tab.Navigator>
  );
}
