const mongoose = require('mongoose');
require('dotenv').config({ path: './backend/.env' });

async function readSteps() {
  await mongoose.connect(process.env.CORE_DB_URI);
  const Settings = mongoose.model('Settings', new mongoose.Schema({
    tenantId: String,
    organizationName: String,
    automation: Object
  }, { collection: 'settings' }));
  
  const gandhinagar = await Settings.findOne({ organizationName: /Gandhinagar/i });
  if (gandhinagar) {
     console.log(`\n[DEBUG] Tenant: ${gandhinagar.tenantId}`);
     const steps = gandhinagar.automation?.aiPrompts?.prdFlowSteps || [];
     console.log("Current Steps:", JSON.stringify(steps, null, 2));
  } else {
     console.log("Gandhinagar tenant not found.");
  }
  process.exit(0);
}

readSteps();
