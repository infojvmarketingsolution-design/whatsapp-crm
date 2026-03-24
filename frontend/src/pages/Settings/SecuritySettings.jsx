import React, { useState } from 'react';
import { Save, ShieldCheck, Database, Download } from 'lucide-react';

export default function SecuritySettings() {
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [settings, setSettings] = useState({
    autoBackup: true,
    gdprConsentTracker: true,
    dataRetention: '365'
  });

  const handleSave = async () => {
    setSaving(true);
    setTimeout(() => {
        setSaving(false);
        setSuccess(true);
        setTimeout(() => setSuccess(false), 2000);
    }, 800);
  };

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

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
        <h2 className="text-lg font-bold text-gray-900 mb-6 flex items-center">
          <ShieldCheck className="mr-2 text-teal-600" size={20} />
          Data & Security
        </h2>

        <div className="space-y-4">
          <Toggle 
            label="Automatic Daily Backups" 
            description="Securely backup contacts, chats, and templates to cold storage every 24 hours."
            checked={settings.autoBackup}
            onChange={(val) => setSettings({...settings, autoBackup: val})}
          />
          
          <Toggle 
            label="GDPR Consent Tracker" 
            description="Automatically log opt-in timestamps for European numbers before sending campaigns."
            checked={settings.gdprConsentTracker}
            onChange={(val) => setSettings({...settings, gdprConsentTracker: val})}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6 border-t border-gray-100 pt-6">
           <div className="bg-gray-50 p-4 border border-gray-100 rounded-xl">
             <label className="block text-sm font-bold text-gray-700 mb-1 flex items-center">
                <Database className="w-4 h-4 mr-1.5 text-gray-400" /> Data Retention Policy
             </label>
             <p className="text-xs text-gray-500 mb-3">Time before old chat logs are automatically permanently deleted.</p>
             <select 
               value={settings.dataRetention}
               onChange={(e) => setSettings({...settings, dataRetention: e.target.value})}
               className="w-full bg-white border border-gray-200 rounded-lg py-2.5 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
             >
                <option value="30">30 Days</option>
                <option value="90">90 Days</option>
                <option value="365">1 Year</option>
                <option value="forever">Keep Forever</option>
             </select>
           </div>
           
           <div className="bg-gray-50 p-4 border border-gray-100 rounded-xl flex flex-col justify-center items-start">
              <label className="block text-sm font-bold text-gray-700 mb-1">Export Workspace Data</label>
              <p className="text-xs text-gray-500 mb-3">Download a raw JSON snapshot of all CRM data.</p>
              <button 
                className="flex items-center px-4 py-2 bg-white border border-gray-200 text-gray-700 rounded-lg text-sm font-bold hover:bg-gray-50 transition shadow-sm w-full justify-center"
              >
                 <Download size={14} className="mr-2" />
                 Generate Export
              </button>
           </div>
        </div>

        <div className="mt-8 pt-5 border-t border-gray-100 flex justify-end">
          <button 
            onClick={handleSave}
            disabled={saving || success}
            className={`flex items-center px-5 py-2.5 text-white rounded-lg text-sm font-bold transition shadow-sm disabled:opacity-50 ${success ? 'bg-green-500 hover:bg-green-600' : 'bg-[var(--theme-bg)] hover:bg-teal-700'}`}
          >
            {saving ? (
               <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2"></span>
            ) : success ? (
               <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
            ) : (
               <Save size={16} className="mr-2" />
            )}
            {success ? 'Saved Successfully!' : 'Save Security Rules'}
          </button>
        </div>
      </div>
    </div>
  );
}
