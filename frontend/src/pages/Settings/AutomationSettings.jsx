import React, { useState, useEffect, useRef } from 'react';
import { Save, Bot, Clock, AlertTriangle, MessageSquare, User, GraduationCap, PhoneCall, Headphones, HelpCircle, Upload } from 'lucide-react';

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

  const PromptInput = ({ label, icon: Icon, value, onChange, placeholder, hint, isImage, fieldKey }) => (
    <div className="space-y-1.5">
      <label className="flex items-center text-xs font-bold text-gray-700 uppercase tracking-wider">
        <Icon size={14} className="mr-1.5 text-teal-600" />
        {label}
      </label>
      <div className="relative group">
        <textarea 
          className="w-full bg-white border border-gray-200 rounded-xl p-3 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 min-h-[80px] resize-none"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
        />
        {isImage && (
          <div className="absolute right-3 bottom-3 flex items-center space-x-2">
            {value && (
              <div className="relative group/preview h-10 w-10 border border-gray-200 rounded-lg overflow-hidden bg-gray-50 flex items-center justify-center">
                 <img src={value} alt="Preview" className="h-full w-full object-cover" onError={(e) => { e.target.style.display = 'none'; }} />
                 <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/preview:opacity-100 flex items-center justify-center transition-opacity">
                    <button onClick={() => window.open(value, '_blank')} className="text-white p-1 hover:text-teal-300">
                       <HelpCircle size={14} />
                    </button>
                 </div>
              </div>
            )}
            <button 
              onClick={() => handleUploadClick(fieldKey)}
              disabled={uploading === fieldKey}
              className={`flex items-center space-x-1.5 px-3 py-1.5 bg-gray-50 border border-gray-200 rounded-lg text-gray-600 hover:text-teal-600 hover:border-teal-200 hover:bg-teal-50 transition-all shadow-sm ${uploading === fieldKey ? 'opacity-50 cursor-not-allowed' : ''}`}
              title="Upload from Browser"
            >
              {uploading === fieldKey ? (
                <span className="w-4 h-4 border-2 border-teal-500/30 border-t-teal-500 rounded-full animate-spin"></span>
              ) : (
                <>
                  <Upload size={14} />
                  <span className="text-[10px] font-bold uppercase">Upload</span>
                </>
              )}
            </button>
          </div>
        )}
      </div>
      <div className="flex justify-between items-center px-1">
        {hint && <p className="text-[10px] text-gray-400 italic">{hint}</p>}
        {isImage && (
           <p className="text-[10px] text-gray-400">
             {value ? 'Link generated auto ✔️' : 'Paste manual link or upload from browser'}
           </p>
        )}
      </div>
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
    </div>
  );
}
