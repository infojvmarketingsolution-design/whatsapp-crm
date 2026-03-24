import React, { useState, useEffect } from 'react';
import { Save, Bell, Mail, Smartphone } from 'lucide-react';

export default function NotificationSettings() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [settings, setSettings] = useState({
    email: true,
    whatsapp: true,
    inApp: true
  });

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
        if (data.notifications) {
          setSettings(data.notifications);
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
      const res = await fetch(`/api/settings/notifications`, {
        method: 'PUT',
        headers: { 
          'Authorization': `Bearer ${token}`, 
          'x-tenant-id': tenantId,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(settings)
      });
      if (res.ok) {
         setSuccess(true);
         setTimeout(() => setSuccess(false), 2000);
      }
    } catch (err) {
      console.error('Failed to save', err);
    } finally {
      setSaving(false);
    }
  };

  const Toggle = ({ label, description, icon: Icon, checked, onChange }) => (
    <div className="flex items-center justify-between p-4 bg-gray-50 border border-gray-100 rounded-xl hover:border-teal-100 transition-colors">
      <div className="flex items-start pr-4">
        <div className="mt-1 mr-3 p-2 bg-white rounded-lg shadow-sm text-teal-600 border border-gray-100">
           <Icon size={18} />
        </div>
        <div>
          <div className="text-sm font-bold text-gray-800">{label}</div>
          <div className="text-xs text-gray-500 mt-0.5 leading-relaxed">{description}</div>
        </div>
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

  if (loading) return <div className="animate-pulse space-y-4"><div className="h-20 bg-gray-200 rounded-xl"></div></div>;

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
        <h2 className="text-lg font-bold text-gray-900 mb-6 flex items-center">
          <Bell className="mr-2 text-teal-600" size={20} />
          Alerts & Notifications
        </h2>

        <div className="space-y-4">
          <Toggle 
            icon={Mail}
            label="Email Alerts" 
            description="Receive daily summaries and critical alerts via email."
            checked={settings.email}
            onChange={(val) => setSettings({...settings, email: val})}
          />
          <Toggle 
            icon={Smartphone}
            label="WhatsApp Alerts" 
            description="Get notified instantly on WhatsApp for new leads and assigned chats."
            checked={settings.whatsapp}
            onChange={(val) => setSettings({...settings, whatsapp: val})}
          />
          <Toggle 
            icon={Bell}
            label="In-App Notifications" 
            description="Show browser push notifications and inside the CRM dashboard."
            checked={settings.inApp}
            onChange={(val) => setSettings({...settings, inApp: val})}
          />
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
            {success ? 'Saved Successfully!' : 'Save Notification Preferences'}
          </button>
        </div>
      </div>
    </div>
  );
}
