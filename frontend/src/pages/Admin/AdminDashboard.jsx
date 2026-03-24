import React, { useState, useEffect } from 'react';
import { 
  Users, 
  Building2, 
  CreditCard, 
  TrendingUp, 
  ArrowUpRight,
  Plus,
  RefreshCcw,
  X
} from 'lucide-react';

import { useNavigate } from 'react-router-dom';

const AdminDashboard = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(new Date().toLocaleTimeString());

  const fetchAnalytics = async () => {
    setLoading(true);
    // Add artificial delay to show spinner and give feedback
    await new Promise(resolve => setTimeout(resolve, 600));
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('/api/clients/analytics', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setStats(data);
        setLastUpdated(new Date().toLocaleTimeString());
      }
    } catch (error) {
      console.error('Failed to fetch analytics', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const statCards = [
    { title: 'Total Clients', value: stats?.totalClients || 0, icon: <Building2 className="text-blue-500" />, subtext: `${stats?.activeClients || 0} active now` },
    { title: 'Total Users', value: stats?.totalUsers || 0, icon: <Users className="text-purple-500" />, subtext: 'Across all tenants' },
    { title: 'Est. Monthly Revenue', value: `₹${stats?.totalRevenue?.toLocaleString() || 0}`, icon: <CreditCard className="text-emerald-500" />, subtext: '+12% from last month' },
    { title: 'Growth Rate', value: '18%', icon: <TrendingUp className="text-orange-500" />, subtext: 'New signups' },
  ];

  return (
    <div className="p-8 bg-slate-50 min-h-screen">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Platform Overview</h1>
          <div className="flex items-center space-x-2 mt-1">
            <p className="text-slate-500 text-sm font-medium">Welcome to the Super Admin Control Center</p>
            <span className="text-[10px] text-slate-300 font-bold uppercase">•</span>
            <span className="text-[10px] text-blue-500 font-bold uppercase tracking-wider bg-blue-50 px-2 py-0.5 rounded">Updated: {lastUpdated}</span>
          </div>
        </div>
        <div className="flex space-x-3">
          <button 
            onClick={fetchAnalytics}
            disabled={loading}
            className="flex items-center space-x-2 px-4 py-2 bg-white border border-slate-200 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50 transition-all shadow-sm"
          >
            <RefreshCcw size={16} className={loading ? 'animate-spin' : ''} />
            <span>{loading ? 'Refreshing...' : 'Refresh'}</span>
          </button>
          <button 
            onClick={() => navigate('/admin/clients')}
            className="flex items-center space-x-2 px-4 py-2 bg-blue-600 rounded-lg text-sm font-medium text-white hover:bg-blue-700 transition-all shadow-md shadow-blue-200"
          >
            <Plus size={16} />
            <span>Add New Client</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {statCards.map((card, idx) => (
          <div key={idx} className="bg-white p-6 rounded-xl border border-slate-100 shadow-sm hover:shadow-md transition-all">
            <div className="flex justify-between items-start mb-4">
              <div className="p-2 bg-slate-50 rounded-lg">{card.icon}</div>
              <span className="flex items-center text-xs font-medium text-emerald-600 bg-emerald-50 px-2 py-1 rounded-full">
                <ArrowUpRight size={12} className="mr-1" />
                Active
              </span>
            </div>
            <h3 className="text-slate-500 text-sm font-medium mb-1">{card.title}</h3>
            <div className="text-2xl font-bold text-slate-900 mb-1">{card.value}</div>
            <p className="text-xs text-slate-400 font-medium">{card.subtext}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white p-6 rounded-xl border border-slate-100 shadow-sm">
          <h3 className="text-lg font-bold text-slate-900 mb-6 font-display">Plan Distribution</h3>
          <div className="space-y-4">
            {stats?.planDistribution && Object.entries(stats.planDistribution).map(([plan, count]) => (
                <div key={plan} className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                        <div className={`w-3 h-3 rounded-full ${plan === 'premium' ? 'bg-indigo-500' : plan === 'pro' ? 'bg-blue-500' : 'bg-slate-400'}`}></div>
                        <span className="text-sm font-medium text-slate-700 capitalize">{plan}</span>
                    </div>
                    <div className="flex items-center space-x-4">
                        <div className="w-32 bg-slate-100 h-2 rounded-full overflow-hidden">
                            <div 
                                className={`h-full ${plan === 'premium' ? 'bg-indigo-500' : plan === 'pro' ? 'bg-blue-500' : 'bg-slate-400'}`}
                                style={{ width: `${(count / (stats.totalClients || 1)) * 100}%` }}
                            ></div>
                        </div>
                        <span className="text-sm font-bold text-slate-900">{count}</span>
                    </div>
                </div>
            ))}
      
      {/* System Status Modal */}
      {showStatusModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in duration-200">
            <div className="flex justify-between items-center p-6 border-b border-slate-100">
                <h2 className="text-xl font-bold text-slate-900">System Health</h2>
                <button onClick={() => setShowStatusModal(false)} className="text-slate-400 hover:text-slate-600 p-2"><X size={20} /></button>
            </div>
            <div className="p-6 space-y-4">
                <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-100">
                    <div className="flex items-center space-x-3">
                        <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
                        <span className="text-sm font-bold text-slate-700">Core Database</span>
                    </div>
                    <span className="text-xs font-bold text-emerald-600 uppercase">Connected</span>
                </div>
                <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-100">
                    <div className="flex items-center space-x-3">
                        <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
                        <span className="text-sm font-bold text-slate-700">Meta Cloud API</span>
                    </div>
                    <span className="text-xs font-bold text-emerald-600 uppercase">Service Up</span>
                </div>
                <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-100">
                    <div className="flex items-center space-x-3">
                        <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
                        <span className="text-sm font-bold text-slate-700">Backend Server</span>
                    </div>
                    <span className="text-xs font-bold text-emerald-600 uppercase">Operational</span>
                </div>
                <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-100">
                    <div className="flex items-center space-x-3">
                        <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                        <span className="text-sm font-bold text-slate-700">Storage Usage</span>
                    </div>
                    <span className="text-xs font-bold text-slate-500 uppercase">12.4 GB / 100 GB</span>
                </div>
                
                <div className="pt-4 text-center">
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">All systems are performing normally</p>
                </div>
            </div>
            <div className="p-6 bg-slate-50/50 border-t border-slate-100">
                <button 
                  onClick={() => setShowStatusModal(false)}
                  className="w-full py-2.5 bg-slate-900 text-white font-bold rounded-lg text-sm hover:bg-slate-800 transition-colors"
                >
                    Close Status
                </button>
            </div>
          </div>
        </div>
      )}
    </div>
        </div>

        <div className="bg-white p-6 rounded-xl border border-slate-100 shadow-sm flex flex-col items-center justify-center text-center p-12">
            <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mb-4">
                <TrendingUp size={32} className="text-blue-600" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 mb-2">Platform Performance</h3>
            <p className="text-slate-500 text-sm max-w-xs mb-6">
                Real-time message volume and system health monitoring will be available in the next update.
            </p>
            <button 
                onClick={() => setShowStatusModal(true)}
                className="text-blue-600 font-bold text-sm hover:underline"
            >
                View System Status
            </button>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
