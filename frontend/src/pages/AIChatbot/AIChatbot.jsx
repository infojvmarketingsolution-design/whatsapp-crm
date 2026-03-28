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
    setUploading(field);

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
        updatePrompt(field, data.url);
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
             <div className={`px-4 py-2 rounded-xl flex items-center space-x-2 border transition-all ${settings.botEnabled ? 'bg-teal-50 border-teal-200 text-teal-700' : 'bg-gray-100 border-gray-200 text-gray-500'}`}>
                <div className={`w-2 h-2 rounded-full ${settings.botEnabled ? 'bg-teal-500 animate-pulse' : 'bg-gray-400'}`}></div>
                <span className="text-xs font-black uppercase tracking-widest">{settings.botEnabled ? 'Bot Active' : 'Bot Disabled'}</span>
             </div>
             <button 
               onClick={handleSave}
               disabled={saving}
               className="px-8 py-3 bg-[var(--theme-bg)] text-white rounded-xl text-sm font-bold hover:opacity-90 transition shadow-lg shadow-teal-500/20 flex items-center disabled:opacity-50"
             >
               {saving ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2"></span> : <Save size={18} className="mr-2" />}
               Publish Bot Changes
             </button>
          </div>
        </div>

        <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleFileChange} />

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
             <NodeInput 
                label="Greeting Text" 
                value={settings.aiPrompts.greetingMessage}
                onChange={(val) => updatePrompt('greetingMessage', val)}
                placeholder="Welcome to our business! How can I help you?"
                hint="Use {{name}} for dynamic name tag."
                icon={MessageSquare}
             />
             <NodeInput 
                label="Greeting Image" 
                value={settings.aiPrompts.greetingImage}
                isImage={true}
                fieldKey="greetingImage"
                onChange={(val) => updatePrompt('greetingImage', val)}
                placeholder="https://image-url.com/welcome.jpg"
                hint="Image shown immediately after text greeting."
                icon={ImageIcon}
             />
          </FlowNode>

          <NodeLine />

          {/* STEP 3: QUALIFICATION */}
          <FlowNode 
            title="Qualification Logic" 
            icon={GraduationCap} 
            colorClass="bg-indigo-600"
            id="node-qual"
          >
             <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <NodeInput 
                  label="Name Request Prompt" 
                  value={settings.aiPrompts.namePrompt}
                  onChange={(val) => updatePrompt('namePrompt', val)}
                  placeholder="May I know your name?"
                  icon={User}
                />
                <NodeInput 
                  label="Education/Program Selection" 
                  value={settings.aiPrompts.programListPrompt}
                  onChange={(val) => updatePrompt('programListPrompt', val)}
                  placeholder="Which program are you interested in?"
                  hint="Bot will show qualification list here."
                  icon={GraduationCap}
                />
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
      </div>
    </div>
  );
}
