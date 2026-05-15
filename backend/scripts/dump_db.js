const fs = require('fs');
const mongoose = require('mongoose');
require('dotenv').config({ path: __dirname + '/../.env' });
const Settings = require('../src/models/core/Settings');

async function run() {
  await mongoose.connect(process.env.CORE_DB_URI);
  const settings = await Settings.findOne({});
  fs.writeFileSync('C:/Users/ASUS/.gemini/antigravity/brain/b998401f-2e6c-4003-8f00-584bde32c2ab/scratch/db_output.txt', JSON.stringify({
    programMap: settings.automation.aiPrompts.programMap,
    steps: settings.automation.aiPrompts.prdFlowSteps,
    options: settings.automation.aiPrompts.qualificationOptions
  }, null, 2));
  console.log("DONE");
  process.exit(0);
}
run();
