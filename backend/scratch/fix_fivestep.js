require('dotenv').config();
const mongoose = require('mongoose');
const { connectCoreDB, getTenantConnection } = require('../src/config/db');

async function fix() {
  await connectCoreDB();
  const Settings = require('../src/models/core/Settings');
  const settings = await Settings.findOne({ tenantId: 'fivestep_599984' }).lean();
  
  if (settings) {
    console.log(JSON.stringify(settings.automation.aiPrompts.prdFlowSteps, null, 2));
    console.log("Program Map Keys:", Object.keys(settings.automation.aiPrompts.programMap || {}));
  } else {
    console.log("Tenant not found in Settings");
  }
  process.exit(0);
}

fix().catch(console.error);
