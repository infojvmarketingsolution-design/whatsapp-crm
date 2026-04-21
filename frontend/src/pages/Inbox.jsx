import React, { useState, useEffect, useRef } from 'react';
import { Search, Filter, Circle, X, Headphones, ShieldCheck, ChevronDown, Paperclip, Send, Image as ImageIcon, FileText, PhoneCall, UserPlus, StickyNote, CheckCircle2, MoreVertical, Calendar, Clock, Smile, Flame, Sparkles, Lock, Check, CheckCheck, AlertCircle, Trash2, Megaphone, Video, Home, School, MapPin, Phone, Users } from 'lucide-react';
import io from 'socket.io-client';
import { useLocation, useNavigate } from 'react-router-dom';

export default function Inbox({ roleAccess }) {
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const userRole = (user.role || 'AGENT').toUpperCase();
  const roleData = roleAccess?.[userRole];
  const isSuper = userRole === 'ADMIN' || userRole === 'SUPER_ADMIN';

  const rolePermissions = roleData?.permissions || [];
  const canAssignLead = isSuper || roleData?.allAccess || rolePermissions.includes('chat_assign_lead');
  const assignSelfOnly = !isSuper && !roleData?.allAccess && rolePermissions.includes('chat_assign_self_only');
  const [contacts, setContacts] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [noteText, setNoteText] = useState('');
  const [showNoteInput, setShowNoteInput] = useState(false);
  const [showStatusDropdown, setShowStatusDropdown] = useState(false);
  const [showCallModal, setShowCallModal] = useState(false);
  const [callOutcome, setCallOutcome] = useState('Connected');
  const [callCount, setCallCount] = useState(1);
  const [callDate, setCallDate] = useState('');
  const [callTime, setCallTime] = useState('');
  const [callNotes, setCallNotes] = useState('');
  const [showMeetingModal, setShowMeetingModal] = useState(false);
  const [meetingMode, setMeetingMode] = useState('Online Meeting (Zoom/Google)');
  const [meetingDate, setMeetingDate] = useState('');
  const [meetingDescription, setMeetingDescription] = useState('');
  const [showFollowupModal, setShowFollowupModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [followupHeading, setFollowupHeading] = useState('');
  const [followupType, setFollowupType] = useState('Call');
  const [followupDate, setFollowupDate] = useState('');
  const [followupTime, setFollowupTime] = useState('');
  const [followupDescription, setFollowupDescription] = useState('');
  const [followupVisitType, setFollowupVisitType] = useState('Office Visit');
  const [showTagInput, setShowTagInput] = useState(false);
  const [newTagName, setNewTagName] = useState('');
  const PREDEFINED_TAGS = ['Hot Lead', 'Warm Lead', 'Cold Lead', 'Interested', 'Not Interested', 'Spam'];
  const STATUSES = ['NEW LEAD', 'CONTACTED', 'INTERESTED', 'FOLLOW_UP', 'CLOSED_WON', 'CLOSED_LOST'];
  const [activeChat, setActiveChat] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [attachment, setAttachment] = useState(null);
  const [isPrivateNote, setIsPrivateNote] = useState(false);
  const [aiSummary, setAiSummary] = useState(null);
  const [loadingSummary, setLoadingSummary] = useState(false);
  const [showProfile, setShowProfile] = useState(true);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const fileInputRef = useRef(null);
  const emojiPickerRef = useRef(null);
  const messagesEndRef = useRef(null);
  const location = useLocation();
  const navigate = useNavigate();
  // userRole defined at top
  const [agents, setAgents] = useState([]);


  const EMOJIS = ['😀', '😂', '😍', '🙌', '🔥', '✅', '❌', '🚀', '🙏', '👍', '❤️', '⚠️', '⭐', '🎁', '📅', '💬', '🏠', '💼', '📊', '🤝'];

  // Handle navigation from Tasks page
  useEffect(() => {
    if (location.state?.selectedContact && contacts.length > 0) {
      const contact = contacts.find(c => c.phone === location.state.selectedContact);
      if (contact) {
        setActiveChat(contact);
        // Clear state to prevent re-selection
        navigate(location.pathname, { replace: true, state: {} });
      }
    }
  }, [location.state, contacts]);

  // Add an emoji to the message input
  const addEmoji = (emoji) => {
    setNewMessage(prev => prev + emoji);
    setShowEmojiPicker(false);
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (emojiPickerRef.current && !emojiPickerRef.current.contains(event.target)) {
        setShowEmojiPicker(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);
  
  const isEmojiOnly = (text) => {
    if (!text || typeof text !== 'string') return false;
    // Simple regex for common emojis
    const emojiRegex = /^(\u00a9|\u00ae|[\u2000-\u3300]|\ud83c[\ud000-\udfff]|\ud83d[\ud000-\udfff]|\ud83e[\ud000-\udfff]|[\s])*$/g;
    return emojiRegex.test(text.trim());
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleAction = async (action, payload) => {
    try {
      const token = localStorage.getItem('token');
      const tenantId = localStorage.getItem('tenantId');
      const res = await fetch(`/api/chat/contacts/${activeChat._id}/action`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'x-tenant-id': tenantId,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ action, payload })
      });
       if (res.ok) {
          const data = await res.json();
          
          if (action === 'archive_lead' || action === 'hard_delete_lead') {
            setContacts(prev => prev.filter(c => c._id !== activeChat._id));
            setActiveChat(null);
            setShowDeleteModal(false);
            return;
          }

          setActiveChat(data.contact);
          setContacts(prev => prev.map(c => c._id === data.contact._id ? {...c, ...data.contact} : c));
          setShowNoteInput(false);
          setNoteText('');
          setShowStatusDropdown(false);
          setShowCallModal(false);
          setShowMeetingModal(false);
          setShowFollowupModal(false);
          setFollowupHeading('');
          setFollowupDescription('');
          setFollowupDate('');
          setFollowupTime('');
          setCallCount(1);
          setCallDate('');
          setCallTime('');
          setMeetingDescription('');
          setShowTagInput(false);
          setNewTagName('');
          // toast is not imported in original snippet but used - keeping as is if it exists globally
          if (window.toast) window.toast.success("Lead Updated Successfully");
       } else {
          if (window.toast) window.toast.error("Failed to update lead");
       }
    } catch (err) {
      console.error("Action failed", err);
    }
  };

  const handleSendMessage = async (e, customMessage = null) => {
    e?.preventDefault();
    const msgContent = customMessage || newMessage.trim();
    if (!msgContent && !attachment) return;
    
    try {
      const token = localStorage.getItem('token');
      const tenantId = localStorage.getItem('tenantId');
      
      const formData = new FormData();
      formData.append('contactId', activeChat._id);
      if (msgContent) formData.append('content', msgContent);
      if (attachment && !customMessage) formData.append('media', attachment);
      if (isPrivateNote && !customMessage) formData.append('isInternal', 'true');

      const res = await fetch('/api/chat/send', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'x-tenant-id': tenantId
        },
        body: formData
      });

      if (res.ok) {
        const sentMsg = await res.json();
        setMessages(prev => [...prev, sentMsg]);
        setIsPrivateNote(false);
        
        // BUMP CONTACT TO TOP & Update Preview
        setContacts(prev => {
           const exists = prev.find(c => c._id === activeChat._id);
           if (exists) {
              const others = prev.filter(c => c._id !== activeChat._id);
              const updated = { 
                ...exists, 
                lastMessage: sentMsg.content, 
                lastMessageAt: sentMsg.timestamp || new Date().toISOString() 
              };
              return [updated, ...others];
           }
           return prev;
        });

        if (!customMessage) {
           setNewMessage('');
           setAttachment(null);
           if (fileInputRef.current) fileInputRef.current.value = '';
        }
        scrollToBottom();
      } else {
        const errData = await res.json();
        alert(`Send Error: ${errData.message || errData.error || 'Unknown error'}`);
      }
    } catch (err) {
      console.error("Failed to send message", err);
      alert(`Network/Client Error: ${err.message}`);
    }
  };

  const handleSummarize = async () => {
    if (!activeChat || loadingSummary) return;
    setLoadingSummary(true);
    try {
      const token = localStorage.getItem('token');
      const tenantId = localStorage.getItem('tenantId');
      const res = await fetch(`/api/chat/summarize/${activeChat._id}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'x-tenant-id': tenantId
        }
      });
      if (res.ok) {
        setAiSummary(await res.json());
      } else {
        const errorData = await res.json();
        alert(`Summarization Failed: ${errorData.message || 'Unknown error. check backend logs.'}`);
      }
    } catch (err) {
      console.error("AI Summarization failed", err);
    } finally {
      setLoadingSummary(false);
    }
  };

  const activeChatRef = useRef(activeChat);
  useEffect(() => {
    activeChatRef.current = activeChat;
    if (activeChat?._id) {
       localStorage.setItem('activeChatId', activeChat._id);
    }
  }, [activeChat]);

  // 🔥 Live Socket.io Connection for Real-Time Webhooks
  useEffect(() => {
    const tenantId = localStorage.getItem('tenantId');
    const socket = io('', { query: { tenantId } });
    
    socket.on('new_message', (newMsg) => {
       // Only inject if it's the active chat
       setMessages(prev => {
          if (prev.find(m => m._id === newMsg._id)) return prev;
          if (activeChatRef.current && activeChatRef.current._id === newMsg.contactId) {
             return [...prev, newMsg];
          }
          return prev;
       });
       
       // Dynamically update contact list to bump the chat up
       setContacts(prev => {
          const exists = prev.find(c => c._id === newMsg.contactId);
          if (exists) {
             const others = prev.filter(c => c._id !== newMsg.contactId);
             // Update last message preview in sidebar immediately
             const updatedContact = { 
                ...exists, 
                lastMessage: newMsg.content, 
                lastMessageAt: newMsg.timestamp || new Date().toISOString() 
             };
             return [updatedContact, ...others];
          }
          
          if (newMsg.contact) {
            const newContact = { 
               ...newMsg.contact, 
               role: 'WhatsApp Chat',
               lastMessage: newMsg.content,
               lastMessageAt: newMsg.timestamp || new Date().toISOString()
            };
            return [newContact, ...prev];
          }
          return prev;
       });
    });

    socket.on('message_status_update', (data) => {
      console.log(`[Socket] Received status update: ${data.status} for msg ${data.messageId}`);
      setMessages(prev => prev.map(m => 
        m.messageId === data.messageId ? { ...m, status: data.status } : m
      ));
    });

    socket.on('lead_score_updated', (data) => {
      console.log(`[Socket] Lead Priority Updated: Contact ${data.contactId} -> Score ${data.score}`);
      setContacts(prev => prev.map(c => 
        c._id === data.contactId ? { ...c, score: data.score, heatLevel: data.heatLevel } : c
      ));
      if (activeChatRef.current && activeChatRef.current._id === data.contactId) {
        setActiveChat(prev => ({ ...prev, score: data.score, heatLevel: data.heatLevel }));
      }
    });

    socket.on('contact_updated', (data) => {
      const { contactId, contact } = data;
      setContacts(prev => {
         const showAssignedOnly = roleData?.permissions?.includes('chat_show_assigned_only');
         const isAssignedToMe = contact.assignedAgent?.toString() === user._id?.toString();
         
         // If restricted to assigned leads and lead is no longer assigned to me, remove from list
         if (showAssignedOnly && !isAssignedToMe && !isSuper) {
            return prev.filter(c => c._id !== contactId);
          }
          
          const exists = prev.find(c => c._id === contactId);
          if (exists) {
             return prev.map(c => c._id === contactId ? { ...c, ...contact } : c);
          } else if (isAssignedToMe || !showAssignedOnly || isSuper) {
             // If it's a new assignment for me, add it to the top
             return [{ ...contact, role: contact.source || 'WhatsApp Chat' }, ...prev];
          }
          return prev;
       });

       // Also update active chat if matches
       if (activeChatRef.current && activeChatRef.current._id === contactId) {
          setActiveChat(prev => ({ ...prev, ...contact }));
       }
    });

    return () => socket.disconnect();
  }, [roleAccess, user._id, isSuper]);

  // Fetch Inbox Contacts from Database
  useEffect(() => {
    const fetchContacts = async () => {
      try {
        const token = localStorage.getItem('token');
        const tenantId = localStorage.getItem('tenantId');
        if (!token) return;

        const res = await fetch('/api/chat/contacts', {
          headers: { 'Authorization': `Bearer ${token}`, 'x-tenant-id': tenantId }
        });
        if (res.ok) {
           const data = await res.json();
           if (data && data.length > 0) {
              const mapped = data.map(c => ({
                 ...c,
                 role: c.source || 'WhatsApp Chat',
              }));
              setContacts(mapped);

              // RESTORE SESSION: Prioritize localStorage for persistence (PRD FR4)
              const storedId = localStorage.getItem('activeChatId');
              if (storedId && storedId !== 'null' && storedId !== 'undefined') {
                const found = mapped.find(c => c._id === storedId);
                if (found) {
                   setActiveChat(found);
                } else if (!activeChatRef.current) {
                   setActiveChat(mapped[0]); // Fallback if stored ID not found
                }
              } else if (!activeChatRef.current) {
                setActiveChat(mapped[0]);
              }
           }
        }
      } catch (err) {
        console.error("Backend API unavailable.", err);
      }
    };

    const fetchAgents = async () => {
      try {
        const token = localStorage.getItem('token');
        const tenantId = localStorage.getItem('tenantId');
        const res = await fetch('/api/chat/agents', {
          headers: { 'Authorization': `Bearer ${token}`, 'x-tenant-id': tenantId }
        });
        if (res.ok) {
          setAgents(await res.json());
        }
      } catch (err) {
        console.error("Failed to fetch agents", err);
      }
    };

    fetchContacts();
    fetchAgents();
  }, []);


  // Fetch Message Thread for Active Contact
  useEffect(() => {
    if (!activeChat?._id) {
       setMessages([]);
       return;
    }
    const fetchMessages = async () => {
      try {
        const token = localStorage.getItem('token');
        const tenantId = localStorage.getItem('tenantId');
        const res = await fetch(`/api/chat/messages/${activeChat._id}`, {
          headers: { 'Authorization': `Bearer ${token}`, 'x-tenant-id': tenantId }
        });
        if (res.ok) {
           setMessages(await res.json());
        }
      } catch (err) {
        console.error("Message load failed", err);
      }
    };
    fetchMessages();
  }, [activeChat]);

  // Utility to determine avatar numeric ID based on string length magic
  const getAvatarUrl = (name) => {
     return `https://ui-avatars.com/api/?name=${encodeURIComponent(name || 'User')}&background=114a43&color=fff&size=100&font-size=0.4&bold=true`;
  };

  const filteredContacts = contacts
    .filter(c => {
      if (!searchQuery) return true;
      const q = searchQuery.toLowerCase();
      const nameMatch = c.name?.toLowerCase().includes(q);
      const phoneMatch = c.phone?.toLowerCase().includes(q);
      return nameMatch || phoneMatch;
    })
    .sort((a, b) => new Date(b.lastMessageAt || 0) - new Date(a.lastMessageAt || 0));

  return (
    <div className="flex h-full bg-white rounded-3xl shadow-[0_4px_30px_rgb(0,0,0,0.06)] overflow-hidden border border-gray-50 flex-row animate-fade-in relative z-10 w-[calc(100%-12px)] ml-3 my-3">
      
      {/* Contact List Panel (Left) */}
      <div className="w-[340px] border-r border-gray-100 flex flex-col bg-white shrink-0 z-10">
        
        <div className="p-3 bg-white flex items-center border-b border-gray-50 h-16">
          <div className="relative w-full">
            <Search className="absolute left-3 top-2.5 text-[var(--theme-bg)] opacity-70" size={16} />
            <input 
              type="text" 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search name or mobile number" 
              className="w-full bg-gray-50 border-none rounded-lg py-2 pl-10 pr-4 text-xs font-medium outline-none text-gray-700 placeholder-gray-400"
            />
          </div>
        </div>

        {/* Global header tab */}
        <div className="bg-[var(--theme-bg)] text-white flex items-center px-4 py-2.5 text-[10px] font-bold tracking-wider justify-between">
           <div className="flex space-x-4">
             <span className="border-b-2 border-[var(--theme-border)] pb-1">ACTIVE ({contacts.length})</span>
           </div>
           <ChevronDown size={14} className="cursor-pointer" />
        </div>

        {/* Top small avatars representing active queues */}
        <div className="bg-[var(--theme-bg)] px-4 py-2 flex items-center space-x-2.5 overflow-x-auto custom-scrollbar">
           {contacts.slice(0,6).map((c, i) => (
              <div key={i} className="relative shrink-0 cursor-pointer hover:-translate-y-0.5 transition-transform" onClick={() => setActiveChat(c)}>
                <img src={getAvatarUrl(c.name)} className="w-7 h-7 rounded-full border border-teal-700/50" />
                {i === 0 && <span className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-brand-light border-2 border-brand-dark rounded-full shadow-sm"></span>}
              </div>
           ))}
        </div>

        {/* Contact Items */}
        <div className="flex-1 overflow-y-auto custom-scrollbar bg-[#fcfcfd]">
          {filteredContacts.length === 0 ? (
            <div className="p-6 text-center text-xs font-medium text-gray-400">No contacts match your search.</div>
          ) : (
            filteredContacts.map((c) => (
              <div 
                key={c._id} 
                onClick={() => setActiveChat(c)}
                className={`p-4 cursor-pointer flex items-center space-x-4 transition-colors relative border-b border-gray-50 ${
                  activeChat && activeChat._id === c._id 
                    ? 'bg-[#eef5fa] border-l-4 border-blue-500' 
                    : 'hover:bg-gray-50 border-l-4 border-transparent'
                } ${c.status === 'FOLLOW_UP' ? 'bg-orange-50/30' : ''}`}
              >
                <div className="relative">
                  <img src={getAvatarUrl(c.name)} className="w-11 h-11 rounded-full shadow-sm object-cover border border-white" />
                  {c.status === 'FOLLOW_UP' && (
                    <span className="absolute -top-1 -right-1 flex h-3 w-3">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-orange-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-3 w-3 bg-orange-500 border border-white"></span>
                    </span>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-center">
                    <div className="flex items-center space-x-1.5 flex-1 min-w-0">
                      <h3 className={`text-sm font-bold truncate ${
                          activeChat && activeChat._id === c._id ? 'text-gray-900' : 'text-gray-800'
                        }`}>{c.name}</h3>
                      {c.heatLevel === 'Hot' && <Flame size={14} className="text-red-500 animate-pulse fill-red-500/20" />}
                      {c.heatLevel === 'Warm' && <Flame size={13} className="text-orange-400 fill-orange-400/10" />}
                    </div>
                    <div className="flex flex-col items-end">
                      {c.score > 0 && (
                        <span className={`text-[9px] font-black px-1.5 py-0.5 rounded-full border shadow-sm ${
                          c.score >= 70 ? 'bg-red-50 text-red-600 border-red-100' : 
                          c.score >= 40 ? 'bg-orange-50 text-orange-600 border-orange-100' : 
                          'bg-gray-50 text-gray-500 border-gray-100'
                        }`}>
                          {c.score}
                        </span>
                      )}
                      {c.status === 'FOLLOW_UP' && (
                        <span className="text-[8px] font-bold bg-orange-100 text-orange-600 px-1 py-0.5 rounded border border-orange-200 uppercase tracking-tighter mt-1">Waiting</span>
                      )}
                    </div>
                  </div>
                  <p className="text-[12px] text-gray-500 truncate mt-0.5">
                    {c.lastMessage || c.role}
                  </p>
                </div>
              </div>
            ))
        )}
        </div>
      </div>

      {/* Chat Area (Middle) */}
      <div className="flex-1 flex flex-col bg-[#eef0eb] relative min-w-0 border-r border-gray-100 shadow-[inset_10px_0_20px_-10px_rgba(0,0,0,0.02)]">
        
        {activeChat ? (
        <>
        {/* Chat Header */}
        <div className="h-[52px] bg-[var(--theme-bg)] text-white flex items-center px-6 shadow-sm z-20 justify-between shrink-0">
          <div className="flex items-center space-x-3">
            <img src={getAvatarUrl(activeChat?.name)} className="w-8 h-8 rounded-full object-cover shadow-sm border border-white/20" alt="avatar" />
            <div className="flex flex-col">
               <span className="font-semibold text-sm leading-tight">{activeChat?.name}</span>
                <span className="text-white/70 text-[10px] font-medium tracking-wide leading-tight">
                  {activeChat?.phone}
                  <span className="ml-2 text-[10px] opacity-40 font-mono italic">v1.1.2 Diagnostics Active</span>
                </span>
             </div>
          </div>
          <div className="flex items-center space-x-2">
            <button 
               onClick={() => setShowProfile(!showProfile)}
               className={`text-xs font-bold transition-colors px-3 py-1 rounded-md ${showProfile ? 'bg-teal-700 text-white' : 'text-teal-100 hover:text-white bg-teal-800/50'}`}
            >
            Chat Profile
          </button>
        </div>
        </div>
        
        {/* Chat Feed */}
        <div className="flex-1 p-8 overflow-y-auto flex flex-col space-y-6 relative z-10 custom-scrollbar" style={{ backgroundImage: 'radial-gradient(circle, #e5dfd5 1px, transparent 1px)', backgroundSize: '30px 30px' }}>
           
           {/* Loop through live DB messages if available */}
           {messages.length > 0 ? (
              messages.map((m, idx) => (
                 <div key={m._id || idx} className={`relative group max-w-[70%] w-fit animate-msg-enter ${m.direction === 'OUTBOUND' ? 'self-end' : 'self-start'}`} style={{ animationDelay: `${idx * 0.1}s` }}>
                   
                   {/* Internal Team Note Decoration */}
                   {m.isInternal && (
                     <div className="flex items-center space-x-1 mb-1 px-1">
                       <Lock size={10} className="text-amber-600" />
                       <span className="text-[9px] font-bold text-amber-700 uppercase tracking-widest">Internal Team Note</span>
                     </div>
                   )}

                   <div className={`${
                     m.isInternal 
                       ? 'bg-amber-50 border-amber-200 text-amber-900 rounded-sm italic shadow-sm' 
                       : (m.direction === 'OUTBOUND' ? 'bg-[var(--theme-bg)] text-white rounded-2xl rounded-tr-sm shadow-md' : 'bg-white text-gray-800 rounded-2xl rounded-tl-sm shadow-sm border border-gray-100')
                   } p-3.5 relative overflow-hidden min-w-[60px]`}>
                     
                     {/* Image/Media Message Handling */}
                     {(m.type === 'image' || (typeof m.content === 'string' && m.content.includes('[Media]'))) && (
                       <div className="mb-2 -mx-1 -mt-1">
                         {(() => {
                            let imgUrl = '';
                            let caption = '';
                            
                            if (m.content?.includes('[Media]')) {
                               const parts = m.content.split('\n');
                               imgUrl = parts[0].replace('[Media] ', '').trim();
                               caption = parts.slice(1).join('\n');
                            } else if (m.content?.startsWith('/')) {
                               imgUrl = '/api' + m.content;
                            } else {
                               imgUrl = m.content;
                            }

                            return (
                              <div className="rounded-xl overflow-hidden bg-black/5 border border-white/10 max-w-full">
                                <img 
                                  src={imgUrl} 
                                  className="w-full h-auto max-h-[300px] object-cover cursor-pointer hover:opacity-90 transition-opacity"
                                  onClick={() => window.open(imgUrl)}
                                  onError={(e) => { e.target.style.display='none'; }}
                                  alt="Media content" 
                                />
                                {caption && (
                                  <p className="px-3 py-2 text-xs leading-relaxed opacity-95 whitespace-pre-wrap border-t border-white/5 bg-black/10">
                                    {caption}
                                  </p>
                                )}
                              </div>
                            );
                         })()}
                       </div>
                     )}

                     {/* Video/Doc Placeholders (Refined) */}
                     {m.type === 'video' && <div className={`mb-2 flex items-center space-x-2 p-2.5 rounded-xl text-xs ${m.isInternal ? 'text-amber-800 bg-amber-200/50' : 'text-white/90 bg-black/20'}`}><ImageIcon size={14}/> <span>Video Attachment</span></div>}
                     {m.type === 'document' && <div className={`mb-2 flex items-center space-x-2 p-2.5 rounded-xl text-xs ${m.isInternal ? 'text-amber-800 bg-amber-200/50' : 'text-white/90 bg-black/20'}`}><FileText size={14}/> <span>Document Attachment</span></div>}
                     
                     {/* Message Text Content (Excluding the [Media] string if already rendered as image) */}
                     {(!m.content?.includes('[Media]') || m.type === 'text') && (
                        <p 
                          className={`leading-relaxed ${isEmojiOnly(m.content) ? 'text-5xl py-2 mb-1' : 'text-[13.5px] font-medium whitespace-pre-wrap break-words'}`}
                          style={isEmojiOnly(m.content) ? { fontFamily: '"Apple Color Emoji", "Segoe UI Emoji", "Noto Color Emoji", sans-serif' } : {}}
                        >
                          {(m.content && typeof m.content === 'object') ? JSON.stringify(m.content) : (m.content || '[Empty Message]')}
                        </p>
                     )}
                   </div>
                    <div className="flex items-center justify-end space-x-1 mt-1 px-1">
                      <span className="text-[10px] text-gray-400 font-medium">
                        {m.isInternal ? `Internal Note by ${m.sender?.name || 'Agent'}` : (m.direction === 'OUTBOUND' ? 'You' : activeChat.name)} • {new Date(m.timestamp || Date.now()).toLocaleTimeString()}
                      </span>
                      {m.direction === 'OUTBOUND' && !m.isInternal && (
                        <div className="ml-1 flex items-center">
                          {m.status === 'READ' ? (
                            <CheckCheck size={14} className="text-blue-500" />
                          ) : m.status === 'DELIVERED' ? (
                            <CheckCheck size={14} className="text-gray-400" />
                          ) : m.status === 'SENT' ? (
                            <Check size={14} className="text-gray-400" />
                          ) : m.status === 'FAILED' ? (
                            <AlertCircle size={14} className="text-red-500" />
                          ) : (
                            <Clock size={12} className="text-gray-300" />
                          )}
                        </div>
                      )}
                    </div>
                 </div>
              ))
           ) : (
             <div className="text-center text-gray-400 mt-10 font-medium">No messages in this conversation.</div>
           )}
           {/* Invisible element to auto-scroll to */}
           <div ref={messagesEndRef} />
        </div>
        
        {/* Chat Input Footer */}
        <div className="bg-white border-t border-gray-100 p-4 shrink-0 flex items-center space-x-3 z-20 shadow-[0_-5px_15px_rgba(0,0,0,0.01)] relative">
           
           {/* Attachment Preview (if any) */}
           {attachment && (
             <div className="absolute -top-16 left-4 bg-white shadow-lg border border-gray-100 rounded-lg p-2 px-3 flex items-center space-x-2 text-xs font-semibold animate-fade-in text-gray-700">
                <Paperclip size={14} className="text-teal-600" />
                <span className="truncate max-w-[150px]">{attachment.name}</span>
                <X size={14} className="text-gray-400 cursor-pointer hover:text-red-500 ml-2" onClick={() => { setAttachment(null); if (fileInputRef.current) fileInputRef.current.value = ''; }} />
             </div>
           )}

           <input 
             type="file" 
             ref={fileInputRef} 
             className="hidden" 
             onChange={(e) => setAttachment(e.target.files[0])}
             accept="image/*,video/*,.pdf,.doc,.docx"
           />
           <button 
             onClick={() => fileInputRef.current?.click()}
             className={`p-2.5 rounded-full transition-colors ${attachment ? 'bg-teal-50 text-teal-600' : 'text-gray-400 hover:bg-gray-50'}`}
           >
             <Paperclip size={20} />
           </button>

           <div className="relative" ref={emojiPickerRef}>
              <button 
                type="button"
                onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                className={`p-2.5 rounded-full transition-colors ${showEmojiPicker ? 'bg-yellow-50 text-yellow-600' : 'text-gray-400 hover:bg-gray-50'}`}
              >
                <Smile size={20} />
              </button>
              {showEmojiPicker && (
                <div className="absolute bottom-full left-0 mb-3 p-3 bg-white shadow-[0_10px_40px_rgba(0,0,0,0.1)] border border-gray-100 rounded-2xl grid grid-cols-5 gap-2 z-50 animate-pop-in min-w-[200px]">
                  {EMOJIS.map(e => (
                    <button type="button" key={e} onClick={() => addEmoji(e)} className="text-xl hover:scale-125 transition-transform p-1 hover:bg-gray-50 rounded border-none bg-transparent text-gray-800">{e}</button>
                  ))}
                </div>
              )}
           </div>
           
           <button 
             onClick={() => setIsPrivateNote(!isPrivateNote)}
             className={`p-2.5 rounded-full transition-all shrink-0 border border-gray-100/50 ${isPrivateNote ? 'bg-amber-100 border-amber-300 shadow-sm' : 'text-gray-400 hover:bg-gray-50'}`}
             title={isPrivateNote ? "Private Note Mode Active" : "Regular WhatsApp Message"}
           >
             <Lock size={20} className={isPrivateNote ? "text-amber-600" : "text-gray-400"} />
           </button>

           <form onSubmit={handleSendMessage} className={`flex-1 flex items-center space-x-3 rounded-full px-4 border transition-all ${isPrivateNote ? 'bg-amber-50/50 border-amber-200' : 'bg-gray-50 border-gray-100 focus-within:ring-2 ring-teal-500/20 focus-within:border-teal-400'}`}>
             <input 
               type="text" 
               placeholder={isPrivateNote ? "Type a private internal note..." : "Type a message..."}
               value={newMessage}
               onChange={(e) => setNewMessage(e.target.value)}
               className="w-full bg-transparent border-none py-3 text-sm font-medium outline-none text-gray-800 placeholder-gray-400"
             />
           </form>

           <button 
             onClick={handleSendMessage}
             disabled={!newMessage.trim() && !attachment}
             className="p-3 bg-[var(--theme-bg)] text-white rounded-full shrink-0 hover:bg-teal-900 transition-transform hover:scale-105 active:scale-95 disabled:opacity-50 disabled:pointer-events-none disabled:transform-none shadow-md"
           >
             <Send size={18} className="translate-x-0.5" />
           </button>
        </div>
        </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-gray-400 font-medium bg-[#fcfcfd]">
            Select a contact to view messages
          </div>
        )}
      </div>

      {/* Chat Profile Panel (Right) */}
      {activeChat && showProfile && (
      <div className="w-[300px] bg-[#fdfdfd] flex flex-col shrink-0 z-20 overflow-y-auto custom-scrollbar shadow-[-5px_0_15px_rgba(0,0,0,0.01)] animate-fade-in">
         
         <div className="p-8 pb-6 flex flex-col items-center justify-center border-b border-gray-50 text-center relative mt-2">
            <img src={getAvatarUrl(activeChat?.name)} className="w-24 h-24 rounded-full shadow-lg object-cover border-4 border-white mb-4" />
            
            <button 
              onClick={() => setShowDeleteModal(!showDeleteModal)}
              className="absolute top-4 right-4 p-2 bg-red-50 text-red-500 rounded-full hover:bg-red-100 transition-colors shadow-sm border border-red-100"
              title="Delete Lead Options"
            >
              <Trash2 size={16} />
            </button>

            {showDeleteModal && (
              <div className="absolute top-14 right-4 bg-white border border-gray-100 rounded-xl shadow-xl p-2 z-50 w-48 animate-pop-in">
                <button 
                  onClick={() => handleAction('archive_lead', {})}
                  className="w-full text-left p-2.5 text-xs font-bold text-gray-700 hover:bg-orange-50 hover:text-orange-700 rounded-lg transition-colors flex items-center space-x-2 mb-1"
                >
                  <Clock size={14} />
                  <span>Delete lead only fronthead</span>
                </button>
                <button 
                  onClick={() => {
                    if (window.confirm("Are you sure? This will PERMANENTLY delete this lead and ALL message history from the database!")) {
                      handleAction('hard_delete_lead', {});
                    }
                  }}
                  className="w-full text-left p-2.5 text-xs font-bold text-red-600 hover:bg-red-50 rounded-lg transition-colors flex items-center space-x-2"
                >
                  <AlertCircle size={14} />
                  <span>Delete this lead from database also</span>
                </button>
              </div>
            )}

            <h2 className="text-xl font-bold text-gray-800">{activeChat?.name}</h2>
            <p className="text-sm text-gray-500 font-semibold tracking-wide mt-1">{activeChat?.phone || '+91 987654321'}</p>
         </div>

         {/* 1-Click Action Panel */}
         <div className="px-6 pt-2 pb-4">
            <div className="grid grid-cols-4 gap-2">
               <button onClick={() => { setShowCallModal(!showCallModal); setShowMeetingModal(false); setShowNoteInput(false); setShowFollowupModal(false); }} className="flex flex-col items-center justify-center bg-gray-50 hover:bg-gray-100 border border-gray-100 rounded-xl p-3 transition-all text-[var(--theme-text)]">
                  <PhoneCall size={18} className="mb-1.5 opacity-80" />
                  <span className="text-[9px] font-bold uppercase tracking-wider">Call</span>
               </button>
               <button onClick={() => { setShowMeetingModal(!showMeetingModal); setShowCallModal(false); setShowNoteInput(false); setShowFollowupModal(false); }} className="flex flex-col items-center justify-center bg-gray-50 hover:bg-gray-100 border border-gray-100 rounded-xl p-3 transition-all text-[var(--theme-text)]">
                  <Calendar size={18} className="mb-1.5 opacity-80" />
                  <span className="text-[9px] font-bold uppercase tracking-wider">Meet</span>
               </button>
               <button onClick={() => { setShowNoteInput(!showNoteInput); setShowCallModal(false); setShowMeetingModal(false); setShowFollowupModal(false); }} className="flex flex-col items-center justify-center bg-gray-50 hover:bg-gray-100 border border-gray-100 rounded-xl p-3 transition-all text-[var(--theme-text)]">
                  <StickyNote size={18} className="mb-1.5 opacity-80" />
                  <span className="text-[9px] font-bold uppercase tracking-wider">Note</span>
               </button>
               <button onClick={() => { setShowFollowupModal(!showFollowupModal); setShowCallModal(false); setShowMeetingModal(false); setShowNoteInput(false); }} className="flex flex-col items-center justify-center bg-gray-50 hover:bg-gray-100 border border-gray-100 rounded-xl p-3 transition-all text-[var(--theme-text)]">
                  <Clock size={18} className="mb-1.5 opacity-80" />
                  <span className="text-[9px] font-bold uppercase tracking-wider">Follow</span>
               </button>
            </div>

            {showCallModal && (
               <div className="mt-3 bg-blue-50 p-4 rounded-xl border border-blue-200 animate-fade-in relative shadow-sm">
                 <h4 className="text-xs font-bold text-blue-900 mb-3 tracking-wide flex items-center"><PhoneCall size={14} className="mr-1.5"/> Log a Call</h4>
                 <select value={callOutcome} onChange={e => setCallOutcome(e.target.value)} className="w-full mb-2 bg-white border border-blue-100 rounded p-1.5 text-xs text-gray-700 outline-none focus:border-blue-300">
                    <option>Connected</option>
                    <option>Not Answered</option>
                    <option>Busy</option>
                    <option>Interested</option>
                    <option>Not Interested</option>
                 </select>
                 
                 <div className="flex space-x-2 mb-2">
                    <input type="date" value={callDate} onChange={e => setCallDate(e.target.value)} className="w-1/2 bg-white border border-blue-100 rounded p-1.5 text-xs text-gray-700 outline-none focus:border-blue-300" />
                    <input type="time" value={callTime} onChange={e => setCallTime(e.target.value)} className="w-1/2 bg-white border border-blue-100 rounded p-1.5 text-xs text-gray-700 outline-none focus:border-blue-300" />
                 </div>

                 <input type="number" min="1" value={callCount} onChange={e => setCallCount(e.target.value)} placeholder="Call Count (e.g. 1)" className="w-full mb-2 bg-white border border-blue-100 rounded p-1.5 text-xs text-gray-700 outline-none focus:border-blue-300" />
                 
                 <textarea value={callNotes} onChange={e => setCallNotes(e.target.value)} placeholder="Description..." rows="2" className="w-full bg-white border border-blue-100 rounded p-1.5 text-xs text-gray-700 outline-none resize-none focus:border-blue-300"></textarea>
                 
                 <div className="flex justify-end mt-2">
                    <button 
                        onClick={async () => {
                           let callMsg = '';
                           if (callOutcome === 'Connected') {
                               callMsg = `Thank you for connecting with us today!`;
                           } else if (callOutcome === 'Not Answered') {
                               callMsg = `We tried to call you but you didn't answer. Please provide a suitable time for calling.`;
                           } else if (callOutcome === 'Busy') {
                               callMsg = `You were busy when we called. Please provide a convenient time for us to call you.`;
                           } else if (callOutcome === 'Interested') {
                               callMsg = `Thank you for your interest in our university.`;
                           } else if (callOutcome === 'Not Interested') {
                               callMsg = `Thank you for your time.`;
                           }

                           if (callDate && callTime) {
                               const d = new Date(`${callDate}T${callTime}`);
                               const formattedDate = d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
                               const formattedTime = d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
                               callMsg += `\n\nOur team's next call is scheduled for:\n📅 *${formattedDate}* at ⏰ *${formattedTime}*`;
                           }

                           await handleSendMessage(null, callMsg);
                           await handleAction('log_call', { outcome: callOutcome, count: callCount, date: callDate, time: callTime, notes: callNotes });

                           setShowCallModal(false);
                           setCallCount(1);
                           setCallDate('');
                           setCallTime('');
                           setCallNotes('');
                        }} 
                        className="bg-blue-600 hover:bg-blue-700 text-white text-[10px] font-bold px-4 py-1.5 rounded inline-block transition-colors"
                     >
                       Save Call Log
                    </button>
                 </div>
               </div>
            )}

            {showMeetingModal && (
                <div className="mt-4 bg-white/40 backdrop-blur-md p-5 rounded-2xl border border-purple-200/50 animate-fade-in relative shadow-xl overflow-hidden group">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/10 rounded-full -mr-16 -mt-16 blur-3xl group-hover:bg-purple-500/20 transition-all duration-700"></div>
                  <h4 className="text-[11px] font-black text-purple-900 mb-4 tracking-[0.2em] uppercase flex items-center"><Calendar size={14} className="mr-2 text-purple-600"/> Schedule Meeting</h4>
                  
                  <div className="grid grid-cols-3 gap-2 mb-4">
                     {[
                        { id: 'Online Meeting (Zoom/Google)', label: 'Online (Zoom/Google)', icon: <Video size={16}/>, color: 'indigo' },
                        { id: 'Office Visit', label: 'Office Visit', icon: <Home size={16}/>, color: 'purple' },
                        { id: 'Campus Visit', label: 'Campus Visit', icon: <School size={16}/>, color: 'teal' }
                     ].map(mode => (
                        <button 
                           key={mode.id}
                           onClick={() => setMeetingMode(mode.id)}
                           className={`flex flex-col items-center justify-center p-3 rounded-xl border-2 transition-all duration-300 ${
                              meetingMode === mode.id 
                              ? `bg-white border-purple-400 shadow-lg scale-[1.02]` 
                              : `bg-white/50 border-transparent hover:border-purple-200 hover:bg-white`
                           }`}
                        >
                           <div className={`mb-2 p-2 rounded-lg ${meetingMode === mode.id ? `bg-purple-100 text-purple-600` : 'bg-gray-100 text-gray-500'}`}>
                              {mode.icon}
                           </div>
                           <span className={`text-[10px] font-bold text-center leading-tight ${meetingMode === mode.id ? `text-purple-700` : 'text-gray-500'}`}>{mode.label}</span>
                        </button>
                     ))}
                  </div>

                  <div className="space-y-2">
                     <div className="relative">
                        <input 
                           type="datetime-local" 
                           value={meetingDate} 
                           onChange={e => setMeetingDate(e.target.value)} 
                           className="w-full bg-white/80 border border-purple-100/50 rounded-xl p-2.5 text-xs text-gray-700 font-bold focus:ring-2 focus:ring-purple-200 outline-none transition-all"
                        />
                     </div>
                     <div className="relative">
                        <textarea 
                           value={meetingDescription} 
                           onChange={e => setMeetingDescription(e.target.value)} 
                           placeholder="Description..." 
                           rows="2"
                           className="w-full bg-white/80 border border-purple-100/50 rounded-xl p-3 text-xs text-gray-700 font-bold focus:ring-2 focus:ring-purple-200 outline-none transition-all placeholder-purple-300 resize-none"
                        ></textarea>
                     </div>
                  </div>

                  <div className="flex justify-end mt-4">
                     <button 
                        onClick={async () => {
                           let locationLink = '';
                           const tenantId = localStorage.getItem('tenantId') || '';
                           if (meetingMode === 'Office Visit') {
                               locationLink = 'https://share.google/9q0vsZgIu4a5StO6L';
                           } else if (meetingMode === 'Campus Visit' && tenantId.toLowerCase().includes('gandhinagar')) {
                               locationLink = 'https://share.google/QjmS6jP5PqmnXWniH';
                           }

                           // Send message first before modal closes
                           const d = new Date(meetingDate);
                           const formattedDate = d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
                           const formattedTime = d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
                           
                           let msg = '';
                           if (meetingMode === 'Campus Visit') {
                               msg = `🎉 *You're Invited!*\n\nYour *Campus Visit* is scheduled! 🌟\n\n📅 *${formattedDate}*\n⏰ *${formattedTime}*\n`;
                               if (locationLink) msg += `\n📍 ${locationLink}\n`;
                               msg += `\n🔥 Explore the campus\n🤝 Meet our team\n🚀 Start your journey\n\n👉 Don’t miss it—see you there!`;
                           } else if (meetingMode === 'Office Visit') {
                               msg = `🎉 *You're Invited!*\n\nYour *Office Visit* is scheduled! 🌟\n\n📅 *${formattedDate}*\n⏰ *${formattedTime}*\n`;
                               if (locationLink) msg += `\n📍 ${locationLink}\n`;
                               msg += `\n🏢 See our workspace\n🤝 Meet our team\n🚀 Start your journey\n\n👉 Don’t miss it—see you there!`;
                           } else {
                               msg = `✨ *Meeting Confirmed!*\n\nYour *${meetingMode}* is scheduled! 🌟\n\n📅 *${formattedDate}*\n⏰ *${formattedTime}*\n\n💻 We will share the meeting link with you shortly.\n\n🤝 Meet our team\n🚀 Discuss your journey\n\n👉 Don’t miss it—see you online!`;
                           }

                           await handleSendMessage(null, msg);
                           await handleAction('schedule_meeting', { mode: meetingMode, dateTime: meetingDate, location: locationLink, description: meetingDescription });

                           setShowMeetingModal(false);
                           setMeetingDate('');
                           setMeetingDescription('');
                        }} 
                        className="bg-purple-600 hover:bg-purple-700 text-white text-[10px] font-black uppercase tracking-wider px-6 py-2.5 rounded-xl shadow-lg shadow-purple-600/20 active:scale-95 transition-all"
                     >
                        Confirm Schedule
                     </button>
                  </div>
                </div>
            )}

            {showNoteInput && (
               <div className="mt-3 bg-yellow-50 p-3 rounded-xl border border-yellow-200 animate-fade-in relative">
                 <textarea 
                   value={noteText}
                   onChange={e => setNoteText(e.target.value)}
                   className="w-full bg-transparent border-none text-xs font-medium text-yellow-900 placeholder-yellow-700/50 outline-none resize-none"
                   placeholder="Write an internal note..."
                   rows="3"
                 ></textarea>
                 <div className="flex justify-end mt-2">
                    <button onClick={() => handleAction('add_note', { note: noteText })} className="bg-yellow-400 hover:bg-yellow-500 text-yellow-900 text-[10px] font-bold px-3 py-1 rounded inline-block transition-colors">
                       Save Note
                    </button>
                 </div>
               </div>
            )}
            
            {showFollowupModal && (
                <div className="mt-4 bg-orange-50/60 backdrop-blur-md p-5 rounded-2xl border border-orange-200/50 animate-fade-in relative shadow-xl overflow-hidden group">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-orange-500/10 rounded-full -mr-16 -mt-16 blur-3xl group-hover:bg-orange-500/20 transition-all duration-700"></div>
                  <h4 className="text-[11px] font-black text-orange-900 mb-4 tracking-[0.2em] uppercase flex items-center"><Clock size={14} className="mr-2 text-orange-600"/> Set Follow-up</h4>
                  
                  <input 
                     type="text" 
                     value={followupHeading} 
                     onChange={e => setFollowupHeading(e.target.value)} 
                     placeholder="Interaction Subject..." 
                     className="w-full mb-3 bg-white/80 border border-orange-100/50 rounded-xl p-2.5 text-xs text-gray-700 font-bold focus:ring-2 focus:ring-orange-200 outline-none transition-all placeholder-orange-300" 
                  />
                  
                  <div className="flex space-x-2 mb-3">
                     {['Call', 'Meeting', 'Update'].map(type => (
                        <button 
                           key={type}
                           onClick={() => setFollowupType(type)}
                           className={`flex-1 py-2 rounded-xl text-[10px] font-black uppercase transition-all ${
                              followupType === type 
                              ? 'bg-orange-600 text-white shadow-md' 
                              : 'bg-white/50 text-orange-600 border border-orange-100 hover:bg-white'
                           }`}
                        >
                           {type}
                        </button>
                     ))}
                  </div>

                  {followupType === 'Meeting' && (
                     <div className="flex bg-white/50 p-1 rounded-xl mb-3 border border-teal-100">
                        {['Office Visit', 'Campus Visit'].map(visit => (
                           <button 
                              key={visit}
                              onClick={() => setFollowupVisitType(visit)}
                              className={`flex-1 py-1.5 rounded-lg text-[9px] font-black uppercase transition-all ${
                                 followupVisitType === visit 
                                 ? 'bg-teal-500 text-white shadow-inner scale-95' 
                                 : 'text-teal-600 hover:text-teal-800'
                              }`}
                           >
                              {visit}
                           </button>
                        ))}
                     </div>
                  )}
                    
                  <div className="flex space-x-2 mb-3">
                     <input type="date" value={followupDate} onChange={e => setFollowupDate(e.target.value)} className="w-1/2 bg-white/80 border border-orange-100/50 rounded-xl p-2.5 text-xs text-gray-700 font-bold outline-none ring-2 ring-transparent focus:ring-orange-200 transition-all" />
                     <input type="time" value={followupTime} onChange={e => setFollowupTime(e.target.value)} className="w-1/2 bg-white/80 border border-orange-100/50 rounded-xl p-2.5 text-xs text-gray-700 font-bold outline-none ring-2 ring-transparent focus:ring-orange-200 transition-all" />
                  </div>

                  <textarea 
                     value={followupDescription} 
                     onChange={e => setFollowupDescription(e.target.value)} 
                     placeholder="Interaction details & expectations..." 
                     rows="3" 
                     className="w-full bg-white/80 border border-orange-100/50 rounded-xl p-3 text-xs text-gray-700 font-bold outline-none resize-none ring-2 ring-transparent focus:ring-orange-200 transition-all placeholder-orange-300"
                  ></textarea>

                  <div className="flex justify-end mt-4">
                     <button 
                       onClick={() => handleAction('add_followup', { 
                         title: `[${followupType}${followupType === 'Meeting' ? `: ${followupVisitType}` : ''}] ${followupHeading}`, 
                         dateTime: new Date(`${followupDate}T${followupTime || '09:00'}`).toISOString(),
                         description: followupDescription,
                         metadata: { visitType: followupType === 'Meeting' ? followupVisitType : null }
                       })} 
                       className="bg-orange-600 hover:bg-orange-700 text-white text-[10px] font-black uppercase tracking-wider px-6 py-2.5 rounded-xl shadow-lg shadow-orange-600/20 active:scale-95 transition-all"
                     >
                        Confirm Follow-up
                     </button>
                  </div>
                </div>
             )}
         </div>

         {/* AI Lead Intelligence Block */}
         <div className="px-6 py-2 pb-3">
             {/* AI Summary Action */}
             {!aiSummary ? (
                <button 
                  onClick={handleSummarize}
                  disabled={loadingSummary}
                  className="w-full mb-4 py-2 bg-gradient-to-r from-teal-500 to-emerald-500 text-white rounded-xl text-xs font-bold shadow-md hover:shadow-lg transition-all active:scale-95 flex items-center justify-center space-x-2 disabled:opacity-50"
                >
                  <Sparkles size={14} className={loadingSummary ? "animate-spin" : "animate-pulse"} />
                  <span>{loadingSummary ? "Summarizing Lead..." : "✨ Generate AI Summary"}</span>
                </button>
             ) : (
                <div className="mb-4 bg-gradient-to-br from-indigo-50 to-blue-50 border border-indigo-100 rounded-xl p-4 shadow-sm relative animate-fade-in">
                   <div className="absolute top-0 right-0 p-1 bg-indigo-100 rounded-bl-lg">
                      <Sparkles size={12} className="text-indigo-600" />
                   </div>
                   <h3 className="text-[10px] font-bold text-indigo-800 mb-3 tracking-widest uppercase">
                     AI Conversation Summary
                   </h3>
                   <div className="space-y-3">
                      <div>
                         <span className="text-[9px] font-bold text-indigo-400 uppercase">🎯 Lead Goal</span>
                         <p className="text-xs text-indigo-900 font-medium leading-relaxed">{aiSummary.goal}</p>
                      </div>
                      <div>
                         <span className="text-[9px] font-bold text-indigo-400 uppercase">🚩 Pain Point</span>
                         <p className="text-xs text-indigo-900 font-medium leading-relaxed">{aiSummary.painPoint}</p>
                      </div>
                      <div className="pt-2 border-t border-indigo-200/50">
                         <span className="text-[9px] font-bold text-emerald-500 uppercase">🚀 Suggested Next Step</span>
                         <p className="text-xs text-indigo-900 font-bold bg-white/50 p-2 rounded-lg mt-1 italic leading-relaxed border border-emerald-100">
                           {aiSummary.nextStep}
                         </p>
                      </div>
                   </div>
                   <button 
                     onClick={() => setAiSummary(null)}
                     className="mt-3 text-[9px] font-bold text-indigo-400 hover:text-indigo-600 underline"
                   >
                     Refresh Summary
                   </button>
                </div>
             )}

             {(activeChat?.qualification || activeChat?.selectedProgram || activeChat?.preferredCallTime) && (
                <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-4 shadow-sm relative overflow-hidden">
                   <div className="absolute top-0 right-0 p-1 bg-emerald-100 rounded-bl-lg">
                     <ShieldCheck size={12} className="text-emerald-600" />
                   </div>
                   <h3 className="text-[10px] font-bold text-emerald-800 mb-3 tracking-widest uppercase flex items-center">
                     AI Lead Intelligence
                   </h3>
                  <div className="space-y-2.5">
                     {activeChat.qualification && (
                        <div className="flex flex-col">
                           <span className="text-[9px] font-bold text-emerald-600/70 uppercase">Qualification</span>
                           <span className="text-xs font-bold text-emerald-900">{activeChat.qualification}</span>
                        </div>
                     )}
                     {activeChat.selectedProgram && (
                        <div className="flex flex-col">
                           <span className="text-[9px] font-bold text-emerald-600/70 uppercase">Selected Program</span>
                           <span className="text-xs font-bold text-emerald-900 leading-tight">{activeChat.selectedProgram}</span>
                        </div>
                     )}
                     {activeChat.preferredCallTime && (
                        <div className="flex flex-col">
                           <span className="text-[9px] font-bold text-emerald-600/70 uppercase">Preferred Call Time</span>
                           <span className="text-xs font-bold text-emerald-900 leading-tight flex items-center">
                             <Clock size={12} className="mr-1 mt-0.5" /> {activeChat.preferredCallTime}
                           </span>
                        </div>
                     )}
                   </div>
                </div>
             )}
         </div>

          <div className="px-6 py-2">
             <div className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-xl p-4 border border-indigo-100/50 shadow-sm relative overflow-hidden">
                <div className="absolute top-0 right-0 p-1 bg-indigo-100 rounded-bl-lg">
                   <Megaphone size={12} className="text-indigo-600" />
                </div>
                <h3 className="text-[10px] font-bold text-indigo-800 mb-3 tracking-widest uppercase">
                   Counselling & Admission
                </h3>
                <div className="space-y-3">
                   <div className="flex justify-between items-center text-[10px]">
                      <span className="text-indigo-600 font-bold uppercase">Visit Status</span>
                      <select 
                         value={activeChat?.visitStatus || 'Not Visited'} 
                         onChange={(e) => handleAction('update_contact', { visitStatus: e.target.value })}
                         className="bg-white border border-indigo-100 rounded px-2 py-1 text-[10px] font-bold outline-none"
                      >
                         <option value="Not Visited">Not Visited</option>
                         <option value="Visited">Visited</option>
                      </select>
                   </div>
                   <div className="flex justify-between items-center text-[10px]">
                      <span className="text-indigo-600 font-bold uppercase">Admission</span>
                      <select 
                         value={activeChat?.admissionStatus || 'None'} 
                         onChange={(e) => handleAction('update_contact', { admissionStatus: e.target.value })}
                         className="bg-white border border-indigo-100 rounded px-2 py-1 text-[10px] font-bold outline-none"
                      >
                         <option value="None">None</option>
                         <option value="Pending">Pending</option>
                         <option value="Admitted">Admitted</option>
                         <option value="Cancelled">Cancelled</option>
                      </select>
                   </div>
                   <div className="pt-1">
                      <span className="text-[9px] font-bold text-indigo-400 uppercase block mb-1">Total Collection (₹)</span>
                      <input 
                         type="number" 
                         placeholder="0"
                         value={activeChat?.collectionAmount || ''} 
                         onChange={(e) => handleAction('update_contact', { collectionAmount: Number(e.target.value) || 0 })}
                         className="w-full bg-white border border-indigo-100 rounded px-2 py-1 text-[10px] font-bold outline-none"
                      />
                   </div>
                   <div>
                      <span className="text-[9px] font-bold text-indigo-400 uppercase block mb-1">Pending Collection (₹)</span>
                      <input 
                         type="number" 
                         placeholder="0"
                         value={activeChat?.pendingCollectionAmount || ''} 
                         onChange={(e) => handleAction('update_contact', { pendingCollectionAmount: Number(e.target.value) || 0 })}
                         className="w-full bg-white border border-indigo-100 rounded px-2 py-1 text-[10px] font-bold outline-none"
                      />
                   </div>
                   <div className="flex items-center space-x-2 pt-1">
                      <input 
                         type="checkbox" 
                         checked={activeChat?.isClosed || false} 
                         onChange={(e) => handleAction('update_contact', { isClosed: e.target.checked })}
                         className="w-3 h-3 rounded text-indigo-600 border-indigo-300"
                      />
                      <span className="text-[10px] font-bold text-indigo-800 uppercase">Mark as Closed</span>
                   </div>
                </div>
             </div>
          </div>
         <div className="px-6 py-2 pb-5">
            <div className="bg-gradient-to-br from-[#def3ee] to-[#e8f7f4] rounded-xl p-4 border border-teal-100/50 shadow-sm">
              <div className="space-y-4">
                  <div className="flex justify-between items-center text-xs relative">
                    <span className="text-teal-800/70 font-bold tracking-wide">PIPELINE STATUS</span>
                    <div className="relative">
                      <button onClick={() => setShowStatusDropdown(!showStatusDropdown)} className="flex items-center space-x-1.5 bg-white px-2.5 py-1 rounded shadow-sm border border-teal-100 text-[var(--theme-text)] font-bold tracking-wide uppercase text-[10px] hover:bg-teal-50 transition">
                         <span>{activeChat?.status?.replace('_', ' ') || 'NEW LEAD'}</span>
                         <ChevronDown size={12} />
                      </button>
                      {showStatusDropdown && (
                         <div className="absolute right-0 top-full mt-1 w-36 bg-white border border-gray-100 rounded-lg shadow-xl z-50 overflow-hidden py-1 animate-fade-in">
                            {STATUSES.map(s => (
                              <div 
                                 key={s} 
                                 onClick={() => handleAction('update_status', { status: s })}
                                 className="px-3 py-2 text-[10px] uppercase font-bold text-gray-600 hover:bg-teal-50 hover:text-[var(--theme-text)] cursor-pointer transition"
                              >
                                {s.replace('_', ' ')}
                              </div>
                            ))}
                         </div>
                      )}
                    </div>
                  </div>
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-teal-800/70 font-bold tracking-wide">Last Active</span>
                    <span className="text-teal-900 font-bold">{new Date().toLocaleDateString()}</span>
                  </div>
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-teal-800/70 font-bold tracking-wide">Source</span>
                    <span className="text-teal-900 font-bold">{activeChat?.source || 'CTWA Lead'}</span>
                  </div>

                  {/* LEAD OWNERSHIP & TEAM */}
                  <div className="pt-4 border-t border-teal-200/50 space-y-4">
                    <div className="flex items-center space-x-2 mb-2">
                       <ShieldCheck size={14} className="text-teal-600" />
                       <span className="text-[10px] font-black text-teal-800 tracking-[0.2em] uppercase">Ownership & Team</span>
                    </div>

                    {/* Sales Rep (Telecaller) */}
                    <div>
                       <label className="text-[9px] font-black text-teal-800/50 uppercase tracking-widest block mb-1.5 ml-1">Sales Rep (Telecaller)</label>
                       <div className="relative group">
                          <Users size={12} className="absolute left-3 top-1/2 -translate-y-1/2 text-teal-400 group-focus-within:text-teal-600" />
                          <select 
                             disabled={!canAssignLead}
                             value={activeChat?.assignedAgent || ''}
                             onChange={(e) => handleAction('update_contact', { assignedAgent: e.target.value })}
                             className={`w-full bg-white pl-9 pr-3 py-2 rounded-xl border border-teal-100 text-[10px] font-black tracking-wide uppercase outline-none focus:ring-4 focus:ring-teal-100/50 transition shadow-sm ${!canAssignLead ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer hover:border-teal-200'}`}
                          >
                             <option value="">Unassigned</option>
                             {agents
                               .filter(a => !assignSelfOnly || a._id === user._id)
                               .map(a => (
                                 <option key={a._id} value={a._id}>{a.name} ({a.role})</option>
                             ))}
                          </select>
                       </div>
                    </div>

                    {/* Expert Counselor (Counsellor) */}
                    <div>
                       <label className="text-[9px] font-black text-teal-800/50 uppercase tracking-widest block mb-1.5 ml-1">Expert Advisor (Counsellor)</label>
                       <div className="relative group">
                          <Headphones size={12} className="absolute left-3 top-1/2 -translate-y-1/2 text-blue-400 group-focus-within:text-blue-600" />
                          <select 
                             value={activeChat?.assignedCounsellor || ''}
                             onChange={(e) => handleAction('update_contact', { assignedCounsellor: e.target.value })}
                             className="w-full bg-white pl-9 pr-3 py-2 rounded-xl border border-teal-100 text-[10px] font-black tracking-wide uppercase outline-none focus:ring-4 focus:ring-teal-100/50 transition shadow-sm cursor-pointer hover:border-teal-200"
                          >
                             <option value="">No Counselor Assigned</option>
                             {agents
                               .filter(a => a.role === 'MANAGER_COUNSELLOUR' || a.role === 'ADMIN')
                               .map(a => (
                                 <option key={a._id} value={a._id}>{a.name}</option>
                             ))}
                          </select>
                       </div>
                    </div>

                    {!canAssignLead && (
                       <div className="p-3 bg-gray-50 rounded-xl border border-gray-100">
                          <p className="text-[9px] text-gray-400 font-bold italic leading-tight flex items-start">
                             <AlertCircle size={10} className="mr-1.5 mt-0.5 shrink-0" />
                             Assignment restricted by policy.
                          </p>
                       </div>
                    )}
                  </div>

                  <div className="flex justify-between items-center text-xs pt-1">
                    <span className="text-teal-800/70 font-bold tracking-wide">Opted In</span>
                    <div className="w-8 h-4 bg-[var(--theme-bg)] rounded-full relative shadow-inner cursor-pointer">
                      <div className="w-5 h-5 bg-white rounded-full absolute -top-0.5 -right-1 shadow border border-gray-100"></div>
                    </div>
                  </div>
              </div>
            </div>
         </div>

         <div className="px-6 py-2">
            <h3 className="text-xs font-bold text-gray-400 mb-2.5 tracking-wider uppercase">Campaigns</h3>
            <p className="text-[var(--theme-text)] font-bold text-sm tracking-wide hover:underline cursor-pointer inline-block">Republic_Day_Sale</p>
         </div>

         <div className="px-6 py-5 border-t border-gray-50 mt-2">
            <div className="flex justify-between items-center mb-3">
               <h3 className="text-xs font-bold text-gray-400 tracking-wider uppercase">Tags</h3>
               <button onClick={() => setShowTagInput(!showTagInput)} className="text-[10px] font-bold text-teal-600 hover:text-teal-800 uppercase tracking-wider bg-teal-50 px-2 py-0.5 rounded border border-teal-100">+ Add</button>
            </div>
            {showTagInput && (
               <div className="mb-3 animate-fade-in">
                  <div className="flex space-x-2 mb-2">
                     <input 
                       type="text" 
                       value={newTagName} 
                       onChange={e => setNewTagName(e.target.value)} 
                       placeholder="Custom tag..." 
                       className="flex-1 bg-white border border-teal-100 rounded px-2 py-1 text-xs outline-none focus:border-teal-300 shadow-sm"
                     />
                     <button 
                       onClick={() => { if(newTagName) handleAction('add_tag', { tag: newTagName }); }}
                       className="bg-teal-600 text-white text-[10px] font-bold px-3 py-1 rounded hover:bg-teal-700 transition shadow-sm"
                     >
                       Add
                     </button>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                     {PREDEFINED_TAGS.map(t => (
                        <button 
                           key={t}
                           onClick={() => handleAction('add_tag', { tag: t })}
                           className="px-2 py-0.5 bg-gray-50 text-gray-500 border border-gray-100 rounded text-[9px] font-bold hover:bg-teal-50 hover:text-teal-600 hover:border-teal-100 transition-colors"
                        >
                           + {t}
                        </button>
                     ))}
                  </div>
               </div>
            )}
            <div className="flex flex-wrap gap-2">
               {(activeChat?.tags || []).length > 0 ? (
                 activeChat.tags.map((tag, i) => (
                   <span key={i} className="px-3 py-1.5 bg-teal-50 text-teal-700 rounded-full text-[11px] font-extrabold tracking-wide flex items-center space-x-1 border border-teal-200 shadow-sm transition-all hover:border-teal-300">
                     <span>{tag}</span>
                     <X 
                       size={12} 
                       className="ml-1 opacity-60 hover:opacity-100 cursor-pointer" 
                       onClick={() => handleAction('remove_tag', { tag: tag })}
                     />
                   </span>
                 ))
               ) : (
                 <span className="text-[10px] text-gray-400 italic">No tags added yet.</span>
               )}
            </div>
         </div>

         <div className="px-6 py-3 flex-1 pb-10">
            <h3 className="text-xs font-bold text-gray-400 mb-5 tracking-wider uppercase">Lead Timeline</h3>
            <div className="relative pl-5 space-y-6 before:content-[''] before:absolute before:left-[7px] before:top-2 before:bottom-2 before:w-[3px] before:bg-gray-100">
              
              {(activeChat?.timeline || []).slice().reverse().map((event, idx) => {
                 let color = 'bg-gray-300', textColor = 'text-gray-700';
                 if (event.eventType === 'STATUS_CHANGE') { color = 'bg-blue-400'; textColor = 'text-blue-700'; }
                 if (event.eventType === 'NOTE_ADDED') { color = 'bg-yellow-400'; textColor = 'text-yellow-700'; }
                 if (event.eventType === 'CALL_LOGGED') { color = 'bg-green-400'; textColor = 'text-green-700'; }
                 if (event.eventType === 'MEETING_SCHEDULED') { color = 'bg-purple-400'; textColor = 'text-purple-700'; }
                 if (event.eventType === 'FOLLOWUP_SET') { color = 'bg-orange-400'; textColor = 'text-orange-700'; }
                 
                 return (
                   <div key={idx} className="relative animate-fade-in">
                     <div className={`absolute -left-[27px] top-1.5 w-3 h-3 rounded-full border-[3px] border-white shadow-sm z-10 ${color}`}></div>
                     <h4 className={`text-xs font-bold leading-tight ${textColor} pr-2`}>{event.description}</h4>
                     <p className="text-[9px] font-bold text-gray-400 mt-1 uppercase tracking-wide">{new Date(event.timestamp).toLocaleString()}</p>
                   </div>
                 );
              })}
              
              {/* Start of Journey Root marker */}
              <div className="relative">
                <div className="absolute -left-[27px] top-1.5 w-3 h-3 bg-[var(--theme-bg)] rounded-full border-[3px] border-white shadow-sm z-10"></div>
                <h4 className="text-xs font-bold text-[var(--theme-text)] leading-tight">Lead Captured</h4>
                <p className="text-[9px] font-bold text-gray-400 mt-1 uppercase tracking-wide">{new Date(activeChat?.createdAt || Date.now()).toLocaleString()}</p>
              </div>
              
            </div>
         </div>

      </div>
      )}
      
    </div>
  );
}
