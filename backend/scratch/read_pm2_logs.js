const fs = require('fs');
const path = require('path');
const os = require('os');

function readLogs() {
   const logDir = path.join(os.homedir(), '.pm2', 'logs');
   console.log('PM2 Log Dir:', logDir);
   if (!fs.existsSync(logDir)) {
      console.log('Log directory does not exist!');
      return;
   }
   
   const files = fs.readdirSync(logDir);
   console.log('Files in log dir:', files);
   
   const errFile = files.find(f => f.includes('whatsapp-crm-backend') && f.includes('error'));
   const outFile = files.find(f => f.includes('whatsapp-crm-backend') && f.includes('out'));
   
   if (errFile) {
      console.log('\n--- ERROR LOGS (Last 50 Lines) ---');
      const content = fs.readFileSync(path.join(logDir, errFile), 'utf8');
      const lines = content.split('\n');
      console.log(lines.slice(-50).join('\n'));
   }
   if (outFile) {
      console.log('\n--- OUT LOGS (Last 50 Lines) ---');
      const content = fs.readFileSync(path.join(logDir, outFile), 'utf8');
      const lines = content.split('\n');
      console.log(lines.slice(-50).join('\n'));
   }
}
readLogs();
