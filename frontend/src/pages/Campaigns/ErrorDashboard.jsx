import React, { useState, useEffect } from 'react';
import { AlertTriangle, TrendingUp, XCircle, CheckCircle, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const ERROR_RECOMMENDATIONS = {
  '131049': {
    status: 'Marketing Message Limit',
    recommendation: 'Retry after 24-72 hours. Ensure target audience is highly engaged or try a different template.'
  },
  '131053': {
    status: 'Media Upload Failure',
    recommendation: 'Re-upload media. Verify MIME type and validate media URL.'
  },
  '131026': {
    status: 'Undeliverable Number',
    recommendation: 'Verify WhatsApp registration. Ask user to update WhatsApp or confirm valid mobile number.'
  }
};

export default function ErrorDashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = localStorage.getItem('token');
        const tenantId = localStorage.getItem('tenantId');
        const res = await fetch('/api/campaigns/errors/dashboard', {
          headers: { 'Authorization': `Bearer ${token}`, 'x-tenant-id': tenantId }
        });
        if (res.ok) {
          setData(await res.json());
        }
      } catch (err) {
        console.error('Failed to load error dashboard data', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) return <div className="p-8 text-center">Loading Error Dashboard...</div>;
  if (!data) return <div className="p-8 text-center text-red-500">Failed to load data</div>;

  return (
    <div className="p-4 sm:p-8 bg-crm-bg min-h-full">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-4">
             <button onClick={() => navigate('/campaigns')} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
               <ArrowLeft size={20} className="text-gray-600" />
             </button>
             <h1 className="text-2xl font-black text-gray-800 tracking-tight">Campaign Error Dashboard</h1>
          </div>
          <button onClick={() => navigate('/campaigns/errors/report')} className="bg-white border border-gray-200 text-gray-700 px-4 py-2 rounded-lg text-sm font-bold shadow-sm hover:bg-gray-50">
             Detailed Report
          </button>
        </div>

        {/* Metrics Overview */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 mb-8">
          <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-1">Total Sent</p>
              <h3 className="text-2xl font-black text-gray-800">{data.totalMessages}</h3>
            </div>
            <div className="bg-blue-50 p-3 rounded-full"><TrendingUp size={20} className="text-blue-600" /></div>
          </div>
          <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-green-600 uppercase tracking-widest mb-1">Delivered</p>
              <h3 className="text-2xl font-black text-green-700">{data.deliveredMessages}</h3>
            </div>
            <div className="bg-green-50 p-3 rounded-full"><CheckCircle size={20} className="text-green-600" /></div>
          </div>
          <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-red-600 uppercase tracking-widest mb-1">Failed</p>
              <h3 className="text-2xl font-black text-red-700">{data.failedMessages}</h3>
            </div>
            <div className="bg-red-50 p-3 rounded-full"><XCircle size={20} className="text-red-600" /></div>
          </div>
          <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-purple-600 uppercase tracking-widest mb-1">Delivery Rate</p>
              <h3 className="text-2xl font-black text-purple-700">{data.deliveryRate}%</h3>
            </div>
            <div className="bg-purple-50 p-3 rounded-full"><TrendingUp size={20} className="text-purple-600" /></div>
          </div>
        </div>

        {/* Error Breakdown Table */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100 bg-gray-50">
            <h2 className="text-lg font-bold text-gray-800">Error Classification & Recommendations</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-white border-b border-gray-100">
                  <th className="px-6 py-3 text-xs font-bold text-gray-500 uppercase tracking-wider">Error Code</th>
                  <th className="px-6 py-3 text-xs font-bold text-gray-500 uppercase tracking-wider">Description</th>
                  <th className="px-6 py-3 text-xs font-bold text-gray-500 uppercase tracking-wider">Count</th>
                  <th className="px-6 py-3 text-xs font-bold text-gray-500 uppercase tracking-wider">Status & Recommended Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {data.errorBreakdown.map((err, idx) => {
                  const rec = ERROR_RECOMMENDATIONS[err.errorCode] || { status: 'Unknown', recommendation: 'Check Meta API Documentation.' };
                  return (
                    <tr key={idx} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-red-100 text-red-800">
                          {err.errorCode || 'N/A'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-800 font-medium">
                        {err.description}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-800 font-bold">
                        {err.count}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600 max-w-xs">
                        <div className="font-bold text-gray-800 mb-1">{rec.status}</div>
                        <div className="text-xs">{rec.recommendation}</div>
                      </td>
                    </tr>
                  );
                })}
                {data.errorBreakdown.length === 0 && (
                  <tr>
                    <td colSpan="4" className="px-6 py-12 text-center text-gray-500">
                      <CheckCircle className="mx-auto h-8 w-8 text-green-400 mb-3" />
                      <p className="font-bold text-gray-800">No recent errors found.</p>
                      <p className="text-sm">Your campaigns are delivering smoothly.</p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
