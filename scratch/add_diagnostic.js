
const fs = require('fs');
const path = require('path');

const filePath = path.resolve(__dirname, '../frontend/src/pages/Contacts.jsx');
let content = fs.readFileSync(filePath, 'utf8');

const targetHeader = '<h2 className="text-2xl font-black text-slate-800 tracking-tight">Contact Workspace</h2>';
const diagnosticHeader = '<div className="flex flex-col">' +
                  '<h2 className="text-2xl font-black text-slate-800 tracking-tight">Contact Workspace</h2>' +
                  '<div className="flex items-center space-x-2 mt-1">' +
                     '<div className="w-1.5 h-1.5 rounded-full bg-teal-500"></div>' +
                     '<p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">' +
                        'Server: {contacts.length} Leads | Filtered: {filteredContacts.length} Visible' +
                     '</p>' +
                  '</div>' +
               '</div>';

if (content.includes(targetHeader)) {
    content = content.replace(targetHeader, diagnosticHeader);
    fs.writeFileSync(filePath, content);
    console.log('Diagnostic header added.');
} else {
    console.log('Could not find Contact Workspace header.');
}
