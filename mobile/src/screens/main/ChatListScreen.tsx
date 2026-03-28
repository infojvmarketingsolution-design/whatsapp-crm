import React, { useState, useEffect } from 'react';
import { View, StyleSheet, FlatList, RefreshControl } from 'react-native';
import { List, Avatar, Text, ActivityIndicator } from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';
import { apiClient } from '../../services/api';

export default function ChatListScreen() {
  const navigation = useNavigation<any>();
  const [contacts, setContacts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchContacts = async () => {
    try {
      const res = await apiClient.get('/chat/contacts');
      setContacts(res.data);
    } catch (error) {
      console.warn('Failed to fetch contacts', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchContacts();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    fetchContacts();
  };

  const getInitials = (name?: string, phone?: string) => {
    if (name) return name.substring(0, 2).toUpperCase();
    if (phone) return phone.substring(phone && phone.length > 2 ? phone.length - 2 : 0);
    return '??';
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={contacts}
        keyExtractor={(item) => item._id}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        renderItem={({ item }) => (
          <List.Item
            title={item.name || item.phone}
            description={item.status || 'NEW LEAD'}
            onPress={() => {
              navigation.navigate('ChatScreen', { id: item._id, name: item.name || item.phone });
            }}
            left={props => (
              <Avatar.Text 
                {...props} 
                label={getInitials(item.name, item.phone)} 
                size={48} 
              />
            )}
            right={props => (
              <View style={styles.rightContent}>
                <Text variant="labelSmall" style={styles.time}>
                  {item.lastMessageAt ? new Date(item.lastMessageAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                </Text>
              </View>
            )}
          />
        )}
        ListEmptyComponent={
          <View style={styles.center}>
            <Text>No active chats found</Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  rightContent: {
    alignItems: 'flex-end',
    justifyContent: 'center',
    paddingRight: 10,
  },
  time: {
    color: '#667781',
    marginBottom: 4,
  },
});
