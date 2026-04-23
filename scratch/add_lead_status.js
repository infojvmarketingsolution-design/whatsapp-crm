
const fs = require('fs');
const path = require('path');

const filePath = path.resolve(__dirname, '../frontend/src/pages/Contacts.jsx');
let content = fs.readFileSync(filePath, 'utf8');

// The Lead Status options from the schema
const STATUS_OPTIONS = ['NEW LEAD', 'CONTACTED', 'INTERESTED', 'FOLLOW_UP', 'CLOSED_WON', 'CLOSED_LOST'];

// Insert the Status dropdown into the Identity section of the sidebar
const identitySectionHeader = '<h3 className="text-[11px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100 pb-3 flex items-center">';
const statusDropdown = `                     <div className="space-y-6">
                        <h3 className="text-[11px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100 pb-3 flex items-center">
                           <TrendingUp size={14} className="mr-2" /> Lifecycle Status
                        </h3>
                        <div className="space-y-1.5">
                           <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Lead Status</label>
                           <select 
                              value={editedContact.status || 'NEW LEAD'} 
                              onChange={e=>handleFieldChange('status', e.target.value)}
                              className="w-full bg-transparent border-b border-slate-100 py-1.5 text-sm font-bold text-slate-800 outline-none cursor-pointer"
                           >
                              {['NEW LEAD', 'CONTACTED', 'INTERESTED', 'FOLLOW_UP', 'CLOSED_WON', 'CLOSED_LOST'].map(s => <option key={s} value={s}>{s}</option>)}
                           </select>
                        </div>
                     </div>\n\n`;

if (content.includes(identitySectionHeader)) {
    // Insert before the Identity section
    content = content.replace(identitySectionHeader, statusDropdown + identitySectionHeader);
    fs.writeFileSync(filePath, content);
    console.log('Lead Status field added to sidebar.');
} else {
    console.log('Target location not found.');
}
