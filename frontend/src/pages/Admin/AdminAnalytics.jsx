import React, { useState, useEffect } from 'react';
import { 
  BarChart3, 
  Users, 
  MessageSquare, 
  Zap,
  ArrowUp,
  ArrowDown,
  Calendar
} from 'lucide-react';

const AdminAnalytics = () => {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);
  const [timeRange, setTimeRange] = useState(7);

  useEffect(() => {
    setLoading(true);
    // Simulated fetch - in real app, fetch from /api/clients/analytics/detailed?days=timeRange
    setTimeout(() => {
      setData({
        messagesSent: timeRange === 7 ? 12540 : 54200,
        messagesReceived: timeRange === 7 ? 8420 : 38100,
        activeTenants: 12,
        throughput: '98%',
        dailyVolume: timeRange === 7 
            ? [450, 600, 800, 1200, 900, 1100, 1300]
            : [1200, 1100, 1300, 1500, 1400, 1600, 1800] // Simplified for demo
      });
      setLoading(false);
    }, 500);
  }, [timeRange]);

  return (
    <div className="p-8 bg-slate-50 min-h-screen">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Platform Analytics</h1>
          <p className="text-slate-500">Detailed messaging and tenant performance metrics</p>
        </div>
         <div className="flex bg-white p-1 rounded-lg border border-slate-200">
            <button 
                onClick={() => setTimeRange(7)}
                className={`px-3 py-1.5 text-xs font-bold rounded-md transition-all ${timeRange === 7 ? 'bg-slate-900 text-white shadow-md' : 'text-slate-500 hover:bg-slate-50'}`}
            >
                Last 7 Days
            </button>
            <button 
                onClick={() => setTimeRange(30)}
                className={`px-3 py-1.5 text-xs font-bold rounded-md transition-all ${timeRange === 30 ? 'bg-slate-900 text-white shadow-md' : 'text-slate-500 hover:bg-slate-50'}`}
            >
                Last 30 Days
            </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
            <div className="flex justify-between items-center mb-4">
                <div className="p-2 bg-blue-50 text-blue-600 rounded-lg"><MessageSquare size={20} /></div>
                <div className="flex items-center text-xs font-bold text-emerald-600">
                    <ArrowUp size={12} className="mr-1" />
                    +24%
                </div>
            </div>
            <p className="text-slate-500 text-sm font-medium">Messages Sent</p>
            <h2 className="text-3xl font-bold text-slate-900 mt-1">{data?.messagesSent?.toLocaleString() || '...'}</h2>
        </div>
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
            <div className="flex justify-between items-center mb-4">
                <div className="p-2 bg-purple-50 text-purple-600 rounded-lg"><Zap size={20} /></div>
                <div className="flex items-center text-xs font-bold text-emerald-600">
                    <ArrowUp size={12} className="mr-1" />
                    +12%
                </div>
            </div>
            <p className="text-slate-500 text-sm font-medium">API Throughput</p>
            <h2 className="text-3xl font-bold text-slate-900 mt-1">{data?.throughput || '...'}</h2>
        </div>
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
            <div className="flex justify-between items-center mb-4">
                <div className="p-2 bg-orange-50 text-orange-600 rounded-lg"><Users size={20} /></div>
                <div className="flex items-center text-xs font-bold text-red-600">
                    <ArrowDown size={12} className="mr-1" />
                    -2%
                </div>
            </div>
            <p className="text-slate-500 text-sm font-medium">User Retention</p>
            <h2 className="text-3xl font-bold text-slate-900 mt-1">94%</h2>
        </div>
      </div>

      <div className="bg-white p-8 rounded-2xl border border-slate-100 shadow-sm">
        <div className="flex justify-between items-center mb-12">
            <div>
                 <h3 className="text-lg font-bold text-slate-900">{timeRange === 7 ? 'Weekly' : 'Monthly'} Message Volume</h3>
                <p className="text-sm text-slate-400">Aggregated across all platform tenants</p>
            </div>
            <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-2">
                    <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                    <span className="text-xs font-bold text-slate-600">Sent</span>
                </div>
                <div className="flex items-center space-x-2">
                    <div className="w-3 h-3 bg-slate-200 rounded-full"></div>
                    <span className="text-xs font-bold text-slate-600">Failed</span>
                </div>
            </div>
        </div>

        <div className="h-64 flex items-end justify-between space-x-2">
            {data?.dailyVolume.map((vol, i) => (
                <div key={i} className="flex-1 flex flex-col items-center group">
                    <div className="w-full bg-blue-500/10 group-hover:bg-blue-500/20 transition-colors rounded-t-lg relative" style={{ height: `${(vol / 1500) * 100}%` }}>
                        <div className="absolute -top-10 left-1/2 -translate-x-1/2 bg-slate-900 text-white text-[10px] px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity">
                            {vol} msg
                        </div>
                    </div>
                    <span className="text-[10px] font-bold text-slate-400 mt-4 uppercase">Day {i+1}</span>
                </div>
            ))}
        </div>
      </div>
    </div>
  );
};

export default AdminAnalytics;
