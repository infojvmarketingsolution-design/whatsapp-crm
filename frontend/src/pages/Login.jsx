import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Mail, Shield, Smartphone, MessageSquare, ArrowRight, Lock, User, CheckCircle2, ChevronLeft, Loader2 } from 'lucide-react';
import toast, { Toaster } from 'react-hot-toast';

export default function Login() {
  const navigate = useNavigate();
  const [isRegister, setIsRegister] = useState(false);
  const [loginMethod, setLoginMethod] = useState('PASSWORD'); // 'PASSWORD' or 'OTP'
  const [otpStep, setOtpStep] = useState('REQUEST'); // 'REQUEST' or 'VERIFY'
  const [deliveryMethod, setDeliveryMethod] = useState('WHATSAPP'); // 'EMAIL', 'WHATSAPP', 'SMS'
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [countdown, setCountdown] = useState(0);

  // Form Fields
  const [identifier, setIdentifier] = useState(''); // Email or Phone
  const [password, setPassword] = useState('');
  const [otpCode, setOtpCode] = useState('');
  
  // Register Fields
  const [name, setName] = useState('');
  const [regMobile, setRegMobile] = useState('');

  useEffect(() => {
    let timer;
    if (countdown > 0) {
      timer = setTimeout(() => setCountdown(countdown - 1), 1000);
    }
    return () => clearTimeout(timer);
  }, [countdown]);

  const handleAuth = async (e) => {
    e?.preventDefault();
    setLoading(true);
    setError('');

    try {
      if (isRegister) {
        // Handle Registration
        const res = await fetch('/api/auth/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name, email: identifier, password, mobileNumber: regMobile }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.message);
        toast.success('Account created! Please sign in.');
        setIsRegister(false);
      } else if (loginMethod === 'PASSWORD') {
        // Handle Password Login
        const res = await fetch('/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: identifier, password }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.message);
        completeLogin(data);
      } else if (loginMethod === 'OTP') {
        if (otpStep === 'REQUEST') {
          // Handle OTP Request
          const res = await fetch('/api/auth/request-otp', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ identifier, method: deliveryMethod }),
          });
          const data = await res.json();
          if (!res.ok) throw new Error(data.message);
          setOtpStep('VERIFY');
          setCountdown(60);
          toast.success(`OTP sent via ${deliveryMethod}`);
        } else {
          // Handle OTP Verification
          const res = await fetch('/api/auth/verify-otp', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ identifier, code: otpCode }),
          });
          const data = await res.json();
          if (!res.ok) throw new Error(data.message);
          completeLogin(data);
        }
      }
    } catch (err) {
      setError(err.message);
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  const completeLogin = (data) => {
    localStorage.setItem('token', data.token);
    localStorage.setItem('tenantId', data.tenantId || '');
    localStorage.setItem('role', data.role || 'AGENT');
    localStorage.setItem('user', JSON.stringify(data));
    toast.success('Authentication successful!');
    
    setTimeout(() => {
      if (data.role === 'SUPER_ADMIN') navigate('/admin/dashboard');
      else navigate('/dashboard');
    }, 800);
  };

  const deliveryOptions = [
    { id: 'WHATSAPP', label: 'WhatsApp', icon: MessageSquare, color: 'text-green-500', bg: 'bg-green-50' },
    { id: 'EMAIL', label: 'Email', icon: Mail, color: 'text-blue-500', bg: 'bg-blue-50' },
    { id: 'SMS', label: 'SMS', icon: Smartphone, color: 'text-purple-500', bg: 'bg-purple-50' },
  ];

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-900 flex items-center justify-center p-4 selection:bg-teal-100 relative overflow-hidden">
      <Toaster position="top-right" />
      
      {/* Dynamic Background Elements */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-teal-200/20 rounded-full blur-[120px] animate-pulse" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-200/20 rounded-full blur-[120px] animate-pulse" style={{ animationDelay: '2s' }} />

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-[450px] w-full z-10"
      >
        <div className="bg-white/80 backdrop-blur-xl border border-white/40 shadow-[0_32px_64px_-16px_rgba(0,0,0,0.1)] rounded-[32px] p-8 md:p-10 relative overflow-hidden">
          
          {/* Logo Section */}
          <div className="flex flex-col items-center mb-10">
            <motion.div 
              whileHover={{ scale: 1.05 }}
              className="relative mb-6"
            >
              <div className="absolute inset-0 bg-teal-400/20 blur-2xl rounded-full" />
              <img src="/logo.png" alt="WapiPulse Logo" className="h-20 w-auto relative object-contain" />
            </motion.div>
            <h1 className="text-3xl font-black tracking-tight text-slate-900">
              {isRegister ? 'Welcome to WapiPulse' : (otpStep === 'VERIFY' ? 'Verify Identity' : 'Hello Again!')}
            </h1>
            <p className="text-slate-500 mt-2 text-sm font-medium text-center max-w-[280px]">
              {isRegister ? 'Set up your workspace in minutes' : 'Access your professional WhatsApp CRM suite'}
            </p>
          </div>

          {!isRegister && otpStep === 'REQUEST' && (
            <div className="flex p-1 bg-slate-100 rounded-2xl mb-8">
              <button 
                onClick={() => setLoginMethod('PASSWORD')}
                className={`flex-1 py-2.5 text-sm font-bold rounded-xl transition-all ${loginMethod === 'PASSWORD' ? 'bg-white text-teal-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
              >
                Password
              </button>
              <button 
                onClick={() => setLoginMethod('OTP')}
                className={`flex-1 py-2.5 text-sm font-bold rounded-xl transition-all ${loginMethod === 'OTP' ? 'bg-white text-teal-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
              >
                OTP Login
              </button>
            </div>
          )}

          <AnimatePresence mode="wait">
            <motion.form 
              key={`${isRegister}-${loginMethod}-${otpStep}`}
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              onSubmit={handleAuth}
              className="space-y-6"
            >
              {isRegister ? (
                <>
                  <div className="space-y-4">
                    <Field label="ORGANIZATION / NAME" icon={<User className="w-4 h-4" />}>
                      <input 
                        type="text" value={name} onChange={e => setName(e.target.value)} required 
                        placeholder="Acme Solutions" className="field-input"
                      />
                    </Field>
                    <Field label="BUSINESS EMAIL" icon={<Mail className="w-4 h-4" />}>
                      <input 
                        type="email" value={identifier} onChange={e => setIdentifier(e.target.value)} required 
                        placeholder="admin@acme.com" className="field-input"
                      />
                    </Field>
                    <Field label="MOBILE NUMBER" icon={<Smartphone className="w-4 h-4" />}>
                      <input 
                        type="tel" value={regMobile} onChange={e => setRegMobile(e.target.value)} required 
                        placeholder="+91..." className="field-input"
                      />
                    </Field>
                    <Field label="CREATE PASSWORD" icon={<Lock className="w-4 h-4" />}>
                      <input 
                        type="password" value={password} onChange={e => setPassword(e.target.value)} required 
                        placeholder="••••••••" className="field-input"
                      />
                    </Field>
                  </div>
                </>
              ) : (
                <>
                  {otpStep === 'REQUEST' ? (
                    <div className="space-y-6">
                      <Field label="EMAIL OR MOBILE" icon={<User className="w-4 h-4" />}>
                        <input 
                          type="text" value={identifier} onChange={e => setIdentifier(e.target.value)} required 
                          placeholder="admin@demo.com or 6354..." 
                          className="field-input"
                        />
                      </Field>
                      
                      {loginMethod === 'PASSWORD' ? (
                        <Field label="SECURE PASSWORD" icon={<Lock className="w-4 h-4" />}>
                          <input 
                            type="password" value={password} onChange={e => setPassword(e.target.value)} required 
                            placeholder="••••••••" 
                            className="field-input"
                          />
                        </Field>
                      ) : (
                        <div className="space-y-3">
                          <label className="text-[11px] font-black tracking-[0.1em] text-slate-400 uppercase">OTP DELIVERY VIA</label>
                          <div className="grid grid-cols-3 gap-3">
                            {deliveryOptions.map(opt => (
                              <button
                                key={opt.id}
                                type="button"
                                onClick={() => setDeliveryMethod(opt.id)}
                                className={`flex flex-col items-center justify-center p-3 rounded-2xl border-2 transition-all ${deliveryMethod === opt.id ? 'border-teal-500 bg-teal-50/50 shadow-sm' : 'border-slate-100 bg-white hover:border-slate-200'}`}
                              >
                                <opt.icon className={`w-6 h-6 mb-1 ${opt.color}`} />
                                <span className="text-[10px] font-bold text-slate-500 uppercase">{opt.label}</span>
                              </button>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="space-y-6 text-center">
                      <div className="flex justify-center mb-2">
                        <div className="w-16 h-16 bg-teal-50 text-teal-600 rounded-full flex items-center justify-center">
                          <CheckCircle2 className="w-8 h-8" />
                        </div>
                      </div>
                      <p className="text-sm text-slate-500 font-medium px-4">
                        We've sent a 6-digit code to <span className="font-bold text-slate-700">{identifier}</span> via <span className="font-bold text-teal-600 lowercase">{deliveryMethod}</span>
                      </p>
                      
                      <div className="relative">
                        <input 
                          type="text" 
                          maxLength={6}
                          value={otpCode}
                          onChange={e => setOtpCode(e.target.value.replace(/\D/g, ''))}
                          className="w-full text-center tracking-[0.5em] text-3xl font-black py-4 bg-slate-50 border-2 border-slate-100 rounded-2xl focus:border-teal-500 focus:bg-white transition-all outline-none"
                          placeholder="••••••"
                          autoFocus
                        />
                      </div>

                      <div className="flex justify-between items-center text-sm px-1">
                        <button 
                          type="button" 
                          onClick={() => setOtpStep('REQUEST')}
                          className="text-slate-400 font-bold hover:text-slate-600 flex items-center transition-all"
                        >
                          <ChevronLeft className="w-4 h-4 mr-0.5" /> Back
                        </button>
                        {countdown > 0 ? (
                          <span className="text-slate-400 font-medium">Resend in {countdown}s</span>
                        ) : (
                          <button 
                            type="button" 
                            onClick={handleAuth}
                            className="text-teal-600 font-bold hover:underline underline-offset-4"
                          >
                            Resend Code
                          </button>
                        )}
                      </div>
                    </div>
                  )}
                </>
              )}

              <button 
                type="submit"
                disabled={loading}
                className="group w-full py-4 bg-[#114a43] hover:bg-[#0c3631] text-white font-black rounded-2xl shadow-[0_12px_24px_-8px_rgba(17,74,67,0.4)] hover:shadow-[0_16px_32px_-12px_rgba(17,74,67,0.5)] transition-all transform hover:-translate-y-0.5 active:scale-[0.98] flex items-center justify-center overflow-hidden relative"
              >
                {loading ? (
                  <Loader2 className="w-6 h-6 animate-spin text-teal-200" />
                ) : (
                  <>
                    <span className="relative z-10">{isRegister ? 'Create My Workspace' : (otpStep === 'VERIFY' ? 'Confirm Login' : (loginMethod === 'OTP' ? 'Generate Access Code' : 'Access Dashboard'))}</span>
                    <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform relative z-10" />
                    <div className="absolute top-0 -inset-full h-full w-1/2 z-5 block transform -skew-x-12 bg-gradient-to-r from-transparent to-white/10 opacity-40 group-hover:animate-shine" />
                  </>
                )}
              </button>
            </motion.form>
          </AnimatePresence>

          <div className="mt-8 pt-8 border-t border-slate-100 flex flex-col items-center">
            <button 
              onClick={() => { setIsRegister(!isRegister); setError(''); setOtpStep('REQUEST'); }}
              className="text-sm font-black text-teal-600 hover:text-teal-700 transition-colors"
            >
              {isRegister ? 'Already registered? Login here' : 'New here? Create Client Account'}
            </button>
          </div>
        </div>

        <div className="mt-8 flex items-center justify-center space-x-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">
          <div className="flex items-center">
            <Shield className="w-3.5 h-3.5 mr-1.5 text-teal-500" />
            AES-256 Protected
          </div>
          <a href="/privacy-policy" className="hover:text-slate-600 transition-colors">Privacy & Terms</a>
        </div>
      </motion.div>

      <style jsx>{`
        .field-input {
          width: 100%;
          background: #f8fafc;
          border: 2px solid #f1f5f9;
          border-radius: 16px;
          padding: 12px 14px 12px 42px;
          font-weight: 600;
          font-size: 0.95rem;
          color: #1e293b;
          transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
          outline: none;
        }
        .field-input:focus {
          border-color: #2dd4bf;
          background: white;
          box-shadow: 0 0 0 4px rgba(45, 212, 191, 0.1);
        }
        .field-input::placeholder {
          color: #94a3b8;
          font-weight: 500;
        }
        @keyframes shine {
          100% {
            left: 125%;
          }
        }
        .animate-shine {
          animation: shine 1s;
        }
      `}</style>
    </div>
  );
}

function Field({ label, icon, children }) {
  return (
    <div className="space-y-2 relative">
      <label className="text-[11px] font-black tracking-[0.1em] text-slate-400 uppercase ml-1">
        {label}
      </label>
      <div className="relative group">
        <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-teal-500 transition-colors">
          {icon}
        </div>
        {children}
      </div>
    </div>
  );
}

