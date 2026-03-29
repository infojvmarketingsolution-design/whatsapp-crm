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

  const handleUploadClick = (field) => {
    activeFieldRef.current = field;
    fileInputRef.current.click();
  };

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const field = activeFieldRef.current;
    
    // Check if we are updating a deep path (e.g., programMap proxy)
    const isDeep = typeof field === 'object';
    const targetField = isDeep ? field.key : field;
    
    setUploading(targetField);

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
        if (isDeep) {
            field.callback(data.url);
        } else {
            updatePrompt(field, data.url);
        }
        toast.success('Image uploaded successfully!');
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

  // --- Branching Logic Editor Handlers ---
  
  const addQualification = () => {
    const newQual = "New Level";
    setSettings(prev => ({
       ...prev,
       aiPrompts: {
          ...prev.aiPrompts,
          qualificationOptions: [...(prev.aiPrompts.qualificationOptions || []), newQual],
          programMap: {
             ...(prev.aiPrompts.programMap || {}),
             [newQual]: { 'Default Category': ['New Program'] }
          }
       }
    }));
  };

  const removeQualification = (qual) => {
    setSettings(prev => {
       const newQuals = (prev.aiPrompts.qualificationOptions || []).filter(q => q !== qual);
       const newMap = { ...(prev.aiPrompts.programMap || {}) };
       delete newMap[qual];
       return {
          ...prev,
          aiPrompts: { ...prev.aiPrompts, qualificationOptions: newQuals, programMap: newMap }
       };
    });
  };

  const updateQualName = (oldName, newName) => {
    if (oldName === newName) return;
    setSettings(prev => {
        const newQuals = (prev.aiPrompts.qualificationOptions || []).map(q => q === oldName ? newName : q);
        const newMap = { ...(prev.aiPrompts.programMap || {}) };
        newMap[newName] = newMap[oldName];
        delete newMap[oldName];
        return {
            ...prev,
            aiPrompts: { ...prev.aiPrompts, qualificationOptions: newQuals, programMap: newMap }
        };
    });
  };

  const addSection = (qual) => {
    setSettings(prev => {
        const newMap = { ...prev.aiPrompts.programMap };
        const qualData = { ...newMap[qual] };
        qualData['New Section'] = ['New Program'];
        newMap[qual] = qualData;
        return { ...prev, aiPrompts: { ...prev.aiPrompts, programMap: newMap } };
    });
  };

  const removeSection = (qual, section) => {
    setSettings(prev => {
        const newMap = { ...prev.aiPrompts.programMap };
        const qualData = { ...newMap[qual] };
        delete qualData[section];
        newMap[qual] = qualData;
        return { ...prev, aiPrompts: { ...prev.aiPrompts, programMap: newMap } };
    });
  };

  const updateSectionName = (qual, oldSection, newSection) => {
    if (oldSection === newSection) return;
    setSettings(prev => {
        const newMap = { ...prev.aiPrompts.programMap };
        const qualData = { ...newMap[qual] };
        qualData[newSection] = qualData[oldSection];
        delete qualData[oldSection];
        newMap[qual] = qualData;
        return { ...prev, aiPrompts: { ...prev.aiPrompts, programMap: newMap } };
    });
  };

  const updateProgram = (qual, section, index, value) => {
    setSettings(prev => {
        const newMap = { ...prev.aiPrompts.programMap };
        const qualData = { ...newMap[qual] };
        const secData = [...qualData[section]];
        secData[index] = value;
        qualData[section] = secData;
        newMap[qual] = qualData;
        return { ...prev, aiPrompts: { ...prev.aiPrompts, programMap: newMap } };
    });
  };

  const addProgram = (qual, section) => {
    setSettings(prev => {
        const newMap = { ...prev.aiPrompts.programMap };
        const qualData = { ...newMap[qual] };
        const secData = [...(qualData[section] || [])];
        secData.push('New Program');
        qualData[section] = secData;
        newMap[qual] = qualData;
        return { ...prev, aiPrompts: { ...prev.aiPrompts, programMap: newMap } };
    });
  };

  const removeProgram = (qual, section, index) => {
    setSettings(prev => {
        const newMap = { ...prev.aiPrompts.programMap };
        const qualData = { ...newMap[qual] };
        const secData = qualData[section].filter((_, i) => i !== index);
        qualData[section] = secData;
        newMap[qual] = qualData;
        return { ...prev, aiPrompts: { ...prev.aiPrompts, programMap: newMap } };
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
                  disabled={uploading === fieldKey}
                  className="flex items-center space-x-2 px-3 py-2 bg-white border border-gray-200 rounded-lg text-gray-600 hover:text-teal-600 hover:border-teal-200 transition-all shadow-sm font-bold"
                >
                  {uploading === fieldKey ? (
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
          
          {/* STEP 1: TRIGGER */}
          <div className="w-full max-w-2xl bg-white border border-teal-200 rounded-2xl shadow-sm p-4 flex items-center justify-between bg-teal-50/30">
             <div className="flex items-center space-x-3">
                <div className="bg-emerald-500 p-2 rounded-lg shadow-sm">
                   <Play size={18} className="text-white fill-white" />
                </div>
                <div>
                  <div className="text-[10px] font-black text-emerald-600 uppercase tracking-widest">Start Trigger</div>
                  <div className="text-sm font-bold text-gray-800">Every Incoming Message</div>
                </div>
             </div>
             <div className="px-3 py-1 bg-white border border-teal-100 rounded-lg text-[10px] font-bold text-teal-600 uppercase">
                Any Keyword
             </div>
          </div>

          <NodeLine />

          {/* STEP 2: GREETING */}
          <FlowNode 
            title="Greeting Message" 
            icon={MessageSquare} 
            colorClass="bg-blue-600"
            id="node-greeting"
          >
             <div className="flex flex-col md:flex-row gap-6">
                <div className="flex-1">
                  <NodeInput 
                      label="Greeting Text" 
                      value={settings.aiPrompts.greetingMessage}
                      onChange={(val) => updatePrompt('greetingMessage', val)}
                      placeholder="Welcome to our business! How can I help you?"
                      hint="Use {{name}} for dynamic name tag."
                      icon={MessageSquare}
                  />
                </div>
                <div className="w-full md:w-64">
                   <NodeInput 
                      label="Name Request" 
                      value={settings.aiPrompts.namePrompt}
                      onChange={(val) => updatePrompt('namePrompt', val)}
                      placeholder="May I know your name?"
                      icon={User}
                   />
                </div>
             </div>
             <NodeInput 
                label="Greeting Image" 
                value={settings.aiPrompts.greetingImage}
                isImage={true}
                fieldKey="greetingImage"
                onChange={(val) => updatePrompt('greetingImage', val)}
                placeholder="https://image-url.com/welcome.jpg"
                hint="Image will be sent with the greeting text as its caption."
                icon={ImageIcon}
             />
          </FlowNode>

          <NodeLine />

          {/* STEP 3 & 4: QUALIFICATION & BRANCHING */}
          <FlowNode 
            title="Qualification & Branching Logic" 
            icon={GraduationCap} 
            colorClass="bg-indigo-600"
            id="node-qual"
          >
             <div className="space-y-6">
                <NodeInput 
                  label="Qualification Question" 
                  value={settings.aiPrompts.programListPrompt}
                  onChange={(val) => updatePrompt('programListPrompt', val)}
                  placeholder="Select your last qualification 👇"
                  hint="This triggers the initial menu selection."
                  icon={User}
                />
                
                <div className="bg-gray-50 border border-gray-100 rounded-3xl p-6 sm:p-8">
                   <div className="flex items-center justify-between mb-8">
                      <div>
                        <h3 className="text-sm font-black text-gray-800 uppercase tracking-widest flex items-center">
                           <Play size={14} className="mr-2 text-indigo-500" />
                           Branching Logic Editor
                        </h3>
                        <p className="text-[10px] text-gray-400 mt-1 uppercase font-bold tracking-wider">Configure what users see after clicking a level</p>
                      </div>
                      <button 
                        onClick={addQualification}
                        className="flex items-center space-x-2 px-4 py-2 bg-indigo-600 text-white rounded-xl text-xs font-bold hover:bg-indigo-700 transition shadow-lg shadow-indigo-500/20 active:scale-95"
                      >
                         <Plus size={14} />
                         <span>Add Level</span>
                      </button>
                   </div>

                   <div className="space-y-6">
                      {(settings.aiPrompts.qualificationOptions || []).map((qual) => (
                        <div key={qual} className="group relative bg-white border border-gray-200 rounded-2xl p-6 shadow-sm transition-all hover:border-indigo-300 hover:shadow-md">
                           <button 
                              onClick={() => removeQualification(qual)}
                              className="absolute -right-2 -top-2 w-7 h-7 bg-red-50 text-red-500 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 hover:bg-red-500 hover:text-white transition-all shadow-sm border border-red-100"
                              title="Delete Level"
                           >
                              <Plus size={14} className="rotate-45" />
                           </button>
                           
                           <div className="flex items-center space-x-3 mb-6">
                              <div className="bg-indigo-100 p-2 rounded-lg text-indigo-600">
                                 <GraduationCap size={16} />
                              </div>
                              <input 
                                className="bg-transparent border-none text-sm font-black text-gray-800 uppercase tracking-wide focus:ring-0 w-full p-0"
                                value={qual}
                                onChange={(e) => updateQualName(qual, e.target.value)}
                              />
                           </div>
                           
                           <div className="pl-4 border-l-2 border-indigo-50 space-y-6">
                              {Object.keys(settings.aiPrompts.programMap?.[qual] || {}).map(section => (
                                 <div key={section} className="relative group/sec">
                                    <button 
                                      onClick={() => removeSection(qual, section)}
                                      className="absolute -left-7 top-0 text-gray-300 hover:text-red-400 opacity-0 group-hover/sec:opacity-100 transition-opacity"
                                      title="Remove Category"
                                    >
                                       <Plus size={14} className="rotate-45" />
                                    </button>
                                    
                                    <input 
                                       className="bg-transparent border-none text-[10px] font-bold text-gray-400 uppercase italic mb-3 focus:ring-0 block w-full p-0"
                                       value={section}
                                       onChange={(e) => updateSectionName(qual, section, e.target.value)}
                                    />
                                    
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                       {(settings.aiPrompts.programMap[qual][section] || []).map((prog, idx) => (
                                          <div key={`${qual}-${section}-${idx}`} className="flex items-center bg-gray-50 border border-gray-100 rounded-lg pr-2 group/prog overflow-hidden transition-colors hover:bg-white hover:border-indigo-100">
                                             <input 
                                                className="flex-1 bg-transparent border-none text-[10px] font-medium text-gray-700 py-2 px-3 focus:ring-0 min-w-0"
                                                value={prog}
                                                onChange={(e) => updateProgram(qual, section, idx, e.target.value)}
                                             />
                                             <button 
                                                onClick={() => removeProgram(qual, section, idx)}
                                                className="text-gray-300 hover:text-red-400 opacity-0 group-hover/prog:opacity-100 transition-opacity p-1"
                                             >
                                                <Plus size={12} className="rotate-45" />
                                             </button>
                                          </div>
                                       ))}
                                       <button 
                                          onClick={() => addProgram(qual, section)}
                                          className="flex items-center justify-center p-2 border border-dashed border-gray-200 rounded-lg text-gray-400 hover:text-indigo-500 hover:border-indigo-300 transition-all hover:bg-indigo-50/30"
                                       >
                                          <Plus size={12} />
                                       </button>
                                    </div>
                                 </div>
                              ))}
                              
                              <button 
                                onClick={() => addSection(qual)}
                                className="flex items-center space-x-2 text-[10px] font-bold text-indigo-400 hover:text-indigo-600 transition-colors bg-indigo-50/50 px-3 py-1.5 rounded-lg border border-dashed border-indigo-100 hover:bg-indigo-50"
                              >
                                 <Plus size={12} />
                                 <span>Add New Category</span>
                              </button>
                           </div>
                        </div>
                      ))}
                   </div>
                   
                   <p className="text-[10px] text-gray-400 mt-8 italic text-center bg-white/50 py-2 rounded-xl border border-gray-50">
                      Changes above are saved only when you click "Publish Bot Changes".
                   </p>
                </div>
             </div>
          </FlowNode>

          <NodeLine />

          {/* STEP 4: SUCCESS PROOF */}
          <FlowNode 
            title="Success & Social Proof" 
            icon={CheckCircle2} 
            colorClass="bg-teal-600"
            id="node-success"
          >
             <NodeInput 
                label="Success Proof Text" 
                value={settings.aiPrompts.successProofMessage}
                onChange={(val) => updatePrompt('successProofMessage', val)}
                placeholder="Our students love us! Here is our success..."
                hint="Increases lead trust and conversion."
                icon={MessageSquare}
             />
             <NodeInput 
                label="Success Proof Image (Optional)" 
                value={settings.aiPrompts.successProofImage}
                isImage={true}
                fieldKey="successProofImage"
                onChange={(val) => updatePrompt('successProofImage', val)}
                placeholder="https://image-url.com/proof.jpg"
                icon={ImageIcon}
             />
          </FlowNode>

          <NodeLine />

          {/* STEP 5: FALLBACK & TRANSFER */}
          <FlowNode 
            title="Advanced Recovery" 
            icon={AlertCircle} 
            colorClass="bg-orange-600"
            id="node-fallback"
          >
             <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <NodeInput 
                  label="Agent Transfer Message" 
                  value={settings.aiPrompts.agentTransferPrompt}
                  onChange={(val) => updatePrompt('agentTransferPrompt', val)}
                  placeholder="Transferring you to a live chat..."
                  icon={Headphones}
                />
                <NodeInput 
                  label="Fallback (Didn't Understand)" 
                  value={settings.aiPrompts.fallbackMessage}
                  onChange={(val) => updatePrompt('fallbackMessage', val)}
                  placeholder="Sorry, I didn't get that. Say it again?"
                  icon={HelpCircle}
                />
             </div>
          </FlowNode>

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
