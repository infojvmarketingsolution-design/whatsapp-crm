const path = require('path');
const dotenv = require('dotenv');
dotenv.config({ path: path.join(__dirname, '../.env') });

const mongoose = require('mongoose');
const Settings = require('../src/models/core/Settings');

async function checkGandhinagarSettings() {
  console.log("Connecting to CORE_DB_URI:", process.env.CORE_DB_URI || process.env.MONGODB_URI);
  await mongoose.connect(process.env.CORE_DB_URI || process.env.MONGODB_URI);
  
  const allSettings = await Settings.find({});
  const gandhinagar = allSettings.find(s => s.tenantId === 'tenant_demo_001');
  
  if (gandhinagar) {
     console.log(`\n[FOUND] Tenant: ${gandhinagar.tenantId}`);
     console.log("Bot Mode:", gandhinagar.automation?.botMode);
     console.log("Bot Enabled:", gandhinagar.automation?.botEnabled);
     console.log("PrdFlowSteps:", JSON.stringify(gandhinagar.automation?.aiPrompts?.prdFlowSteps, null, 2));
  } else {
     console.log("tenant_demo_001 settings not found.");
  }
  
  process.exit(0);
}

checkGandhinagarSettings();
