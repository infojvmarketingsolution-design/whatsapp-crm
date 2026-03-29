import React, { useState, useEffect, useRef } from 'react';
import { 
  Save, 
  Bot, 
  MessageSquare, 
  User, 
  GraduationCap, 
  PhoneCall, 
  Headphones, 
  HelpCircle, 
  Upload, 
  Play, 
  ArrowRight,
  Plus,
  Image as ImageIcon,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { toast } from 'react-hot-toast';

export default function AIChatbot() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
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
      fallbackMessage: ''
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
    setSettings({
      ...settings,
      aiPrompts: {
        ...settings.aiPrompts,
        [key]: value
      }
    });
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

  // --- Dynamic Flow Step Handlers ---
  
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

  const moveStep = (index, direction) => {
     setSettings(prev => {
        const steps = [...(prev.aiPrompts.prdFlowSteps || [])];
        const newIndex = index + direction;
        if (newIndex < 0 || newIndex >= steps.length) return prev;
        [steps[index], steps[newIndex]] = [steps[newIndex], steps[index]];
        return { ...prev, aiPrompts: { ...prev.aiPrompts, prdFlowSteps: steps } };
     });
  };

  const NodeLine = () => (
    <div className="flex flex-col items-center py-2">
      <div className="w-0.5 h-8 bg-gray-200"></div>
      <div className="w-2 h-2 rounded-full bg-teal-500 -mt-1"></div>
    </div>
  );

  const FlowNode = ({ title, icon: Icon, colorClass, children, id }) => (
    <div id={id} className={`w-full max-w-2xl bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden animate-fade-in-up transition-all hover:shadow-md hover:border-teal-200`}>
      <div className={`px-5 py-3 ${colorClass} flex items-center justify-between border-b border-black/5`}>
        <div className="flex items-center space-x-2.5">
          <div className="bg-white/20 p-1.5 rounded-lg">
            <Icon size={18} className="text-white" />
          </div>
          <span className="text-sm font-bold text-white uppercase tracking-wider">{title}</span>
        </div>
        <div className="flex items-center space-x-2">
           <div className="bg-white/20 px-2 py-0.5 rounded text-[10px] font-bold text-white uppercase">AI Optimized</div>
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
          {isImage && (
             <div className="text-[10px] font-medium text-teal-600 flex items-center">
                <ImageIcon size={10} className="mr-1" />
                Image Attachment
             </div>
          )}
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
                {value && (
                  <div className="relative group/preview h-10 w-10 border border-gray-200 rounded-lg overflow-hidden bg-white shadow-sm flex items-center justify-center">
                     <img src={value} alt="Preview" className="h-full w-full object-cover" />
                     <button onClick={() => window.open(value, '_blank')} className="absolute inset-0 bg-black/40 opacity-0 group-hover/preview:opacity-100 flex items-center justify-center transition-opacity text-white">
                        <Play size={14} />
                     </button>
                  </div>
                )}
                <button 
                  onClick={() => handleUploadClick(fieldKey)}
                  disabled={uploading === (typeof fieldKey === 'object' ? `${fieldKey.stepId}_${fieldKey.field}` : fieldKey)}
                  className="flex items-center space-x-2 px-3 py-2 bg-white border border-gray-200 rounded-lg text-gray-600 hover:text-teal-600 hover:border-teal-200 transition-all shadow-sm font-bold"
                >
                  {uploading === (typeof fieldKey === 'object' ? `${fieldKey.stepId}_${fieldKey.field}` : fieldKey) ? (
                    <span className="w-4 h-4 border-2 border-teal-500/30 border-t-teal-500 rounded-full animate-spin"></span>
                  ) : (
                    <>
                      <Upload size={14} />
                      <span className="text-[10px] uppercase">Upload</span>
                    </>
                  )}
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
    <div className="p-8 bg-gray-50 min-h-screen">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-10">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center uppercase tracking-tight">
              <Bot className="mr-3 text-teal-600" size={28} />
              AI Chatbot Configuration
            </h1>
            <p className="text-sm text-gray-500 mt-1 font-medium">Design your automated conversation flow in real-time.</p>
          </div>
          <div className="flex items-center space-x-4">
             <button 
               onClick={() => setSettings({ ...settings, botEnabled: !settings.botEnabled })}
               className={`px-4 py-2 rounded-xl flex items-center space-x-2 border transition-all cursor-pointer hover:shadow-md active:scale-95 ${settings.botEnabled ? 'bg-teal-50 border-teal-200 text-teal-700' : 'bg-gray-100 border-gray-200 text-gray-500'}`}
               title={settings.botEnabled ? "Click to Disable Bot" : "Click to Enable Bot"}
             >
                <div className={`w-2 h-2 rounded-full ${settings.botEnabled ? 'bg-teal-500 animate-pulse' : 'bg-gray-400'}`}></div>
                <span className="text-xs font-black uppercase tracking-widest">{settings.botEnabled ? 'Bot Active' : 'Bot Disabled'}</span>
             </button>
             <button 
               onClick={handleSave}
               disabled={saving}
               className="px-8 py-3 bg-teal-600 text-white rounded-xl text-sm font-bold hover:bg-teal-700 transition shadow-lg shadow-teal-500/20 flex items-center disabled:opacity-50"
             >
               {saving ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2"></span> : <Save size={18} className="mr-2" />}
               Publish Bot Changes
             </button>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 mb-8 flex flex-col md:flex-row items-start md:items-center justify-between">
           <div>
              <h2 className="text-lg font-bold text-gray-800 tracking-tight">AI Strategy Mode</h2>
              <p className="text-sm text-gray-500 mt-1">Choose between the fixed Education Template or your custom dragged sequences.</p>
           </div>
           <div className="mt-4 md:mt-0 flex flex-col md:flex-row items-center space-y-3 md:space-y-0 md:space-x-3 w-full md:w-auto">
              <div className="flex bg-gray-100 p-1 rounded-xl w-full md:w-auto">
                 <button 
                   onClick={() => setSettings({ ...settings, botMode: 'PRD' })}
                   className={`px-5 py-2 rounded-lg text-sm font-bold uppercase tracking-wider transition-all w-1/2 md:w-auto ${settings.botMode === 'PRD' ? 'bg-white text-teal-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                 >
                   Education Template
                 </button>
                 <button 
                   onClick={() => setSettings({ ...settings, botMode: 'CUSTOM' })}
                   className={`px-5 py-2 rounded-lg text-sm font-bold uppercase tracking-wider transition-all w-1/2 md:w-auto ${settings.botMode === 'CUSTOM' ? 'bg-white text-teal-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                 >
                   Custom Flow Canvas
                 </button>
              </div>
           </div>
        </div>

        {settings.botMode === 'CUSTOM' && (
           <div className="bg-gradient-to-br from-teal-50 to-blue-50 border border-teal-100 rounded-2xl p-8 mb-8 flex flex-col items-center text-center shadow-inner">
              <div className="w-16 h-16 bg-white rounded-2xl border border-teal-200 shadow flex items-center justify-center mb-6">
                 <Bot className="text-teal-500" size={32} />
              </div>
              <h2 className="text-2xl font-black text-gray-800 mb-2">Advanced Custom Automation</h2>
              <p className="text-gray-600 max-w-lg mb-8">
                 You have selected Custom Freedom mode. Your bot will now completely ignore the default Education prompts and instead map incoming users to your visual reactive flow.
              </p>
              
              <div className="w-full max-w-md bg-white p-5 border border-teal-100 rounded-2xl shadow-sm text-left mb-6">
                 <label className="block text-xs font-bold text-teal-600 uppercase tracking-widest mb-2">Select Active Greeting Flow</label>
                 <select 
                   className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 text-sm font-bold text-gray-800 outline-none focus:ring-2 focus:ring-teal-500"
                   value={settings.customGreetingFlowId || ''}
                   onChange={(e) => setSettings({ ...settings, customGreetingFlowId: e.target.value })}
                 >
                   <option value="">-- Choose Custom Flow --</option>
                   {flows.map(f => (
                     <option key={f._id} value={f._id}>{f.name}</option>
                   ))}
                 </select>
              </div>

              <div className="flex items-center space-x-4">
                 <a href="/flows" target="_blank" className="px-6 py-3 bg-white border border-gray-200 text-gray-700 font-bold rounded-xl shadow-sm hover:border-teal-300 hover:text-teal-600 transition-colors uppercase text-sm tracking-wider">
                    Open Visual Builder
                 </a>
              </div>
           </div>
        )}

        {settings.botMode === 'PRD' && (
          <div className="flex flex-col items-center space-y-2 pb-20">
          
          <FlowNode title="Start Trigger" icon={Play} colorClass="bg-emerald-500" id="node-start">
             <div className="flex items-center justify-between text-xs font-bold text-gray-500 uppercase tracking-widest">
                <span>Every Incoming Message</span>
                <span className="bg-emerald-50 text-emerald-600 px-2 py-0.5 rounded">Any Keyword</span>
             </div>
          </FlowNode>

          {(settings.aiPrompts.prdFlowSteps || []).map((step, index) => {
            let colorClass = "bg-gray-400";
            let icon = MessageSquare;

            switch(step.type) {
              case 'GREETING': colorClass = "bg-blue-600"; icon = MessageSquare; break;
              case 'NAME_CAPTURE': colorClass = "bg-teal-600"; icon = User; break;
              case 'QUALIFICATION': colorClass = "bg-indigo-600"; icon = GraduationCap; break;
              case 'PROGRAM_SELECTION': colorClass = "bg-purple-600"; icon = Layers; break;
              case 'SUCCESS_PROOF': colorClass = "bg-rose-500"; icon = ShieldCheck; break;
              case 'CALL_TIME': colorClass = "bg-emerald-600"; icon = Calendar; break;
              case 'CUSTOM_MESSAGE': colorClass = "bg-amber-500"; icon = Mail; break;
              case 'CUSTOM_QUESTION': colorClass = "bg-cyan-600"; icon = HelpCircle; break;
            }

            return (
              <React.Fragment key={step.id}>
                 <div className="flex flex-col items-center group/add relative">
                     <div className="w-0.5 h-8 bg-gray-200 group-hover/add:bg-indigo-300 transition-colors"></div>
                     <button 
                       onClick={() => addStep(index - 1)}
                       className="absolute top-1/2 -translate-y-1/2 opacity-0 group-hover/add:opacity-100 flex items-center bg-indigo-600 text-white rounded-full p-1 shadow-lg hover:scale-110 transition z-10"
                     >
                        <Plus size={14} />
                     </button>
                     <div className="w-0.5 h-8 bg-gray-200 group-hover/add:bg-indigo-300 transition-colors"></div>
                 </div>

                 <FlowNode 
                   title={step.title} 
                   icon={icon} 
                   colorClass={colorClass}
                   id={step.id}
                 >
                    <div className="relative group">
                      <button 
                        onClick={() => removeStep(step.id)}
                        className="absolute -right-2 -top-12 opacity-0 group-hover:opacity-100 p-2 text-red-400 hover:text-red-500 transition-all bg-white rounded-full shadow-sm border border-red-50"
                      >
                         <Plus size={16} className="rotate-45" />
                      </button>

                      <div className="space-y-4">
                         <div className="flex items-center space-x-3">
                            <select 
                              className="bg-gray-50 border-none text-[10px] font-black text-gray-400 uppercase tracking-widest focus:ring-0 rounded-lg py-1 px-2"
                              value={step.type}
                              onChange={(e) => updateStep(step.id, 'type', e.target.value)}
                            >
                               <option value="GREETING">Greeting Node</option>
                               <option value="NAME_CAPTURE">Name Capture</option>
                               <option value="QUALIFICATION">Qualification Choice</option>
                               <option value="PROGRAM_SELECTION">Program Branching</option>
                               <option value="SUCCESS_PROOF">Success/Media Proof</option>
                               <option value="CALL_TIME">Call Scheduling</option>
                               <option value="CUSTOM_MESSAGE">Simple Message</option>
                               <option value="CUSTOM_QUESTION">Simple Question</option>
                            </select>
                            <input 
                              className="flex-1 bg-transparent border-none text-xs font-black text-gray-800 uppercase focus:ring-0 p-0"
                              value={step.title}
                              onChange={(e) => updateStep(step.id, 'title', e.target.value)}
                            />
                         </div>

                         <div className="grid grid-cols-1 gap-4">
                            {(step.type === 'GREETING' || step.type === 'SUCCESS_PROOF') && (
                               <NodeInput 
                                  label="Image Attachment" 
                                  value={step.image}
                                  isImage={true}
                                  fieldKey={{ stepId: step.id, field: 'image' }}
                                  onChange={(val) => updateStep(step.id, 'image', val)}
                                  placeholder="Upload or paste URL"
                                  icon={ImageIcon}
                               />
                            )}
                            
                            <NodeInput 
                               label="Message Body" 
                               value={step.message}
                               onChange={(val) => updateStep(step.id, 'message', val)}
                               placeholder="Type your message here..."
                               hint="Use {{name}} for user name."
                               icon={MessageSquare}
                            />
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
