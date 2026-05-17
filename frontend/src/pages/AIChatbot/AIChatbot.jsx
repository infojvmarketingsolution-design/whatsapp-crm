import React, { useState, useEffect, useRef } from 'react';
import { 
  Bot, Save, Plus, Trash2, Edit3, Image as ImageIcon, ChevronRight, Settings, 
  Target, MessageSquare, HelpCircle, PhoneCall, ExternalLink, Award, Share2, 
  UserCircle, LayoutGrid, Network, Upload, Play, ArrowRight, CheckCircle2,
  AlertCircle, Layers, ShieldCheck, Calendar, Mail, GraduationCap, Headphones,
  X
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
    aiPrompts: {
      prdFlowSteps: [],
      programMap: {},
      qualificationOptions: []
    }
  });
  const [programMapJson, setProgramMapJson] = useState('{}');

  const [uploading, setUploading] = useState(null);
  const fileInputRef = useRef(null);
  const activeFieldRef = useRef(null);

  useEffect(() => {
    fetchSettings();
  }, []);

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
          setSettings(data.automation);
          if (data.automation.aiPrompts && data.automation.aiPrompts.programMap) {
            setProgramMapJson(JSON.stringify(data.automation.aiPrompts.programMap, null, 2));
          }
        }
      }
    } catch (err) {
      console.error('Failed to fetch settings', err);
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
        toast.success('Configuration saved!');
      }
    } catch (err) {
      toast.error('Save failed');
    } finally {
      setSaving(false);
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
        title: 'New Step',
        message: 'Hello student!'
     };
     setSettings(prev => {
        const steps = [...(prev.aiPrompts.prdFlowSteps || [])];
        steps.splice(index + 1, 0, newStep);
        return { ...prev, aiPrompts: { ...prev.aiPrompts, prdFlowSteps: steps } };
     });
  };

  const removeStep = (id) => {
     setSettings(prev => ({
        ...prev,
        aiPrompts: {
           ...prev.aiPrompts,
           prdFlowSteps: (prev.aiPrompts.prdFlowSteps || []).filter(s => s.id !== id)
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
                return { ...s, buttons: [...buttons, { type: 'reply', label: 'Option', value: 'option' }] };
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

  if (loading) return <div className="p-8">Loading AI Chatbot...</div>;

  return (
    <div className="p-4 sm:p-8 bg-slate-50 min-h-screen">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-2xl font-black text-slate-900 flex items-center uppercase tracking-tight">
              <Bot className="mr-3 text-blue-600" size={28} /> AI Chatbot Builder
            </h1>
            <p className="text-xs text-slate-500 mt-1 font-bold uppercase tracking-widest">Configure your automation flows</p>
          </div>
          <button 
            onClick={handleSave} 
            disabled={saving}
            className="px-8 py-3 bg-slate-900 text-white rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-black transition-all shadow-lg"
          >
            {saving ? 'Saving...' : 'Save Configuration'}
          </button>
        </div>

        {/* 🤖 GLOBAL AI ENGINE CONTROLLERS */}
        <div className="bg-white border border-slate-200 rounded-[2rem] p-6 mb-8 shadow-sm flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center space-x-4">
             <div className={`p-3 rounded-2xl transition-all ${settings.botEnabled ? 'bg-emerald-100 text-emerald-600 animate-pulse' : 'bg-slate-100 text-slate-400'}`}>
                <Bot size={24} />
             </div>
             <div>
                <h2 className="text-sm font-black text-slate-800 uppercase tracking-wider flex items-center gap-2">
                   Chatbot Integration Status
                   {settings.botEnabled ? (
                      <span className="px-2 py-0.5 bg-emerald-100 text-emerald-700 text-[8px] font-black rounded-md uppercase tracking-widest animate-bounce">Active</span>
                   ) : (
                      <span className="px-2 py-0.5 bg-slate-100 text-slate-400 text-[8px] font-black rounded-md uppercase tracking-widest">Paused</span>
                   )}
                </h2>
                <p className="text-xs text-slate-500 font-bold uppercase tracking-wider mt-1">Configure your automation strategy</p>
             </div>
          </div>

          <div className="flex flex-wrap items-center gap-4 w-full md:w-auto">
             {/* Activate Toggle */}
             <div className="flex items-center space-x-3 bg-slate-50 border border-slate-100 px-4 py-2.5 rounded-2xl">
                <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">Enable Bot:</span>
                <button
                   onClick={() => setSettings(prev => ({ ...prev, botEnabled: !prev.botEnabled }))}
                   className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${settings.botEnabled ? 'bg-emerald-500' : 'bg-slate-200'}`}
                >
                   <span
                      className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${settings.botEnabled ? 'translate-x-5' : 'translate-x-0'}`}
                   />
                </button>
             </div>

             {/* Mode Selector */}
             <div className="flex items-center space-x-2 bg-slate-50 border border-slate-100 px-4 py-2.5 rounded-2xl">
                <span className="text-[10px] font-black uppercase tracking-widest text-slate-500 mr-2">Strategy Mode:</span>
                <div className="flex bg-slate-200 p-0.5 rounded-xl border border-slate-300/40">
                   <button
                      onClick={() => {
                         setSettings(prev => ({ ...prev, botMode: 'PRD' }));
                         if (activeTab === 'ai_agent') setActiveTab('builder');
                      }}
                      className={`px-4 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all ${settings.botMode === 'PRD' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
                   >
                      PRD Form
                   </button>
                   <button
                      onClick={() => setSettings(prev => ({ ...prev, botMode: 'AI' }))}
                      className={`px-4 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all ${settings.botMode === 'AI' ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
                   >
                      ⚡ Advanced AI Agent
                   </button>
                </div>
             </div>
          </div>
        </div>

        {/* Tab Selection */}
        <div className="flex bg-slate-200/50 p-1 rounded-2xl mb-8 w-fit border border-slate-200">
           <button 
             onClick={() => setActiveTab('builder')}
             className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center space-x-2 ${activeTab === 'builder' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
           >
              <LayoutGrid size={14} />
              <span>Structured Builder</span>
           </button>
           <button 
             onClick={() => setActiveTab('visual')}
             className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center space-x-2 ${activeTab === 'visual' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
           >
              <Network size={14} />
              <span>Visual Journey</span>
           </button>
           {settings.botMode === 'AI' && (
             <button 
               onClick={() => setActiveTab('ai_agent')}
               className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center space-x-2 ${activeTab === 'ai_agent' ? 'bg-white text-amber-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
             >
                <Bot size={14} />
                <span>🧠 AI Agent Settings</span>
             </button>
           )}
        </div>

        {activeTab === 'visual' && (
           <div className="mb-12 animate-fade-in">
              <FlowCanvas steps={settings.aiPrompts.prdFlowSteps} />
           </div>
        )}

        {activeTab === 'ai_agent' && (
          <div className="space-y-6 pb-20 animate-fade-in">
            {/* 🧠 Core system guidelines */}
            <div className="bg-white border border-slate-200 rounded-[2rem] p-8 shadow-sm animate-fade-in">
              <h3 className="text-sm font-black text-slate-800 uppercase tracking-wider mb-2 flex items-center gap-2">
                <ShieldCheck size={18} className="text-amber-500" />
                AI Agent Core Guidelines & Persona
              </h3>
              <p className="text-xs text-slate-400 mb-6 font-bold uppercase tracking-wider">
                Instruct the AI on how to speak, its persona, and any special admissions rules.
              </p>
              
              <textarea 
                className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-4 text-xs font-semibold text-slate-700 outline-none focus:bg-white focus:ring-2 focus:ring-amber-500/10 focus:border-amber-500 transition-all h-36"
                placeholder="e.g. Speak warmly like a top academic counsellor named Sarah from Gandhinagar University. Keep answers concise, highly polite, and recommend B.Sc Trending courses."
                value={settings.aiPrompts.aiSystemInstructions || ''}
                onChange={(e) => setSettings(prev => ({
                  ...prev,
                  aiPrompts: {
                    ...prev.aiPrompts,
                    aiSystemInstructions: e.target.value
                  }
                }))}
              />
            </div>

            {/* 📚 FAQ & Knowledge Base */}
            <div className="bg-white border border-slate-200 rounded-[2rem] p-8 shadow-sm animate-fade-in">
              <h3 className="text-sm font-black text-slate-800 uppercase tracking-wider mb-2 flex items-center gap-2">
                <Layers size={18} className="text-blue-500" />
                AI Knowledge Base & FAQs
              </h3>
              <p className="text-xs text-slate-400 mb-6 font-bold uppercase tracking-wider">
                Define the dynamic institutional facts that the AI agent uses to answer student questions.
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Placements */}
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block">Placement Information</label>
                  <textarea 
                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-4 text-xs font-semibold text-slate-700 outline-none focus:bg-white focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500 h-32"
                    placeholder="e.g. Over 90% placement rates, top packages exceeding 12 Lakhs..."
                    value={settings.aiPrompts.aiPlacementInfo || ''}
                    onChange={(e) => setSettings(prev => ({
                      ...prev,
                      aiPrompts: { ...prev.aiPrompts, aiPlacementInfo: e.target.value }
                    }))}
                  />
                </div>

                {/* Hostel */}
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block">Hostel & Campus Facilities</label>
                  <textarea 
                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-4 text-xs font-semibold text-slate-700 outline-none focus:bg-white focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500 h-32"
                    placeholder="e.g. Clean AC & Non-AC rooms, Wi-Fi, gym, mess food..."
                    value={settings.aiPrompts.aiHostelInfo || ''}
                    onChange={(e) => setSettings(prev => ({
                      ...prev,
                      aiPrompts: { ...prev.aiPrompts, aiHostelInfo: e.target.value }
                    }))}
                  />
                </div>

                {/* Scholarships */}
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block">Scholarship Schemes</label>
                  <textarea 
                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-4 text-xs font-semibold text-slate-700 outline-none focus:bg-white focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500 h-32"
                    placeholder="e.g. Up to 50% waiver based on academic performance/financial needs..."
                    value={settings.aiPrompts.aiScholarshipInfo || ''}
                    onChange={(e) => setSettings(prev => ({
                      ...prev,
                      aiPrompts: { ...prev.aiPrompts, aiScholarshipInfo: e.target.value }
                    }))}
                  />
                </div>

                {/* Fees */}
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block">Fee Details</label>
                  <textarea 
                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-4 text-xs font-semibold text-slate-700 outline-none focus:bg-white focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500 h-32"
                    placeholder="e.g. B.Sc Trending courses are ~85k/year, Traditional courses ~45k/year..."
                    value={settings.aiPrompts.aiFeeInfo || ''}
                    onChange={(e) => setSettings(prev => ({
                      ...prev,
                      aiPrompts: { ...prev.aiPrompts, aiFeeInfo: e.target.value }
                    }))}
                  />
                </div>
              </div>
            </div>

            {/* 📄 Admission Brochure */}
            <div className="bg-white border border-slate-200 rounded-[2rem] p-8 shadow-sm animate-fade-in">
              <h3 className="text-sm font-black text-slate-800 uppercase tracking-wider mb-2 flex items-center gap-2">
                <Mail size={18} className="text-emerald-500" />
                Dynamic Brochure PDF Share Link
              </h3>
              <p className="text-xs text-slate-400 mb-6 font-bold uppercase tracking-wider">
                Upload or paste the URL of the prospectus brochure. The AI will automatically share this file when requested!
              </p>

              <input 
                type="text"
                className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-4 text-xs font-semibold text-slate-700 outline-none focus:bg-white focus:ring-2 focus:ring-emerald-500/10 focus:border-emerald-500"
                placeholder="https://example.com/brochure.pdf"
                value={settings.aiPrompts.aiBrochureUrl || ''}
                onChange={(e) => setSettings(prev => ({
                  ...prev,
                  aiPrompts: { ...prev.aiPrompts, aiBrochureUrl: e.target.value }
                }))}
              />
            </div>
          </div>
        )}

        {activeTab === 'builder' && (
          <div className="space-y-6 pb-20 animate-fade-in">
            {(settings.aiPrompts.prdFlowSteps || []).map((step, index) => (
              <div key={step.id} className="bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-sm hover:shadow-md transition-all">
                <div className="px-6 py-4 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-blue-100 text-blue-600 rounded-xl">
                       <MessageSquare size={18} />
                    </div>
                    <input 
                      className="bg-transparent border-none text-sm font-black text-slate-800 uppercase focus:ring-0 p-0 w-64"
                      value={step.title}
                      onChange={(e) => updateStep(step.id, 'title', e.target.value)}
                    />
                  </div>
                  <div className="flex items-center space-x-2">
                    <select 
                      className="bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-[10px] font-black uppercase text-slate-500 outline-none focus:ring-1 focus:ring-blue-500"
                      value={step.type}
                      onChange={(e) => updateStep(step.id, 'type', e.target.value)}
                    >
                      <option value="GREETING">Greeting</option>
                      <option value="NAME_CAPTURE">Name Capture</option>
                      <option value="QUALIFICATION">Qualification</option>
                      <option value="PROGRAM_SELECTION">Program Branch</option>
                      <option value="SUCCESS_PROOF">Success Proof</option>
                      <option value="CUSTOM_MESSAGE">Custom Message</option>
                    </select>
                    <button onClick={() => removeStep(step.id)} className="p-2 text-red-500 hover:text-red-700 bg-red-50 hover:bg-red-100 rounded-xl transition-all" title="Delete Step">
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
                
                <div className="p-6 space-y-6">
                  <div>
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">Message Body</label>
                    <textarea 
                      className="w-full bg-slate-50 border border-slate-100 rounded-2xl p-4 text-sm min-h-[100px] outline-none focus:bg-white focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500 transition-all"
                      value={step.message || step.text || ''}
                      onChange={(e) => updateStep(step.id, 'message', e.target.value)}
                      placeholder="Type message..."
                    />

                    {/* 🖼️ PREMIUM IMAGE BANNER UPLOADER & PREVIEW */}
                    {(step.type === 'GREETING' || step.type === 'SUCCESS_PROOF') && (
                      <div className="mt-4 p-4 bg-slate-50 border border-slate-200/60 rounded-2xl animate-fade-in">
                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block mb-2">Greeting / Proof Image Banner</label>
                        
                        <div className="flex flex-col sm:flex-row gap-4 items-center">
                          {/* Image Thumbnail Preview */}
                          <div className="w-full sm:w-36 h-24 bg-white border border-slate-200 rounded-xl overflow-hidden flex items-center justify-center relative group shadow-inner">
                            {step.image ? (
                              <>
                                <img src={step.image} alt="Banner Preview" className="w-full h-full object-cover" />
                                <button 
                                  onClick={() => updateStep(step.id, 'image', '')}
                                  className="absolute top-1.5 right-1.5 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-all duration-200 hover:scale-110 shadow"
                                >
                                  <X size={10} />
                                </button>
                              </>
                            ) : (
                              <div className="text-center p-2 text-slate-300">
                                <ImageIcon size={24} className="mx-auto mb-1 text-slate-300/70" />
                                <span className="text-[8px] font-bold uppercase tracking-widest text-slate-400 block">No Banner</span>
                              </div>
                            )}
                          </div>

                          {/* Image Actions */}
                          <div className="flex-1 w-full space-y-2">
                            <div className="flex flex-col sm:flex-row gap-2">
                              {/* Custom File Upload Label */}
                              <label className="flex-shrink-0 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-[10px] font-black uppercase tracking-widest text-center cursor-pointer shadow-sm transition-all flex items-center justify-center gap-1.5">
                                <Upload size={12} />
                                <span>Upload Image</span>
                                <input 
                                  type="file" 
                                  accept="image/*"
                                  className="hidden"
                                  onChange={async (e) => {
                                    const file = e.target.files[0];
                                    if (!file) return;
                                    
                                    const formData = new FormData();
                                    formData.append('image', file);
                                    
                                    const token = localStorage.getItem('token');
                                    const tenantId = localStorage.getItem('tenantId');
                                    
                                    const uploadToast = toast.loading('Uploading banner...');
                                    try {
                                      const res = await fetch('/api/settings/upload-image', {
                                        method: 'POST',
                                        headers: {
                                          'Authorization': `Bearer ${token}`,
                                          'x-tenant-id': tenantId
                                        },
                                        body: formData
                                      });
                                      
                                      toast.dismiss(uploadToast);
                                      if (res.ok) {
                                        const data = await res.json();
                                        updateStep(step.id, 'image', data.url);
                                        toast.success('Banner uploaded successfully!');
                                      } else {
                                        toast.error('Failed to upload image banner');
                                      }
                                    } catch (err) {
                                      toast.dismiss(uploadToast);
                                      toast.error('Error uploading image');
                                    }
                                  }}
                                />
                              </label>

                              {/* Paste URL Input */}
                              <input 
                                type="text"
                                className="flex-1 bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs outline-none focus:ring-1 focus:ring-blue-500 font-medium text-slate-700"
                                placeholder="Or paste image URL here..."
                                value={step.image || ''}
                                onChange={(e) => updateStep(step.id, 'image', e.target.value)}
                              />
                            </div>
                            <p className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">Recommended: PNG/JPG ratios (16:9 or 4:3) under 2MB for optimal WhatsApp delivery.</p>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                    {step.type === 'QUALIFICATION' ? (
                      <div>
                        <label className="text-[10px] font-black text-amber-600 uppercase tracking-widest mb-2 block">Qualification Options (Comma Separated)</label>
                        <textarea 
                           className="w-full text-xs p-3 rounded-xl border border-amber-200 outline-none focus:ring-2 focus:ring-amber-500/20"
                           placeholder="10th Pass, 12th Pass, Diploma, Graduation..."
                           value={(settings.aiPrompts.qualificationOptions || []).join(', ')}
                           onChange={(e) => setSettings(prev => ({...prev, aiPrompts: {...prev.aiPrompts, qualificationOptions: e.target.value.split(',').map(s=>s.trim())}}))}
                        />
                        <p className="text-[10px] text-slate-400 mt-2">These options will be sent to the user as an interactive list.</p>
                      </div>
                    ) : step.type === 'PROGRAM_SELECTION' ? (
                      <div>
                        <label className="text-[10px] font-black text-blue-600 uppercase tracking-widest mb-2 block">Dynamic Program Mapping (JSON)</label>
                        <p className="text-xs text-blue-800 mb-2">Programs are automatically mapped based on the selected qualification. Edit the raw JSON mapping below:</p>
                        <textarea 
                           className="w-full text-[10px] p-3 rounded-xl border border-blue-200 outline-none h-48 font-mono focus:ring-2 focus:ring-blue-500/20 font-medium text-slate-700"
                           value={programMapJson}
                           onChange={(e) => {
                              setProgramMapJson(e.target.value);
                              try {
                                const parsed = JSON.parse(e.target.value);
                                setSettings(prev => ({...prev, aiPrompts: {...prev.aiPrompts, programMap: parsed}}));
                              } catch(err) {
                                // Silent catch during typing
                              }
                           }}
                           onBlur={(e) => {
                              try {
                                const parsed = JSON.parse(e.target.value);
                                setSettings(prev => ({...prev, aiPrompts: {...prev.aiPrompts, programMap: parsed}}));
                                toast.success('Program mapping format is valid!');
                              } catch(err) {
                                toast.error('Invalid JSON format! Please correct before saving.');
                              }
                           }}
                        />
                      </div>
                    ) : (
                      <>
                        <div className="flex justify-between items-center mb-4">
                          <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Interactive Buttons</label>
                      <button onClick={() => addStepButton(step.id)} className="text-[10px] font-black text-blue-600 bg-white px-3 py-1.5 rounded-lg border border-slate-200 shadow-sm hover:bg-blue-50 transition-all flex items-center">
                        <Plus size={12} className="mr-1" /> Add Button
                      </button>
                    </div>
                    <div className="space-y-2">
                      {(step.buttons || []).map((btn, bIdx) => (
                        <div key={bIdx} className="flex items-center gap-3 bg-white p-2 rounded-xl border border-slate-100 shadow-sm">
                          <select 
                             className="bg-slate-50 border-none text-[10px] font-bold text-slate-500 rounded-lg py-1 px-2"
                             value={btn.type}
                             onChange={(e) => updateStepButton(step.id, bIdx, 'type', e.target.value)}
                          >
                             <option value="reply">Reply</option>
                             <option value="url">URL</option>
                             <option value="call">Call</option>
                             <option value="handoff">Handoff</option>
                          </select>
                          <input 
                            className="flex-1 text-xs font-bold text-slate-700 outline-none border-b border-transparent focus:border-blue-500"
                            value={btn.label}
                            onChange={(e) => updateStepButton(step.id, bIdx, 'label', e.target.value)}
                          />
                          <button onClick={() => removeStepButton(step.id, bIdx)} className="text-slate-300 hover:text-red-400 p-1">
                            <X size={14} />
                          </button>
                        </div>
                      ))}
                    </div>
                  </>
                  )}
                </div>
              </div>

                <div className="flex justify-center -mb-3 relative z-10">
                   <button onClick={() => addStep(index)} className="bg-white p-2 rounded-full border border-slate-200 shadow-md hover:scale-110 transition-transform text-blue-600">
                      <Plus size={20} />
                   </button>
                </div>
              </div>
            ))}
            
            {(settings.aiPrompts.prdFlowSteps || []).length === 0 && (
              <div className="text-center py-20 bg-white border-2 border-dashed border-slate-200 rounded-[3rem]">
                 <Bot size={48} className="mx-auto text-slate-200 mb-4" />
                 <h3 className="text-lg font-black text-slate-800">No Automation Steps Yet</h3>
                 <p className="text-slate-400 text-sm mb-6">Start building your automated student journey.</p>
                 <button onClick={() => addStep(-1)} className="px-8 py-3 bg-blue-600 text-white rounded-2xl font-black uppercase text-xs tracking-widest shadow-premium hover:bg-blue-700 transition-all">
                    Create First Step
                 </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
