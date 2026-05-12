import React, { useState, useEffect, useRef } from 'react';
import { 
  Save, 
  Bot, 
  MessageSquare, 
  User, 
  Bot, Save, Plus, Trash2, Edit3, Image as ImageIcon, ChevronRight, Settings, 
  Target, MessageSquare, HelpCircle, PhoneCall, ExternalLink, Award, Share2, 
  UserCircle, LayoutGrid, Network, Upload, Play, ArrowRight, CheckCircle2,
  AlertCircle, Layers, ShieldCheck, Calendar, Mail, User, GraduationCap, Headphones
} from 'lucide-react';
import FlowCanvas from '../../components/AIChatbot/FlowCanvas';
import { toast } from 'react-hot-toast';

export default function AIChatbot() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('builder'); 
  const [settings, setSettings] = useState({
    botEnabled: false,
    botMode: 'PRD',
    customGreetingFlowId: null,
    fallbackToHuman: true,
    aiPrompts: {
      greetingMessage: '',
      greetingImage: '',
      namePrompt: '',
      programListPrompt: '',
      successProofMessage: '',
      successProofImage: '',
      callTimePrompt: '',
      agentTransferPrompt: '',
      fallbackMessage: '',
      prdFlowSteps: [],
      programMap: {},
      qualificationOptions: []
    }
  });

  const [uploading, setUploading] = useState(null);
  const [flows, setFlows] = useState([]);
  const fileInputRef = useRef(null);
  const activeFieldRef = useRef(null);

  useEffect(() => {
    fetchSettings();
    fetchFlows();
  }, []);

  const fetchFlows = async () => {
    try {
      const token = localStorage.getItem('token');
      const tenantId = localStorage.getItem('tenantId');
      const res = await fetch(`/api/flows`, {
        headers: { 'Authorization': `Bearer ${token}`, 'x-tenant-id': tenantId }
      });
      if (res.ok) {
        const data = await res.json();
        setFlows(data.filter(f => f.status === 'ACTIVE'));
      }
    } catch (err) {
      console.error('Failed to fetch custom flows', err);
    }
  };
  const fetchSettings = async () => {
    try {
      const token = localStorage.getItem('token');
      const tenantId = localStorage.getItem('tenantId');
      const res = await fetch(`/api/settings`, {
        headers: { 'Authorization': `Bearer ${token}`, 'x-tenant-id': tenantId }
      });
      if (res.ok) {
        const data = await res.json();
        if (data.automation) {
          setSettings({
            ...data.automation,
            aiPrompts: {
              ...(data.automation.aiPrompts || {})
            }
          });
        }
      }
    } catch (err) {
      console.error('Failed to fetch chatbot settings', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const token = localStorage.getItem('token');
      const tenantId = localStorage.getItem('tenantId');
      const res = await fetch(`/api/settings/automation`, {
        method: 'PUT',
        headers: { 
          'Authorization': `Bearer ${token}`, 
          'x-tenant-id': tenantId,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(settings)
      });
      if (res.ok) {
        toast.success('AI Chatbot configuration saved successfully!');
      } else {
        toast.error('Failed to save settings');
      }
    } catch (err) {
      console.error('Failed to save', err);
      toast.error('Error saving settings');
    } finally {
      setSaving(false);
    }
  };

  const updatePrompt = (key, value) => {
    setSettings(prev => ({
      ...prev,
      aiPrompts: {
        ...prev.aiPrompts,
        [key]: value
      }
    }));
  };

  const updateProgramMap = (qual, category, pIndex, newVal) => {
    const newMap = { ...settings.aiPrompts.programMap };
    if (!newMap[qual][category]) return;
    
    if (newVal === null) {
       newMap[qual][category].splice(pIndex, 1);
    } else {
       if (pIndex === -1) newMap[qual][category].push(newVal);
       else newMap[qual][category][pIndex] = newVal;
    }
    updatePrompt('programMap', newMap);
  };

  const addCategory = (qual, name) => {
    const newMap = { ...settings.aiPrompts.programMap };
    if (!newMap[qual]) newMap[qual] = {};
    newMap[qual][name] = [];
    updatePrompt('programMap', newMap);
  };

  const removeCategory = (qual, catName) => {
    const newMap = { ...settings.aiPrompts.programMap };
    if (newMap[qual] && newMap[qual][catName]) {
       delete newMap[qual][catName];
       updatePrompt('programMap', newMap);
    }
  };

  const handleUploadClick = (fieldKey) => {
    activeFieldRef.current = fieldKey;
    fileInputRef.current.click();
  };

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const dataRef = activeFieldRef.current; 
    const isStep = typeof dataRef === 'object' && dataRef.stepId;
    const uploadKey = isStep ? `${dataRef.stepId}_${dataRef.field}` : dataRef;
    
    setUploading(uploadKey);

    try {
      const token = localStorage.getItem('token');
      const tenantId = localStorage.getItem('tenantId');
      const formData = new FormData();
      formData.append('image', file);

      const res = await fetch('/api/settings/upload-image', {
        method: 'POST',
        headers: { 
          'Authorization': `Bearer ${token}`, 
          'x-tenant-id': tenantId 
        },
        body: formData
      });

      if (res.ok) {
        const data = await res.json();
        if (isStep) {
           updateStep(dataRef.stepId, dataRef.field, data.url);
        } else {
           updatePrompt(dataRef, data.url);
        }
        toast.success(`${isStep ? 'Cart' : 'Prompt'} image updated!`);
      } else {
        toast.error('Failed to upload image');
      }
    } catch (err) {
      console.error('Upload error:', err);
      toast.error('Error uploading image');
    } finally {
      setUploading(null);
      e.target.value = '';
    }
  };

  const updateStep = (id, field, value) => {
    setSettings(prev => ({
       ...prev,
       aiPrompts: {
          ...prev.aiPrompts,
          prdFlowSteps: (prev.aiPrompts.prdFlowSteps || []).map(s => s.id === id ? { ...s, [field]: value } : s)
       }
    }));
  };

  const addStep = (index) => {
     const newStep = {
        id: `step_${Date.now()}`,
        type: 'CUSTOM_MESSAGE',
        title: 'New Information Step',
        message: 'Your message here...'
     };
     setSettings(prev => {
        const steps = [...(prev.aiPrompts?.prdFlowSteps || [])];
        steps.splice(index + 1, 0, newStep);
        return { ...prev, aiPrompts: { ...prev.aiPrompts, prdFlowSteps: steps } };
     });
  };

  const removeStep = (id) => {
     setSettings(prev => ({
        ...prev,
        aiPrompts: {
           ...prev.aiPrompts,
           prdFlowSteps: (prev.aiPrompts?.prdFlowSteps || []).filter(s => s.id !== id)
        }
     }));
  };

  const addStepButton = (stepId) => {
    setSettings(prev => ({
       ...prev,
       aiPrompts: {
          ...prev.aiPrompts,
          prdFlowSteps: (prev.aiPrompts.prdFlowSteps || []).map(s => {
             if (s.id === stepId) {
                const buttons = s.buttons || [];
                return { ...s, buttons: [...buttons, { type: 'reply', label: 'New Option', value: 'new_option' }] };
             }
             return s;
          })
       }
    }));
  };

  const updateStepButton = (stepId, btnIndex, field, value) => {
    setSettings(prev => ({
       ...prev,
       aiPrompts: {
          ...prev.aiPrompts,
          prdFlowSteps: (prev.aiPrompts.prdFlowSteps || []).map(s => {
             if (s.id === stepId) {
                const buttons = [...(s.buttons || [])];
                buttons[btnIndex] = { ...buttons[btnIndex], [field]: value };
                return { ...s, buttons };
             }
             return s;
          })
       }
    }));
  };

  const removeStepButton = (stepId, btnIndex) => {
    setSettings(prev => ({
       ...prev,
       aiPrompts: {
          ...prev.aiPrompts,
          prdFlowSteps: (prev.aiPrompts.prdFlowSteps || []).map(s => {
             if (s.id === stepId) {
                const buttons = [...(s.buttons || [])];
                buttons.splice(btnIndex, 1);
                return { ...s, buttons };
             }
             return s;
          })
       }
    }));
  };

  const FlowNode = ({ title, icon: Icon, colorClass, children, id }) => (
    <div id={id} className={`w-full max-w-2xl bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden animate-fade-in-up transition-all hover:shadow-md hover:border-teal-200`}>
      <div className={`px-5 py-3 ${colorClass} flex items-center justify-between border-b border-black/5`}>
        <div className="flex items-center space-x-2.5">
          <div className="bg-white/20 p-1.5 rounded-lg">
            <Icon size={18} className="text-white" />
          </div>
          <span className="text-sm font-bold text-white uppercase tracking-wider">{title}</span>
        </div>
      </div>
      <div className="p-6 space-y-5">
        {children}
      </div>
    </div>
  );

  const NodeInput = ({ label, value, onChange, placeholder, isImage, fieldKey, hint, icon: Icon }) => (
    <div className="space-y-2">
       <div className="flex items-center justify-between">
          <label className="text-[11px] font-bold text-gray-500 uppercase tracking-widest flex items-center">
             {Icon && <Icon size={12} className="mr-1.5 text-teal-600" />}
             {label}
          </label>
       </div>
       <div className="relative group">
          <textarea 
            className="w-full bg-gray-50 border border-gray-100 rounded-xl p-4 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/10 focus:border-teal-500 focus:bg-white transition-all min-h-[100px] resize-none leading-relaxed text-gray-700"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder}
          />
          {isImage && (
             <div className="absolute right-3 bottom-3 flex items-center space-x-2">
                <button 
                  onClick={() => handleUploadClick(fieldKey)}
                  className="flex items-center space-x-2 px-3 py-2 bg-white border border-gray-200 rounded-lg text-gray-600 hover:text-teal-600 transition-all shadow-sm font-bold"
                >
                  <Upload size={14} />
                  <span className="text-[10px] uppercase">Upload</span>
                </button>
             </div>
          )}
       </div>
       {hint && <p className="text-[10px] text-gray-400 italic px-1">{hint}</p>}
    </div>
  );

  if (loading) return (
    <div className="p-8 flex flex-col items-center justify-center h-full">
       <div className="w-12 h-12 border-4 border-teal-500/20 border-t-teal-500 rounded-full animate-spin mb-4"></div>
       <p className="text-gray-500 font-bold animate-pulse uppercase tracking-widest text-xs">Initializing AI Engine...</p>
    </div>
  );

  return (
    <div className="p-4 sm:p-8 bg-slate-50 min-h-screen">
      <div className="max-w-6xl mx-auto">
         <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
          <div>
            <h1 className="text-2xl font-black text-slate-900 flex items-center uppercase tracking-tight">
              <Bot className="mr-3 text-blue-600" size={28} />
              AI Chatbot Configuration
            </h1>
            <p className="text-xs text-slate-500 mt-1 font-bold uppercase tracking-widest">Real-time automation engine</p>
          </div>
          <div className="flex gap-3">
             <button 
               onClick={handleSave}
               disabled={saving}
                                     </div>
                                  </div>
                                  
                                  <div className="space-y-6">
                                     {(settings.aiPrompts.qualificationOptions || []).map(qual => (
                                       <div key={qual} className="bg-white rounded-3xl border border-slate-100 p-5 sm:p-7 shadow-sm hover:shadow-md transition-shadow">
                                          <div className="flex items-center justify-between mb-5 border-b border-slate-50 pb-4">
                                             <div className="text-sm sm:text-base font-black text-slate-700 tracking-tight">{qual}</div>
                                             <button 
                                               onClick={() => {
                                                  const cat = prompt('New Category Name (e.g. "DIPLOMA PROGRAMS")');
                                                  if (cat) addCategory(qual, cat);
                                               }}
                                               className="text-[9px] font-black text-indigo-600 hover:bg-indigo-50 px-3 py-1.5 rounded-xl transition-all uppercase tracking-widest flex items-center"
                                             >
                                                <Plus size={10} className="mr-1.5" /> Add Category
                                             </button>
                                          </div>
 
                                          <div className="space-y-6">
                                             {Object.entries(settings.aiPrompts.programMap[qual] || {}).map(([cat, programs]) => (
                                               <div key={cat} className="space-y-3 relative group/cat">
                                                  <div className="flex items-center justify-between">
                                                     <div className="text-[9px] font-black text-slate-400 uppercase tracking-[0.15em] flex items-center">
                                                        <div className="w-1 h-3 bg-indigo-200 rounded-full mr-2"></div>
                                                        {cat}
                                                     </div>
                                                     <button 
                                                        onClick={() => { if(confirm(`Remove entire category "${cat}"?`)) removeCategory(qual, cat); }}
                                                        className="opacity-0 group-hover/cat:opacity-100 text-[8px] font-bold text-rose-400 hover:text-rose-600 uppercase transition-opacity"
                                                     >
                                                        Remove
                                                     </button>
                                                  </div>
                                                  <div className="flex flex-wrap gap-2.5">
                                                     {programs.map((p, pIdx) => (
                                                       <div key={pIdx} className="group relative">
                                                          <input 
                                                            className="text-[11px] font-bold bg-slate-50 border border-slate-100 text-slate-600 rounded-xl py-2 px-4 w-40 focus:bg-white focus:ring-4 focus:ring-indigo-500/5 focus:border-indigo-500/20 outline-none transition-all"
                                                            value={p}
                                                            onChange={(e) => updateProgramMap(qual, cat, pIdx, e.target.value)}
                                                          />
                                                          <button 
                                                            onClick={() => updateProgramMap(qual, cat, pIdx, null)}
                                                            className="absolute -top-1.5 -right-1.5 opacity-0 group-hover:opacity-100 bg-rose-500 text-white rounded-full p-1 shadow-lg hover:scale-110 transition-all z-10"
                                                          >
                                                             <Plus size={8} className="rotate-45" />
                                                          </button>
                                                       </div>
                                                     ))}
                                                     <button 
                                                       onClick={() => updateProgramMap(qual, cat, -1, 'New Program')}
                                                       className="text-[11px] font-bold text-indigo-500 hover:bg-indigo-50 px-4 py-2 border border-dashed border-indigo-200 rounded-xl flex items-center transition-all active:scale-95 shadow-sm"
                                                     >
                                                        <Plus size={12} className="mr-1.5" /> Program
                                                     </button>
                                                  </div>
                                               </div>
                                             ))}
                                             {Object.keys(settings.aiPrompts.programMap[qual] || {}).length === 0 && (
                                                <div className="py-4 text-center border-2 border-dashed border-slate-50 rounded-2xl">
                                                   <p className="text-[10px] font-bold text-slate-300 uppercase tracking-widest">No categories mapped for this level</p>
                                                </div>
                                             )}
                                          </div>
                                       </div>
                                     ))}
                                  </div>
                               </div>
                             )}

                             {step.type === 'QUALIFICATION' && (
                                <div className="mt-4 p-4 bg-indigo-50/50 rounded-2xl border border-indigo-100">
                                   <div className="text-[10px] font-black text-indigo-400 uppercase tracking-widest mb-3">Qualification Options</div>
                                   <div className="flex flex-wrap gap-2">
                                      {(settings.aiPrompts.qualificationOptions || []).map((q, i) => (
                                         <div key={i} className="group relative">
                                            <input 
                                              className="text-[11px] font-medium bg-white border-none rounded-lg py-1 px-3 focus:ring-1 focus:ring-indigo-300 shadow-sm"
                                              value={q}
                                              onChange={(e) => {
                                                 const newQuals = [...settings.aiPrompts.qualificationOptions];
                                                 newQuals[i] = e.target.value;
                                                 updatePrompt('qualificationOptions', newQuals);
                                              }}
                                            />
                                            <button 
                                              onClick={() => {
                                                 const newQuals = settings.aiPrompts.qualificationOptions.filter((_, idx) => idx !== i);
                                                 updatePrompt('qualificationOptions', newQuals);
                                              }}
                                              className="absolute -top-1 -right-1 opacity-0 group-hover:opacity-100 bg-red-500 text-white rounded-full p-0.5"
                                            >
                                               <Plus size={8} className="rotate-45" />
                                            </button>
                                         </div>
                                      ))}
                                      <button 
                                         onClick={() => updatePrompt('qualificationOptions', [...settings.aiPrompts.qualificationOptions, 'New Option'])}
                                         className="text-[11px] font-medium text-indigo-400 hover:text-indigo-500 px-3 py-1 border border-dashed border-indigo-200 rounded-lg bg-white"
                                      >
                                         + Option
                                      </button>
                                   </div>
                                </div>
                             )}
                         </div>
                      </div>
                   </div>
                 </FlowNode>
              </React.Fragment>
            );
          })}

          <div className="flex flex-col items-center group/add relative mt-4">
              <div className="w-0.5 h-8 bg-gray-200 group-hover/add:bg-indigo-300 transition-colors"></div>
              <button 
                onClick={() => addStep(settings.aiPrompts.prdFlowSteps.length - 1)}
                className="flex items-center space-x-2 bg-gray-100 text-gray-500 px-4 py-2 rounded-xl text-[10px] font-black uppercase hover:bg-indigo-50 hover:text-indigo-600 transition border border-dashed border-gray-200"
              >
                 <Plus size={14} />
                 <span>Add One More Cart</span>
              </button>
          </div>

          <div className="pt-10 flex flex-col items-center">
             <div className="p-4 bg-white border border-gray-100 rounded-2xl shadow-sm text-center">
                <div className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-2">End of Conversation</div>
                <div className="text-xs font-bold text-gray-600 underline decoration-teal-500/30">User qualified as Hot Lead 🔥</div>
             </div>
          </div>

        </div>
        )}
        <input 
          type="file" 
          ref={fileInputRef} 
          onChange={handleFileChange} 
          style={{ display: 'none' }} 
          accept="image/*" 
        />
      </div>
    </div>
  );
}
