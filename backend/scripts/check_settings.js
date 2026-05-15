const mongoose = require('mongoose');
const { getTenantConnection } = require('../src/config/db');
const Settings = require('../src/models/core/Settings');
require('dotenv').config({ path: '../.env' });

async function checkSettings() {
  await mongoose.connect(process.env.MONGODB_URI);
  const settings = await Settings.find({});
  for (const s of settings) {
     console.log(`Tenant: ${s.tenantId}`);
     if (s.automation && s.automation.aiPrompts && s.automation.aiPrompts.programMap) {
         console.log(JSON.stringify(s.automation.aiPrompts.programMap, null, 2));
     } else {
         console.log("No custom programMap found.");
     }
  }
  process.exit(0);
}
checkSettings();
