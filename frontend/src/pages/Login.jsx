import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ArrowRight, 
  Mail, 
  Lock, 
  Smartphone, 
  User, 
  Shield, 
  MessageSquare,
  CheckCircle2,
  Loader2,
  Globe,
  ChevronLeft
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast, Toaster } from 'react-hot-toast';

export default function Login() {
  const navigate = useNavigate();
  const [isRegister, setIsRegister] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loginMethod, setLoginMethod] = useState('PIN'); // 'PIN' or 'PASSWORD'

  // Saved User for Fast Login
  const [savedUser, setSavedUser] = useState(() => {
    const saved = localStorage.getItem('lastLoginInfo');
    return saved ? JSON.parse(saved) : null;
  });
  const [showFastLogin, setShowFastLogin] = useState(!!savedUser);

  // Form Fields
  const [phoneNumber, setPhoneNumber] = useState(savedUser?.identifier || ''); 
  const [mpin, setMpin] = useState('');
  
  // Register/Access Fields
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleAuth = async (e) => {
    e?.preventDefault();
    setLoading(true);

    try {
      if (isRegister) {
        // Handle Registration
        const res = await fetch('/api/auth/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name, email, password, mobileNumber: phoneNumber, mpin }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.message);
        toast.success('Account created! Please sign in.');
        setIsRegister(false);
      } else if (loginMethod === 'PIN') {
        // Handle MPIN Login
        const res = await fetch('/api/auth/login-mpin', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ phoneNumber, mpin }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.message);
        completeLogin(data, phoneNumber);
      } else {
        // Handle Classic Password Login
        const res = await fetch('/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.message);
        completeLogin(data, email);
      }
    } catch (err) {
      toast.error(err.message || 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  const completeLogin = (data, identifier) => {
    // 1. Core Auth Storage
    localStorage.setItem('token', data.token);
    localStorage.setItem('tenantId', data.tenantId || '');
    localStorage.setItem('role', data.role || 'AGENT');
    localStorage.setItem('user', JSON.stringify(data));

    // 2. Fast Login Persistence
    localStorage.setItem('lastLoginInfo', JSON.stringify({
      name: data.name || 'User',
      identifier: identifier
    }));

    const toastId = toast.success('Authentication successful!');
    
    setTimeout(() => {
      toast.dismiss(toastId);
      if (data.role === 'SUPER_ADMIN') navigate('/admin/dashboard');
      else navigate('/dashboard');
    }, 800);
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-900 flex items-center justify-center p-4 selection:bg-teal-100 relative overflow-hidden">
      <Toaster position="top-center" />
      
      {/* Background Decor */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-teal-200/20 rounded-full blur-[120px] animate-pulse" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-200/20 rounded-full blur-[120px] animate-pulse" />

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="max-w-[450px] w-full z-10">
        <div className="bg-white/80 backdrop-blur-xl border border-white/40 shadow-[0_32px_64px_-16px_rgba(0,0,0,0.1)] rounded-[32px] p-8 md:p-10 relative">
          
          {/* Header */}
          <div className="flex flex-col items-center mb-6">
            <motion.div whileHover={{ scale: 1.05 }} className="relative mb-6">
              <div className="absolute inset-0 bg-teal-400/20 blur-2xl rounded-full" />
              <img src="/logo.png" alt="WapiPulse Logo" className="h-20 w-auto relative object-contain" />
            </motion.div>
            <h1 className="text-3xl font-black tracking-tight text-slate-900">
              {showFastLogin ? 'Welcome Back' : (isRegister ? 'New Workspace' : (loginMethod === 'PIN' ? 'Secure Sign In' : 'Access Portal'))}
            </h1>
            <p className="text-slate-500 mt-2 text-sm font-medium text-center">
              {showFastLogin ? `Logged in last as ${savedUser?.name}` : (isRegister ? 'Register your organization and set your MPIN' : (loginMethod === 'PIN' ? 'Identify with your mobile number and MPIN' : 'Login using your administrative credentials'))}
            </p>
          </div>

          {!isRegister && !showFastLogin && (
            <div className="flex p-1 bg-slate-100/50 rounded-xl mb-8 border border-slate-200">
              <button 
                onClick={() => setLoginMethod('PIN')}
                className={`flex-1 py-2 text-xs font-black uppercase tracking-widest rounded-lg transition-all ${loginMethod === 'PIN' ? 'bg-white text-teal-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
              >
                Fast MPIN Login
              </button>
              <button 
                onClick={() => setLoginMethod('PASSWORD')}
                className={`flex-1 py-2 text-xs font-black uppercase tracking-widest rounded-lg transition-all ${loginMethod === 'PASSWORD' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
              >
                Access Account
              </button>
            </div>
          )}

          <AnimatePresence mode="wait">
            {showFastLogin ? (
              <motion.div key="fast-login" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="space-y-6">
                 <div className="bg-slate-50/50 border border-slate-100 rounded-2xl p-6 flex flex-col items-center">
                    <div className="w-16 h-16 bg-white border-2 border-teal-500/20 rounded-full flex items-center justify-center mb-4 shadow-sm">
                      <User className="w-8 h-8 text-teal-600" />
                    </div>
                    <div className="text-center">
                       <p className="font-black text-slate-900 text-lg">{savedUser?.name}</p>
                       <p className="text-xs text-slate-400 font-bold uppercase tracking-wider mt-1">{savedUser?.identifier}</p>
                    </div>
                 </div>

                 <div className="space-y-4">
                    <Field label="6-DIGIT MASTER PIN (MPIN)" icon={<Shield className="w-4 h-4" />}>
                      <input 
                        type="password" 
                        maxLength={6} 
                        value={mpin} 
                        onChange={e => setMpin(e.target.value.replace(/\D/g, ''))} 
                        required 
                        placeholder="••••••" 
                        className="field-input tracking-[0.5em] text-lg font-black" 
                      />
                    </Field>
                 </div>

                 <button 
                    onClick={handleAuth}
                    disabled={loading || mpin.length < 6}
                    className="w-full py-4 bg-teal-600 hover:bg-teal-700 text-white font-black rounded-2xl shadow-lg transition-all flex items-center justify-center space-x-2 disabled:opacity-50"
                 >
                    {loading ? <Loader2 className="w-6 h-6 animate-spin" /> : (
                      <>
                        <CheckCircle2 className="w-5 h-5" />
                        <span>Sign In</span>
                      </>
                    )}
                 </button>

                 <div className="text-center">
                    <button onClick={() => setShowFastLogin(false)} className="text-sm font-bold text-slate-400 hover:text-teal-600 underline underline-offset-4">Sign in with a different user</button>
                 </div>
              </motion.div>
            ) : (
              <motion.form key={isRegister ? 'reg' : loginMethod} initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} onSubmit={handleAuth} className="space-y-6">
                
                <div className="space-y-4">
                  {isRegister && (
                    <>
                      <Field label="ORGANIZATION NAME" icon={<Globe className="w-4 h-4" />}>
                        <input type="text" value={name} onChange={e => setName(e.target.value)} required placeholder="Acme University" className="field-input" />
                      </Field>
                    </>
                  )}

                  {(isRegister || loginMethod === 'PASSWORD') && (
                    <>
                      <Field label="EMAIL / USER ID" icon={<Mail className="w-4 h-4" />}>
                        <input type="email" value={email} onChange={e => setEmail(e.target.value)} required placeholder="admin@example.com" className="field-input" />
                      </Field>
                      <Field label="PASSWORD" icon={<Lock className="w-4 h-4" />}>
                        <input type="password" value={password} onChange={e => setPassword(e.target.value)} required placeholder="••••••••" className="field-input" />
                      </Field>
                    </>
                  )}
                  
                  {(isRegister || loginMethod === 'PIN') && (
                    <>
                      <Field label="REGISTERED MOBILE NUMBER" icon={<User className="w-4 h-4" />}>
                        <input type="text" value={phoneNumber} onChange={e => setPhoneNumber(e.target.value)} required placeholder="e.g. 917016XXXXXX" className="field-input" />
                      </Field>

                      <Field label="6-DIGIT MASTER PIN (MPIN)" icon={<Shield className="w-4 h-4" />}>
                        <input 
                          type="password" 
                          maxLength={6} 
                          value={mpin} 
                          onChange={e => setMpin(e.target.value.replace(/\D/g, ''))} 
                          required 
                          placeholder="••••••" 
                          className="field-input tracking-[0.5em] text-lg font-black" 
                        />
                      </Field>
                    </>
                  )}

                  <div className="pt-2">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest text-center mb-1 italic">
                      Security alerts will be sent to your WhatsApp
                    </p>
                  </div>
                </div>

                <button 
                  type="submit" disabled={loading || (loginMethod === 'PIN' && mpin.length < 6)}
                  className={`group w-full py-4 ${loginMethod === 'PIN' ? 'bg-[#114a43] hover:bg-[#0c3631]' : 'bg-[#1e293b] hover:bg-slate-900'} text-white font-black rounded-2xl shadow-lg transition-all transform hover:-translate-y-0.5 flex items-center justify-center relative overflow-hidden disabled:opacity-50`}
                >
                  {loading ? <Loader2 className="w-6 h-6 animate-spin" /> : (
                    <>
                      <span>{isRegister ? 'Register & Set MPIN' : (loginMethod === 'PIN' ? 'Secure Login' : 'Enter Portal')}</span>
                      <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
                    </>
                  )}
                </button>
              </motion.form>
            )}
          </AnimatePresence>

          <div className="mt-8 pt-6 border-t border-slate-100 flex flex-col items-center space-y-4">
            <button onClick={() => { setIsRegister(!isRegister); setShowFastLogin(false); }} className="text-sm font-black text-teal-600 uppercase tracking-wide">
              {isRegister ? 'Already have an account?' : 'New here? Create Client Account'}
            </button>
          </div>
        </div>

        <div className="mt-8 flex items-center justify-center space-x-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">
          <div className="flex items-center"><Shield className="w-3.5 h-3.5 mr-1.5 text-teal-500" /> Secure Encryption</div>
          <a href="/privacy-policy" className="hover:text-slate-600 transition-colors">Privacy Policy</a>
        </div>
      </motion.div>

      <style jsx>{`
        .field-input {
          width: 100%; background: #f8fafc; border: 2px solid #f1f5f9; border-radius: 16px;
          padding: 12px 14px 12px 42px; font-weight: 600; font-size: 0.95rem; color: #1e293b;
          transition: all 0.2s ease; outline: none;
        }
        .field-input:focus { border-color: #2dd4bf; background: white; }
      `}</style>
    </div>
  );
}

function Field({ label, icon, children }) {
  return (
    <div className="space-y-2 relative">
      <label className="text-[10px] font-black tracking-[0.1em] text-slate-400 uppercase ml-1">{label}</label>
      <div className="relative group">
        <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-teal-500 transition-colors">{icon}</div>
        {children}
      </div>
    </div>
  );
}
