import React, { useState, useEffect } from 'react';
import { Key, Phone, Database, CheckCircle, Copy, Eye, EyeOff, Save, AlertCircle, Webhook, Zap, Wallet, ExternalLink } from 'lucide-react';

export default function ApiSetup() {
  const [token, setToken] = useState('');
  const [phoneId, setPhoneId] = useState('');
  const [wabaId, setWabaId] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [wabaName, setWabaName] = useState('');
  const [limitTier, setLimitTier] = useState('');
  const [callbackUrl, setCallbackUrl] = useState('');
  const [verifyToken, setVerifyToken] = useState('');
  const [openaiApiKey, setOpenaiApiKey] = useState('');

  useEffect(() => {
    fetchConfig();
  }, []);

  const fetchConfig = async () => {
    try {
      const jwtToken = localStorage.getItem('token');
      const tenantId = localStorage.getItem('tenantId');
      const res = await fetch(`/api/whatsapp/config`, {
        headers: { 'Authorization': `Bearer ${jwtToken}`, 'x-tenant-id': tenantId }
      });
      if (res.ok) {
        const data = await res.json();
        if (data.accessToken) setToken(data.accessToken);
        if (data.phoneNumberId) setPhoneId(data.phoneNumberId);
        if (data.wabaId) setWabaId(data.wabaId);
        if (data.phoneNumber) setPhoneNumber(data.phoneNumber);
        if (data.wabaName) setWabaName(data.wabaName);
        if (data.limitTier) setLimitTier(data.limitTier);
        if (data.callbackUrl) setCallbackUrl(data.callbackUrl);
        if (data.verifyToken) setVerifyToken(data.verifyToken);
        if (data.openaiApiKey) setOpenaiApiKey(data.openaiApiKey);
      }
    } catch (err) {
      console.error('Failed to fetch config', err);
    }
  };
  
  const [showToken, setShowToken] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState(null);

  const handleCopy = (text) => {
    navigator.clipboard.writeText(text);
  };

  const handleFacebookConnect = () => {
    if (!window.FB) {
      alert("Facebook System is still initializing or was blocked by an ad-blocker. Please turn off ad-blockers, refresh the page, and try again.");
      return;
    }

    try {
      window.FB.login(function(response) {
        console.log("Meta Embedded Signup Response:", response);
        
        const processResponse = async () => {
          if (response.authResponse) {
            const code = response.authResponse.code;
            if (!code) {
               alert("Embedded Signup closed early or failed to provide a valid OAuth code. Please try again.");
               return;
            }
            console.log("OAuth Code received. Initiating Server Exchange...");
            
            try {
              const jwtToken = localStorage.getItem('token');
              const tenantId = localStorage.getItem('tenantId');
              
              setSaving(true);
              const res = await fetch('/api/whatsapp/oauth', {
                method: 'POST',
                headers: { 
                  'Authorization': `Bearer ${jwtToken}`, 
                  'x-tenant-id': tenantId, 
                  'Content-Type': 'application/json' 
                },
                body: JSON.stringify({ code })
              });

              const data = await res.json();
              if (res.ok) {
                alert("Success! Meta Access Token successfully exchanged and saved.");
                if (data.accessToken) setToken(data.accessToken);
                fetchConfig();
              } else {
                alert("OAuth Exchange Failed: " + data.message);
              }
            } catch (err) {
               alert("Network Error during Token Exchange: " + err.message);
            } finally {
               setSaving(false);
            }

          } else {
            alert('Meta Embedded Signup sequence was blocked, cancelled, or failed validation. (Check pop-up blockers!)');
            console.warn('User cancelled login or did not fully authorize the Meta Embedded Signup.', response);
          }
        };

        processResponse();

      }, {
        config_id: '1270957501788115',
        response_type: 'code',
        override_default_response_type: true,
        extras: {"sessionInfoVersion":"3","version":"v4"}
      });
    } catch (e) {
      alert("Failed to open Facebook Window: " + e.message);
    }
  };

  const handleTestConnection = async () => {
    setTesting(true);
    setTestResult(null);
    try {
      const jwtToken = localStorage.getItem('token');
      const tenantId = localStorage.getItem('tenantId');
      const res = await fetch(`/api/whatsapp/test-connection`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${jwtToken}`,
          'x-tenant-id': tenantId
        }
      });

      const data = await res.json();
      setTestResult({
        success: data.success,
        message: data.message
      });
    } catch (err) {
      setTestResult({
        success: false,
        message: err.message
      });
    } finally {
      setTesting(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const jwtToken = localStorage.getItem('token');
      const tenantId = localStorage.getItem('tenantId');
      const res = await fetch(`/api/whatsapp/config`, {
        method: 'POST',
        headers: { 
          'Authorization': `Bearer ${jwtToken}`, 
          'x-tenant-id': tenantId, 
          'Content-Type': 'application/json' 
        },
        body: JSON.stringify({ accessToken: token, phoneNumberId: phoneId, wabaId, phoneNumber, wabaName })
      });
      
      if (res.ok) {
        setSaved(true);
        setTimeout(() => setSaved(false), 3000);
      } else {
        const data = await res.json();
        alert(data.message || 'Failed to save config');
      }
    } catch (err) {
      alert(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="bg-slate-50/50 min-h-full flex flex-col p-2 sm:p-8 relative overflow-y-auto custom-scrollbar animate-fade-in pb-20 sm:pb-10">
      <div className="mb-8 sm:mb-10 relative z-10">
         <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 mb-3 sm:mb-4">
            <div className="w-12 h-12 sm:w-14 sm:h-14 bg-blue-600 rounded-2xl flex items-center justify-center shadow-glow">
               <Key className="text-white" size={24} />
            </div>
            <div>
               <h1 className="text-xl sm:text-3xl font-black text-slate-800 tracking-tight uppercase">API Configuration</h1>
               <p className="text-[10px] sm:text-sm font-black text-slate-400 mt-1 uppercase tracking-widest leading-relaxed">Connect your Meta Developer App to enable the WhatsApp Cloud Engine and Webhooks.</p>
            </div>
         </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        
        {/* API Keys Panel */}
        <div className="xl:col-span-2 space-y-8">
           <div className="bg-white border border-slate-100 rounded-3xl shadow-premium p-5 sm:p-8">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8 pb-6 border-b border-slate-50">
                 <h2 className="text-base sm:text-lg font-black text-slate-800 flex items-center uppercase tracking-tight">
                    <Database className="mr-3 text-blue-600" size={24} />
                    WhatsApp Business API Credentials
                 </h2>
                 <button 
                   onClick={handleFacebookConnect}
                   className="w-full sm:w-auto flex items-center justify-center space-x-3 bg-blue-600 text-white px-6 py-3 rounded-2xl font-black uppercase tracking-widest text-[10px] shadow-glow hover:bg-blue-700 transition-all active:scale-95"
                 >
                   <ExternalLink size={14} /> <span>Connect Meta Portfolio</span>
                 </button>
              </div>
              
              <div className="space-y-8">
                 {/* Access Token */}
                 <div className="group">
                    <label className="flex justify-between items-center text-[10px] font-black text-slate-500 mb-3 uppercase tracking-widest">
                       <span>Permanent Access Token</span>
                       <span className="bg-emerald-50 text-emerald-700 px-3 py-1 rounded-full font-black border border-emerald-100">VERIFIED</span>
                    </label>
                    <div className="relative">
                       <input 
                         type={showToken ? "text" : "password"} 
                         value={token}
                         readOnly
                         placeholder="EAA..."
                         className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-4 pl-5 pr-28 text-xs font-bold text-slate-400 cursor-not-allowed outline-none group-focus-within:border-blue-500 transition-all"
                       />
                       <div className="absolute right-3 top-1/2 -translate-y-1/2 flex space-x-2">
                          <button onClick={() => setShowToken(!showToken)} className="p-2 text-slate-400 hover:text-blue-600 transition bg-white rounded-xl border border-slate-200 shadow-sm">
                             {showToken ? <EyeOff size={16} /> : <Eye size={16} />}
                          </button>
                          <button onClick={() => handleCopy(token)} className="p-2 text-slate-400 hover:text-blue-600 transition bg-white rounded-xl border border-slate-200 shadow-sm">
                             <Copy size={16} />
                          </button>
                       </div>
                    </div>
                    <p className="text-[10px] text-slate-400 mt-3 font-bold uppercase tracking-widest leading-relaxed">Token requires `whatsapp_business_messaging` permissions.</p>
                 </div>

                 <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {/* Phone Number ID */}
                    <div className="group">
                       <label className="block text-[10px] font-black text-slate-500 mb-3 uppercase tracking-widest">Phone Number ID</label>
                       <div className="relative">
                          <input 
                            type="text" 
                            value={phoneId}
                            readOnly
                            placeholder="e.g. 103564477..."
                            className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-4 pl-5 pr-14 text-xs font-black text-slate-500 cursor-not-allowed outline-none group-focus-within:border-blue-500 transition-all"
                          />
                          <button onClick={() => handleCopy(phoneId)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-blue-600 transition bg-white/90 p-2 rounded-xl shadow-sm border border-slate-100">
                             <Copy size={16} />
                          </button>
                       </div>
                    </div>

                    {/* WABA ID */}
                    <div className="group">
                       <label className="block text-[10px] font-black text-slate-500 mb-3 uppercase tracking-widest">Business Account ID</label>
                       <div className="relative">
                          <input 
                            type="text" 
                            value={wabaId}
                            readOnly
                            placeholder="e.g. 4217981..."
                            className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-4 pl-5 pr-14 text-xs font-black text-slate-500 cursor-not-allowed outline-none group-focus-within:border-blue-500 transition-all"
                          />
                          <button onClick={() => handleCopy(wabaId)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-blue-600 transition bg-white/90 p-2 rounded-xl shadow-sm border border-slate-100">
                             <Copy size={16} />
                          </button>
                       </div>
                    </div>
                 </div>

                 {/* Display Number & Name */}
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                   <div className="group">
                      <label className="block text-[10px] font-black text-slate-500 mb-3 uppercase tracking-widest">Registered Phone Number</label>
                      <div className="relative flex items-center">
                         <div className="absolute left-5 text-slate-400">
                            <Phone size={18} />
                         </div>
                         <input 
                           type="text" 
                           value={phoneNumber}
                           readOnly
                           className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-4 pl-14 pr-5 text-xs font-black text-slate-500 cursor-not-allowed outline-none group-focus-within:border-blue-500 transition-all"
                         />
                      </div>
                   </div>
                   <div className="group">
                      <label className="block text-[10px] font-black text-slate-500 mb-3 uppercase tracking-widest">WhatsApp Display Name</label>
                      <div className="relative">
                         <input 
                           type="text" 
                           value={wabaName}
                           readOnly
                           className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-4 px-5 text-xs font-black text-slate-500 cursor-not-allowed outline-none group-focus-within:border-blue-500 transition-all"
                         />
                      </div>
                   </div>
                 </div>
              </div>

              <div className="mt-8 pt-6 border-t border-gray-100 flex justify-end items-center">
                 <p className="text-sm font-medium text-gray-400">These credentials are managed by the system and cannot be edited.</p>
              </div>
           </div>

           {/* OpenAI API Key Panel */}
           <div className="bg-white border border-slate-100 rounded-3xl shadow-premium p-5 sm:p-8">
              <h2 className="text-base sm:text-lg font-black text-slate-800 mb-8 flex items-center uppercase tracking-tight">
                 <Zap className="mr-3 text-purple-600" size={24} />
                 AI Services Configuration
              </h2>
              <div className="group">
                  <label className="block text-[10px] font-black text-slate-500 mb-3 uppercase tracking-widest">OpenAI API Key</label>
                  <div className="relative">
                     <input 
                       type="text" 
                       value={openaiApiKey}
                       readOnly
                       className="w-full bg-purple-50/30 border border-purple-100 rounded-2xl py-4 px-5 text-xs font-bold text-purple-800 cursor-not-allowed outline-none font-mono tracking-widest group-focus-within:border-purple-500 transition-all"
                     />
                  </div>
                  <p className="text-[10px] text-slate-400 mt-4 font-bold uppercase tracking-widest leading-relaxed">This key powers Conversation Summarization and AI classification.</p>
              </div>
           </div>
        </div>

        {/* Side Panels */}
        <div className="space-y-6">
           {/* Webhook Status */}
           <div className="bg-slate-900 rounded-3xl p-6 sm:p-8 text-white shadow-premium relative overflow-hidden group">
              <div className="absolute -right-6 -top-6 text-white/5 group-hover:text-white/10 transition-colors duration-500">
                 <Webhook size={140} />
              </div>
               <h3 className="font-black text-lg mb-2 relative z-10 flex items-center justify-between uppercase tracking-tight">
                  <div className="flex items-center">
                    <Zap size={20} className="mr-3 text-yellow-400" fill="currentColor" />
                    Webhook Status
                  </div>
                  <span className="text-[8px] bg-white/10 px-2 py-1 rounded-full font-mono uppercase border border-white/5">v1.3.0-LIVE</span>
               </h3>
              <p className="text-[10px] font-bold text-slate-400 mb-8 relative z-10 uppercase tracking-widest">Listening for incoming Meta hooks on verified endpoint.</p>
              
              <div className="bg-white/5 rounded-2xl p-5 border border-white/10 relative z-10 space-y-6">
                 <div className="flex justify-between items-center">
                    <span className="text-[10px] font-black tracking-widest text-slate-400 uppercase">System Status</span>
                    <span className="flex items-center text-[10px] font-black text-blue-400 uppercase tracking-widest">
                       <span className="w-2 h-2 rounded-full bg-blue-400 mr-2 animate-pulse shadow-[0_0_8px_rgba(96,165,250,0.5)]"></span> Active
                    </span>
                 </div>
                 
                 <div>
                    <span className="text-[10px] font-black tracking-widest text-slate-400 uppercase">Callback URL</span>
                    <p className="text-[10px] font-mono text-white mt-3 break-all bg-black/40 p-3 rounded-xl border border-white/5">
                       {callbackUrl || 'Fetching...'}
                    </p>
                 </div>

                 <div>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Verify Token</p>
                    <p className="text-[10px] font-mono text-white mt-3 break-all bg-black/40 p-3 rounded-xl border border-white/5">
                       {verifyToken || 'Fetching...'}
                    </p>
                 </div>

                 <button onClick={() => handleCopy(callbackUrl)} className="w-full text-[10px] uppercase font-black tracking-widest text-blue-400 py-3 bg-blue-400/10 rounded-xl hover:bg-blue-400 hover:text-white transition-all active:scale-95">
                    Copy Callback URL
                 </button>
              </div>
           </div>

           {/* Diagnostics */}
           <div className="bg-white border border-slate-100 rounded-3xl p-6 sm:p-8 shadow-premium flex flex-col items-center text-center">
              <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center mb-6 shadow-sm">
                 <AlertCircle size={32} />
              </div>
              <h3 className="font-black text-slate-800 uppercase tracking-tight">Diagnostics</h3>
              <p className="text-[10px] font-bold text-slate-400 mt-2 uppercase tracking-widest leading-relaxed px-4">Test your credentials by triggering a test payload.</p>

              {testResult && (
                <div className={`mt-6 p-4 rounded-2xl text-[10px] font-black uppercase tracking-widest w-full text-left ${testResult.success ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' : 'bg-red-50 text-red-700 border border-red-100'}`}>
                  {testResult.message}
                </div>
              )}

              <button 
                onClick={handleTestConnection}
                disabled={testing}
                className="mt-8 w-full flex items-center justify-center bg-slate-900 text-white font-black text-[10px] uppercase tracking-widest py-4 rounded-2xl hover:bg-slate-800 transition-all active:scale-95 shadow-glow disabled:opacity-50"
              >
                 {testing ? <span className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin"></span> : 'Run Connectivity Test'}
              </button>
           </div>

        </div>
      </div>
    </div>
  );
}
