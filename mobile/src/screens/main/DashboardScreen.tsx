import React, { useEffect, useState, useCallback } from 'react';
import { View, StyleSheet, ScrollView, RefreshControl } from 'react-native';
import { Text, Card, useTheme, ActivityIndicator } from 'react-native-paper';
import { apiClient } from '../../services/api';

export default function DashboardScreen() {
  const theme = useTheme();
  const [stats, setStats] = useState({ leads: 0, activeChats: 0, campaigns: 0 });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchStats = async () => {
    try {
      const res = await apiClient.get('/chat/stats');
      setStats(res.data);
    } catch (e) {
      console.warn('Failed to fetch dashboard stats', e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchStats();
  }, []);

  if (loading && !refreshing) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <ScrollView 
      style={[styles.container, { backgroundColor: '#f0f2f5' }]}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      <Text variant="titleLarge" style={styles.header}>Overview</Text>
      
      <View style={styles.row}>
        <Card style={styles.card}>
          <Card.Title title="Total Leads" />
          <Card.Content>
            <Text variant="headlineSmall" style={styles.statValue}>{stats.leads}</Text>
          </Card.Content>
        </Card>
        
        <Card style={styles.card}>
          <Card.Title title="Active Chats" />
          <Card.Content>
            <Text variant="headlineSmall" style={styles.statValue}>{stats.activeChats}</Text>
          </Card.Content>
        </Card>
      </View>

      <View style={[styles.row, { marginTop: 12 }]}>
        <Card style={styles.card}>
          <Card.Title title="Campaigns" />
          <Card.Content>
            <Text variant="headlineSmall" style={styles.statValue}>{stats.campaigns}</Text>
          </Card.Content>
        </Card>
        <View style={styles.card} /> 
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    fontWeight: 'bold',
    marginBottom: 16,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  card: {
    flex: 1,
    marginHorizontal: 4,
    backgroundColor: '#fff',
  },
  statValue: {
    fontWeight: 'bold',
    color: '#075E54',
  }
});
