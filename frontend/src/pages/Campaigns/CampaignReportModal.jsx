import React from 'react';
import { X, CheckCircle2, XCircle, Clock, Search, BookOpen, ChevronLeft } from 'lucide-react';

function CampaignReportModal({ isOpen, onClose, campaign, logs }) {
  const [searchTerm, setSearchTerm] = React.useState('');
  const [showGuide, setShowGuide] = React.useState(false);

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
            <h2 className="text-xl font-bold text-gray-800">
              {showGuide ? 'WhatsApp Delivery Guide' : `${campaign.name} - Delivery Report`}
            </h2>
            <p className="text-sm text-gray-500 mt-1">
              {showGuide ? 'Best practices to avoid Meta Anti-Spam blocks and improve delivery.' : 'Detailed status of every message sent in this campaign.'}
            </p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors p-2 hover:bg-gray-100 rounded-full">
            <X size={20} />
          </button>
        </div>

        {showGuide ? (
          <div className="flex-1 overflow-y-auto p-6 bg-white space-y-6 text-sm text-gray-700">
             <div className="bg-blue-50 text-blue-800 p-4 rounded-xl border border-blue-100">
               <h3 className="font-bold text-lg mb-2 flex items-center"><BookOpen size={18} className="mr-2"/> Why do messages fail?</h3>
               <p>Meta uses AI to protect users from spam. If you get errors like <strong>Code 131049</strong>, it means Meta actively blocked your marketing message to maintain "Ecosystem Engagement". Follow these rules to prevent it.</p>
             </div>
             
             <div className="space-y-4">
                <div className="border-b border-gray-100 pb-4">
                   <h4 className="font-bold text-gray-900 text-base mb-1">1. Send Campaigns Early in the Morning ☀️ (Recommended)</h4>
                   <p className="text-gray-600">Meta limits how many marketing messages a single person can receive per day. If you send your campaign at 9:00 AM, your message will likely be the first one they receive today, so it will deliver perfectly. If you send it at 5:00 PM, they may have already received ads from other businesses, so Meta will block yours.</p>
                </div>
                
                <div className="border-b border-gray-100 pb-4">
                   <h4 className="font-bold text-gray-900 text-base mb-1">2. Warm Up Your WhatsApp Number 🔥</h4>
                   <p className="text-gray-600">If your WhatsApp Business number is relatively new to sending bulk messages, Meta's AI puts strict limits on it. Start by sending smaller campaigns (10-50 people) to your most loyal customers who are likely to reply. When customers reply to you, Meta's AI learns that you are a high-quality business, and it will slowly stop blocking your messages.</p>
                </div>
                
                <div className="border-b border-gray-100 pb-4">
                   <h4 className="font-bold text-gray-900 text-base mb-1">3. Encourage Customer Replies 💬</h4>
                   <p className="text-gray-600">If a customer sends a message to your WhatsApp number first, a "24-hour Service Window" opens. During this 24-hour window, the Anti-Spam AI is completely turned off for that customer, and your messages will 100% deliver. Try to encourage your customers to message your number first (e.g., "Reply 'Hi' for syllabus").</p>
                </div>
                
                <div className="border-b border-gray-100 pb-4">
                   <h4 className="font-bold text-gray-900 text-base mb-1">4. Remove Blockers 🚫</h4>
                   <p className="text-gray-600">If you send ads to people who don't want them, they will click the "Block & Report Spam" button on WhatsApp. If Meta sees people blocking you, they will start rejecting your campaigns with Code 131049. Only send campaigns to people who actually opted-in to receive messages from you.</p>
                </div>
                
                <div className="pb-2">
                   <h4 className="font-bold text-gray-900 text-base mb-1">5. Fix Your Payment Method 💳</h4>
                   <p className="text-gray-600">If a number fails with a <strong>Payment Method Error (Code 131042)</strong>, it means your Facebook credit card is declining or you are out of funds. Even if the AI allows the message, Meta will drop it without payment. Make sure your Facebook Billing page has an active card with sufficient funds.</p>
                </div>
             </div>
          </div>
        ) : (
          <>
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
          </>
        )}

        {/* Footer */}
        <div className="p-4 border-t border-gray-100 bg-gray-50/50 flex justify-between items-center">
          {showGuide ? (
             <button onClick={() => setShowGuide(false)} className="px-4 py-2 flex items-center text-gray-600 hover:text-gray-900 font-medium transition-colors">
                <ChevronLeft size={16} className="mr-1"/> Back to Report
             </button>
          ) : (
             <button onClick={() => setShowGuide(true)} className="px-4 py-2 flex items-center text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg text-sm font-bold transition-colors">
                <BookOpen size={16} className="mr-2"/> Delivery Guide & Tips
             </button>
          )}
          <button onClick={onClose} className="px-6 py-2 bg-gray-800 text-white rounded-lg text-sm font-bold shadow-soft hover:bg-black transition-all">Close Report</button>
        </div>
      </div>
    </div>
  );
}

export default CampaignReportModal;
