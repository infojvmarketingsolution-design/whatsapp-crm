const mongoose = require('mongoose');
require('dotenv').config();

async function checkTenants() {
  await mongoose.connect(process.env.CORE_DB_URI);
  const Settings = mongoose.model('Settings', new mongoose.Schema({
    tenantId: String,
    organizationName: String,
    automation: Object
  }, { collection: 'settings' }));
  
  const allSettings = await Settings.find({});
  console.log(`Found ${allSettings.length} tenants.`);
  
  for (const s of allSettings) {
    console.log(`--- Tenant: ${s.tenantId} | Org: ${s.organizationName} ---`);
    console.log(`Bot Mode: ${s.automation?.botMode}`);
    console.log(`Bot Enabled: ${s.automation?.botEnabled}`);
    const prompts = s.automation?.aiPrompts || {};
    console.log(`Qual Options: ${JSON.stringify(prompts.qualificationOptions)}`);
    console.log(`Program Map Keys: ${Object.keys(prompts.programMap || {})}`);
  }
  
  process.exit(0);
}

checkTenants();
