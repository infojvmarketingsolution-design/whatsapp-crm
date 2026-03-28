import React, { useState, useEffect, useRef } from 'react';
import { View, StyleSheet, FlatList, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform, Image, ActivityIndicator, ScrollView } from 'react-native';
import { Text, useTheme, Modal, Portal, Button, Divider, IconButton } from 'react-native-paper';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { socketService } from '../../services/socket';
import { apiClient, crmApi } from '../../services/api';
import { useAuthStore } from '../../store/authStore';
import { useCrmStore } from '../../store/crmStore';

const BASE_URL = 'https://wapipulse.com';

export default function ChatScreen({ route }: any) {
  const { id, name } = route.params || { id: 'unknown', name: 'Unknown Contact' };
  const theme = useTheme();
  
  const { agents, fetchAgents, fetchStats } = useCrmStore();
  const user = useAuthStore(state => state.user);
  
  const [messages, setMessages] = useState<any[]>([]);
  const [contact, setContact] = useState<any>(null);
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [infoVisible, setInfoVisible] = useState(false);
  const [aiSummary, setAiSummary] = useState<any>(null);
  const [loadingSummary, setLoadingSummary] = useState(false);
  const flatListRef = useRef<FlatList>(null);

  useEffect(() => {
    fetchMessages();
    fetchContact();
    
    // Subscribe to socket events
    if (socketService.socket) {
      const handleNewMessage = (msg: any) => {
        if (msg.contactId === id || msg.contact?._id === id) {
          setMessages(prev => [msg, ...prev]);
        }
      };

      const handleStatusUpdate = (data: any) => {
        if (data.contactId === id) {
          setMessages(prev => prev.map(m => 
            m.messageId === data.messageId ? { ...m, status: data.status } : m
          ));
        }
      };

      socketService.socket.on('new_message', handleNewMessage);
      socketService.socket.on('message_status_update', handleStatusUpdate);
      
      return () => {
        socketService.socket?.off('new_message', handleNewMessage);
        socketService.socket?.off('message_status_update', handleStatusUpdate);
      };
    }
  }, [id]);

  const fetchContact = async () => {
    try {
      const res = await apiClient.get(`/chat/contacts`);
      // Finding the specific contact from the list since there's no single contact GET at the moment
      const c = res.data.find((item: any) => item._id === id);
      if (c) setContact(c);
    } catch (e) {
      console.warn('Failed to fetch contact info', e);
    }
  };

  const fetchMessages = async () => {
    try {
      setLoading(true);
      const res = await apiClient.get(`/chat/messages/${id}`);
      setMessages([...res.data].reverse());
    } catch (e) {
      console.warn('Failed to fetch messages', e);
    } finally {
      setLoading(false);
    }
  };

  const assignToMe = async () => {
    if (!user?._id) return;
    try {
      await crmApi.performAction(id, 'assign_agent', { agentId: user._id });
      await Promise.all([
        fetchContact(),
        fetchStats() // Sync global badges/dashboard
      ]);
    } catch (e) {
      console.warn('Failed to assign lead', e);
    }
  };

  const handleSummarize = async () => {
    if (loadingSummary) return;
    setLoadingSummary(true);
    try {
      const res = await apiClient.get(`/chat/summarize/${id}`);
      setAiSummary(res.data);
    } catch (e) {
      console.warn('AI Summarization failed', e);
    } finally {
      setLoadingSummary(false);
    }
  };

  const handleAssignAgent = async (agentId: string) => {
    try {
      await crmApi.performAction(id, 'assign_agent', { agentId });
      await Promise.all([
        fetchContact(),
        fetchStats() // Sync global badges/dashboard
      ]);
    } catch (e) {
      console.warn('Failed to reassign lead', e);
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
    const isMine = item.direction === 'OUTBOUND';
    const isInternal = item.isInternal;
    const isEmojiOnly = item.type === 'text' && typeof item.content === 'string' && 
                        item.content.length <= 4 && 
                        /^(\u00a9|\u00ae|[\u2000-\u3300]|\ud83c[\ud000-\udfff]|\ud83d[\ud000-\udfff]|\ud83e[\ud000-\udfff])+$/.test(item.content);

    return (
      <View style={[
        styles.messageRow, 
        isMine ? styles.myMessageRow : styles.theirMessageRow,
        isInternal ? { marginVertical: 8, paddingHorizontal: 4 } : {}
      ]}>
        {isInternal && (
          <View style={styles.internalLabelRow}>
            <Icon name="lock" size={10} color="#f57c00" />
            <Text style={styles.internalLabel}>PRIVATE TEAM NOTE</Text>
          </View>
        )}
        <View style={[
          styles.messageBubble,
          isInternal 
            ? styles.internalBubble 
            : (isMine ? styles.myBubble : styles.theirBubble),
          isEmojiOnly ? styles.emojiBubble : {}
        ]}>
          {item.type === 'image' && (
            <Image 
              source={{ uri: item.content?.startsWith('/') ? `${BASE_URL}/api${item.content}` : item.content }} 
              style={styles.messageImage} 
              resizeMode="cover"
            />
          )}
          {item.type === 'text' && (
            <Text style={[
              styles.messageText, 
              isInternal ? styles.internalText : (isMine ? styles.myMessageText : styles.theirMessageText),
              isEmojiOnly ? { fontSize: 48, lineHeight: 60 } : {}
            ]}>
              {item.content}
            </Text>
          )}
          {isInternal && (
            <Text style={styles.senderName}>— {item.sender?.name || 'Agent'}</Text>
          )}
          {!isEmojiOnly && (
            <View style={styles.timeRow}>
              <Text style={[styles.messageTime, isInternal ? { color: '#f57c00' } : {}]}>
                {item.timestamp ? new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
              </Text>
              {isMine && !isInternal && (
                <View style={{ marginLeft: 3 }}>
                  {item.status === 'READ' ? (
                    <Icon name="check-all" size={13} color="#34B7F1" />
                  ) : item.status === 'DELIVERED' ? (
                    <Icon name="check-all" size={13} color="#8696a0" />
                  ) : item.status === 'SENT' ? (
                    <Icon name="check" size={13} color="#8696a0" />
                  ) : item.status === 'FAILED' ? (
                    <Icon name="alert-circle" size={13} color="#f44336" />
                  ) : (
                    <Icon name="clock-outline" size={11} color="#8696a0" style={{ marginTop: 1 }} />
                  )}
                </View>
              )}
            </View>
          )}
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
        <View style={{ flex: 1 }}>
          <Text variant="titleMedium" style={styles.headerTitle}>{name}</Text>
          <Text variant="labelSmall" style={{ color: 'rgba(255,255,255,0.7)' }}>
            {contact?.assignedAgent?.name ? `Assigned to: ${contact.assignedAgent.name}` : 'Unassigned'}
          </Text>
        </View>
        <IconButton 
          icon="information-outline" 
          iconColor="#fff" 
          size={24} 
          onPress={() => {
            setInfoVisible(true);
            fetchAgents();
          }} 
        />
      </View>

      <Portal>
        <Modal 
          visible={infoVisible} 
          onDismiss={() => setInfoVisible(false)} 
          contentContainerStyle={styles.modalContent}
        >
          <View style={styles.modalHeader}>
            <Text variant="titleLarge">Lead Intelligence</Text>
            <IconButton icon="close" onPress={() => setInfoVisible(false)} />
          </View>
          
          <ScrollView style={styles.modalBody}>
            <Text variant="labelLarge" style={styles.sectionTitle}>AI QUALIFICATION DATA</Text>
            
            {/* AI Summary Section */}
            {!aiSummary ? (
               <Button 
                 mode="contained" 
                 loading={loadingSummary} 
                 onPress={handleSummarize}
                 style={styles.summaryButton}
                 icon="sparkles"
               >
                 ✨ Ask AI for TL;DR
               </Button>
            ) : (
               <View style={styles.summaryContainer}>
                  <Text variant="labelSmall" style={styles.summaryLabel}>🎯 GOAL</Text>
                  <Text variant="bodyMedium" style={styles.summaryValue}>{aiSummary.goal}</Text>
                  
                  <Text variant="labelSmall" style={[styles.summaryLabel, { marginTop: 8 }]}>🚩 PAIN POINT</Text>
                  <Text variant="bodyMedium" style={styles.summaryValue}>{aiSummary.painPoint}</Text>
                  
                  <View style={styles.nextStepBox}>
                     <Text variant="labelSmall" style={styles.nextStepLabel}>🚀 NEXT STEP</Text>
                     <Text variant="bodyMedium" style={styles.nextStepValue}>{aiSummary.nextStep}</Text>
                  </View>

                  <TouchableOpacity onPress={() => setAiSummary(null)}>
                     <Text style={styles.refreshText}>Regenerate Summary</Text>
                  </TouchableOpacity>
               </View>
            )}

            <View style={styles.dataRow}>
              <Text variant="bodyMedium" style={styles.dataLabel}>Status:</Text>
              <Text variant="bodyMedium" style={[styles.dataValue, { color: '#ff9800', fontWeight: 'bold' }]}>{contact?.status || 'NEW'}</Text>
            </View>
            <View style={styles.dataRow}>
              <Text variant="bodyMedium" style={styles.dataLabel}>Education:</Text>
              <Text variant="bodyMedium" style={styles.dataValue}>{contact?.qualification || 'Not Captured'}</Text>
            </View>
            <View style={styles.dataRow}>
              <Text variant="bodyMedium" style={styles.dataLabel}>Program:</Text>
              <Text variant="bodyMedium" numberOfLines={1} style={[styles.dataValue, { maxWidth: '60%' }]}>
                {contact?.selectedProgram || 'Not Selected'}
              </Text>
            </View>

            <View style={styles.divider} />

            <View style={[styles.priorityCard, { backgroundColor: contact?.heatLevel === 'Hot' ? '#ffebee' : contact?.heatLevel === 'Warm' ? '#fff3e0' : '#f5f5f5' }]}>
               <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <Icon 
                    name="fire" 
                    size={24} 
                    color={contact?.heatLevel === 'Hot' ? '#f44336' : contact?.heatLevel === 'Warm' ? '#ff9800' : '#757575'} 
                  />
                  <View style={{ marginLeft: 12 }}>
                    <Text variant="labelSmall" style={{ color: contact?.heatLevel === 'Hot' ? '#c62828' : '#666' }}>AI CONVERSION SCORE</Text>
                    <Text variant="headlineSmall" style={{ fontWeight: '900', color: contact?.heatLevel === 'Hot' ? '#c62828' : '#111' }}>
                      {contact?.score || 0}<Text variant="titleSmall">/100</Text>
                    </Text>
                  </View>
               </View>
               <Text variant="labelMedium" style={{ marginTop: 8, fontStyle: 'italic', opacity: 0.7 }}>
                 {contact?.heatLevel === 'Hot' ? '🔥 Extremely high buying intent detected.' : contact?.heatLevel === 'Warm' ? '⚡ Good engagement, ready for follow-up.' : '❄️ Low interaction, needs nurturing.'}
               </Text>
            </View>
            <View style={styles.dataRow}>
              <Text variant="bodyMedium" style={styles.dataLabel}>Call Time:</Text>
              <Text variant="bodyMedium" style={styles.dataValue}>{contact?.preferredCallTime || 'Not Set'}</Text>
            </View>

            <Divider style={styles.divider} />
            
            <Text variant="labelLarge" style={styles.sectionTitle}>ASSIGNMENT</Text>
            {contact?.assignedAgent ? (
               <View style={styles.assignmentInfo}>
                  <Text variant="bodyMedium">Lead managed by: <Text style={{ fontWeight: 'bold' }}>{contact.assignedAgent.name}</Text></Text>
                  <Button mode="outlined" style={{ marginTop: 8 }} onPress={assignToMe}>Reassign to Me</Button>
               </View>
            ) : (
               <Button mode="contained" style={styles.claimButton} onPress={assignToMe}>Claim Lead</Button>
            )}

            <Divider style={styles.divider} />

            <Text variant="labelLarge" style={styles.sectionTitle}>ACTIVITY HISTORY</Text>
            {contact?.timeline && contact.timeline.length > 0 ? (
              contact.timeline.reverse().map((event: any, idx: number) => (
                <View key={idx} style={styles.historyItem}>
                  <View style={styles.historyDot} />
                  <View style={{ flex: 1 }}>
                    <Text variant="bodySmall" style={styles.historyTime}>
                      {new Date(event.timestamp).toLocaleString()}
                    </Text>
                    <Text variant="bodyMedium" style={styles.historyDesc}>{event.description}</Text>
                  </View>
                </View>
              ))
            ) : (
              <Text variant="bodySmall" style={{ textAlign: 'center', opacity: 0.5, marginVertical: 10 }}>No history recorded</Text>
            )}
            
            <View style={{ height: 40 }} />
          </ScrollView>
        </Modal>
      </Portal>

      {contact && (contact.qualification || contact.selectedProgram || contact.status === 'FOLLOW_UP') && (
        <View style={styles.leadInfoBar}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ alignItems: 'center' }}>
            {contact.status === 'FOLLOW_UP' && (
              <View style={[styles.miniBadge, { backgroundColor: '#fff3e0', borderColor: '#ffe0b2' }]}>
                <Text style={[styles.miniBadgeText, { color: '#e65100' }]}>WAITING FOR AGENT</Text>
              </View>
            )}
            {contact.qualification && (
              <View style={[styles.miniBadge, { backgroundColor: '#e3f2fd', borderColor: '#bbdefb' }]}>
                <Text style={[styles.miniBadgeText, { color: '#1565c0' }]}>{contact.qualification.toUpperCase()}</Text>
              </View>
            )}
            {contact.selectedProgram && (
              <View style={[styles.miniBadge, { backgroundColor: '#f3e5f5', borderColor: '#e1bee7' }]}>
                <Text style={[styles.miniBadgeText, { color: '#7b1fa2' }]}>{contact.selectedProgram.substring(0, 30).toUpperCase()}</Text>
              </View>
            )}
          </ScrollView>
        </View>
      )}
      
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
  messageRow: {
    marginVertical: 4,
    width: '100%',
  },
  myMessageRow: {
    alignItems: 'flex-end',
  },
  theirMessageRow: {
    alignItems: 'flex-start',
  },
  messageBubble: {
    maxWidth: '80%',
    padding: 8,
    borderRadius: 8,
    elevation: 1,
  },
  myBubble: {
    backgroundColor: '#DCF8C6',
    borderTopRightRadius: 0,
  },
  theirBubble: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 0,
  },
  internalBubble: {
    backgroundColor: '#FFF9C4', // Amber/Yellow
    borderWidth: 1,
    borderColor: '#FBC02D',
    borderStyle: 'dashed',
    alignSelf: 'center',
    maxWidth: '90%',
  },
  internalLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
    width: '100%',
  },
  internalLabel: {
    fontSize: 9,
    fontWeight: 'bold',
    color: '#F57C00',
    marginLeft: 4,
    letterSpacing: 1,
  },
  internalText: {
    color: '#5D4037',
    fontStyle: 'italic',
  },
  senderName: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#F57C00',
    marginTop: 4,
    fontStyle: 'italic',
  },
  messageImage: {
    width: 250,
    height: 250,
    borderRadius: 4,
    marginBottom: 4,
  },
  emojiBubble: {
    backgroundColor: 'transparent',
    elevation: 0,
  },
  myMessageText: {
    color: '#111B21',
  },
  theirMessageText: {
    color: '#111B21',
  },
  messageText: {
    fontSize: 15,
    color: '#111B21',
  },
  messageTime: {
    fontSize: 10,
    color: '#667781',
  },
  timeRow: {
    flexDirection: 'row',
    alignItems: 'center',
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
  leadInfoBar: {
    backgroundColor: '#fff',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    height: 44,
  },
  miniBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
    borderWidth: 1,
    marginRight: 8,
  },
  miniBadgeText: {
    fontSize: 9,
    fontWeight: 'bold',
  },
  modalContent: {
    backgroundColor: '#fff',
    margin: 20,
    borderRadius: 8,
    flex: 0.9,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  modalBody: {
    padding: 16,
  },
  sectionTitle: {
    color: '#667781',
    marginBottom: 12,
    marginTop: 8,
    fontSize: 11,
    letterSpacing: 1,
  },
  dataRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  dataLabel: {
    color: '#667781',
  },
  dataValue: {
    fontWeight: '500',
  },
  divider: {
    marginVertical: 16,
  },
  claimButton: {
    backgroundColor: '#075E54',
  },
  assignmentInfo: {
    padding: 12,
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
  },
  historyItem: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  historyDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#075E54',
    marginTop: 6,
    marginRight: 12,
  },
  historyTime: {
    color: '#667781',
    fontSize: 10,
    marginBottom: 2,
  },
  historyDesc: {
    color: '#111B21',
  },
  summaryButton: {
    marginBottom: 16,
    backgroundColor: '#075E54',
    borderRadius: 8,
  },
  summaryContainer: {
    backgroundColor: '#F0F7F4',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#C2E0D1',
    marginBottom: 16,
  },
  summaryLabel: {
    color: '#075E54',
    fontWeight: 'bold',
    fontSize: 10,
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  summaryValue: {
    color: '#111B21',
    lineHeight: 18,
    marginBottom: 8,
  },
  nextStepBox: {
    backgroundColor: '#fff',
    padding: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#075E54',
    borderStyle: 'dashed',
    marginTop: 4,
  },
  nextStepLabel: {
    color: '#075E54',
    fontWeight: 'bold',
    fontSize: 10,
    marginBottom: 2,
  },
  nextStepValue: {
    color: '#111B21',
    fontWeight: '600',
    fontStyle: 'italic',
  },
  refreshText: {
    color: '#075E54',
    fontSize: 11,
    fontWeight: 'bold',
    marginTop: 12,
    textAlign: 'center',
    textDecorationLine: 'underline',
  },
  priorityCard: {
    padding: 12,
    borderRadius: 12,
    marginVertical: 4,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.05)',
  }
});
