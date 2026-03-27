import React from 'react';
import { View, StyleSheet, FlatList } from 'react-native';
import { List, Avatar, Text } from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';

const MOCK_CHATS = [
  { id: '1', name: 'John Doe', lastMessage: 'Hey, I need info about the standard CRM.', time: '10:45 AM', unread: 2 },
  { id: '2', name: 'Alice Smith', lastMessage: 'Thank you!', time: 'Yesterday', unread: 0 },
];

export default function ChatListScreen() {
  const navigation = useNavigation<any>();

  return (
    <View style={styles.container}>
      <FlatList
        data={MOCK_CHATS}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <List.Item
            title={item.name}
            description={item.lastMessage}
            onPress={() => {
              navigation.navigate('ChatScreen', { id: item.id, name: item.name });
            }}
            left={props => <Avatar.Text {...props} label={item.name.substring(0, 2).toUpperCase()} size={48} />}
            right={props => (
              <View style={styles.rightContent}>
                <Text variant="labelSmall" style={styles.time}>{item.time}</Text>
                {item.unread > 0 && (
                  <View style={styles.badge}>
                    <Text style={styles.badgeText}>{item.unread}</Text>
                  </View>
                )}
              </View>
            )}
          />
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
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
  badge: {
    backgroundColor: '#25D366',
    borderRadius: 12,
    paddingHorizontal: 6,
    paddingVertical: 2,
    minWidth: 20,
    alignItems: 'center',
  },
  badgeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
});
