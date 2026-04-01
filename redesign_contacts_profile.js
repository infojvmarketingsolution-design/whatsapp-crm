const fs = require('fs');
const path = require('path');

const filePath = 'o:/OneDrive/Business/Development/Whatsapp Api + CRM (19 March 2026)/frontend/src/pages/Contacts.jsx';
let content = fs.readFileSync(filePath, 'utf8');

// 1. Update Icons
const iconTarget = /import \{[\s\n\r]+Search, PlayCircle, Plus, ChevronDown, Download, Upload, Trash2,[\s\n\r]+MoreVertical, AlertCircle, Clock, Mail, MapPin, Phone, User,[\s\n\r]+MessageCircle, Calendar, CheckCircle2, X, ArrowUpRight, History[\s\n\r]+\} from 'lucide-react';/;
const iconReplacement = `import { 
  Search, PlayCircle, Plus, ChevronDown, Download, Upload, Trash2, 
  MoreVertical, AlertCircle, Clock, Mail, MapPin, Phone, User, 
  MessageCircle, Calendar, CheckCircle2, X, ArrowUpRight, History,
  LayoutGrid, ClipboardList, Info, Star, Send, ExternalLink, ShieldCheck,
  Zap, Target, Activity, FileText
} from 'lucide-react';`;

if (iconTarget.test(content)) {
    content = content.replace(iconTarget, iconReplacement);
    console.log('Icons updated successfully');
} else {
    console.log('Icons target not found');
}

// 2. Update States
const stateTarget = /const \[isUpdatingContact, setIsUpdatingContact\] = useState\(false\);/;
const stateReplacement = `const [isUpdatingContact, setIsUpdatingContact] = useState(false);
  
  // Design states
  const [activeTab, setActiveTab] = useState('overview');
  const [noteInput, setNoteInput] = useState('');
  const [isAddingNote, setIsAddingNote] = useState(false);`;

if (stateTarget.test(content)) {
    content = content.replace(stateTarget, stateReplacement);
    console.log('States updated successfully');
} else {
    console.log('States target not found');
}

// 3. Add addInternalNote helper
const updateContactTarget = /const updateContactDetail = async \(contactId, updates\) => \{[\s\n\r]+setIsUpdatingContact\(true\);[\s\n\r]+try \{[\s\n\r]+const token = localStorage\.getItem\('token'\);[\s\n\r]+const tenantId = localStorage\.getItem\('tenantId'\);[\s\n\r]+const res = await fetch\(\`\/api\/chat\/action\`, \{[\s\n\r]+method: 'POST',[\s\n\r]+headers: \{ 'Authorization': \`Bearer \$\{token\}\`, 'x-tenant-id': tenantId, 'Content-Type': 'application/json' \},[\s\n\r]+body: JSON\.stringify\(\{ contactId, action: 'update_contact', payload: updates \}\)[\s\n\r]+\}\);[\s\n\r]+if \(res\.ok\) \{[\s\n\r]+const data = await res\.json\(\);[\s\n\r]+setSelectedContact\(data\.contact\);[\s\n\r]+fetchContacts\(\);[\s\n\r]+[\s\n\r]+fetchRecentMessages\(contactId\);[\s\n\r\t]+ \/\/ Refresh messages too if needed[\s\n\r]+\}[\s\n\r]+ \} catch \(err\) \{[\s\n\r]+ console\.error\(err\);[\s\n\r]+ \} finally \{[\s\n\r]+ setIsUpdatingContact\(false\);[\s\n\r]+ \}[\s\n\r]+ \};/g;
// Wait, the previous view_file didn't show fetchRecentMessages inside updateContactDetail. Let's check updateContactDetail again.
// Actually, it was:
//   const updateContactDetail = async (contactId, updates) => {
//     setIsUpdatingContact(true);
//     try {
//       const token = localStorage.getItem('token');
//       const tenantId = localStorage.getItem('tenantId');
//       const res = await fetch(`/api/chat/action`, {
//         method: 'POST',
//         headers: { 'Authorization': `Bearer ${token}`, 'x-tenant-id': tenantId, 'Content-Type': 'application/json' },
//         body: JSON.stringify({ contactId, action: 'update_contact', payload: updates })
//       });
//       if (res.ok) {
//         const data = await res.json();
//         setSelectedContact(data.contact);
//         fetchContacts();
//       }
//     } catch (err) {
//       console.error(err);
//     } finally {
//       setIsUpdatingContact(false);
//     }
//   };

const updateContactTargetSimple = /const updateContactDetail = async \(contactId, updates\) => \{[\s\n\r]+setIsUpdatingContact\(true\);[\s\n\r]+try \{[\s\n\r]+const token = localStorage\.getItem\('token'\);[\s\n\r]+const tenantId = localStorage\.getItem\('tenantId'\);[\s\n\r]+const res = await fetch\(\`\/api\/chat\/action\`, \{[\s\n\r]+method: 'POST',[\s\n\r]+headers: \{ 'Authorization': \`Bearer \$\{token\}\`, 'x-tenant-id': tenantId, 'Content-Type': 'application/json' \},[\s\n\r]+body: JSON\.stringify\(\{ contactId, action: 'update_contact', payload: updates \}\)[\s\n\r]+\}\);[\s\n\r]+if \(res\.ok\) \{[\s\n\r]+const data = await res\.json\(\);[\s\n\r]+setSelectedContact\(data\.contact\);[\s\n\r]+fetchContacts\(\);[\s\n\r]+[\s\n\r]*\}[\s\n\r]+ \} catch \(err\) \{[\s\n\r]+ console\.error\(err\);[\s\n\r]+ \} finally \{[\s\n\r]+ setIsUpdatingContact\(false\);[\s\n\r]+ \}[\s\n\r]+ \};/;
const noteReplacement = `const updateContactDetail = async (contactId, updates) => {
    setIsUpdatingContact(true);
    try {
      const token = localStorage.getItem('token');
      const tenantId = localStorage.getItem('tenantId');
      const res = await fetch(\`/api/chat/action\`, {
        method: 'POST',
        headers: { 'Authorization': \`Bearer \${token}\`, 'x-tenant-id': tenantId, 'Content-Type': 'application/json' },
        body: JSON.stringify({ contactId, action: 'update_contact', payload: updates })
      });
      if (res.ok) {
        const data = await res.json();
        setSelectedContact(data.contact);
        fetchContacts();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsUpdatingContact(false);
    }
  };

  const addInternalNote = async (contactId) => {
    if (!noteInput.trim()) return;
    setIsAddingNote(true);
    try {
      const token = localStorage.getItem('token');
      const tenantId = localStorage.getItem('tenantId');
      const res = await fetch(\`/api/chat/action\`, {
        method: 'POST',
        headers: { 'Authorization': \`Bearer \${token}\`, 'x-tenant-id': tenantId, 'Content-Type': 'application/json' },
        body: JSON.stringify({ contactId, action: 'add_note', payload: { note: noteInput } })
      });
      if (res.ok) {
        const data = await res.json();
        setSelectedContact(data.contact);
        setNoteInput('');
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsAddingNote(false);
    }
  };`;

if (updateContactTargetSimple.test(content)) {
    content = content.replace(updateContactTargetSimple, noteReplacement);
    console.log('Update handler and Note helper updated successfully');
} else {
    console.log('Update handler target not found');
}

// 4. Complete Redesign of ContactProfile Slideover
const profileSlideoverTarget = /\{showProfile && selectedContact && \([\s\n\r]+<div className="fixed inset-0 z-\[120\] flex justify-end bg-black\/20 backdrop-blur-\[2px\] animate-fade-in" onClick=\{\(\) => setShowProfile\(false\)\}>[\s\S]+<\/div>[\s\n\r]+\)\}/;
const profileSlideoverReplacement = `{showProfile && selectedContact && (
        <div className="fixed inset-0 z-[150] flex justify-end bg-slate-900/40 backdrop-blur-sm animate-fade-in" onClick={() => setShowProfile(false)}>
           <div 
             className="w-[500px] h-full bg-white shadow-2xl flex flex-col animate-slide-left relative"
             onClick={(e) => e.stopPropagation()}
           >
              {/* Premium Header/Hero */}
              <div className="relative h-48 bg-[var(--theme-bg)] flex flex-col justify-end p-8 text-white">
                 <div className="absolute top-6 right-6 flex space-x-2">
                    <button onClick={() => setShowProfile(false)} className="p-2 bg-white/10 hover:bg-white/20 rounded-xl transition text-white backdrop-blur-md">
                       <X size={20} />
                    </button>
                 </div>
                 
                 <div className="flex items-end space-x-6 relative z-10 translate-y-12">
                    <div className="w-24 h-24 rounded-3xl bg-white p-1.5 shadow-2xl">
                       <div className="w-full h-full rounded-2xl bg-teal-50 text-[var(--theme-text)] flex items-center justify-center font-black text-3xl shadow-inner border border-teal-100/50">
                          {selectedContact.name?.charAt(0) || 'U'}
                       </div>
                    </div>
                    <div className="pb-2">
                       <div className="flex items-center space-x-3 mb-1">
                          <h2 className="text-2xl font-black text-slate-800 tracking-tight drop-shadow-sm">{selectedContact.name}</h2>
                          <div className={\`px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest \${
                            selectedContact.status === 'CLOSED_WON' ? 'bg-teal-100 text-teal-600' :
                            selectedContact.status === 'CLOSED_LOST' ? 'bg-rose-100 text-rose-600' :
                            'bg-blue-100 text-blue-600'
                          }\`}>
                             {selectedContact.status?.replace('_', ' ')}
                          </div>
                       </div>
                       <p className="text-xs font-bold text-slate-400 flex items-center">
                          <Phone size={12} className="mr-1.5 opacity-60" /> {selectedContact.phone}
                       </p>
                    </div>
                 </div>
              </div>

              {/* Tab Navigation */}
              <div className="mt-16 px-8 border-b border-slate-100 flex space-x-8">
                 {[
                   { id: 'overview', label: 'Overview', icon: LayoutGrid },
                   { id: 'activity', label: 'Activity', icon: History },
                   { id: 'chat', label: 'Chat Log', icon: MessageCircle },
                   { id: 'notes', label: 'Team Notes', icon: ClipboardList }
                 ].map((tab) => (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={\`pb-4 flex items-center space-x-2 text-[11px] font-black uppercase tracking-widest transition-all relative \${
                        activeTab === tab.id ? 'text-[var(--theme-text)]' : 'text-slate-400 hover:text-slate-600'
                      }\`}
                    >
                       <tab.icon size={14} />
                       <span>{tab.label}</span>
                       {activeTab === tab.id && (
                          <div className="absolute bottom-0 left-0 right-0 h-1 bg-[var(--theme-bg)] rounded-t-full shadow-[0_-2px_6px_rgba(0,0,0,0.1)] animate-scale-in"></div>
                       )}
                    </button>
                 ))}
              </div>

              <div className="flex-1 overflow-y-auto custom-scrollbar p-8">
                 {/* Overview Tab */}
                 {activeTab === 'overview' && (
                    <div className="space-y-8 animate-fade-in">
                       {/* Contact Info Cards */}
                       <div className="grid grid-cols-1 gap-6">
                          <div className="p-5 bg-slate-50/50 rounded-2xl border border-slate-100 hover:border-slate-200 transition-all group">
                             <div className="flex items-center justify-between mb-4">
                                <div className="flex items-center space-x-2 text-slate-400 group-hover:text-slate-600">
                                   <Mail size={14} strokeWidth={3} />
                                   <span className="text-[10px] font-black uppercase tracking-widest">Email Address</span>
                                </div>
                                <div className="w-6 h-6 rounded-lg bg-white border border-slate-100 flex items-center justify-center text-slate-300">
                                   <Zap size={12} />
                                </div>
                             </div>
                             <input 
                               type="email" 
                               defaultValue={selectedContact.email} 
                               onBlur={(e) => updateContactDetail(selectedContact._id, { email: e.target.value })}
                               className="w-full bg-transparent text-sm font-black text-slate-700 outline-none placeholder:text-slate-200"
                               placeholder="Not provided"
                             />
                          </div>

                          <div className="p-5 bg-slate-50/50 rounded-2xl border border-slate-100 hover:border-slate-200 transition-all group">
                             <div className="flex items-center justify-between mb-4">
                                <div className="flex items-center space-x-2 text-slate-400 group-hover:text-slate-600">
                                   <MapPin size={14} strokeWidth={3} />
                                   <span className="text-[10px] font-black uppercase tracking-widest">Primary Location</span>
                                </div>
                                <div className="w-6 h-6 rounded-lg bg-white border border-slate-100 flex items-center justify-center text-slate-300">
                                   <Target size={12} />
                                </div>
                             </div>
                             <textarea 
                               defaultValue={selectedContact.address} 
                               onBlur={(e) => updateContactDetail(selectedContact._id, { address: e.target.value })}
                               className="w-full bg-transparent text-sm font-black text-slate-700 outline-none placeholder:text-slate-200 resize-none"
                               placeholder="Not provided"
                               rows={2}
                             />
                          </div>
                       </div>

                       {/* Status Selection */}
                       <div className="space-y-4">
                          <h3 className="text-[11px] font-black text-slate-400 uppercase tracking-widest flex items-center">
                             <Activity size={14} className="mr-2" /> Pipeline Status
                          </h3>
                          <div className="grid grid-cols-2 gap-2">
                             {['NEW LEAD', 'INTERESTED', 'FOLLOW_UP', 'CLOSED_WON', 'CLOSED_LOST'].map((status) => (
                                <button
                                  key={status}
                                  onClick={() => updateContactDetail(selectedContact._id, { status })}
                                  className={\`px-4 py-3 rounded-xl text-[10px] font-black transition-all text-left flex items-center border \${
                                    selectedContact.status === status 
                                    ? 'bg-[var(--theme-bg)] text-white border-transparent shadow-lg shadow-teal-900/20 scale-[1.02]' 
                                    : 'bg-white text-slate-400 border-slate-100 hover:bg-slate-50'
                                  }\`}
                                >
                                   <div className={\`w-2 h-2 rounded-full mr-3 \${
                                      selectedContact.status === status ? 'bg-white shadow-[0_0_8px_rgba(255,255,255,0.8)]' : 'bg-slate-200'
                                   }\`}></div>
                                   {status.replace('_', ' ')}
                                </button>
                             ))}
                          </div>
                       </div>
                    </div>
                 )}

                 {/* Activity Tab */}
                 {activeTab === 'activity' && (
                    <div className="space-y-6 animate-fade-in">
                       <div className="relative before:absolute before:left-[11px] before:top-2 before:bottom-2 before:w-[2px] before:bg-slate-100">
                          {(selectedContact.timeline || []).slice(-10).reverse().map((event, idx) => (
                             <div key={idx} className="relative pl-10 pb-8 last:pb-0 animate-fade-in-up" style={{ animationDelay: \`\${idx * 50}ms\` }}>
                                <div className="absolute left-0 top-1 w-6 h-6 rounded-xl bg-white border-2 border-slate-100 flex items-center justify-center z-10 shadow-sm">
                                   <div className="w-2 h-2 rounded-full bg-[var(--theme-border)]"></div>
                                </div>
                                <div className="p-4 bg-white border border-slate-100 rounded-2xl shadow-sm hover:shadow-md transition-shadow">
                                   <p className="text-xs font-black text-slate-700 leading-relaxed mb-1">{event.description}</p>
                                   <p className="text-[10px] text-slate-400 font-bold flex items-center uppercase tracking-tighter">
                                      <Clock size={10} className="mr-1" /> {new Date(event.timestamp).toLocaleString()}
                                   </p>
                                </div>
                             </div>
                          ))}
                          {(!selectedContact.timeline || selectedContact.timeline.length === 0) && (
                             <div className="ml-10 p-8 bg-slate-50 rounded-2xl border border-dashed border-slate-200 text-center text-xs font-bold text-slate-400">
                                <Info size={24} className="mx-auto mb-2 opacity-30" />
                                No activity milestones found.
                             </div>
                          )}
                       </div>
                    </div>
                 )}

                 {/* Chat Tab */}
                 {activeTab === 'chat' && (
                    <div className="space-y-6 animate-fade-in">
                        <div className="bg-slate-50/50 rounded-3xl p-6 border border-slate-100 backdrop-blur-sm">
                           <div className="flex items-center justify-between mb-6">
                              <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center">
                                 <MessageCircle size={14} className="mr-2" /> Recent Conversation
                              </h3>
                              <button onClick={() => fetchRecentMessages(selectedContact._id)} className={\`p-1.5 bg-white border border-slate-100 rounded-xl hover:bg-slate-50 transition shadow-sm \${isRefreshingMessages ? 'animate-spin' : ''}\`}>
                                 <History size={14} className="text-slate-400" />
                              </button>
                           </div>
                           
                           <div className="space-y-4 mb-6 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                              {recentMessages.length > 0 ? recentMessages.map((msg, idx) => (
                                 <div key={idx} className={\`flex \${msg.direction === 'OUTBOUND' ? 'justify-end' : 'justify-start'}\`}>
                                    <div className={\`max-w-[85%] p-3.5 rounded-2xl text-xs font-bold shadow-sm \${
                                      msg.direction === 'OUTBOUND' 
                                      ? 'bg-[var(--theme-bg)] text-white rounded-tr-none' 
                                      : 'bg-white text-slate-600 border border-slate-100 rounded-tl-none'
                                    }\`}>
                                       {msg.content}
                                       <div className={\`text-[8px] mt-1 opacity-60 \${msg.direction === 'OUTBOUND' ? 'text-white text-right' : 'text-slate-400 text-left'}\`}>
                                          {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                       </div>
                                    </div>
                                 </div>
                              )) : (
                                 <div className="text-center py-10">
                                    <MessageCircle size={32} className="mx-auto mb-3 opacity-10 text-slate-900" />
                                    <p className="text-xs font-black text-slate-300 uppercase tracking-widest">No chat logs found</p>
                                 </div>
                              )}
                           </div>

                           <button 
                             onClick={() => {
                               localStorage.setItem('activeChatId', selectedContact._id);
                               navigate('/inbox', { state: { selectedContact: selectedContact.phone } });
                             }}
                             className="w-full py-4 bg-white border border-slate-200 rounded-2xl text-[10px] font-black text-slate-500 hover:text-[var(--theme-text)] hover:border-[var(--theme-border)] transition-all uppercase tracking-widest flex items-center justify-center shadow-sm active:scale-95"
                           >
                              Jump to Inbox <ExternalLink size={14} className="ml-2" />
                           </button>
                        </div>
                    </div>
                 )}

                 {/* Notes Tab */}
                 {activeTab === 'notes' && (
                    <div className="space-y-6 animate-fade-in">
                       <div className="relative">
                          <textarea 
                            value={noteInput}
                            onChange={(e) => setNoteInput(e.target.value)}
                            placeholder="Type a team note here..."
                            rows={4}
                            className="w-full bg-slate-50 border border-slate-100 rounded-2xl p-5 text-sm font-bold text-slate-700 outline-none focus:bg-white focus:border-[var(--theme-border)] transition-all"
                          />
                          <button 
                            onClick={() => addInternalNote(selectedContact._id)}
                            disabled={isAddingNote || !noteInput.trim()}
                            className="absolute bottom-4 right-4 p-3 bg-[var(--theme-bg)] text-white rounded-xl shadow-lg shadow-teal-900/20 hover:scale-105 active:scale-95 transition-all disabled:opacity-50 disabled:scale-100"
                          >
                             {isAddingNote ? <Clock size={18} className="animate-spin" /> : <Send size={18} />}
                          </button>
                       </div>

                       <div className="space-y-4">
                          {(selectedContact.notes || []).slice().reverse().map((note, idx) => (
                             <div key={idx} className="p-5 bg-white border border-slate-100 rounded-2xl shadow-sm hover:shadow-md transition-shadow group relative overflow-hidden">
                                <div className="absolute top-0 left-0 w-1 h-full bg-[var(--theme-border)] opacity-0 group-hover:opacity-100 transition-opacity"></div>
                                <div className="flex items-center justify-between mb-3">
                                   <div className="flex items-center space-x-2">
                                      <div className="w-6 h-6 rounded-lg bg-teal-50 text-teal-600 flex items-center justify-center">
                                         <User size={12} strokeWidth={3} />
                                      </div>
                                      <span className="text-[10px] font-black text-slate-800 uppercase tracking-tight">{note.createdBy || 'Agent'}</span>
                                   </div>
                                   <span className="text-[9px] font-bold text-slate-300 uppercase">{new Date(note.createdAt).toLocaleDateString()}</span>
                                </div>
                                <p className="text-sm font-bold text-slate-600 leading-relaxed whitespace-pre-wrap">{note.content}</p>
                             </div>
                          ))}
                          {(!selectedContact.notes || selectedContact.notes.length === 0) && (
                             <div className="text-center py-10 bg-slate-50 rounded-3xl border border-dashed border-slate-200">
                                <FileText size={32} className="mx-auto mb-3 opacity-10 text-slate-900" />
                                <p className="text-xs font-black text-slate-300 uppercase tracking-widest">No team notes yet</p>
                             </div>
                          )}
                       </div>
                    </div>
                 )}
              </div>

              {/* Bottom Info Bar */}
              <div className="px-8 py-6 border-t border-slate-50 flex items-center justify-between text-[10px] font-black text-slate-300 uppercase tracking-widest bg-slate-50/30">
                 <div className="flex items-center">
                    <ShieldCheck size={14} className="mr-2 text-teal-600 opacity-40" /> 
                    Lead Score: <span className="text-slate-600 ml-1">{selectedContact.score || 0}</span>
                 </div>
                 <div className="flex items-center bg-white px-3 py-1.5 rounded-lg border border-slate-100 shadow-sm">
                    <Star size={12} className="mr-1.5 text-amber-500" />
                    Heat: <span className="text-slate-600 ml-1">{selectedContact.heatLevel || 'Cold'}</span>
                 </div>
              </div>
           </div>
        </div>
      )}`;

if (profileSlideoverTarget.test(content)) {
    content = content.replace(profileSlideoverTarget, profileSlideoverReplacement);
    console.log('Profile Slideover redesigned successfully');
} else {
    console.log('Profile Slideover target not found');
}

fs.writeFileSync(filePath, content);
console.log('File written successfully');
