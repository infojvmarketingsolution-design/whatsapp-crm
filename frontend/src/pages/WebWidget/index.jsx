import React, { useState, useEffect } from 'react';
import { Globe, Settings, Code, Copy, CheckCircle, Save, MessageCircle } from 'lucide-react';
import API_URL from '../../apiConfig';

export default function WebWidget() {
  const [settings, setSettings] = useState({
    status: 'ACTIVE',
    theme_color: '#25D366',
    welcome_text: 'Hi there! How can we help you today?',
    button_text: 'Chat with us',
    position: 'right',
    whatsapp_number_id: ''
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [copied, setCopied] = useState(false);
  const [ctcData, setCtcData] = useState({ phone: '', message: '' });
  const [generatedLink, setGeneratedLink] = useState('');

  const tenantId = localStorage.getItem('tenantId') || 'DEMO_TENANT';
  const scriptCode = `<script src="/public/widget.js" data-client-id="${tenantId}"></script>`;

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_URL}/api/widgets`, {
        headers: { 'Authorization': `Bearer ${token}`, 'x-tenant-id': tenantId }
      });
      if (res.ok) {
        const data = await res.json();
        setSettings({
          status: data.status || 'ACTIVE',
          theme_color: data.theme_color || '#25D366',
          welcome_text: data.welcome_text || 'Hi there! How can we help you today?',
          button_text: data.button_text || 'Chat with us',
          position: data.position || 'right',
          whatsapp_number_id: data.whatsapp_number_id || ''
        });
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_URL}/api/widgets`, {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${token}`, 'x-tenant-id': tenantId, 'Content-Type': 'application/json' },
        body: JSON.stringify(settings)
      });
      if (!res.ok) {
        throw new Error('Failed to save widget settings');
      }
      alert('Settings saved successfully!');
    } catch (err) {
      alert(err.message);
    } finally {
      setSaving(false);
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text || scriptCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const generateCtcLink = () => {
    if (!ctcData.phone) return alert('Please enter a phone number');
    const cleanPhone = ctcData.phone.replace(/[^0-9]/g, '');
    const encodedMsg = encodeURIComponent(ctcData.message);
    const link = `https://wa.me/${cleanPhone}/?text=${encodedMsg}`;
    setGeneratedLink(link);
  };

  if (loading) return <div className="p-8">Loading widget settings...</div>;

  return (
    <div className="p-8 bg-crm-bg min-h-full animate-fade-in-up">
      <div className="flex justify-between items-end mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 flex items-center">
            <Globe className="mr-3 text-blue-600" /> Web Chat Widget
          </h1>
          <p className="text-sm text-gray-500 mt-2 font-medium">Configure your website tracking and chat embed code.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Configuration Form */}
        <div className="lg:col-span-2 space-y-6">
          <form onSubmit={handleSave} className="bg-white p-6 rounded-2xl shadow-soft border border-crm-border">
            <div className="flex items-center mb-6 pb-4 border-b border-gray-100">
              <Settings className="text-gray-400 mr-2" size={20}/>
              <h2 className="text-lg font-bold text-gray-800">Widget Configuration</h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-6">
              <div>
                <label className="block text-xs font-bold text-gray-600 mb-1.5 uppercase tracking-wide">Status</label>
                <select 
                  value={settings.status} 
                  onChange={(e) => setSettings({...settings, status: e.target.value})}
                  className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 transition-all font-medium text-gray-700"
                >
                  <option value="ACTIVE">Active (Visible)</option>
                  <option value="INACTIVE">Inactive (Hidden)</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-600 mb-1.5 uppercase tracking-wide">Brand Color</label>
                <div className="flex space-x-2">
                  <input 
                    type="color" 
                    value={settings.theme_color} 
                    onChange={(e) => setSettings({...settings, theme_color: e.target.value})}
                    className="h-10 w-14 rounded cursor-pointer border-0 p-0"
                  />
                  <input 
                    type="text" 
                    value={settings.theme_color} 
                    onChange={(e) => setSettings({...settings, theme_color: e.target.value})}
                    className="flex-1 border border-gray-200 rounded-xl px-4 py-2 text-sm focus:ring-2 focus:ring-blue-500 font-medium text-gray-700"
                  />
                </div>
              </div>
            </div>

            <div className="space-y-6 mb-6">
              <div>
                <label className="block text-xs font-bold text-gray-600 mb-1.5 uppercase tracking-wide">Welcome Text</label>
                <input 
                  type="text" 
                  value={settings.welcome_text} 
                  onChange={(e) => setSettings({...settings, welcome_text: e.target.value})}
                  className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 font-medium text-gray-700"
                  placeholder="e.g. Hi there!"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-600 mb-1.5 uppercase tracking-wide">Button Text</label>
                <input 
                  type="text" 
                  value={settings.button_text} 
                  onChange={(e) => setSettings({...settings, button_text: e.target.value})}
                  className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 font-medium text-gray-700"
                  placeholder="e.g. Chat with us"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-8">
              <div>
                <label className="block text-xs font-bold text-gray-600 mb-1.5 uppercase tracking-wide">Position on Screen</label>
                <select 
                  value={settings.position} 
                  onChange={(e) => setSettings({...settings, position: e.target.value})}
                  className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 font-medium text-gray-700"
                >
                  <option value="right">Bottom Right</option>
                  <option value="left">Bottom Left</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-600 mb-1.5 uppercase tracking-wide">Target WhatsApp Number ID (Optional)</label>
                <input 
                  type="text" 
                  value={settings.whatsapp_number_id} 
                  onChange={(e) => setSettings({...settings, whatsapp_number_id: e.target.value})}
                  className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 font-medium text-gray-700"
                  placeholder="e.g. 919909700606"
                />
              </div>
            </div>

            <button type="submit" disabled={saving} className="flex items-center justify-center w-full px-5 py-3 bg-blue-600 text-white rounded-xl text-sm font-bold shadow-soft hover:bg-blue-700 transition-colors disabled:opacity-50">
               <Save size={18} className="mr-2"/> {saving ? 'Saving...' : 'Save Configuration'}
            </button>
          </form>

          <div className="bg-white p-6 rounded-2xl shadow-soft border border-crm-border">
            <div className="flex items-center mb-4">
              <Code className="text-gray-400 mr-2" size={20}/>
              <h2 className="text-lg font-bold text-gray-800">Installation Code</h2>
            </div>
            <p className="text-sm text-gray-500 mb-4">Copy and paste this code snippet right before the closing <code>&lt;/body&gt;</code> tag on your website.</p>
            
            <div className="relative bg-gray-900 rounded-xl overflow-hidden p-4 group">
               <pre className="text-sm text-green-400 font-mono overflow-x-auto whitespace-pre-wrap">
                  {scriptCode}
               </pre>
               <button 
                  onClick={() => copyToClipboard(scriptCode)}
                  className="absolute top-2 right-2 p-2 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                  title="Copy code"
               >
                 {copied ? <CheckCircle size={18} className="text-green-400"/> : <Copy size={18} />}
               </button>
            </div>
          </div>

          {/* WhatsApp Click-to-Chat Generator */}
          <div className="bg-white p-6 rounded-2xl shadow-soft border border-crm-border mt-8">
            <div className="flex items-center mb-4 text-green-600">
              <MessageCircle className="mr-2" size={20}/>
              <h2 className="text-lg font-bold text-gray-800 uppercase tracking-tight">Click-to-Chat Generator</h2>
            </div>
            <p className="text-sm text-gray-400 mb-6 font-medium">Generate direct links for your ads or social media bios.</p>
            
            <div className="space-y-4">
              <div>
                <label className="block text-[10px] font-bold text-gray-400 mb-1.5 uppercase tracking-widest">Phone Number (with Country Code)</label>
                <input 
                  type="text" 
                  placeholder="e.g. 919876543210" 
                  className="w-full border border-gray-100 bg-gray-50 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-green-400 outline-none font-medium text-gray-700"
                  value={ctcData.phone}
                  onChange={e => setCtcData({...ctcData, phone: e.target.value})}
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-gray-400 mb-1.5 uppercase tracking-widest">Pre-filled Message</label>
                <textarea 
                  placeholder="Hi, I'm interested in your product!" 
                  className="w-full border border-gray-100 bg-gray-50 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-green-400 outline-none h-20 resize-none font-medium text-gray-700"
                  value={ctcData.message}
                  onChange={e => setCtcData({...ctcData, message: e.target.value})}
                />
              </div>
              <button 
                onClick={generateCtcLink}
                className="w-full py-3 bg-green-500 text-white font-bold rounded-xl shadow-glow hover:bg-green-600 transition-all text-sm uppercase tracking-wide"
              >
                Generate Link
              </button>

              {generatedLink && (
                <div className="mt-4 p-4 bg-green-50 rounded-xl border border-green-100 animate-fade-in text-center">
                  <p className="text-[11px] font-bold text-green-700 uppercase tracking-wider mb-2">Your WhatsApp Link:</p>
                  <div className="flex items-center space-x-2 bg-white p-2 rounded-lg border border-green-200">
                    <span className="flex-1 text-xs truncate font-mono text-gray-600">{generatedLink}</span>
                    <button onClick={() => copyToClipboard(generatedLink)} className="p-1.5 hover:bg-gray-100 rounded text-green-600">
                      {copied ? <CheckCircle size={16}/> : <Copy size={16}/>}
                    </button>
                  </div>
                  <div className="mt-4 flex justify-center">
                     <div className="p-2 bg-white border border-green-200 rounded-lg">
                        <div className="w-24 h-24 bg-gray-50 flex items-center justify-center text-[10px] text-gray-400 font-bold border-2 border-dashed border-gray-200 rounded">
                           LINK READY
                        </div>
                     </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Live Preview Pane */}
        <div className="lg:col-span-1">
          <div className="sticky top-8 bg-gray-100 rounded-2xl border-4 border-gray-800 h-[600px] overflow-hidden relative shadow-premium flex flex-col">
            <div className="bg-white h-12 border-b flex items-center px-4 space-x-2">
               <div className="w-3 h-3 rounded-full bg-red-400"></div>
               <div className="w-3 h-3 rounded-full bg-yellow-400"></div>
               <div className="w-3 h-3 rounded-full bg-green-400"></div>
            </div>
            <div className="flex-1 bg-white p-6 opacity-30">
                <div className="w-full h-8 bg-gray-200 rounded mb-4"></div>
                <div className="w-3/4 h-8 bg-gray-200 rounded mb-8"></div>
                <div className="w-full h-40 bg-gray-200 rounded mb-4"></div>
                <div className="w-full h-40 bg-gray-200 rounded mb-4"></div>
            </div>

            {/* Floating button preview */}
            <div className={`absolute bottom-6 flex items-center space-x-3 ${settings.position === 'left' ? 'left-6 flex-row-reverse space-x-reverse' : 'right-6'}`}>
               <div className="bg-white max-w-[200px] px-4 py-2 rounded-2xl shadow-lg border text-sm font-medium text-gray-700 relative">
                 {settings.welcome_text}
                 <div className={`absolute bottom-1/2 translate-y-1/2 w-3 h-3 bg-white border-t border-r ${settings.position === 'left' ? '-left-1.5 rotate-[225deg]' : '-right-1.5 rotate-45'}`}></div>
               </div>
               <button 
                 className="w-14 h-14 rounded-full shadow-lg flex items-center justify-center text-white transform hover:scale-110 transition-transform"
                 style={{ backgroundColor: settings.theme_color }}
               >
                  <Globe size={28} />
               </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
