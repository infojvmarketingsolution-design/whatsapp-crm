
const fs = require('fs');
const path = require('path');

const filePath = path.resolve(__dirname, '../frontend/src/pages/Contacts.jsx');
let content = fs.readFileSync(filePath, 'utf8');

// 1. Remove Geography and Email sections from the UI
// Look for the "Core Identity" section
const identitySectionRegex = /\{\/\* SECTION: Core Identity \*\/\}[\s\S]+?Geography[\s\S]+?<\/div>[\s\S]+?<\/div>[\s\S]+?<\/section>/i;
const identityReplacement = `{/* SECTION: CORE IDENTITY */}
                    <section className="space-y-6">
                       <h3 className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em] flex items-center">
                          <Users size={14} className="mr-2 text-slate-300" /> Core Identity
                       </h3>
                       <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-premium space-y-6">
                            <div className="grid grid-cols-2 gap-5">
                                <div className="space-y-2">
                                   <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block ml-1">First Name</label>
                                   <input 
                                     value={editedContact.firstName || editedContact.name || ''} 
                                     onChange={e=>handleFieldChange('firstName', e.target.value)} 
                                     className="w-full text-xs font-bold text-slate-700 bg-[#f9fafb] border border-slate-100 rounded-xl px-4 py-3 outline-none focus:border-blue-300/50 transition-all" 
                                   />
                                </div>
                                <div className="space-y-2">
                                   <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block ml-1">Last Name</label>
                                   <input 
                                     value={editedContact.lastName || ''} 
                                     onChange={e=>handleFieldChange('lastName', e.target.value)} 
                                     className="w-full text-xs font-bold text-slate-700 bg-[#f9fafb] border border-slate-100 rounded-xl px-4 py-3 outline-none focus:border-blue-300/50 transition-all" 
                                   />
                                </div>
                            </div>
                            
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block ml-1">Communication Channels</label>
                                <div className="w-full text-xs font-bold text-slate-500 bg-slate-50 border border-slate-100 rounded-xl px-4 py-3 flex items-center justify-between">
                                   <div className="flex items-center"><Phone size={14} className="mr-3 text-teal-500" /> {editedContact.phone}</div>
                                   <span className="text-[9px] font-black text-teal-600 bg-teal-50 px-2 py-0.5 rounded uppercase">Verified</span>
                                </div>
                            </div>
                       </div>
                    </section>`;

if (identitySectionRegex.test(content)) {
    content = content.replace(identitySectionRegex, identityReplacement);
    console.log('Identity section simplified.');
} else {
    console.log('Identity regex failed.');
}

fs.writeFileSync(filePath, content);
console.log('Profile simplification update complete.');
