import React from 'react';
import { X, CheckCircle2, XCircle, Clock, Search } from 'lucide-react';

function CampaignReportModal({ isOpen, onClose, campaign, logs }) {
  const [searchTerm, setSearchTerm] = React.useState('');

  if (!isOpen || !campaign) return null;

  const filteredLogs = logs.filter(log => 
    log.phone.includes(searchTerm) || 
    log.status.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-premium w-full max-w-4xl max-h-[85vh] overflow-hidden flex flex-col animate-scale-in">
        {/* Header */}
        <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
          <div>
            <h2 className="text-xl font-bold text-gray-800">{campaign.name} - Delivery Report</h2>
            <p className="text-sm text-gray-500 mt-1">Detailed status of every message sent in this campaign.</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors p-2 hover:bg-gray-100 rounded-full">
            <X size={20} />
          </button>
        </div>

        {/* Stats Strip */}
        <div className="grid grid-cols-4 border-b border-gray-100">
           <div className="p-4 border-r border-gray-100 text-center">
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Audience</p>
              <p className="text-lg font-bold text-gray-800">{campaign.metrics?.totalContacts || 0}</p>
           </div>
           <div className="p-4 border-r border-gray-100 text-center">
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Delivered</p>
              <p className="text-lg font-bold text-green-600">{campaign.metrics?.delivered || 0}</p>
           </div>
           <div className="p-4 border-r border-gray-100 text-center">
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Read</p>
              <p className="text-lg font-bold text-blue-600">{campaign.metrics?.read || 0}</p>
           </div>
           <div className="p-4 text-center">
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Failed</p>
              <p className="text-lg font-bold text-red-600">{campaign.metrics?.failed || 0}</p>
           </div>
        </div>

        {/* Search Bar */}
        <div className="p-4 bg-white">
           <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
              <input 
                type="text" 
                placeholder="Search by phone or status..." 
                className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
           </div>
        </div>

        {/* Table Content */}
        <div className="flex-1 overflow-y-auto p-4 pt-0">
          <table className="w-full text-left border-collapse">
            <thead className="sticky top-0 bg-white z-10">
              <tr className="text-[10px] text-gray-400 font-bold uppercase tracking-wider border-b border-gray-100">
                <th className="py-3 px-4">Recipient</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Sent At</th>
                <th className="py-3 px-4">Error / Reason</th>
              </tr>
            </thead>
            <tbody className="text-sm">
              {filteredLogs.map(log => (
                <tr key={log._id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                  <td className="py-3 px-4 font-medium text-gray-700">{log.phone}</td>
                  <td className="py-3 px-4">
                    {log.status === 'READ' ? (
                       <span className="flex items-center text-blue-600 font-bold text-xs"><CheckCircle2 size={12} className="mr-1.5" /> Read</span>
                    ) : log.status === 'DELIVERED' ? (
                       <span className="flex items-center text-green-600 font-bold text-xs"><CheckCircle2 size={12} className="mr-1.5" /> Delivered</span>
                    ) : log.status === 'SENT' ? (
                       <span className="flex items-center text-gray-500 font-bold text-xs"><Clock size={12} className="mr-1.5" /> Sent</span>
                    ) : log.status === 'FAILED' ? (
                       <span className="flex items-center text-red-600 font-bold text-xs"><XCircle size={12} className="mr-1.5" /> Failed</span>
                    ) : (
                       <span className="text-gray-400 text-xs italic">{log.status}</span>
                    )}
                  </td>
                  <td className="py-3 px-4 text-gray-500 text-xs">
                    {log.sentAt ? new Date(log.sentAt).toLocaleString() : '-'}
                  </td>
                  <td className="py-3 px-4 text-xs text-red-400 italic">
                    {log.errorReason || '-'}
                  </td>
                </tr>
              ))}
              {filteredLogs.length === 0 && (
                <tr>
                   <td colSpan="4" className="py-20 text-center text-gray-400">No matching logs found.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-100 bg-gray-50/50 flex justify-end">
          <button onClick={onClose} className="px-6 py-2 bg-gray-800 text-white rounded-lg text-sm font-bold shadow-soft hover:bg-black transition-all">Close Report</button>
        </div>
      </div>
    </div>
  );
}

export default CampaignReportModal;
