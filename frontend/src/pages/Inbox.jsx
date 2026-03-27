import React, { useState, useEffect, useRef } from 'react';
import { Search, Filter, Circle, X, Headphones, ShieldCheck, ChevronDown, Paperclip, Send, Image as ImageIcon, FileText, PhoneCall, UserPlus, StickyNote, CheckCircle2, MoreVertical, Calendar, Clock, Smile } from 'lucide-react';
import io from 'socket.io-client';
import { useLocation, useNavigate } from 'react-router-dom';

export default function Inbox() {
  const [contacts, setContacts] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [noteText, setNoteText] = useState('');
  const [showNoteInput, setShowNoteInput] = useState(false);
  const [showStatusDropdown, setShowStatusDropdown] = useState(false);
  const [showCallModal, setShowCallModal] = useState(false);
  const [callOutcome, setCallOutcome] = useState('Connected');
  const [callDuration, setCallDuration] = useState(5);
  const [callNotes, setCallNotes] = useState('');
  const [showMeetingModal, setShowMeetingModal] = useState(false);
  const [meetingMode, setMeetingMode] = useState('Online');
  const [meetingDate, setMeetingDate] = useState('');
  const [meetingLocation, setMeetingLocation] = useState('');
  const [showFollowupModal, setShowFollowupModal] = useState(false);
  const [followupHeading, setFollowupHeading] = useState('');
  const [followupType, setFollowupType] = useState('Call');
  const [followupDate, setFollowupDate] = useState('');
  const [followupTime, setFollowupTime] = useState('');
  const [followupDescription, setFollowupDescription] = useState('');
  const [showTagInput, setShowTagInput] = useState(false);
  const [newTagName, setNewTagName] = useState('');
  const PREDEFINED_TAGS = ['Hot Lead', 'Warm Lead', 'Cold Lead', 'Interested', 'Not Interested', 'Spam'];
  const STATUSES = ['NEW LEAD', 'CONTACTED', 'INTERESTED', 'FOLLOW_UP', 'CLOSED_WON', 'CLOSED_LOST'];
  const [activeChat, setActiveChat] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [attachment, setAttachment] = useState(null);
  const [showProfile, setShowProfile] = useState(true);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const fileInputRef = useRef(null);
  const emojiPickerRef = useRef(null);
  const messagesEndRef = useRef(null);
  const location = useLocation();
  const navigate = useNavigate();

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
         setShowTagInput(false);
         setNewTagName('');
      }
    } catch (err) {
      console.error("Action failed", err);
    }
  };

  const handleSendMessage = async (e) => {
    e?.preventDefault();
    if (!newMessage.trim() && !attachment) return;
    
    try {
      const token = localStorage.getItem('token');
      const tenantId = localStorage.getItem('tenantId');
      
      const formData = new FormData();
      formData.append('contactId', activeChat._id);
      if (newMessage.trim()) formData.append('content', newMessage.trim());
      if (attachment) formData.append('media', attachment);

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
        
        // BUMP CONTACT TO TOP
        setContacts(prev => {
           const exists = prev.find(c => c._id === activeChat._id);
           if (exists) {
              const others = prev.filter(c => c._id !== activeChat._id);
              return [exists, ...others];
           }
           return prev;
        });

        setNewMessage('');
        setAttachment(null);
        if (fileInputRef.current) fileInputRef.current.value = '';
      } else {
        const errData = await res.json();
        alert(`Send Error: ${errData.message || errData.error || 'Unknown error'}`);
      }
    } catch (err) {
      console.error("Failed to send message", err);
      alert(`Network/Client Error: ${err.message}`);
    }
  };

  const activeChatRef = useRef(activeChat);
  useEffect(() => {
    activeChatRef.current = activeChat;
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
             return [exists, ...others];
          }
          
          if (newMsg.contact) {
            const newContact = { ...newMsg.contact, role: 'WhatsApp Chat' };
            return [newContact, ...prev];
          }
          return prev;
       });
    });

    return () => socket.disconnect();
  }, []);

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
              setActiveChat(mapped[0]);
           }
        }
      } catch (err) {
        console.error("Backend API unavailable.", err);
      }
    };
    fetchContacts();
  }, []);

  // Fetch Message Thread for Active Contact
  useEffect(() => {
    if (!activeChat || activeChat._id.length < 5) {
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

  const filteredContacts = contacts.filter(c => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    const nameMatch = c.name?.toLowerCase().includes(q);
    const phoneMatch = c.phone?.toLowerCase().includes(q);
    return nameMatch || phoneMatch;
  });

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
             <span className="text-teal-400/80 cursor-pointer">REQUESTING (0)</span>
             <span className="text-teal-400/80 cursor-pointer">INTERVENED (0)</span>
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
              }`}
            >
              <div className="relative">
                <img src={getAvatarUrl(c.name)} className="w-11 h-11 rounded-full shadow-sm object-cover border border-white" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className={`text-sm font-bold truncate ${
                    activeChat && activeChat._id === c._id ? 'text-gray-900' : 'text-gray-800'
                  }`}>{c.name}</h3>
                <p className="text-[12px] text-gray-500 truncate mt-0.5">{c.role}</p>
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
                  <span className="ml-2 text-[10px] opacity-40 font-mono italic">v1.1.0</span>
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
                   <div className={`${m.direction === 'OUTBOUND' ? 'bg-[var(--theme-bg)] text-white rounded-tr-sm' : 'bg-white text-gray-800 rounded-tl-sm'} p-4 rounded-2xl shadow-md border border-gray-100`}>
                     {/* Image Message */}
                     {m.type === 'image' && (
                       <div className="mb-2">
                         {m.content?.startsWith('/') ? (
                           <div 
                             className="overflow-hidden bg-gray-50 rounded-xl border border-gray-100/50" 
                             style={{ maxWidth: '280px', maxHeight: '180px' }}
                           >
                             <img 
                               src={'/api' + m.content} 
                               style={{ width: '100%', height: '180px', objectFit: 'cover', display: 'block' }}
                               className="cursor-pointer hover:scale-110 transition-transform duration-300" 
                               onClick={() => window.open('/api' + m.content)} 
                               alt="Attachment preview" 
                             />
                           </div>
                         ) : (
                           <div className="flex items-center space-x-2 text-white/90 bg-black/20 p-2 rounded-lg text-xs"><ImageIcon size={14}/> <span>Image Attached</span></div>
                         )}
                       </div>
                     )}

                     {/* Video/Doc Placeholders */}
                     {m.type === 'video' && <div className="mb-2 flex items-center space-x-2 text-white/90 bg-black/20 p-2 rounded-lg text-xs"><ImageIcon size={14}/> <span>Video Attached</span></div>}
                     {m.type === 'document' && <div className="mb-2 flex items-center space-x-2 text-white/90 bg-black/20 p-2 rounded-lg text-xs"><FileText size={14}/> <span>Document Attached</span></div>}
                     
                     {/* Message Text Content */}
                     {(!m.content || typeof m.content !== 'string' || !m.content.startsWith('/') || m.type === 'text') && (
                        <p 
                          className={`leading-relaxed font-medium ${isEmojiOnly(m.content) ? 'text-6xl py-2 mb-2 drop-shadow-md' : 'text-[14px]'}`}
                          style={isEmojiOnly(m.content) ? { fontFamily: '"Apple Color Emoji", "Segoe UI Emoji", "Noto Color Emoji", sans-serif' } : {}}
                        >
                          {(m.content && typeof m.content === 'object') ? JSON.stringify(m.content) : (m.content || '[Empty Message]')}
                        </p>
                     )}
                   </div>
                   <span className="text-[10px] text-gray-400 block mt-1 font-medium px-2">{m.direction === 'OUTBOUND' ? 'You' : activeChat.name} • {new Date(m.timestamp || Date.now()).toLocaleTimeString()}</span>
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
           
           <form onSubmit={handleSendMessage} className="flex-1 flex items-center space-x-3 bg-gray-50 rounded-full px-4 border border-gray-100 focus-within:ring-2 ring-teal-500/20 focus-within:border-teal-400 transition-all">
             <input 
               type="text" 
               placeholder="Type a message..." 
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
                 <input type="number" value={callDuration} onChange={e => setCallDuration(e.target.value)} placeholder="Duration (mins)" className="w-full mb-2 bg-white border border-blue-100 rounded p-1.5 text-xs text-gray-700 outline-none focus:border-blue-300" />
                 <textarea value={callNotes} onChange={e => setCallNotes(e.target.value)} placeholder="Call notes..." rows="2" className="w-full bg-white border border-blue-100 rounded p-1.5 text-xs text-gray-700 outline-none resize-none focus:border-blue-300"></textarea>
                 <div className="flex justify-end mt-2">
                    <button onClick={() => handleAction('log_call', { outcome: callOutcome, duration: callDuration, notes: callNotes })} className="bg-blue-600 hover:bg-blue-700 text-white text-[10px] font-bold px-4 py-1.5 rounded inline-block transition-colors">
                       Save Call Log
                    </button>
                 </div>
               </div>
            )}

            {showMeetingModal && (
               <div className="mt-3 bg-purple-50 p-4 rounded-xl border border-purple-200 animate-fade-in relative shadow-sm">
                 <h4 className="text-xs font-bold text-purple-900 mb-3 tracking-wide flex items-center"><Calendar size={14} className="mr-1.5"/> Schedule Meeting</h4>
                 <select value={meetingMode} onChange={e => setMeetingMode(e.target.value)} className="w-full mb-2 bg-white border border-purple-100 rounded p-1.5 text-xs text-gray-700 outline-none focus:border-purple-300">
                    <option>Online (Zoom/Meet)</option>
                    <option>Offline (Office)</option>
                    <option>Phone Call</option>
                 </select>
                 <input type="datetime-local" value={meetingDate} onChange={e => setMeetingDate(e.target.value)} className="w-full mb-2 bg-white border border-purple-100 rounded p-1.5 text-xs text-gray-700 outline-none focus:border-purple-300" />
                 <input type="text" value={meetingLocation} onChange={e => setMeetingLocation(e.target.value)} placeholder="Link or Location..." className="w-full mb-2 bg-white border border-purple-100 rounded p-1.5 text-xs text-gray-700 outline-none focus:border-purple-300" />
                 <div className="flex justify-end mt-2">
                    <button onClick={() => handleAction('schedule_meeting', { mode: meetingMode, dateTime: meetingDate, location: meetingLocation })} className="bg-purple-600 hover:bg-purple-700 text-white text-[10px] font-bold px-4 py-1.5 rounded inline-block transition-colors">
                       Schedule Meeting
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
               <div className="mt-3 bg-orange-50 p-4 rounded-xl border border-orange-200 animate-fade-in relative shadow-sm">
                 <h4 className="text-xs font-bold text-orange-900 mb-3 tracking-wide flex items-center"><Clock size={14} className="mr-1.5"/> Set Follow-up</h4>
                 <input type="text" value={followupHeading} onChange={e => setFollowupHeading(e.target.value)} placeholder="Heading/Subject..." className="w-full mb-2 bg-white border border-orange-100 rounded p-1.5 text-xs text-gray-700 outline-none focus:border-orange-300" />
                 <select value={followupType} onChange={e => setFollowupType(e.target.value)} className="w-full mb-2 bg-white border border-orange-100 rounded p-1.5 text-xs text-gray-700 outline-none focus:border-orange-300">
                    <option>Call</option>
                    <option>Meeting</option>
                    <option>Update</option>
                 </select>
                 <div className="flex space-x-2 mb-2">
                    <input type="date" value={followupDate} onChange={e => setFollowupDate(e.target.value)} className="w-1/2 bg-white border border-orange-100 rounded p-1.5 text-xs text-gray-700 outline-none focus:border-orange-300" />
                    <input type="time" value={followupTime} onChange={e => setFollowupTime(e.target.value)} className="w-1/2 bg-white border border-orange-100 rounded p-1.5 text-xs text-gray-700 outline-none focus:border-orange-300" />
                 </div>
                 <textarea value={followupDescription} onChange={e => setFollowupDescription(e.target.value)} placeholder="Description..." rows="2" className="w-full bg-white border border-orange-100 rounded p-1.5 text-xs text-gray-700 outline-none resize-none focus:border-orange-300"></textarea>
                 <div className="flex justify-end mt-2">
                    <button 
                      onClick={() => handleAction('add_followup', { 
                        title: `[${followupType}] ${followupHeading}`, 
                        dateTime: new Date(`${followupDate}T${followupTime || '09:00'}`).toISOString(),
                        description: followupDescription
                      })} 
                      className="bg-orange-600 hover:bg-orange-700 text-white text-[10px] font-bold px-4 py-1.5 rounded inline-block transition-colors"
                    >
                       Save Follow-up
                    </button>
                 </div>
               </div>
            )}
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
