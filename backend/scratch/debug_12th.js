const mongoose = require('mongoose');
const { getTenantConnection } = require('./backend/src/config/db');
require('dotenv').config({ path: './backend/.env' });

async function debug12thPass() {
  await mongoose.connect(process.env.CORE_DB_URI);
  const Settings = mongoose.model('Settings', new mongoose.Schema({
    tenantId: String,
    organizationName: String,
    automation: Object
  }, { collection: 'settings' }));
  
  const gandhinagar = await Settings.findOne({ organizationName: /Gandhinagar/i });
  if (gandhinagar) {
     console.log(`\n[DEBUG] Tenant: ${gandhinagar.tenantId}`);
     const programMap = gandhinagar.automation?.aiPrompts?.programMap || {};
     console.log("Program Map Keys:", Object.keys(programMap));
     
     for (const k of Object.keys(programMap)) {
        console.log(`\nKey: "${k}"`);
        console.log("Categories:", Object.keys(programMap[k]));
     }
  } else {
     console.log("Gandhinagar tenant not found.");
  }
  process.exit(0);
}

debug12thPass();
