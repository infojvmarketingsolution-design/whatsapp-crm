import React, { useState, useEffect } from 'react';
import { View, StyleSheet, FlatList, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform } from 'react-native';
import { Text, useTheme } from 'react-native-paper';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { socketService } from '../../services/socket';
import { apiClient } from '../../services/api';

export default function ChatScreen({ route }: any) {
  const { id, name } = route.params || { id: '1', name: 'Unknown Contact' };
  const theme = useTheme();
  
  const [messages, setMessages] = useState<any[]>([]);
  const [text, setText] = useState('');

  useEffect(() => {
    fetchMessages();
    
    // Subscribe to new messages via socket
    if (socketService.socket) {
      socketService.socket.on('new_message', (msg: any) => {
        if (msg.chatId === id) {
          setMessages(prev => [msg, ...prev]);
        }
      });
    }

    return () => {
      if (socketService.socket) {
        socketService.socket.off('new_message');
      }
    };
  }, [id]);

  const fetchMessages = async () => {
    try {
      // Stub API request
      // const res = await apiClient.get(`/chats/${id}/messages`);
      // setMessages(res.data);
      
      // Mock Data
      setMessages([
        { id: 'm1', text: 'Hey, I need info about the standard CRM.', isMe: false, time: '10:45 AM' },
        { id: 'm2', text: 'Sure! Here is the pricing.', isMe: true, time: '10:46 AM' },
      ].reverse());
    } catch (e) {
      console.warn('Failed to fetch messages');
    }
  };

  const sendMessage = async () => {
    if (!text.trim()) return;
    
    const newMsg = {
      id: Math.random().toString(),
      text,
      isMe: true,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
    
    setMessages(prev => [newMsg, ...prev]);
    setText('');
    
    try {
      // await apiClient.post('/messages/send', { chatId: id, text: newMsg.text });
      // socketService.socket?.emit('message_sent', newMsg);
    } catch (e) {
      console.error('Failed to send');
    }
  };

  const renderBubble = ({ item }: { item: any }) => {
    const isMe = item.isMe;
    return (
      <View style={[styles.messageWrapper, isMe ? styles.messageWrapperRight : styles.messageWrapperLeft]}>
        <View style={[styles.bubble, isMe ? styles.bubbleRight : styles.bubbleLeft]}>
          <Text style={styles.messageText}>{item.text}</Text>
          <Text style={styles.messageTime}>{item.time}</Text>
        </View>
      </View>
    );
  };

  return (
    <KeyboardAvoidingView 
      style={styles.container} 
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={styles.header}>
        <Text variant="titleMedium" style={styles.headerTitle}>{name}</Text>
      </View>
      
      <FlatList
        data={messages}
        keyExtractor={item => item.id}
        renderItem={renderBubble}
        inverted
        contentContainerStyle={styles.chatList}
      />
      
      <View style={styles.inputContainer}>
        <View style={styles.inputWrapper}>
          <TextInput
            style={styles.input}
            placeholder="Type a message"
            value={text}
            onChangeText={setText}
            multiline
          />
        </View>
        <TouchableOpacity style={styles.sendButton} onPress={sendMessage}>
          <Icon name="send" size={24} color="#fff" />
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#E5DDD5', // WhatsApp background pattern emulation
  },
  header: {
    backgroundColor: '#075E54',
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerTitle: {
    color: '#fff',
    fontWeight: 'bold',
  },
  chatList: {
    paddingHorizontal: 10,
    paddingBottom: 10,
  },
  messageWrapper: {
    marginVertical: 4,
    width: '100%',
  },
  messageWrapperLeft: {
    alignItems: 'flex-start',
  },
  messageWrapperRight: {
    alignItems: 'flex-end',
  },
  bubble: {
    maxWidth: '80%',
    padding: 10,
    borderRadius: 8,
    elevation: 1,
  },
  bubbleLeft: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 0,
  },
  bubbleRight: {
    backgroundColor: '#DCF8C6',
    borderTopRightRadius: 0,
  },
  messageText: {
    fontSize: 15,
    color: '#111B21',
  },
  messageTime: {
    fontSize: 11,
    color: '#667781',
    alignSelf: 'flex-end',
    marginTop: 4,
  },
  inputContainer: {
    flexDirection: 'row',
    padding: 8,
    alignItems: 'flex-end',
  },
  inputWrapper: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 24,
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginRight: 8,
    maxHeight: 120,
    elevation: 1,
  },
  input: {
    fontSize: 16,
    maxHeight: 100,
  },
  sendButton: {
    backgroundColor: '#075E54',
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 1,
  },
});
