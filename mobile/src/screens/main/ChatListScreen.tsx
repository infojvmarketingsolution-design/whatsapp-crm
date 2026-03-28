import React, { useState, useEffect } from 'react';
import { View, StyleSheet, FlatList, RefreshControl } from 'react-native';
import { List, Avatar, Text, ActivityIndicator } from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';
import { apiClient } from '../../services/api';
import { useCrmStore } from '../../store/crmStore';
import { socketService } from '../../services/socket';

export default function ChatListScreen() {
  const navigation = useNavigation<any>();
  const [contacts, setContacts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const setWaitingCount = useCrmStore(state => state.setWaitingCount);

  const fetchContacts = async () => {
    try {
      const res = await apiClient.get('/chat/contacts');
      setContacts(res.data);
      
      // Update global waiting count for tab badge
      const count = res.data.filter((c: any) => c.status === 'FOLLOW_UP').length;
      setWaitingCount(count);
    } catch (error) {
      console.warn('Failed to fetch contacts', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchContacts();

    // Real-time socket updates for the contact list
    if (socketService.socket) {
      const handleNewMessage = (msg: any) => {
        // Refresh list on any new message to ensure sorting and status are current
        fetchContacts();
      };

      socketService.socket.on('new_message', handleNewMessage);
      socketService.socket.on('lead_score_updated', handleNewMessage); // Re-fetch on score update
      
      return () => {
        socketService.socket?.off('new_message', handleNewMessage);
        socketService.socket?.off('lead_score_updated', handleNewMessage);
      };
    }
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
        data={contacts.sort((a, b) => {
          // Tier 1: Score (Priority)
          if ((b.score || 0) !== (a.score || 0)) return (b.score || 0) - (a.score || 0);
          // Tier 2: Waiting Status
          if (a.status === 'FOLLOW_UP' && b.status !== 'FOLLOW_UP') return -1;
          if (a.status !== 'FOLLOW_UP' && b.status === 'FOLLOW_UP') return 1;
          return 0;
        })}
        keyExtractor={(item) => item._id}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        renderItem={({ item }) => (
          <List.Item
            title={
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <Text style={[{ fontWeight: 'bold' }, item.status === 'FOLLOW_UP' ? { color: '#fb8c00' } : {}]}>
                  {item.name || item.phone}
                </Text>
                {item.heatLevel === 'Hot' && <List.Icon icon="fire" color="#f44336" style={{ margin: 0, padding: 0 }} />}
                {item.heatLevel === 'Warm' && <List.Icon icon="fire" color="#ff9800" style={{ margin: 0, padding: 0 }} />}
              </View>
            }
            description={item.status || 'NEW LEAD'}
            right={props => (
              <View style={styles.rightContent}>
                {item.score > 0 && (
                  <View style={[
                    styles.scoreBadge, 
                    { backgroundColor: item.score >= 70 ? '#ffebee' : item.score >= 40 ? '#fff3e0' : '#f5f5f5' }
                  ]}>
                    <Text style={[
                      styles.scoreText, 
                      { color: item.score >= 70 ? '#c62828' : item.score >= 40 ? '#ef6c00' : '#757575' }
                    ]}>
                      {item.score}
                    </Text>
                  </View>
                )}
                {item.status === 'FOLLOW_UP' && (
                  <View style={styles.waitingBadge}>
                    <Text style={styles.waitingText}>WAITING</Text>
                  </View>
                )}
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
  waitingDot: {
    position: 'absolute',
    top: 2,
    right: 2,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#ff9800',
    borderWidth: 2,
    borderColor: '#fff',
  },
  waitingBadge: {
    backgroundColor: '#fff3e0',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#ffe0b2',
    marginBottom: 4,
  },
  waitingText: {
    fontSize: 9,
    fontWeight: 'bold',
    color: '#e65100',
  },
  scoreBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    borderWidth: 1,
    marginBottom: 4,
  },
  scoreText: {
    fontSize: 10,
    fontWeight: '900',
  }
});
