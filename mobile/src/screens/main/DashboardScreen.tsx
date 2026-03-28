import React, { useEffect, useState, useCallback } from 'react';
import { View, StyleSheet, ScrollView, RefreshControl } from 'react-native';
import { Text, Card, useTheme, ActivityIndicator } from 'react-native-paper';
import { useCrmStore } from '../../store/crmStore';

export default function DashboardScreen() {
  const theme = useTheme();
  const { stats, loading, fetchStats } = useCrmStore();
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchStats();
  }, []);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchStats();
    setRefreshing(false);
  }, [fetchStats]);

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
        <Card style={[styles.card, { backgroundColor: '#e8f5e9' }]}>
          <Card.Title title="Qualified Leads" titleStyle={{ color: '#2e7d32' }} />
          <Card.Content>
            <Text variant="headlineSmall" style={[styles.statValue, { color: '#2e7d32' }]}>{stats.qualifiedLeads || 0}</Text>
          </Card.Content>
        </Card>
        
        <Card style={[styles.card, { backgroundColor: '#fff3e0' }]}>
          <Card.Title title="Waiting Agent" titleStyle={{ color: '#e65100' }} />
          <Card.Content>
            <Text variant="headlineSmall" style={[styles.statValue, { color: '#e65100' }]}>{stats.waitingForAgent || 0}</Text>
          </Card.Content>
        </Card>
      </View>

      <View style={[styles.row, { marginTop: 12, marginBottom: 20 }]}>
        <Card style={[styles.card, { backgroundColor: '#ffebee' }]}>
          <Card.Title title="🔥 Hot Leads" titleStyle={{ color: '#c62828' }} />
          <Card.Content>
            <Text variant="headlineSmall" style={[styles.statValue, { color: '#c62828' }]}>{stats.hotLeads || 0}</Text>
          </Card.Content>
        </Card>
        
        <Card style={styles.card}>
          <Card.Title title="Warm Leads" />
          <Card.Content>
            <Text variant="headlineSmall" style={styles.statValue}>{stats.warmLeads || 0}</Text>
          </Card.Content>
        </Card>
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
