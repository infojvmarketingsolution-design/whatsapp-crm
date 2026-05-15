const mongoose = require('mongoose');
require('dotenv').config({ path: __dirname + '/../backend/.env' });
const Settings = require('../backend/src/models/core/Settings');

async function check() {
  await mongoose.connect(process.env.MONGODB_URI);
  const settings = await Settings.findOne({});
  const aiPrompts = settings.automation.aiPrompts;
  console.log("=== QUALIFICATION OPTIONS ===");
  console.log(aiPrompts.qualificationOptions);
  console.log("\n=== FLOW STEPS ===");
  if (!aiPrompts.prdFlowSteps) console.log("Default steps");
  else aiPrompts.prdFlowSteps.forEach(s => console.log(`${s.type}: ${s.message.substring(0, 50).replace(/\n/g, ' ')}`));
  process.exit(0);
}
check();
