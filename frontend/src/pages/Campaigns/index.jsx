import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Play, Pause, Plus, BarChart2, CheckCircle2, XCircle, Trash2 } from 'lucide-react';
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
      case 'COMPLETED': return <span className="px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs font-bold">Completed</span>;
      case 'RUNNING': return <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-bold animate-pulse">Running</span>;
      case 'SCHEDULED': return <span className="px-2 py-1 bg-purple-100 text-purple-700 rounded-full text-xs font-bold">Scheduled</span>;
      case 'FAILED': return <span className="px-2 py-1 bg-red-100 text-red-700 rounded-full text-xs font-bold">Failed</span>;
      default: return <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded-full text-xs font-bold">{status}</span>;
    }
  };

  return (
    <div className="p-8 bg-crm-bg min-h-full animate-fade-in-up">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Campaigns</h1>
          <p className="text-sm text-gray-500 mt-1">Manage and track your bulk messaging broadcasts.</p>
        </div>
        <button onClick={() => navigate('/campaigns/create')} className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-md text-sm font-bold shadow-premium hover:bg-blue-700 transition-colors">
          <Plus size={16} />
          <span>Create Campaign</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-white p-5 rounded-lg shadow-sm border border-gray-100">
          <p className="text-gray-500 text-xs font-bold uppercase tracking-wider">Total Campaigns</p>
          <p className="text-2xl font-bold text-gray-800 mt-2">{campaigns.length}</p>
        </div>
        <div className="bg-white p-5 rounded-lg shadow-sm border border-gray-100">
          <p className="text-gray-500 text-xs font-bold uppercase tracking-wider">Messages Sent</p>
          <p className="text-2xl font-bold text-gray-800 mt-2">
            {campaigns.reduce((acc, curr) => acc + (curr.metrics?.sent || 0), 0)}
          </p>
        </div>
        <div className="bg-white p-5 rounded-lg shadow-sm border border-gray-100">
          <p className="text-gray-500 text-xs font-bold uppercase tracking-wider">Delivery Rate</p>
          <p className="text-2xl font-bold text-brand-light mt-2">98.5%</p>
        </div>
        <div className="bg-white p-5 rounded-lg shadow-sm border border-gray-100">
          <p className="text-gray-500 text-xs font-bold uppercase tracking-wider">Avg Read Rate</p>
          <p className="text-2xl font-bold text-blue-500 mt-2">45.2%</p>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 font-bold text-gray-700">Recent Campaigns</div>
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-gray-50 text-gray-500 text-xs uppercase tracking-wider">
              <th className="p-4 font-semibold">Campaign Name</th>
              <th className="p-4 font-semibold">Status</th>
              <th className="p-4 font-semibold">Audience</th>
              <th className="p-4 font-semibold">Sent</th>
              <th className="p-4 font-semibold">Delivered</th>
              <th className="p-4 font-semibold">Read</th>
              <th className="p-4 font-semibold text-red-500">Failed</th>
              <th className="p-4 font-semibold text-right">Action</th>
            </tr>
          </thead>
          <tbody className="text-sm">
            {campaigns.map(c => (
              <tr key={c._id} className="border-b border-gray-50 hover:bg-gray-50">
                <td className="p-4 font-medium text-gray-800">{c.name}</td>
                <td className="p-4">{getStatusBadge(c.status)}</td>
                <td className="p-4 text-gray-600">{c.metrics?.totalContacts || 0}</td>
                <td className="p-4 text-gray-600">{c.metrics?.sent || 0}</td>
                <td className="p-4 text-green-600 font-medium">{c.metrics?.delivered || 0}</td>
                <td className="p-4 text-blue-600 font-medium">{c.metrics?.read || 0}</td>
                <td className="p-4 text-red-500 font-medium">{c.metrics?.failed || 0}</td>
                <td className="p-4 text-right">
                  <div className="flex items-center justify-end space-x-2">
                    <button 
                      onClick={() => showReport(c)}
                      className="text-blue-500 hover:bg-blue-50 p-2 rounded-lg transition-colors border border-blue-100 shadow-sm"
                      title="View Detailed Report"
                    >
                      <BarChart2 size={16} />
                    </button>
                    <button 
                      onClick={() => handleDelete(c._id)}
                      className="text-red-400 hover:text-red-600 hover:bg-red-50 p-2 rounded-lg transition-colors text-right"
                      title="Delete Campaign"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {campaigns.length === 0 && !loading && (
              <tr><td colSpan="8" className="p-8 text-center text-gray-500">No campaigns found. Create one to get started.</td></tr>
            )}
          </tbody>
        </table>
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
