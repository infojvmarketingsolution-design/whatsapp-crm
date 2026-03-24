import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, PlayCircle, Plus, ChevronDown, Download, Upload } from 'lucide-react';

export default function Contacts() {
  const navigate = useNavigate();
  const [contacts, setContacts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [newLeadName, setNewLeadName] = useState('');
  const [newLeadPhone, setNewLeadPhone] = useState('');

  const fetchContacts = async () => {
    try {
      const token = localStorage.getItem('token');
      const tenantId = localStorage.getItem('tenantId');
      if (!token) return;
      const res = await fetch('/api/chat/contacts', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'x-tenant-id': tenantId
        }
      });
      if (res.ok) {
         const data = await res.json();
         setContacts(data);
      }
    } catch (err) {
      console.error("Backend API unavailable.", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchContacts();
  }, []);

  const handleAddContact = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      const tenantId = localStorage.getItem('tenantId');
      const res = await fetch('/api/chat/contacts', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}`, 'x-tenant-id': tenantId, 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newLeadName, phone: newLeadPhone, source: 'Manual Entry' })
      });
      if (res.ok) {
        setShowAddModal(false);
        setNewLeadName('');
        setNewLeadPhone('');
        fetchContacts();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const filteredContacts = contacts.filter(c => 
    (c.name || '').toLowerCase().includes(searchTerm.toLowerCase()) || 
    (c.phone || '').includes(searchTerm)
  );

  const handleExport = () => {
    if (contacts.length === 0) return alert("No contacts available to export");
    
    const headers = ['Name', 'Mobile Number', 'Source', 'Tags'];
    const csvRows = [headers.join(',')];
    
    contacts.forEach(c => {
      const name = c.name ? `"${c.name.replace(/"/g, '""')}"` : '';
      const phone = c.phone || '';
      const source = c.source || 'CTWA Lead';
      const tags = (c.tags || ['AD']).join(';');
      csvRows.push([name, phone, source, tags].join(','));
    });
    
    const blob = new Blob([csvRows.join('\n')], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `contacts_export_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Need to trick grep syntax replacement bounds
  const x = async () => {
      try {
        const token = localStorage.getItem('token');
        const tenantId = localStorage.getItem('tenantId');
        if (!token) return;

        const res = await fetch('/api/chat/contacts', {
          headers: {
            'Authorization': `Bearer ${token}`,
            'x-tenant-id': tenantId
          }
        });
        
        if (res.ok) {
           const data = await res.json();
           setContacts(data);
        }
      } catch (err) {
        console.error("Backend API unavailable.", err);
      } finally {
        setLoading(false);
      }
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 min-h-full flex flex-col pt-10 px-10 relative overflow-hidden animate-fade-in">
      <div className="mb-8 relative z-10">
         <h1 className="text-3xl font-bold text-gray-800 tracking-tight">Contacts</h1>
         <p className="text-gray-400 mt-2 font-medium">Import contact, create audience & launch campaign, all from one place!</p>
         
         <div className="flex items-center space-x-6 mt-4 text-sm text-gray-500 font-medium">
            <div className="flex items-center space-x-2">
               <span className="w-4 h-4 rounded bg-[var(--theme-bg)] block"></span>
               <span>Import upto 2 lakh contacts in one go</span>
            </div>
            <button className="flex items-center space-x-2 hover:text-[var(--theme-text)] transition">
               <PlayCircle size={16} />
               <span>Watch Tutorial</span>
            </button>
         </div>
      </div>

      <div className="flex justify-between items-center mb-6 relative z-10 w-full max-w-5xl">
          <div className="relative w-80">
             <Search className="absolute left-3 top-2.5 text-gray-400" size={18} />
             <input 
               type="text" 
               value={searchTerm}
               onChange={(e) => setSearchTerm(e.target.value)}
               placeholder="Search name or mobile number" 
               className="w-full bg-gray-50 hover:bg-gray-100 border-none rounded-lg py-2 pl-10 pr-4 text-sm outline-none focus:ring-2 focus:ring-gray-200 transition-all font-medium text-gray-700 placeholder-gray-400"
             />
          </div>
          <div className="flex items-center space-x-3">
             <button onClick={() => navigate('/campaigns/create')} className="bg-[var(--theme-bg)] text-white px-5 py-2 rounded-lg text-sm font-semibold hover:bg-teal-900 transition shadow-[0_4px_10px_rgba(17,74,67,0.2)]">
                Broadcast
             </button>
             <button onClick={() => setShowAddModal(true)} className="flex items-center space-x-1 border border-brand-dark text-[var(--theme-text)] px-4 py-2 rounded-lg text-sm font-semibold hover:bg-teal-50 transition">
                <Plus size={16} className="text-[var(--theme-text)]" />
                <span>Add Contact</span>
             </button>
             <button onClick={() => alert('CSV Tooling connecting natively mapping payload in upcoming iterations!')} className="flex items-center space-x-1 border border-gray-300 text-gray-700 px-4 py-2 rounded-lg text-sm font-semibold hover:bg-gray-50 transition hover:border-brand-dark hover:text-[var(--theme-text)]">
                <Upload size={14} />
                <span>Import</span>
             </button>
             <button onClick={handleExport} className="flex items-center space-x-1 border border-gray-300 text-gray-700 px-4 py-2 rounded-lg text-sm font-semibold hover:bg-gray-50 transition hover:border-brand-dark hover:text-[var(--theme-text)]">
                <Download size={14} />
                <span>Export</span>
             </button>
          </div>
      </div>

      <div className="flex-1 w-full max-w-5xl overflow-y-auto custom-scrollbar">
        <div className="rounded-xl border border-gray-100 overflow-hidden shadow-[0_2px_15px_rgba(0,0,0,0.02)] mb-8">
          <table className="w-full text-left border-collapse">
             <thead>
               <tr className="border-b border-gray-100 bg-white">
                  <th className="py-4 px-6"><input type="checkbox" className="w-4 h-4 accent-brand-dark rounded" defaultChecked /></th>
                  <th className="py-4 px-6 text-sm font-semibold text-[var(--theme-text)]">Name</th>
                  <th className="py-4 px-6 text-sm font-semibold text-[var(--theme-text)]">Mobile Number</th>
                  <th className="py-4 px-6 text-sm font-semibold text-gray-400">Tags</th>
                  <th className="py-4 px-6 text-sm font-semibold text-gray-400">Source</th>
               </tr>
             </thead>
             <tbody>
               {filteredContacts.length === 0 && (
                 <tr>
                   <td colSpan="5" className="py-8 text-center text-gray-400 font-medium">
                     No contacts matched your search criteria.
                   </td>
                 </tr>
               )}
               {filteredContacts.map((c, i) => (
                 <tr key={c._id || i} className={i % 2 === 0 ? 'bg-[#fbfbfb]' : 'bg-white'}>
                   <td className="py-4 px-6"><input type="checkbox" className="w-4 h-4 accent-brand-dark rounded" /></td>
                   <td className="py-4 px-6 text-sm font-bold text-gray-800">{c.name}</td>
                   <td className="py-4 px-6 text-sm font-semibold text-gray-600">{c.phone}</td>
                   <td className="py-4 px-6">
                      <span className="px-3 py-1 bg-[#fff6d6] text-[#bda030] rounded border border-[#faebad] text-xs font-bold tracking-wide">
                        {c.source || 'CTWA Lead'}
                      </span>
                   </td>
                   <td className="py-4 px-6 text-[13px] font-bold text-gray-600">{c.tags?.[0] || 'AD'}</td>
                 </tr>
               ))}
             </tbody>
          </table>
        </div>
      </div>

      {/* Add Contact Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-sm animate-fade-in">
           <div className="bg-white p-7 rounded-3xl w-96 shadow-2xl animate-fade-in-up border border-gray-100">
              <h2 className="text-xl font-bold text-gray-800 mb-6">Add New Contact</h2>
              <form onSubmit={handleAddContact}>
                 <div className="space-y-4 mb-8">
                    <div>
                      <label className="text-[11px] font-bold text-gray-500 mb-1.5 block uppercase tracking-wide">Full Name</label>
                      <input type="text" value={newLeadName} onChange={e=>setNewLeadName(e.target.value)} required className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 outline-none focus:border-[var(--theme-border)] focus:ring-2 ring-brand-dark/20 text-sm font-medium text-gray-800 transition-all" placeholder="John Doe" />
                    </div>
                    <div>
                      <label className="text-[11px] font-bold text-gray-500 mb-1.5 block uppercase tracking-wide">Mobile Number</label>
                      <input type="tel" value={newLeadPhone} onChange={e=>setNewLeadPhone(e.target.value)} required className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 outline-none focus:border-[var(--theme-border)] focus:ring-2 ring-brand-dark/20 text-sm font-medium text-gray-800 transition-all" placeholder="+91 9876543210" />
                    </div>
                 </div>
                 <div className="flex justify-end space-x-3">
                    <button type="button" onClick={()=>setShowAddModal(false)} className="px-5 py-2.5 font-bold text-sm text-gray-500 hover:text-gray-800 hover:bg-gray-100 rounded-xl transition-colors">Cancel</button>
                    <button type="submit" className="px-5 py-2.5 font-bold text-sm text-white bg-[var(--theme-bg)] hover:bg-teal-900 rounded-xl transition-transform hover:scale-105 active:scale-95 shadow-[0_4px_10px_rgba(17,74,67,0.2)]">Create Lead</button>
                 </div>
              </form>
           </div>
        </div>
      )}
    </div>
  );
}
