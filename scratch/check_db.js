const mongoose = require('mongoose');
const { getTenantConnection } = require('./backend/src/config/db');
const Settings = require('./backend/src/models/core/Settings');
require('dotenv').config({ path: './backend/.env' });

async function check() {
  await mongoose.connect(process.env.MONGODB_URI);
  const settings = await Settings.findOne({});
  console.log("Program Map:");
  console.log(JSON.stringify(settings.automation.aiPrompts.programMap, null, 2));
  console.log("\nFlow Steps:");
  const steps = settings.automation.aiPrompts.prdFlowSteps;
  if (!steps) {
    console.log("No custom steps, using default");
  } else {
    steps.forEach(s => {
      console.log(`- ${s.id} (${s.type})`);
    });
  }
  process.exit(0);
}
check();
