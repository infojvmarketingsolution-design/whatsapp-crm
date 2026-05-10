import React, { useState, useEffect } from 'react';
import { Download, Share, Info, X } from 'lucide-react';

/**
 * PWAInstallHandler - Robust component to handle PWA installation for Android & iOS.
 */
export default function PWAInstallHandler({ 
  variant = 'sidebar', // 'sidebar' or 'login'
  collapsed = false,
  customClassName = ""
}) {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [showIosGuide, setShowIosGuide] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);
  const [isIos, setIsIos] = useState(false);

  useEffect(() => {
    // 1. Standalone Check
    const checkStandalone = window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone;
    setIsStandalone(!!checkStandalone);

    // 2. iOS Detection (Robust)
    const ua = window.navigator.userAgent;
    const isIosDevice = /iPad|iPhone|iPod/.test(ua) || 
                       (window.navigator.userAgent.includes('Mac') && window.navigator.maxTouchPoints > 1);
    setIsIos(isIosDevice);

    // 3. Android / Browser Prompt Listener
    const handler = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleInstall = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        setDeferredPrompt(null);
      }
    } else if (isIos) {
      setShowIosGuide(true);
    }
  };

  // Don't show anything if already installed
  if (isStandalone) return null;

  // Don't show if neither prompt is available nor it is iOS
  if (!deferredPrompt && !isIos) return null;

  const isLoginVariant = variant === 'login';

  return (
    <>
      <button 
        onClick={handleInstall}
        className={customClassName || `
          flex w-full items-center transition-all duration-300
          ${isLoginVariant 
            ? 'justify-center space-x-2 py-3 px-6 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-2xl text-[10px] font-black uppercase tracking-widest' 
            : `px-7 py-5 text-sm border-t border-teal-800/50 ${deferredPrompt ? 'text-green-400 hover:bg-green-700/50' : 'text-blue-400 hover:bg-blue-700/50'} ${collapsed ? 'justify-center' : 'space-x-3'}`
          }
        `}
      >
        <Download size={isLoginVariant ? 14 : 20} className={!isLoginVariant && deferredPrompt ? 'text-green-400' : (isLoginVariant ? 'text-slate-500' : 'text-blue-400')} />
        {(!collapsed || isLoginVariant) && (
          <span className="font-bold">
            {isIos ? 'Install App (iOS)' : 'Install App'}
          </span>
        )}
      </button>

      {/* iOS Guide Modal */}
      {showIosGuide && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in" onClick={() => setShowIosGuide(false)}>
          <div className="bg-white rounded-[2.5rem] p-8 max-w-sm w-full text-slate-800 shadow-2xl animate-scale-in border border-white/20" onClick={e => e.stopPropagation()}>
            <div className="text-center mb-8">
              <div className="w-20 h-20 bg-blue-50 text-blue-600 rounded-3xl flex items-center justify-center mx-auto mb-4 shadow-inner">
                <Share size={40} />
              </div>
              <h3 className="text-2xl font-black uppercase tracking-tight text-slate-900">Install on iPhone</h3>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">Simple 3-step setup</p>
            </div>
            
            <div className="space-y-6 text-sm font-medium text-slate-600">
              <div className="flex items-start space-x-4 p-4 bg-slate-50 rounded-2xl border border-slate-100">
                <div className="w-8 h-8 bg-white border border-slate-200 rounded-xl flex items-center justify-center text-xs font-black shrink-0 shadow-sm text-blue-600">1</div>
                <p className="leading-tight pt-1">Tap the <span className="font-black text-blue-600">Share</span> button in Safari or Chrome menu.</p>
              </div>
              <div className="flex items-start space-x-4 p-4 bg-slate-50 rounded-2xl border border-slate-100">
                <div className="w-8 h-8 bg-white border border-slate-200 rounded-xl flex items-center justify-center text-xs font-black shrink-0 shadow-sm text-blue-600">2</div>
                <p className="leading-tight pt-1">Scroll down and tap <span className="font-black text-blue-600">"Add to Home Screen"</span>.</p>
              </div>
              <div className="flex items-start space-x-4 p-4 bg-slate-50 rounded-2xl border border-slate-100">
                <div className="w-8 h-8 bg-white border border-slate-200 rounded-xl flex items-center justify-center text-xs font-black shrink-0 shadow-sm text-blue-600">3</div>
                <p className="leading-tight pt-1">The <span className="font-black text-blue-600">WapiPulse</span> icon will appear on your home screen!</p>
              </div>
            </div>

            <button 
              onClick={() => setShowIosGuide(false)}
              className="w-full mt-10 py-5 bg-slate-900 text-white rounded-2xl font-black uppercase tracking-[0.2em] hover:bg-black transition-all shadow-xl active:scale-95"
            >
              Got it!
            </button>
            <button 
              onClick={() => setShowIosGuide(false)}
              className="w-full mt-2 py-3 text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-slate-600"
            >
              Close Guide
            </button>
          </div>
        </div>
      )}
    </>
  );
}
