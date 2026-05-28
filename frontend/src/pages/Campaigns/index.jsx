import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Play, Pause, Plus, BarChart2, CheckCircle2, XCircle, Trash2, Megaphone, Users, Send, AlertCircle } from 'lucide-react';
import CampaignReportModal from './CampaignReportModal';

function Campaigns() {
  const navigate = useNavigate();
  const [campaigns, setCampaigns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [reportData, setReportData] = useState({ isOpen: false, campaign: null, logs: [] });

  useEffect(() => {
    fetchCampaigns();
    const interval = setInterval(() => fetchCampaigns(true), 10000);
    return () => clearInterval(interval);
  }, []);

  const fetchCampaigns = async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const tenantId = localStorage.getItem('tenantId');
      const res = await fetch('/api/campaigns', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'x-tenant-id': tenantId
        }
      });
      if (res.ok) {
        const data = await res.json();
        setCampaigns(data);
      } else {
        setCampaigns([]);
      }
    } catch (err) {
      console.error(err);
      setCampaigns([]);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this campaign? All delivery logs will be lost.')) return;
    try {
      const token = localStorage.getItem('token');
      const tenantId = localStorage.getItem('tenantId');
      const res = await fetch(`/api/campaigns/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'x-tenant-id': tenantId
        }
      });
      if (res.ok) {
        setCampaigns(campaigns.filter(c => c._id !== id));
      } else {
         alert('Failed to delete campaign');
      }
    } catch (err) {
      console.error(err);
    }
  };

  const showReport = async (campaign) => {
    try {
       const token = localStorage.getItem('token');
       const tenantId = localStorage.getItem('tenantId');
       const res = await fetch(`/api/campaigns/${campaign._id}/report`, {
          headers: {
             'Authorization': `Bearer ${token}`,
             'x-tenant-id': tenantId
          }
       });
       if (res.ok) {
          const data = await res.json();
          setReportData({ isOpen: true, campaign: data.campaign, logs: data.logs });
       }
    } catch (err) {
       console.error("Failed to load report", err);
    }
  };

  const getStatusBadge = (status) => {
    switch(status) {
      case 'COMPLETED': return <span className="px-2 py-0.5 bg-green-100 text-green-700 rounded-lg text-[10px] font-bold capitalize">Completed</span>;
      case 'RUNNING': return <span className="px-2 py-0.5 bg-blue-100 text-blue-700 rounded-lg text-[10px] font-bold capitalize animate-pulse">Running</span>;
      case 'SCHEDULED': return <span className="px-2 py-0.5 bg-purple-100 text-purple-700 rounded-lg text-[10px] font-bold capitalize">Scheduled</span>;
      case 'FAILED': return <span className="px-2 py-0.5 bg-red-100 text-red-700 rounded-lg text-[10px] font-bold capitalize">Failed</span>;
      default: return <span className="px-2 py-0.5 bg-gray-100 text-gray-700 rounded-lg text-[10px] font-bold capitalize">{status}</span>;
    }
  };

  return (
    <div className="p-4 sm:p-8 bg-crm-bg min-h-full animate-fade-in-up">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-800 tracking-tight flex items-center">
            <Megaphone className="mr-3 text-blue-600" size={24} /> Campaigns
          </h1>
          <p className="text-xs sm:text-sm font-bold text-gray-400 mt-1 capitalize">Manage and track bulk broadcasts.</p>
        </div>
        <button onClick={() => navigate('/campaigns/create')} className="w-full sm:w-auto flex items-center justify-center space-x-3 px-6 py-3 bg-blue-600 text-white rounded-2xl text-xs font-bold shadow-glow hover:bg-blue-700 transition-all active:scale-95 capitalize">
          <Plus size={18} />
          <span>Create Campaign</span>
        </button>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-10">
        <div className="bg-white p-5 rounded-[2rem] shadow-premium border border-slate-100 group hover:border-blue-200 transition-all">
          <p className="text-slate-400 text-[9px] font-bold capitalize">Total Campaigns</p>
          <div className="flex items-center justify-between mt-3">
            <p className="text-2xl font-bold text-slate-800 tracking-tighter">{campaigns.length}</p>
            <div className="p-2.5 bg-blue-50 text-blue-600 rounded-2xl group-hover:bg-blue-600 group-hover:text-white transition-all shadow-sm"><Megaphone size={16} /></div>
          </div>
        </div>
        <div className="bg-white p-5 rounded-[2rem] shadow-premium border border-slate-100 group hover:border-emerald-200 transition-all">
          <p className="text-slate-400 text-[9px] font-bold capitalize">Messages Sent</p>
          <div className="flex items-center justify-between mt-3">
            <p className="text-2xl font-bold text-slate-800 tracking-tighter">
               {campaigns.reduce((acc, curr) => acc + (curr.metrics?.sent || 0), 0)}
            </p>
            <div className="p-2.5 bg-emerald-50 text-emerald-600 rounded-2xl group-hover:bg-emerald-600 group-hover:text-white transition-all shadow-sm"><Send size={16} /></div>
          </div>
        </div>
        <div className="bg-white p-5 rounded-[2rem] shadow-premium border border-slate-100">
          <p className="text-slate-400 text-[9px] font-bold capitalize">Avg Delivery</p>
          <p className="text-2xl font-bold text-emerald-600 mt-3 tracking-tighter">
            {(() => {
              const totalSent = campaigns.reduce((acc, c) => acc + (c.metrics?.sent || 0), 0);
              const totalDelivered = campaigns.reduce((acc, c) => acc + (c.metrics?.delivered || 0), 0);
              return totalSent > 0 ? ((totalDelivered / totalSent) * 100).toFixed(1) : '0';
            })()}%
          </p>
        </div>
        <div className="bg-white p-5 rounded-[2rem] shadow-premium border border-slate-100">
          <p className="text-slate-400 text-[9px] font-bold capitalize">Read Rate</p>
          <p className="text-2xl font-bold text-blue-500 mt-3 tracking-tighter">
            {(() => {
              const totalDelivered = campaigns.reduce((acc, c) => acc + (c.metrics?.delivered || 0), 0);
              const totalRead = campaigns.reduce((acc, c) => acc + (c.metrics?.read || 0), 0);
              return totalDelivered > 0 ? ((totalRead / totalDelivered) * 100).toFixed(1) : '0';
            })()}%
          </p>
        </div>
      </div>

      <div className="bg-white rounded-[2rem] shadow-sm border border-gray-100 overflow-hidden">
        <div className="px-6 py-5 border-b border-gray-50 flex items-center justify-between">
           <h2 className="text-xs font-bold text-gray-400 capitalize">Recent Activity</h2>
           {loading && <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>}
        </div>

        {/* Mobile Grid View */}
        <div className="block md:hidden p-4 space-y-4">
           {campaigns.map(c => (
             <div key={c._id} className="p-5 bg-white rounded-[2rem] border border-slate-100 shadow-premium space-y-5 group relative overflow-hidden">
                <div className="flex items-center justify-between">
                   <div>
                      <p className="text-[10px] font-bold text-slate-400 capitalize mb-1">Campaign Identity</p>
                      <p className="text-sm font-bold text-slate-800 tracking-tight group-hover:text-blue-600 transition-colors">{c.name}</p>
                   </div>
                   <div className="transform scale-90 origin-right">
                      {getStatusBadge(c.status)}
                   </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4 pt-4 border-t border-slate-50">
                   <div className="bg-slate-50/50 p-3 rounded-2xl border border-slate-100">
                      <span className="text-[8px] font-bold text-slate-400 capitalize block mb-1">Audience</span>
                      <span className="text-sm font-bold text-slate-700">{c.metrics?.totalContacts || 0}</span>
                   </div>
                   <div className="bg-slate-50/50 p-3 rounded-2xl border border-slate-100">
                      <span className="text-[8px] font-bold text-slate-400 capitalize block mb-1">Processed</span>
                      <span className="text-sm font-bold text-slate-700">{c.metrics?.sent || 0}</span>
                   </div>
                   <div className="bg-emerald-50/30 p-3 rounded-2xl border border-emerald-100/50">
                      <span className="text-[8px] font-bold text-emerald-500 capitalize block mb-1">Success</span>
                      <span className="text-sm font-bold text-emerald-600">{c.metrics?.delivered || 0}</span>
                   </div>
                   <div className="bg-rose-50/30 p-3 rounded-2xl border border-rose-100/50">
                      <span className="text-[8px] font-bold text-rose-500 capitalize block mb-1">Failure</span>
                      <span className="text-sm font-bold text-rose-600">{c.metrics?.failed || 0}</span>
                   </div>
                </div>

                <div className="flex items-center space-x-3 pt-2">
                   <button 
                      onClick={() => showReport(c)}
                      className="flex-1 py-3.5 bg-blue-600 text-white rounded-2xl text-[10px] font-bold capitalize flex items-center justify-center space-x-3 shadow-glow active:scale-95 transition-all"
                   >
                      <BarChart2 size={14} />
                      <span>Intelligence Report</span>
                   </button>
                   <button 
                      onClick={() => handleDelete(c._id)}
                      className="p-3.5 bg-slate-100 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-2xl transition-all active:scale-90"
                   >
                      <Trash2 size={18} />
                   </button>
                </div>
             </div>
           ))}
        </div>

        {/* Desktop Table View */}
        <div className="hidden md:block overflow-x-auto h-full custom-scrollbar">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50/50 text-gray-400 text-[10px] font-bold capitalize">
                <th className="p-5">Campaign Name</th>
                <th className="p-5">Status</th>
                <th className="p-5 text-center"><Users size={14} className="mx-auto" /></th>
                <th className="p-5 text-center"><Send size={14} className="mx-auto" /></th>
                <th className="p-5 text-center text-emerald-600">Delivered</th>
                <th className="p-5 text-center text-blue-600">Read</th>
                <th className="p-5 text-center text-red-500">Failed</th>
                <th className="p-5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="text-sm">
              {campaigns.map(c => (
                <tr key={c._id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors group">
                  <td className="p-5 font-bold text-gray-800 tracking-tight">{c.name}</td>
                  <td className="p-5">{getStatusBadge(c.status)}</td>
                  <td className="p-5 text-center font-bold text-gray-600">{c.metrics?.totalContacts || 0}</td>
                  <td className="p-5 text-center font-bold text-gray-600">{c.metrics?.sent || 0}</td>
                  <td className="p-5 text-center text-emerald-600 font-bold">{c.metrics?.delivered || 0}</td>
                  <td className="p-5 text-center text-blue-600 font-bold">{c.metrics?.read || 0}</td>
                  <td className="p-5 text-center text-red-500 font-bold">{c.metrics?.failed || 0}</td>
                  <td className="p-5 text-right">
                    <div className="flex items-center justify-end space-x-3">
                      <button 
                        onClick={() => showReport(c)}
                        className="text-blue-500 hover:bg-blue-600 hover:text-white p-2.5 rounded-xl transition-all border border-blue-100 shadow-sm"
                        title="View Detailed Report"
                      >
                        <BarChart2 size={16} />
                      </button>
                      <button 
                        onClick={() => handleDelete(c._id)}
                        className="text-gray-300 hover:text-rose-600 hover:bg-rose-50 p-2.5 rounded-xl transition-all"
                        title="Delete Campaign"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        {campaigns.length === 0 && !loading && (
           <div className="py-20 text-center opacity-40">
              <Megaphone size={48} className="mx-auto mb-4 text-slate-200" />
              <p className="text-xs font-bold capitalize text-slate-400">No campaigns found. Launch one today.</p>
           </div>
        )}
      </div>

      <CampaignReportModal 
        isOpen={reportData.isOpen} 
        onClose={() => setReportData({ ...reportData, isOpen: false })} 
        campaign={reportData.campaign} 
        logs={reportData.logs} 
      />
    </div>
  );
}

export default Campaigns;
