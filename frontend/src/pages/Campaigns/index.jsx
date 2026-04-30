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
  }, []);

  const fetchCampaigns = async () => {
    setLoading(true);
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
      case 'COMPLETED': return <span className="px-2 py-0.5 bg-green-100 text-green-700 rounded-lg text-[10px] font-black uppercase tracking-wider">Completed</span>;
      case 'RUNNING': return <span className="px-2 py-0.5 bg-blue-100 text-blue-700 rounded-lg text-[10px] font-black uppercase tracking-wider animate-pulse">Running</span>;
      case 'SCHEDULED': return <span className="px-2 py-0.5 bg-purple-100 text-purple-700 rounded-lg text-[10px] font-black uppercase tracking-wider">Scheduled</span>;
      case 'FAILED': return <span className="px-2 py-0.5 bg-red-100 text-red-700 rounded-lg text-[10px] font-black uppercase tracking-wider">Failed</span>;
      default: return <span className="px-2 py-0.5 bg-gray-100 text-gray-700 rounded-lg text-[10px] font-black uppercase tracking-wider">{status}</span>;
    }
  };

  return (
    <div className="p-4 sm:p-8 bg-crm-bg min-h-full animate-fade-in-up">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-gray-800 tracking-tight flex items-center">
            <Megaphone className="mr-3 text-blue-600" size={24} /> Campaigns
          </h1>
          <p className="text-xs sm:text-sm font-bold text-gray-400 mt-1 uppercase tracking-widest">Manage and track bulk broadcasts.</p>
        </div>
        <button onClick={() => navigate('/campaigns/create')} className="w-full sm:w-auto flex items-center justify-center space-x-3 px-6 py-3 bg-blue-600 text-white rounded-2xl text-xs font-black shadow-glow hover:bg-blue-700 transition-all active:scale-95 uppercase tracking-widest">
          <Plus size={18} />
          <span>Create Campaign</span>
        </button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 mb-8">
        <div className="bg-white p-4 sm:p-5 rounded-3xl shadow-sm border border-gray-100 group hover:border-blue-200 transition-all">
          <p className="text-gray-400 text-[9px] font-black uppercase tracking-widest">Total Campaigns</p>
          <div className="flex items-center justify-between mt-2">
            <p className="text-xl sm:text-2xl font-black text-gray-800 tracking-tighter">{campaigns.length}</p>
            <div className="p-2 bg-blue-50 text-blue-600 rounded-xl group-hover:bg-blue-600 group-hover:text-white transition-all"><Megaphone size={14} /></div>
          </div>
        </div>
        <div className="bg-white p-4 sm:p-5 rounded-3xl shadow-sm border border-gray-100 group hover:border-emerald-200 transition-all">
          <p className="text-gray-400 text-[9px] font-black uppercase tracking-widest">Messages Sent</p>
          <div className="flex items-center justify-between mt-2">
            <p className="text-xl sm:text-2xl font-black text-gray-800 tracking-tighter">
               {campaigns.reduce((acc, curr) => acc + (curr.metrics?.sent || 0), 0)}
            </p>
            <div className="p-2 bg-emerald-50 text-emerald-600 rounded-xl group-hover:bg-emerald-600 group-hover:text-white transition-all"><Send size={14} /></div>
          </div>
        </div>
        <div className="bg-white p-4 sm:p-5 rounded-3xl shadow-sm border border-gray-100">
          <p className="text-gray-400 text-[9px] font-black uppercase tracking-widest">Delivery Rate</p>
          <p className="text-xl sm:text-2xl font-black text-emerald-600 mt-2 tracking-tighter">98.5%</p>
        </div>
        <div className="bg-white p-4 sm:p-5 rounded-3xl shadow-sm border border-gray-100">
          <p className="text-gray-400 text-[9px] font-black uppercase tracking-widest">Avg Read Rate</p>
          <p className="text-xl sm:text-2xl font-black text-blue-500 mt-2 tracking-tighter">45.2%</p>
        </div>
      </div>

      <div className="bg-white rounded-[2rem] shadow-sm border border-gray-100 overflow-hidden">
        <div className="px-6 py-5 border-b border-gray-50 flex items-center justify-between">
           <h2 className="text-xs font-black text-gray-400 uppercase tracking-widest">Recent Activity</h2>
           {loading && <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>}
        </div>

        {/* Mobile Grid View */}
        <div className="block md:hidden p-4 space-y-4">
           {campaigns.map(c => (
             <div key={c._id} className="p-4 bg-slate-50/50 rounded-2xl border border-slate-100 space-y-4">
                <div className="flex items-center justify-between">
                   <p className="text-sm font-black text-slate-800 tracking-tight">{c.name}</p>
                   {getStatusBadge(c.status)}
                </div>
                <div className="grid grid-cols-4 gap-2">
                   <div className="flex flex-col">
                      <span className="text-[8px] font-black text-slate-400 uppercase tracking-tighter">Audience</span>
                      <span className="text-xs font-bold text-slate-700">{c.metrics?.totalContacts || 0}</span>
                   </div>
                   <div className="flex flex-col">
                      <span className="text-[8px] font-black text-slate-400 uppercase tracking-tighter">Sent</span>
                      <span className="text-xs font-bold text-slate-700">{c.metrics?.sent || 0}</span>
                   </div>
                   <div className="flex flex-col">
                      <span className="text-[8px] font-black text-emerald-500 uppercase tracking-tighter">Delivered</span>
                      <span className="text-xs font-bold text-emerald-600">{c.metrics?.delivered || 0}</span>
                   </div>
                   <div className="flex flex-col">
                      <span className="text-[8px] font-black text-red-500 uppercase tracking-tighter">Failed</span>
                      <span className="text-xs font-bold text-red-600">{c.metrics?.failed || 0}</span>
                   </div>
                </div>
                <div className="flex items-center space-x-2 pt-3 border-t border-slate-100">
                   <button 
                      onClick={() => showReport(c)}
                      className="flex-1 py-2 bg-white border border-blue-100 text-blue-600 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center justify-center space-x-2 active:scale-95 transition-transform"
                   >
                      <BarChart2 size={12} />
                      <span>Analytics</span>
                   </button>
                   <button 
                      onClick={() => handleDelete(c._id)}
                      className="p-2 bg-rose-50 text-rose-500 rounded-xl active:scale-90 transition-transform"
                   >
                      <Trash2 size={14} />
                   </button>
                </div>
             </div>
           ))}
        </div>

        {/* Desktop Table View */}
        <div className="hidden md:block overflow-x-auto h-full custom-scrollbar">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50/50 text-gray-400 text-[10px] font-black uppercase tracking-widest">
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
                  <td className="p-5 font-black text-gray-800 tracking-tight">{c.name}</td>
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
              <p className="text-xs font-black uppercase tracking-widest text-slate-400">No campaigns found. Launch one today.</p>
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
