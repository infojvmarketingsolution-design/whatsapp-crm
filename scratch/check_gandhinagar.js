const mongoose = require('mongoose');
const { getTenantConnection } = require('./backend/src/config/db');
require('dotenv').config({ path: './backend/.env' });

async function checkGandhinagar() {
  await mongoose.connect(process.env.MONGODB_URI);
  const Settings = require('./backend/src/models/core/Settings');
  
  // Search for tenants that might be Gandhinagar University
  const allSettings = await Settings.find({});
  console.log("Tenants found:", allSettings.length);
  
  for (const s of allSettings) {
    console.log(`Tenant: ${s.tenantId} | Name: ${s.organizationName}`);
    if (s.organizationName?.toLowerCase().includes('gandhinagar')) {
       console.log(`\n[MATCH] Found Gandhinagar University Tenant: ${s.tenantId}`);
       console.log("Program Map:", JSON.stringify(s.automation?.aiPrompts?.programMap, null, 2));
    }
  }
  
  process.exit(0);
}

checkGandhinagar();
