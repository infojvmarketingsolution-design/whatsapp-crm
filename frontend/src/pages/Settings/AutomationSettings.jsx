// Standalone PromptInput component for better performance and safety
const PromptInput = ({ label, icon: Icon, value, onChange, placeholder, hint, isImage, fieldKey, handleUploadClick, uploading }) => {
  const safeValue = typeof value === 'string' ? value : '';
  
  return (
    <div className="space-y-1.5">
      <label className="flex items-center text-xs font-bold text-gray-700 uppercase tracking-wider">
        <Icon size={14} className="mr-1.5 text-teal-600" />
        {label}
      </label>
      
      {isImage ? (
        <div className="space-y-2">
          <div className="flex gap-2">
            <div className="relative flex-1 group">
              <input 
                type="text"
                className="w-full bg-white border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 shadow-sm"
                value={safeValue}
                onChange={(e) => onChange(e.target.value)}
                placeholder="Manual Image URL or ID"
              />
              {safeValue && (
                <button 
                  onClick={() => onChange('')}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-red-500 transition-colors"
                  title="Clear Value"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
                </button>
              )}
            </div>
            <button 
              onClick={() => handleUploadClick(fieldKey)}
              disabled={uploading === fieldKey}
              className="flex items-center justify-center px-4 bg-teal-50 border border-teal-100 rounded-xl text-teal-700 hover:bg-teal-100 hover:border-teal-200 transition-all font-bold text-xs shadow-sm disabled:opacity-50"
              title="Upload from computer"
            >
              {uploading === fieldKey ? (
                <span className="w-4 h-4 border-2 border-teal-500/30 border-t-teal-500 rounded-full animate-spin"></span>
              ) : (
                <>
                  <Upload size={14} className="mr-2" />
                  Upload
                </>
              )}
            </button>
          </div>
          {safeValue && safeValue.startsWith('http') && (
            <div className="relative w-20 h-20 rounded-lg overflow-hidden border border-gray-100 shadow-sm bg-gray-50 flex items-center justify-center">
              <img src={safeValue} alt="Preview" className="w-full h-full object-cover" onError={(e) => e.target.style.display='none'} />
              <div className="absolute inset-0 bg-black/0 hover:bg-black/5 transition-colors pointer-events-none" />
            </div>
          )}
        </div>
      ) : (
        <div className="relative group">
          <textarea 
            className="w-full bg-white border border-gray-200 rounded-xl p-3 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 min-h-[80px] resize-none shadow-sm"
            value={safeValue}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder}
          />
        </div>
      )}
      
      {hint && <p className="text-[10px] text-gray-400 italic mt-1">{hint}</p>}
    </div>
  );
};

export default function AutomationSettings() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [settings, setSettings] = useState({
    botEnabled: false,
    fallbackToHuman: true,
    rateLimit: 50,
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

  const [uploading, setUploading] = useState(null); // stores the key being uploaded
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
      console.error('Failed to fetch automation settings', err);
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
    } catch (err) {
      console.error('Failed to save', err);
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
      } else {
        alert('Failed to upload image. Please try again.');
      }
    } catch (err) {
      console.error('Upload error:', err);
      alert('Error uploading image');
    } finally {
      setUploading(null);
      e.target.value = ''; // reset file input
    }
  };

  // Switch Toggle Component
  const Toggle = ({ label, description, checked, onChange }) => (
    <div className="flex items-center justify-between p-4 bg-gray-50 border border-gray-100 rounded-xl hover:border-teal-100 transition-colors">
      <div className="pr-4">
        <div className="text-sm font-bold text-gray-800">{label}</div>
        <div className="text-xs text-gray-500 mt-0.5 leading-relaxed">{description}</div>
      </div>
      <button 
        type="button"
        onClick={() => onChange(!checked)}
        className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none shadow-inner ${checked ? 'bg-teal-500' : 'bg-gray-300'}`}
      >
        <span className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${checked ? 'translate-x-5' : 'translate-x-0'}`} />
      </button>
    </div>
  );

  if (loading) return <div className="animate-pulse space-y-4"><div className="h-20 bg-gray-200 rounded-xl"></div><div className="h-20 bg-gray-200 rounded-xl"></div></div>;

  return (
    <div className="max-w-4xl space-y-6 pb-20">
      <input 
        type="file" 
        ref={fileInputRef} 
        className="hidden" 
        accept="image/*"
        onChange={handleFileChange}
      />
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
        <h2 className="text-lg font-bold text-gray-900 mb-6 flex items-center">
          <Bot className="mr-2 text-teal-600" size={20} />
          Bot & Automation Rules
        </h2>

        <div className="space-y-4">
          <Toggle 
            label="Enable Meta AI / Reply Bot" 
            description="Automatically reply to incoming messages when agents are busy. Uses default flows."
            checked={settings.botEnabled}
            onChange={(val) => setSettings({...settings, botEnabled: val})}
          />
          
          <Toggle 
            label="Fallback to Human Agent" 
            description="If the bot doesn't understand or the user requests a human, seamlessly transfer to the Inbox."
            checked={settings.fallbackToHuman}
            onChange={(val) => setSettings({...settings, fallbackToHuman: val})}
          />
        </div>

        <div className="mt-6 border-t border-gray-100 pt-6">
          <h3 className="text-sm font-bold text-gray-800 mb-4 flex items-center">
            <AlertTriangle className="mr-2 text-orange-500" size={16} />
            Smart Controls
          </h3>
          
          <div className="bg-gray-50 p-4 border border-gray-100 rounded-xl">
             <label className="block text-sm font-bold text-gray-700 mb-1">Rate Limiting (Messages per minute)</label>
             <p className="text-xs text-gray-500 mb-3">Prevent spam loops by limiting how many times automation triggers per user.</p>
             <input 
                type="number" 
                value={settings.rateLimit || 0}
                onChange={(e) => setSettings({...settings, rateLimit: parseInt(e.target.value) || 0})}
                className="w-32 bg-white border border-gray-200 rounded-lg py-2 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
              />
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
        <div className="flex justify-between items-start mb-2">
          <h2 className="text-lg font-bold text-gray-900 flex items-center">
            <MessageSquare className="mr-2 text-teal-600" size={20} />
            Bot Script & Prompts
          </h2>
          <div className="flex items-center text-[10px] uppercase font-bold text-gray-400 tracking-widest bg-gray-50 px-2 py-1 rounded">
             <Upload size={10} className="mr-1" />
             Auto-Upload Enabled
          </div>
        </div>
        <p className="text-sm text-gray-500 mb-8 border-b border-gray-50 pb-4">
          Customize what the AI bot says during the automated onboarding process. Use the <strong>Upload</strong> button or enter a <strong>Manual Link</strong> for images.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="space-y-6">
            <PromptInput 
              label="Greeting Message" 
              icon={Bot}
              value={settings.aiPrompts.greetingMessage}
              onChange={(val) => updatePrompt('greetingMessage', val)}
              placeholder="First message sent when user says hi..."
              hint="Supports: {{name}}"
            />
            <PromptInput 
              label="Greeting Image" 
              icon={Bot}
              value={settings.aiPrompts.greetingImage}
              onChange={(val) => updatePrompt('greetingImage', val)}
              placeholder="https://example.com/image.jpg"
              hint="Upload a welcoming image or add a manual link"
              isImage={true}
              fieldKey="greetingImage"
              handleUploadClick={handleUploadClick}
              uploading={uploading}
            />
          </div>

          <div className="space-y-6">
            <PromptInput 
              label="Program List Prompt" 
              icon={GraduationCap}
              value={settings.aiPrompts.programListPrompt}
              onChange={(val) => updatePrompt('programListPrompt', val)}
              placeholder="Asking user to select a course..."
              hint="Supports: {{name}}"
            />
            <div className="pt-[14px]">
              <PromptInput 
                label="Name Request (Secondary)" 
                icon={User}
                value={settings.aiPrompts.namePrompt}
                onChange={(val) => updatePrompt('namePrompt', val)}
                placeholder="If bot forgot to ask name..."
              />
            </div>
          </div>

          <div className="space-y-6">
            <PromptInput 
              label="Success Proof / Social Proof" 
              icon={AlertTriangle}
              value={settings.aiPrompts.successProofMessage}
              onChange={(val) => updatePrompt('successProofMessage', val)}
              placeholder="Mentioning success stories..."
              hint="Supports: {{name}}"
            />
            <PromptInput 
              label="Success Proof Image" 
              icon={AlertTriangle}
              value={settings.aiPrompts.successProofImage}
              onChange={(val) => updatePrompt('successProofImage', val)}
              placeholder="https://example.com/success.jpg"
              hint="Select a success story image or add manual link"
              isImage={true}
              fieldKey="successProofImage"
              handleUploadClick={handleUploadClick}
              uploading={uploading}
            />
          </div>

          <div className="space-y-6">
            <PromptInput 
              label="Call Time Request" 
              icon={PhoneCall}
              value={settings.aiPrompts.callTimePrompt}
              onChange={(val) => updatePrompt('callTimePrompt', val)}
              placeholder="Asking when to call back..."
              hint="Supports: {{name}}"
            />
            <PromptInput 
              label="Agent Transfer Message" 
              icon={Headphones}
              value={settings.aiPrompts.agentTransferPrompt}
              onChange={(val) => updatePrompt('agentTransferPrompt', val)}
              placeholder="When handing over to a human..."
            />
          </div>

          <PromptInput 
            label="Fallback / Don't Understand" 
            icon={HelpCircle}
            value={settings.aiPrompts.fallbackMessage}
            onChange={(val) => updatePrompt('fallbackMessage', val)}
            placeholder="When user says something irrelevant..."
          />
        </div>

        <div className="mt-10 pt-6 border-t border-gray-100 flex justify-end items-center">
           <p className="text-xs text-gray-400 mr-6">
             All changes are saved instantly to the database.
           </p>
          <button 
            onClick={handleSave}
            disabled={saving}
            className="flex items-center px-6 py-3 bg-[var(--theme-bg)] text-white rounded-xl text-sm font-bold hover:opacity-90 transition shadow-lg shadow-teal-500/20 disabled:opacity-50"
          >
            {saving ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2"></span> : <Save size={18} className="mr-2" />}
            Save Automation Settings
          </button>
        </div>
      </div>
    </div>
  );
}
