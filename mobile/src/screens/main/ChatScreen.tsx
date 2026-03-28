import React, { useState, useEffect, useRef } from 'react';
import { View, StyleSheet, FlatList, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform, Image, ActivityIndicator } from 'react-native';
import { Text, useTheme } from 'react-native-paper';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { socketService } from '../../services/socket';
import { apiClient } from '../../services/api';

const BASE_URL = 'https://wapipulse.com';

export default function ChatScreen({ route }: any) {
  const { id, name } = route.params || { id: 'unknown', name: 'Unknown Contact' };
  const theme = useTheme();
  
  const [messages, setMessages] = useState<any[]>([]);
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const flatListRef = useRef<FlatList>(null);

  useEffect(() => {
    fetchMessages();
    
    // Subscribe to new messages via socket
    if (socketService.socket) {
      const handleNewMessage = (msg: any) => {
        // msg might contain .contact if it's from current tenant room
        if (msg.contactId === id || msg.contact?._id === id) {
          setMessages(prev => [msg, ...prev]);
        }
      };

      socketService.socket.on('new_message', handleNewMessage);
      
      return () => {
        socketService.socket?.off('new_message', handleNewMessage);
      };
    }
  }, [id]);

  const fetchMessages = async () => {
    try {
      setLoading(true);
      const res = await apiClient.get(`/chat/messages/${id}`);
      // Backend returns older first, but FlatList is inverted, so we keep order or reverse if needed.
      // Message.find({ contactId }).sort({ timestamp: 1 }); // Backend sorts by old to new
      // Since FlatList is inverted, we should reverse to show new at bottom (top of list)
      setMessages([...res.data].reverse());
    } catch (e) {
      console.warn('Failed to fetch messages', e);
    } finally {
      setLoading(false);
    }
  };

  const sendMessage = async () => {
    if (!text.trim() || sending) return;
    
    const content = text;
    setText('');
    setSending(true);
    
    try {
      await apiClient.post('/chat/send', { contactId: id, content });
      // The socket event 'new_message' will update the UI for us
    } catch (e) {
      console.error('Failed to send', e);
      setText(content); // Restore text on failure
    } finally {
      setSending(false);
    }
  };

  const renderBubble = ({ item }: { item: any }) => {
    const isMe = item.direction === 'OUTBOUND';
    const isImage = item.type === 'image';
    const isVideo = item.type === 'video';
    
    let mediaUrl = '';
    if (isImage || isVideo) {
      mediaUrl = item.content.startsWith('http') ? item.content : `${BASE_URL}${item.content}`;
    }

    return (
      <View style={[styles.messageWrapper, isMe ? styles.messageWrapperRight : styles.messageWrapperLeft]}>
        <View style={[styles.bubble, isMe ? styles.bubbleRight : styles.bubbleLeft]}>
          {isImage && (
            <Image 
              source={{ uri: mediaUrl }} 
              style={styles.mediaContent} 
              resizeMode="cover"
            />
          )}
          {isVideo && (
             <View style={styles.videoPlaceholder}>
               <Icon name="play-circle-outline" size={48} color="#fff" />
               <Text style={{ color: '#fff' }}>Video Message</Text>
             </View>
          )}
          {item.type === 'text' && (
            <Text style={styles.messageText}>{item.content}</Text>
          )}
          <Text style={styles.messageTime}>
            {item.timestamp ? new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
          </Text>
        </View>
      </View>
    );
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView 
      style={styles.container} 
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
    >
      <View style={styles.header}>
        <TouchableOpacity onPress={() => route.params.onGoBack?.()}>
           <Icon name="chevron-left" size={30} color="#fff" style={{ marginRight: 10 }} />
        </TouchableOpacity>
        <Text variant="titleMedium" style={styles.headerTitle}>{name}</Text>
      </View>
      
      <FlatList
        ref={flatListRef}
        data={messages}
        keyExtractor={item => item._id || item.messageId || Math.random().toString()}
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
            editable={!sending}
          />
        </View>
        <TouchableOpacity 
          style={[styles.sendButton, (!text.trim() || sending) && { opacity: 0.6 }]} 
          onPress={sendMessage}
          disabled={!text.trim() || sending}
        >
          {sending ? (
            <ActivityIndicator color="#fff" size="small" />
          ) : (
            <Icon name="send" size={24} color="#fff" />
          )}
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#E5DDD5',
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    backgroundColor: '#075E54',
    padding: 12,
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
    padding: 8,
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
    fontSize: 10,
    color: '#667781',
    alignSelf: 'flex-end',
    marginTop: 2,
  },
  mediaContent: {
    width: 250,
    height: 250,
    borderRadius: 4,
    marginBottom: 4,
  },
  videoPlaceholder: {
    width: 250,
    height: 150,
    backgroundColor: '#000',
    borderRadius: 4,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 4,
  },
  inputContainer: {
    flexDirection: 'row',
    padding: 8,
    backgroundColor: 'transparent',
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
    paddingTop: Platform.OS === 'ios' ? 8 : 0,
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
