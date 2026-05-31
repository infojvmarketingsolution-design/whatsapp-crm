import React, { useState, useEffect } from 'react';
import { IndianRupee, CheckCircle, XCircle, Clock, Search, Edit2, Users, PieChart, TrendingUp, Wallet, X } from 'lucide-react';

function PaymentActivity() {
   const [requests, setRequests] = useState([]);
   const [stats, setStats] = useState(null);
   const [loading, setLoading] = useState(true);
   const [showEditModal, setShowEditModal] = useState(false);
   const [editingClient, setEditingClient] = useState(null);
   const [newWalletBalance, setNewWalletBalance] = useState('');

   useEffect(() => {
      fetchRequests();
      fetchStats();
   }, []);

   const fetchRequests = async () => {
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
      }
   };

   const fetchStats = async () => {
      setLoading(true);
      try {
         const token = localStorage.getItem('token');
         const res = await fetch('/api/payments/admin/dashboard', {
            headers: { 'Authorization': `Bearer ${token}` }
         });
         if (res.ok) {
            const data = await res.json();
            setStats(data);
         }
      } catch (err) {
         console.error('Error fetching dashboard stats', err);
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
            fetchStats(); // Update stats
         } else {
            alert('Failed to update request');
         }
      } catch (err) {
         console.error('Error updating request', err);
      }
   };

   const handleEditBudget = (client) => {
      setEditingClient(client);
      setNewWalletBalance(client.walletBalance?.toString() || '0');
      setShowEditModal(true);
   };

   const submitBudgetEdit = async (e) => {
      e.preventDefault();
      try {
         const token = localStorage.getItem('token');
         const res = await fetch(`/api/clients/${editingClient._id}`, {
            method: 'PUT',
            headers: { 
               'Authorization': `Bearer ${token}`,
               'Content-Type': 'application/json'
            },
            body: JSON.stringify({ walletBalance: parseFloat(newWalletBalance) || 0 })
         });
         
         if (res.ok) {
            setShowEditModal(false);
            fetchStats(); // Refresh dashboard
         } else {
            alert('Failed to update client budget');
         }
      } catch (err) {
         console.error('Error updating budget', err);
      }
   };

   return (
      <div className="p-4 sm:p-8 min-h-full bg-slate-50">
         <div className="max-w-7xl mx-auto space-y-8">
            <div className="mb-4">
               <h1 className="text-2xl sm:text-3xl font-black text-slate-800 tracking-tight flex items-center gap-3">
                  <IndianRupee className="text-emerald-500" size={32} />
                  Campaign Payment Dashboard
               </h1>
               <p className="text-sm font-bold text-slate-500 mt-2">Global statistics, client budgets, and ad fund approvals.</p>
            </div>

            {/* Dashboard Stats */}
            {stats && (
               <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                  <div className="bg-white rounded-[1.5rem] p-6 shadow-sm border border-slate-200">
                     <div className="flex items-center gap-3 mb-2">
                        <div className="p-2.5 bg-blue-50 text-blue-600 rounded-xl"><Users size={20} /></div>
                        <h3 className="text-sm font-black text-slate-400 uppercase tracking-widest">Total Clients</h3>
                     </div>
                     <p className="text-3xl font-black text-slate-800">{stats.totalClients}</p>
                  </div>
                  
                  <div className="bg-white rounded-[1.5rem] p-6 shadow-sm border border-slate-200">
                     <div className="flex items-center gap-3 mb-2">
                        <div className="p-2.5 bg-emerald-50 text-emerald-600 rounded-xl"><TrendingUp size={20} /></div>
                        <h3 className="text-sm font-black text-slate-400 uppercase tracking-widest">Fund Added</h3>
                     </div>
                     <p className="text-3xl font-black text-emerald-600">₹{stats.totalFundAdded.toLocaleString()}</p>
                  </div>

                  <div className="bg-white rounded-[1.5rem] p-6 shadow-sm border border-slate-200">
                     <div className="flex items-center gap-3 mb-2">
                        <div className="p-2.5 bg-indigo-50 text-indigo-600 rounded-xl"><PieChart size={20} /></div>
                        <h3 className="text-sm font-black text-slate-400 uppercase tracking-widest">Fund Utilized</h3>
                     </div>
                     <p className="text-3xl font-black text-indigo-600">₹{stats.totalFundUtilized.toLocaleString()}</p>
                  </div>

                  <div className="bg-white rounded-[1.5rem] p-6 shadow-sm border border-slate-200">
                     <div className="flex items-center gap-3 mb-2">
                        <div className="p-2.5 bg-amber-50 text-amber-600 rounded-xl"><Wallet size={20} /></div>
                        <h3 className="text-sm font-black text-slate-400 uppercase tracking-widest">Unused Fund</h3>
                     </div>
                     <p className="text-3xl font-black text-amber-600">₹{stats.totalUnusedFund.toLocaleString()}</p>
                  </div>
               </div>
            )}

            {/* Client Details Table */}
            <div className="bg-white rounded-[2rem] shadow-sm border border-slate-200 overflow-hidden">
               <div className="p-6 border-b border-slate-100 bg-slate-50/50">
                  <h2 className="text-lg font-black text-slate-800">Client Budgets & Details</h2>
               </div>
               <div className="overflow-x-auto">
                  <table className="w-full text-left">
                     <thead>
                        <tr className="bg-slate-50 border-b border-slate-100">
                           <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Client Name</th>
                           <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Billing Mode</th>
                           <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Total Messages</th>
                           <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Fund Added</th>
                           <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Wallet Balance</th>
                           <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Actions</th>
                        </tr>
                     </thead>
                     <tbody className="divide-y divide-slate-100">
                        {loading && !stats ? (
                           <tr><td colSpan="6" className="text-center py-8 text-slate-400">Loading...</td></tr>
                        ) : stats?.clientDetails?.length === 0 ? (
                           <tr><td colSpan="6" className="text-center py-8 text-slate-400">No clients found</td></tr>
                        ) : (
                           stats?.clientDetails?.map(client => (
                              <tr key={client._id} className="hover:bg-slate-50">
                                 <td className="px-6 py-4">
                                    <p className="text-sm font-black text-slate-800">{client.name}</p>
                                 </td>
                                 <td className="px-6 py-4">
                                    <span className={`px-2 py-1 rounded-md text-[10px] font-bold uppercase ${
                                       client.billingMode === 'MANUAL' ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700'
                                    }`}>
                                       {client.billingMode}
                                    </span>
                                 </td>
                                 <td className="px-6 py-4">
                                    <span className="text-sm font-bold text-slate-600">{client.totalMessages.toLocaleString()}</span>
                                 </td>
                                 <td className="px-6 py-4">
                                    <span className="text-sm font-bold text-slate-700">₹{client.totalFundAdded.toLocaleString()}</span>
                                 </td>
                                 <td className="px-6 py-4">
                                    <span className="text-sm font-black text-indigo-600">₹{client.walletBalance.toLocaleString()}</span>
                                 </td>
                                 <td className="px-6 py-4 text-right">
                                    <button 
                                       onClick={() => handleEditBudget(client)}
                                       className="inline-flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-lg transition-colors"
                                    >
                                       <Edit2 size={14} /> Edit Budget
                                    </button>
                                 </td>
                              </tr>
                           ))
                        )}
                     </tbody>
                  </table>
               </div>
            </div>

            {/* Payment Activity History */}
            <div className="bg-white rounded-[2rem] shadow-sm border border-slate-200 overflow-hidden">
               <div className="p-6 border-b border-slate-100 bg-slate-50/50">
                  <h2 className="text-lg font-black text-slate-800">Pending & Historical Requests</h2>
               </div>
               <div className="overflow-x-auto">
                  <table className="w-full text-left">
                     <thead>
                        <tr className="bg-slate-50 border-b border-slate-100">
                           <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Client Name</th>
                           <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Messages Qty</th>
                           <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Amount (₹)</th>
                           <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">UTR / Reference</th>
                           <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Date & Time</th>
                           <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Status</th>
                           <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Actions</th>
                        </tr>
                     </thead>
                     <tbody className="divide-y divide-slate-100">
                        {loading && requests.length === 0 ? (
                           <tr>
                              <td colSpan="7" className="text-center py-10 text-slate-500 font-bold">Loading requests...</td>
                           </tr>
                        ) : requests.length === 0 ? (
                           <tr>
                              <td colSpan="7" className="text-center py-10 text-slate-500 font-bold">No payment requests found.</td>
                           </tr>
                        ) : (
                           requests.map((req) => (
                              <tr key={req._id} className="hover:bg-slate-50 transition-colors">
                                 <td className="px-6 py-4">
                                    <p className="text-sm font-black text-slate-800">{req.clientId?.companyName || 'Unknown Client'}</p>
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
                                    <span className="text-xs font-bold text-slate-500">
                                       {new Date(req.createdAt).toLocaleString()}
                                    </span>
                                 </td>
                                 <td className="px-6 py-4">
                                    {req.status === 'PENDING' && <span className="inline-flex items-center gap-1 text-[10px] font-black uppercase tracking-widest text-amber-600 bg-amber-50 px-2 py-1 rounded border border-amber-200"><Clock size={12} /> Pending</span>}
                                    {req.status === 'APPROVED' && <span className="inline-flex items-center gap-1 text-[10px] font-black uppercase tracking-widest text-emerald-600 bg-emerald-50 px-2 py-1 rounded border border-emerald-200"><CheckCircle size={12} /> Approved</span>}
                                    {req.status === 'REJECTED' && <span className="inline-flex items-center gap-1 text-[10px] font-black uppercase tracking-widest text-rose-600 bg-rose-50 px-2 py-1 rounded border border-rose-200"><XCircle size={12} /> Rejected</span>}
                                 </td>
                                 <td className="px-6 py-4 text-right">
                                    {req.status === 'PENDING' ? (
                                       <div className="flex justify-end gap-2">
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

         {/* Edit Budget Modal */}
         {showEditModal && editingClient && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
               <div className="bg-white rounded-[2rem] shadow-2xl w-full max-w-md overflow-hidden">
                  <div className="flex justify-between items-center p-6 border-b border-slate-100">
                     <h2 className="text-xl font-black text-slate-800">Edit Client Budget</h2>
                     <button onClick={() => setShowEditModal(false)} className="text-slate-400 hover:text-slate-600">
                        <X size={24} />
                     </button>
                  </div>
                  <form onSubmit={submitBudgetEdit} className="p-6 space-y-6">
                     <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Client Name</label>
                        <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-700">
                           {editingClient.name}
                        </div>
                     </div>
                     <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Wallet Balance (₹)</label>
                        <input 
                           type="number" 
                           step="0.01"
                           value={newWalletBalance}
                           onChange={(e) => setNewWalletBalance(e.target.value)}
                           className="w-full p-3 bg-white border border-slate-200 rounded-xl text-lg font-black text-indigo-600 focus:ring-2 focus:ring-blue-500 outline-none"
                           required
                        />
                        <p className="text-xs text-slate-400 mt-2 font-bold">You can forcefully set the wallet balance to 0 or any other number here.</p>
                     </div>
                     <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                        <button 
                           type="button"
                           onClick={() => setShowEditModal(false)}
                           className="px-5 py-2.5 text-sm font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors"
                        >
                           Cancel
                        </button>
                        <button 
                           type="submit"
                           className="px-5 py-2.5 text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-lg shadow-blue-200 transition-all"
                        >
                           Save Budget
                        </button>
                     </div>
                  </form>
               </div>
            </div>
         )}
      </div>
   );
}

export default PaymentActivity;
