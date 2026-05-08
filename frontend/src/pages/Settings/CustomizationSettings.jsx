import React, { useState, useEffect } from 'react';
import { Save, Palette, Monitor } from 'lucide-react';
import { toast } from 'react-hot-toast';

export default function CustomizationSettings() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [settings, setSettings] = useState({
    themeColor: '#10b981',
    customLogin: false
  });

  const colors = ['#10b981', '#3b82f6', '#8b5cf6', '#f43f5e', '#f97316', '#14b8a6', '#0f172a'];

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
        if (data.customization) {
          setSettings(data.customization);
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
      const res = await fetch(`/api/settings/customization`, {
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
         toast.success('Branding settings saved!');
         setTimeout(() => setSuccess(false), 2000);
      } else {
         toast.error('Failed to save settings');
      }
    } catch (err) {
      console.error('Failed to save', err);
      toast.error('Connection error');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="animate-pulse space-y-4"><div className="h-40 bg-gray-200 rounded-xl"></div></div>;

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
        <h2 className="text-lg font-bold text-gray-900 mb-6 flex items-center">
          <Palette className="mr-2 text-teal-600" size={20} />
          Theme & Branding
        </h2>

        <div className="space-y-6">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-3">Primary Brand Color</label>
            <div className="flex flex-wrap gap-3">
               {colors.map(color => (
                  <button
                    key={color}
                    onClick={() => {
                        setSettings({...settings, themeColor: color});
                        window.dispatchEvent(new CustomEvent('themeChanged', { detail: { color } }));
                    }}
                    className={`w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300 ${settings.themeColor === color ? 'ring-4 ring-offset-2 scale-110' : 'hover:scale-110 shadow-sm border border-black/10'}`}
                    style={{ 
                      backgroundColor: color,
                      ringColor: color,
                      borderColor: settings.themeColor === color ? color : 'transparent'
                    }}
                  >
                     {settings.themeColor === color && <div className="w-3 h-3 rounded-full bg-white shadow-sm animate-pop-in"></div>}
                  </button>
               ))}
            </div>
            <p className="text-xs text-gray-500 mt-4 font-medium">Select a color to replace the default Teal across the CRM platform.</p>
          </div>
          
          <div className="pt-6 border-t border-gray-100">
             <div className="flex items-center justify-between p-4 bg-gray-50 border border-gray-100 rounded-xl hover:border-teal-100 transition-colors">
                <div className="flex items-start pr-4">
                  <div className="mt-1 mr-3 p-2 bg-white rounded-lg shadow-sm text-teal-600 border border-gray-100">
                     <Monitor size={18} />
                  </div>
                  <div>
                    <div className="text-sm font-bold text-gray-800">Custom Login Page</div>
                    <div className="text-xs text-gray-500 mt-0.5 leading-relaxed">Display your company logo and hide the WapiPulse CRM branding on the login screen.</div>
                  </div>
                </div>
                <button 
                  type="button"
                  onClick={() => setSettings({...settings, customLogin: !settings.customLogin})}
                  className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none shadow-inner ${settings.customLogin ? 'bg-teal-500' : 'bg-gray-300'}`}
                >
                  <span className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${settings.customLogin ? 'translate-x-5' : 'translate-x-0'}`} />
                </button>
              </div>
          </div>
        </div>

        <div className="mt-8 pt-5 border-t border-gray-100 flex justify-end">
          <button 
            onClick={handleSave}
            disabled={saving || success}
            className={`flex items-center px-6 py-3 text-white rounded-xl text-sm font-black uppercase tracking-widest transition-all shadow-lg disabled:opacity-50 ${success ? 'bg-green-500' : 'hover:scale-105 active:scale-95'}`}
            style={{ 
              backgroundColor: success ? undefined : (settings.themeColor === '#10b981' ? '#075E54' : settings.themeColor)
            }}
          >
            {saving ? (
               <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2"></span>
            ) : success ? (
               <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
            ) : (
               <Save size={18} className="mr-2" />
            )}
            {success ? 'Saved!' : 'Save Branding'}
          </button>
        </div>
      </div>
    </div>
  );
}
