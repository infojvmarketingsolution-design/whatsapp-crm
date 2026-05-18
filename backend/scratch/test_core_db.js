const path = require('path');
const dotenv = require('dotenv');
dotenv.config({ path: path.join(__dirname, '../.env') });

const { connectCoreDB } = require('../src/config/db');
const Settings = require('../src/models/core/Settings');

async function run() {
  try {
    await connectCoreDB();
    console.log("Connected successfully using db.js logic");
    
    const settings = await Settings.findOne({ tenantId: 'tenant_demo_001' });
    if (settings) {
      console.log("Found settings for tenant_demo_001");
      console.log("PrdFlowSteps:", JSON.stringify(settings.automation?.aiPrompts?.prdFlowSteps, null, 2));
    } else {
      console.log("Settings for tenant_demo_001 not found.");
    }
  } catch (err) {
    console.error("Error:", err);
  }
  process.exit(0);
}

run();
