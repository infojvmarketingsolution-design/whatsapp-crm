import React, { useEffect } from 'react';
import { CheckCircle, ArrowRight, ExternalLink } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const OAuthCallback = () => {
  const navigate = useNavigate();

  useEffect(() => {
    // Check if this was opened in a popup and communicate back if needed
    if (window.opener) {
      // If used as a redirect target for FB.login (rare but possible in some configs)
      // window.opener.postMessage("oauth_success", window.location.origin);
      // window.close();
    }
    
    // Auto-redirect after 5 seconds
    const timer = setTimeout(() => {
      navigate('/dashboard');
    }, 5000);

    return () => clearTimeout(timer);
  }, [navigate]);

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6 font-sans">
      <div className="max-w-md w-full bg-white rounded-3xl shadow-2xl border border-blue-50 p-10 text-center animate-fade-in">
        <div className="w-20 h-20 bg-emerald-100 text-emerald-600 rounded-2xl flex items-center justify-center mx-auto mb-8 shadow-inner">
          <CheckCircle size={40} />
        </div>
        
        <h1 className="text-2xl font-black text-slate-800 mb-2 tracking-tight">Authentication Successful!</h1>
        <p className="text-sm font-bold text-slate-400 mb-8 uppercase tracking-widest leading-relaxed">
          Your Meta account has been successfully verified and connected to WapiPulse CRM.
        </p>

        <div className="bg-slate-50 rounded-2xl p-6 mb-8 border border-slate-100 flex flex-col items-center">
           <div className="flex items-center space-x-2 text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">
              <ExternalLink size={12} />
              <span>Verified Redirect URI</span>
           </div>
           <code className="text-blue-600 font-mono text-xs font-bold break-all">
              https://wapipulse.com/oauth/callback
           </code>
        </div>

        <button 
          onClick={() => navigate('/dashboard')}
          className="w-full py-4 bg-slate-800 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-black transition-all shadow-lg hover:shadow-blue-200/50 flex items-center justify-center space-x-2"
        >
          <span>Return to Dashboard</span>
          <ArrowRight size={14} />
        </button>
        
        <p className="mt-6 text-[9px] font-bold text-slate-300 uppercase tracking-widest">
           System will automatically redirect in 5 seconds
        </p>
      </div>
    </div>
  );
};

export default OAuthCallback;
