import React, { useEffect, useState } from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { Text, Card, useTheme } from 'react-native-paper';
import { apiClient } from '../../services/api';

export default function DashboardScreen() {
  const theme = useTheme();
  const [stats, setStats] = useState({ leads: 0, activeChats: 0, campaigns: 0 });

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      // Stubbing dashboard call for now
      // const res = await apiClient.get('/dashboard/stats');
      // setStats(res.data);
    } catch (e) {}
  };

  return (
    <ScrollView style={[styles.container, { backgroundColor: '#f0f2f5' }]}>
      <Text variant="titleLarge" style={styles.header}>Overview</Text>
      
      <View style={styles.row}>
        <Card style={styles.card}>
          <Card.Title title="Total Leads" />
          <Card.Content>
            <Text variant="headlineSmall">{stats.leads}</Text>
          </Card.Content>
        </Card>
        
        <Card style={styles.card}>
          <Card.Title title="Active Chats" />
          <Card.Content>
            <Text variant="headlineSmall">{stats.activeChats}</Text>
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
  },
});
