const mongoose = require('mongoose');
const path = require('path');
const dotenv = require('dotenv');

// Load environment variables from backend/.env
dotenv.config({ path: path.join(__dirname, '../.env') });

const Settings = require('../src/models/core/Settings');

async function inspect() {
  const uri = process.env.CORE_DB_URI || process.env.MONGODB_URI;
  console.log("Connecting to MongoDB:", uri);
  if (!uri) {
    console.error("Error: MONGODB_URI/CORE_DB_URI is undefined!");
    process.exit(1);
  }
  await mongoose.connect(uri);
  
  const allSettings = await Settings.find({});
  console.log(`Found ${allSettings.length} settings records.`);
  
  for (const s of allSettings) {
    console.log(`\n=========================================`);
    console.log(`Tenant ID: ${s.tenantId}`);
    console.log(`Bot Mode: ${s.automation?.botMode}`);
    console.log(`Bot Enabled: ${s.automation?.botEnabled}`);
    console.log(`PrdFlowSteps:`);
    console.log(JSON.stringify(s.automation?.aiPrompts?.prdFlowSteps, null, 2));
  }
  
  process.exit(0);
}

inspect().catch(err => {
  console.error("Inspection error:", err);
  process.exit(1);
});
