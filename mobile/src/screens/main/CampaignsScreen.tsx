import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Text } from 'react-native-paper';

export default function CampaignsScreen() {
  return (
    <View style={styles.container}>
      <Text variant="headlineSmall" style={styles.text}>Campaigns</Text>
      <Text variant="bodyMedium" style={{color: '#667781'}}>Coming Soon</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  text: {
    color: '#075E54',
    marginBottom: 8,
  }
});
