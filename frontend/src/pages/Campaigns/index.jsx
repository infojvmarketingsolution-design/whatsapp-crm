import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Play, Pause, Plus, BarChart2, CheckCircle2, XCircle, Trash2, Megaphone, Users, Send, AlertCircle, FileText, Activity, ShieldAlert, IndianRupee, Wallet } from 'lucide-react';
import CampaignReportModal from './CampaignReportModal';
import RefillBudgetModal from './RefillBudgetModal';

const META_BASE_PRICING = {
  MARKETING: 0.88, // Standard Meta India Rate
  UTILITY: 0.11,
  AUTHENTICATION: 0.11,
  SERVICE: 0.29
};

const PLATFORM_MARGIN = 0.05; // Platform Commission

const META_PRICING = {
  MARKETING: META_BASE_PRICING.MARKETING + PLATFORM_MARGIN,
  UTILITY: META_BASE_PRICING.UTILITY + PLATFORM_MARGIN,
  AUTHENTICATION: META_BASE_PRICING.AUTHENTICATION + PLATFORM_MARGIN,
  SERVICE: META_BASE_PRICING.SERVICE + PLATFORM_MARGIN
};

function Campaigns() {
  const navigate = useNavigate();
  const [campaigns, setCampaigns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [reportData, setReportData] = useState({ isOpen: false, campaign: null, logs: [] });
  const [metaStatus, setMetaStatus] = useState({ limitTier: 'Loading...', qualityRating: 'Loading...', walletBalance: 0 });
  const [showRefillModal, setShowRefillModal] = useState(false);

  useEffect(() => {
    fetchCampaigns();
    fetchMetaStatus();
    const interval = setInterval(() => fetchCampaigns(true), 10000);
    return () => clearInterval(interval);
  }, []);

  const fetchMetaStatus = async () => {
    try {
      const token = localStorage.getItem('token');
      const tenantId = localStorage.getItem('tenantId');
      const res = await fetch('/api/whatsapp/meta-status', {
        headers: { 'Authorization': `Bearer ${token}`, 'x-tenant-id': tenantId }
      });
      if (res.ok) {
        const data = await res.json();
        setMetaStatus(data);
      }
    } catch (err) {
      console.error(err);
      setMetaStatus({ limitTier: 'Unknown', qualityRating: 'UNKNOWN', walletBalance: 0 });
    }
  };

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
        <div className="flex flex-col sm:flex-row items-center gap-4 w-full sm:w-auto">
          
          {/* Ad Budget Credit Card */}
          <div className="bg-white px-4 py-2 rounded-2xl shadow-sm border border-slate-200 flex items-center justify-between gap-4 w-full sm:w-auto h-[46px] box-border">
             <div className="flex flex-col justify-center">
                <span className="text-[10px] font-bold text-slate-500 leading-tight">Ad Budget Credit</span>
                <span className="text-sm font-black text-slate-800 leading-tight">₹{metaStatus.walletBalance?.toFixed(2) || '0.00'}</span>
             </div>
             <div className="h-6 w-px bg-slate-200 mx-1"></div>
             <button onClick={() => setShowRefillModal(true)} className="flex items-center justify-center space-x-1 px-3 py-1.5 bg-blue-50 text-blue-600 rounded-xl text-xs font-bold hover:bg-blue-100 transition-colors h-full max-h-[30px]">
                <Plus size={14} />
                <span>Add</span>
             </button>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
            <button onClick={() => navigate('/campaigns/reports/all')} className="w-full sm:w-auto flex items-center justify-center space-x-2 px-6 py-3 bg-white text-gray-700 border border-gray-200 rounded-2xl text-xs font-bold shadow-sm hover:bg-gray-50 transition-all active:scale-95 capitalize">
              <FileText size={18} />
              <span>Overall Report</span>
            </button>
            <button onClick={() => navigate('/campaigns/create')} className="w-full sm:w-auto flex items-center justify-center space-x-3 px-6 py-3 bg-blue-600 text-white rounded-2xl text-xs font-bold shadow-glow hover:bg-blue-700 transition-all active:scale-95 capitalize">
              <Plus size={18} />
              <span>Create Campaign</span>
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-6 gap-4 sm:gap-6 mb-10">
        <div className="bg-white p-5 rounded-[2rem] shadow-premium border border-slate-100 group hover:border-blue-200 transition-all col-span-2 lg:col-span-1">
          <p className="text-slate-400 text-[9px] font-bold capitalize">Total Campaigns</p>
          <div className="flex items-center justify-between mt-3">
            <p className="text-2xl font-bold text-slate-800 tracking-tighter">{campaigns.length}</p>
            <div className="p-2.5 bg-blue-50 text-blue-600 rounded-2xl group-hover:bg-blue-600 group-hover:text-white transition-all shadow-sm"><Megaphone size={16} /></div>
          </div>
        </div>
        <div className="bg-white p-5 rounded-[2rem] shadow-premium border border-slate-100 group hover:border-emerald-200 transition-all col-span-2 lg:col-span-1">
          <p className="text-slate-400 text-[9px] font-bold capitalize">Messages Sent</p>
          <div className="flex items-center justify-between mt-3">
            <p className="text-2xl font-bold text-slate-800 tracking-tighter">
               {campaigns.reduce((acc, curr) => acc + (curr.metrics?.sent || 0), 0)}
            </p>
            <div className="p-2.5 bg-emerald-50 text-emerald-600 rounded-2xl group-hover:bg-emerald-600 group-hover:text-white transition-all shadow-sm"><Send size={16} /></div>
          </div>
        </div>
        <div className="bg-white p-5 rounded-[2rem] shadow-premium border border-slate-100 col-span-2 lg:col-span-1">
          <p className="text-slate-400 text-[9px] font-bold capitalize">Avg Delivery</p>
          <p className="text-2xl font-bold text-emerald-600 mt-3 tracking-tighter">
            {(() => {
              const totalSent = campaigns.reduce((acc, c) => acc + (c.metrics?.sent || 0), 0);
              const totalDelivered = campaigns.reduce((acc, c) => acc + (c.metrics?.delivered || 0), 0);
              return totalSent > 0 ? ((totalDelivered / totalSent) * 100).toFixed(1) : '0';
            })()}%
          </p>
        </div>
        <div className="bg-white p-5 rounded-[2rem] shadow-premium border border-slate-100 col-span-2 lg:col-span-1">
          <p className="text-slate-400 text-[9px] font-bold capitalize">Meta Limit & Quality</p>
          <div className="flex flex-col mt-2">
            <span className="text-xs font-bold text-slate-800 tracking-tight flex items-center gap-1">
               <Activity size={12} className="text-blue-500" /> {metaStatus.limitTier?.replace('TIER_', '') || 'Unknown'} Limit
            </span>
            <span className={`text-xs font-bold tracking-tight flex items-center gap-1 mt-1 ${metaStatus.qualityRating === 'GREEN' ? 'text-green-600' : metaStatus.qualityRating === 'YELLOW' ? 'text-amber-500' : 'text-red-600'}`}>
               <ShieldAlert size={12} /> {metaStatus.qualityRating || 'UNKNOWN'} Quality
            </span>
          </div>
        </div>
        <div className="bg-white p-5 rounded-[2rem] shadow-premium border border-slate-100 col-span-2 lg:col-span-2 bg-gradient-to-br from-green-50 to-emerald-100/50">
          <p className="text-emerald-700 text-[9px] font-bold capitalize">Total Campaigns Cost (Est.)</p>
          <div className="flex items-center justify-between mt-3">
            <p className="text-2xl font-bold text-emerald-800 tracking-tighter flex items-center">
              <IndianRupee size={20} className="mr-1" />
              {campaigns.reduce((acc, c) => {
                 const cat = c.templateId?.category || 'MARKETING';
                 const rate = META_PRICING[cat] || 0.88;
                 return acc + ((c.metrics?.sent || 0) * rate);
              }, 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </p>
            <div className="p-2.5 bg-white text-emerald-600 rounded-2xl shadow-sm"><IndianRupee size={16} /></div>
          </div>
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
                   <div className="flex flex-col items-end">
                      <div className="transform scale-90 origin-right mb-1">
                         {getStatusBadge(c.status)}
                      </div>
                      <span className="text-[9px] font-bold text-slate-400" title={c.scheduledAt ? 'Scheduled For' : 'Created At'}>
                        🗓 {new Date(c.scheduledAt || c.createdAt).toLocaleString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                      </span>
                   </div>
                </div>
                
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 pt-4 border-t border-slate-50">
                   <div className="bg-slate-50/50 p-3 rounded-2xl border border-slate-100">
                      <span className="text-[8px] font-bold text-slate-400 capitalize block mb-1">Total Audience</span>
                      <span className="text-sm font-bold text-slate-700">{c.metrics?.totalContacts || 0}</span>
                   </div>
                   <div className="bg-blue-50/50 p-3 rounded-2xl border border-blue-100/50">
                      <span className="text-[8px] font-bold text-blue-500 capitalize block mb-1">Sent to API</span>
                      <span className="text-sm font-bold text-blue-600">{c.metrics?.sent || 0}</span>
                   </div>
                   <div className="bg-amber-50/30 p-3 rounded-2xl border border-amber-100/50">
                      <span className="text-[8px] font-bold text-amber-500 capitalize block mb-1">Unsent</span>
                      <span className="text-sm font-bold text-amber-600">{Math.max(0, (c.metrics?.totalContacts || 0) - (c.metrics?.sent || 0))}</span>
                   </div>
                   <div className="bg-emerald-50/30 p-3 rounded-2xl border border-emerald-100/50">
                      <span className="text-[8px] font-bold text-emerald-500 capitalize block mb-1">Delivered</span>
                      <span className="text-sm font-bold text-emerald-600">{c.metrics?.delivered || 0}</span>
                   </div>
                   <div className="bg-rose-50/30 p-3 rounded-2xl border border-rose-100/50">
                      <span className="text-[8px] font-bold text-rose-500 capitalize block mb-1">Failed</span>
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
                <th className="p-5 whitespace-nowrap">Schedule Date</th>
                <th className="p-5 text-center whitespace-nowrap" title="Template Category">Category</th>
                <th className="p-5 text-center whitespace-nowrap text-emerald-600" title="Cost per message">Msg Cost</th>
                <th className="p-5 text-center whitespace-nowrap text-blue-500" title="Successfully sent to API">Sent</th>
                <th className="p-5 text-center whitespace-nowrap text-emerald-700" title="Total Campaign Cost">Total Cost</th>
                <th className="p-5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="text-sm">
              {campaigns.map(c => {
                const category = c.templateId?.category || 'MARKETING';
                const rate = META_PRICING[category] || 0.88;
                const cost = ((c.metrics?.sent || 0) * rate).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
                return (
                <tr key={c._id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors group">
                  <td className="p-5 font-bold text-gray-800 tracking-tight">{c.name}</td>
                  <td className="p-5">{getStatusBadge(c.status)}</td>
                  <td className="p-5 text-[11px] font-bold text-slate-500 whitespace-nowrap">
                    {new Date(c.scheduledAt || c.createdAt).toLocaleString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                  </td>
                  <td className="p-5 text-center font-bold text-gray-600">
                     <span className={`px-2 py-1 rounded-md text-[9px] ${category === 'MARKETING' ? 'bg-blue-50 text-blue-600' : category === 'UTILITY' ? 'bg-amber-50 text-amber-600' : 'bg-emerald-50 text-emerald-600'}`}>{category}</span>
                  </td>
                  <td className="p-5 text-center font-bold text-emerald-600">₹{rate}</td>
                  <td className="p-5 text-center font-bold text-blue-500">{c.metrics?.sent || 0}</td>
                  <td className="p-5 text-center font-bold text-emerald-700 bg-emerald-50/30">₹{cost}</td>
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
              )})}
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
        onClose={() => setReportData({ isOpen: false, campaign: null, logs: [] })}
        campaign={reportData.campaign}
        logs={reportData.logs}
      />
        
      <RefillBudgetModal 
        isOpen={showRefillModal} 
        onClose={() => setShowRefillModal(false)} 
      />
    </div>
  );
}

export default Campaigns;
