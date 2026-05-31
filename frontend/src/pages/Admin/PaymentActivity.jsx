import React, { useState, useEffect } from 'react';
import { IndianRupee, CheckCircle, XCircle, Clock, Search, ExternalLink } from 'lucide-react';

function PaymentActivity() {
   const [requests, setRequests] = useState([]);
   const [loading, setLoading] = useState(true);

   useEffect(() => {
      fetchRequests();
   }, []);

   const fetchRequests = async () => {
      setLoading(true);
      try {
         const token = localStorage.getItem('token');
         const res = await fetch('/api/payments/admin/requests', {
            headers: { 'Authorization': `Bearer ${token}` }
         });
         if (res.ok) {
            const data = await res.json();
            setRequests(data);
         }
      } catch (err) {
         console.error('Error fetching requests', err);
      } finally {
         setLoading(false);
      }
   };

   const handleUpdateStatus = async (id, status) => {
      if (!window.confirm(`Are you sure you want to ${status.toLowerCase()} this payment request?`)) return;
      try {
         const token = localStorage.getItem('token');
         const res = await fetch(`/api/payments/admin/requests/${id}`, {
            method: 'PUT',
            headers: { 
               'Authorization': `Bearer ${token}`,
               'Content-Type': 'application/json'
            },
            body: JSON.stringify({ status })
         });
         if (res.ok) {
            fetchRequests();
         } else {
            alert('Failed to update request');
         }
      } catch (err) {
         console.error('Error updating request', err);
      }
   };

   return (
      <div className="p-4 sm:p-8 min-h-full bg-slate-50">
         <div className="max-w-7xl mx-auto">
            <div className="mb-8">
               <h1 className="text-2xl sm:text-3xl font-black text-slate-800 tracking-tight flex items-center gap-3">
                  <IndianRupee className="text-emerald-500" size={32} />
                  Campaign Payment Activity
               </h1>
               <p className="text-sm font-bold text-slate-500 mt-2">Verify and approve ad budget top-up requests submitted by clients.</p>
            </div>

            <div className="bg-white rounded-[2rem] shadow-sm border border-slate-200 overflow-hidden">
               <div className="overflow-x-auto">
                  <table className="w-full text-left">
                     <thead>
                        <tr className="bg-slate-50 border-b border-slate-100">
                           <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Client Name</th>
                           <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Messages Qty</th>
                           <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Amount (₹)</th>
                           <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">UTR / Reference</th>
                           <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Status</th>
                           <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Actions</th>
                        </tr>
                     </thead>
                     <tbody className="divide-y divide-slate-100">
                        {loading ? (
                           <tr>
                              <td colSpan="6" className="text-center py-10 text-slate-500 font-bold">Loading requests...</td>
                           </tr>
                        ) : requests.length === 0 ? (
                           <tr>
                              <td colSpan="6" className="text-center py-10 text-slate-500 font-bold">No pending payment requests found.</td>
                           </tr>
                        ) : (
                           requests.map((req) => (
                              <tr key={req._id} className="hover:bg-slate-50 transition-colors">
                                 <td className="px-6 py-4">
                                    <p className="text-sm font-black text-slate-800">{req.clientId?.companyName || 'Unknown Client'}</p>
                                    <p className="text-[10px] font-bold text-slate-400">{new Date(req.createdAt).toLocaleString()}</p>
                                 </td>
                                 <td className="px-6 py-4">
                                    <span className="text-sm font-bold text-slate-700 bg-slate-100 px-2.5 py-1 rounded-lg border border-slate-200">
                                       {req.messageQuantity.toLocaleString()}
                                    </span>
                                 </td>
                                 <td className="px-6 py-4">
                                    <span className="text-sm font-black text-emerald-600">₹{req.amount?.toFixed(2)}</span>
                                 </td>
                                 <td className="px-6 py-4">
                                    <span className="text-xs font-mono font-bold text-slate-600">{req.utrNumber}</span>
                                 </td>
                                 <td className="px-6 py-4">
                                    {req.status === 'PENDING' && <span className="inline-flex items-center gap-1 text-[10px] font-black uppercase tracking-widest text-amber-600 bg-amber-50 px-2 py-1 rounded border border-amber-200"><Clock size={12} /> Pending</span>}
                                    {req.status === 'APPROVED' && <span className="inline-flex items-center gap-1 text-[10px] font-black uppercase tracking-widest text-emerald-600 bg-emerald-50 px-2 py-1 rounded border border-emerald-200"><CheckCircle size={12} /> Approved</span>}
                                    {req.status === 'REJECTED' && <span className="inline-flex items-center gap-1 text-[10px] font-black uppercase tracking-widest text-rose-600 bg-rose-50 px-2 py-1 rounded border border-rose-200"><XCircle size={12} /> Rejected</span>}
                                 </td>
                                 <td className="px-6 py-4">
                                    {req.status === 'PENDING' ? (
                                       <div className="flex gap-2">
                                          <button 
                                             onClick={() => handleUpdateStatus(req._id, 'APPROVED')}
                                             className="px-3 py-1.5 bg-emerald-500 hover:bg-emerald-600 text-white text-[10px] font-black uppercase tracking-widest rounded transition-colors shadow-sm"
                                          >
                                             Approve
                                          </button>
                                          <button 
                                             onClick={() => handleUpdateStatus(req._id, 'REJECTED')}
                                             className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200 text-[10px] font-black uppercase tracking-widest rounded transition-colors"
                                          >
                                             Reject
                                          </button>
                                       </div>
                                    ) : (
                                       <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Resolved</span>
                                    )}
                                 </td>
                              </tr>
                           ))
                        )}
                     </tbody>
                  </table>
               </div>
            </div>
         </div>
      </div>
   );
}

export default PaymentActivity;
