
const fs = require('fs');
const path = require('path');

const filePath = path.resolve(__dirname, '../frontend/src/pages/Contacts.jsx');
let content = fs.readFileSync(filePath, 'utf8');

// 1. Add state for the brief
const oldStates = '  const [isAddingNote, setIsAddingNote] = useState(false);';
const newStates = `  const [isAddingNote, setIsAddingNote] = useState(false);
  const [isGeneratingBrief, setIsGeneratingBrief] = useState(false);
  const [strategicBrief, setStrategicBrief] = useState(null);`;

// 2. Add the generateBrief function
const addInternalNoteCode = '  const addInternalNote = async (contactId) => {';
const generateBriefFunc = `  const generateBrief = async (contactId) => {
    setIsGeneratingBrief(true);
    try {
      const token = localStorage.getItem('token');
      const tenantId = localStorage.getItem('tenantId');
      const res = await fetch(\`/api/chat/action\`, {
        method: 'POST',
        headers: { 'Authorization': \`Bearer \${token}\`, 'x-tenant-id': tenantId, 'Content-Type': 'application/json' },
        body: JSON.stringify({ contactId, action: 'generate_brief' })
      });
      if (res.ok) {
        const data = await res.json();
        setStrategicBrief(data.brief);
        toast.success("Intelligence Brief Generated!");
      }
    } catch (err) {
      console.error(err);
      toast.error("AI Brief generation failed");
    } finally {
      setIsGeneratingBrief(false);
    }
  };\n\n`;

// 3. Update the Strategic Notes UI
const oldInternalNotesUI = `{activeTab === 'internalnotes' && (
                           <div className="space-y-8">
                              <div className="space-y-4">
                                 <textarea`;

const newInternalNotesUI = `{activeTab === 'internalnotes' && (
                           <div className="space-y-10 animate-fade-in">
                              {/* AI STRATEGIC BRIEF SECTION */}
                              <div className="space-y-6">
                                 <div className="flex justify-between items-center">
                                    <h3 className="text-[11px] font-black text-slate-400 uppercase tracking-widest flex items-center">
                                       <Activity size={14} className="mr-2 text-teal-600" /> Strategic Intelligence
                                    </h3>
                                    {!strategicBrief && (
                                       <button 
                                         onClick={() => generateBrief(selectedContact._id)}
                                         disabled={isGeneratingBrief}
                                         className="px-6 py-2.5 bg-slate-900 text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg hover:bg-black transition-all flex items-center disabled:opacity-50"
                                       >
                                          {isGeneratingBrief ? <RefreshCw size={12} className="mr-2 animate-spin" /> : <Sparkles size={12} className="mr-2 text-teal-400" />}
                                          Generate AI Brief
                                       </button>
                                    )}
                                 </div>

                                 {strategicBrief ? (
                                    <div className="bg-white border border-teal-100 rounded-3xl overflow-hidden shadow-sm animate-pop-in">
                                       <div className="bg-teal-50/50 px-8 py-5 border-b border-teal-50 flex items-center justify-between">
                                          <span className="text-[10px] font-black text-teal-600 uppercase tracking-widest">Intelligence Report</span>
                                          <span className="px-3 py-1 bg-white border border-teal-100 rounded-lg text-[9px] font-black text-teal-700 uppercase">{strategicBrief.responseVelocity}</span>
                                       </div>
                                       <div className="p-8 space-y-8">
                                          <div className="grid grid-cols-2 gap-8">
                                             <div className="space-y-1">
                                                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Verified Identity</p>
                                                <p className="text-sm font-black text-slate-800">{strategicBrief.name || 'Not Mentioned'}</p>
                                             </div>
                                             <div className="space-y-1">
                                                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Last Qualification</p>
                                                <p className="text-sm font-black text-slate-800">{strategicBrief.qualification || 'Not Mentioned'}</p>
                                             </div>
                                             <div className="space-y-1">
                                                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Target Program</p>
                                                <p className="text-sm font-black text-slate-800 text-teal-600">{strategicBrief.program || 'Not Mentioned'}</p>
                                             </div>
                                             <div className="space-y-1">
                                                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Preferred Call</p>
                                                <p className="text-sm font-black text-slate-800">{strategicBrief.callTime || 'Not Mentioned'}</p>
                                             </div>
                                          </div>
                                          <div className="p-5 bg-slate-50 rounded-2xl border border-slate-100">
                                             <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-2">Conversation Narrative</p>
                                             <p className="text-sm font-bold text-slate-700 leading-relaxed italic">"{strategicBrief.summary}"</p>
                                          </div>
                                          <button 
                                             onClick={() => setStrategicBrief(null)} 
                                             className="text-[10px] font-black text-slate-300 uppercase tracking-widest hover:text-teal-600 transition-colors"
                                          >
                                             Re-Generate Analysis
                                          </button>
                                       </div>
                                    </div>
                                 ) : (
                                    <div className="p-12 border-2 border-dashed border-slate-100 rounded-[2.5rem] text-center space-y-3">
                                       <p className="text-[11px] font-black text-slate-300 uppercase tracking-widest">Intelligence Waiting</p>
                                       <p className="text-xs font-bold text-slate-400">Click generate to scan the conversation for insights.</p>
                                    </div>
                                 )}
                              </div>

                              <div className="space-y-4">
                                 <h3 className="text-[11px] font-black text-slate-400 uppercase tracking-widest flex items-center">
                                    <Edit3 size={14} className="mr-2" /> Manual Field Notes
                                 </h3>
                                 <textarea`;

if (content.includes(oldStates)) {
    content = content.replace(oldStates, newStates);
}
if (content.includes(addInternalNoteCode)) {
    content = content.replace(addInternalNoteCode, generateBriefFunc + addInternalNoteCode);
}
if (content.includes(oldInternalNotesUI)) {
    content = content.replace(oldInternalNotesUI, newInternalNotesUI);
}

fs.writeFileSync(filePath, content);
console.log('Contacts UI updated with Strategic Brief features.');
