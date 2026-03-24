import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import API_URL from '../apiConfig';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await fetch(`${API_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to authenticate');
      }

      localStorage.setItem('token', data.token);
      localStorage.setItem('tenantId', data.tenantId || ''); 
      localStorage.setItem('user', JSON.stringify(data));
      
      setTimeout(() => {
         if (data.role === 'SUPER_ADMIN') {
            navigate('/admin/dashboard');
         } else {
            navigate('/dashboard');
         }
      }, 500);
    } catch (err) {
      setError(err.message || 'Failed to login');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-crm-bg flex items-center justify-center p-4">
      <div className="bg-crm-card p-8 rounded-2xl shadow-premium max-w-md w-full animate-fade-in-up">
        
        <div className="text-center mb-8">
          <div className="flex justify-center items-center space-x-2 mb-6">
            <img src="/logo.png" alt="WapiPulse Logo" className="h-24 object-contain" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Sign in to WapiPulse</h1>
          <p className="text-gray-500 text-sm mt-2 font-medium">Enter your administrative credentials to access your SaaS workspace</p>
        </div>

        {error && <div className="bg-red-50 text-red-500 p-3 rounded-lg text-sm mb-6 font-medium text-center border border-red-100">{error}</div>}

        <form onSubmit={handleLogin} className="space-y-5">
          <div>
            <label className="block text-[13px] font-bold text-gray-700 mb-1.5 uppercase tracking-wide">Email Address</label>
            <input 
              type="email" 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3 rounded-xl bg-gray-50 border border-gray-200 focus:bg-white focus:ring-2 focus:ring-brand-light/50 outline-none transition-all placeholder-gray-400 font-medium text-gray-800"
              placeholder="admin@demo.com"
              required
            />
          </div>
          <div>
            <label className="block text-[13px] font-bold text-gray-700 mb-1.5 uppercase tracking-wide">Password</label>
            <input 
              type="password" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 rounded-xl bg-gray-50 border border-gray-200 focus:bg-white focus:ring-2 focus:ring-brand-light/50 outline-none transition-all placeholder-gray-400 font-medium text-gray-800"
              placeholder="••••••••"
              required
            />
          </div>
          
          <button 
            type="submit" 
            disabled={loading}
            className="w-full bg-[var(--theme-bg)] hover:bg-teal-900 text-white font-bold py-3.5 rounded-xl shadow-[0_4px_15px_rgba(17,74,67,0.3)] hover:shadow-[0_6px_20px_rgba(17,74,67,0.4)] transition-all flex justify-center items-center mt-4 disabled:opacity-70 transform hover:-translate-y-0.5"
          >
            {loading ? <span className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin"></span> : 'Authenticate Securely'}
          </button>
        </form>

        <div className="mt-8 text-center text-xs text-gray-400 font-medium flex flex-col items-center justify-center space-y-2">
          <div className="flex items-center space-x-1">
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
            <span>Protected by AES-256 Encryption & OAuth 2.0</span>
          </div>
          <a href="/privacy-policy" className="hover:text-brand-light transition-colors underline decoration-dotted">Privacy Policy</a>
        </div>
      </div>
    </div>
  );
}
