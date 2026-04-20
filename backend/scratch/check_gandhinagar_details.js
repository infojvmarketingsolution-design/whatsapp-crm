const mongoose = require('mongoose');
const { getTenantConnection } = require('./backend/src/config/db');
require('dotenv').config({ path: './backend/.env' });

async function checkGandhinagarSettings() {
  await mongoose.connect(process.env.MONGODB_URI);
  const Settings = require('./backend/src/models/core/Settings');
  
  const targetPhone = '916359700606';
  
  // Find tenant by searching contacts across all tenants (this is slow but we only have a few)
  // Actually, let's just search Settings for "Gandhinagar"
  const allSettings = await Settings.find({});
  const gandhinagar = allSettings.find(s => s.organizationName?.toLowerCase().includes('gandhinagar'));
  
  if (gandhinagar) {
     console.log(`\n[FOUND] Tenant: ${gandhinagar.tenantId}`);
     console.log("Bot Mode:", gandhinagar.automation?.botMode);
     console.log("Bot Enabled:", gandhinagar.automation?.botEnabled);
     console.log("Program Map Keys:", Object.keys(gandhinagar.automation?.aiPrompts?.programMap || {}));
     console.log("Detailed Program Map:", JSON.stringify(gandhinagar.automation?.aiPrompts?.programMap, null, 2));
  } else {
     console.log("Gandhinagar tenant not found by name.");
  }
  
  process.exit(0);
}

checkGandhinagarSettings();
