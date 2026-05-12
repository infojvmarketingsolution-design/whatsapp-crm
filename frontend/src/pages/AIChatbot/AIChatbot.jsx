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
        </div>

        {activeTab === 'visual' ? (
           <div className="mb-12 animate-fade-in">
              <FlowCanvas steps={settings.aiPrompts.prdFlowSteps} />
           </div>
        ) : (
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
                    <button onClick={() => removeStep(step.id)} className="p-2 text-slate-300 hover:text-red-500 transition-colors">
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
                  </div>

                  <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
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
