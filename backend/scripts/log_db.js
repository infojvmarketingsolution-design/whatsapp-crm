const mongoose = require('mongoose');
require('dotenv').config({ path: __dirname + '/../.env' });
const Settings = require('../src/models/core/Settings');

async function run() {
  await mongoose.connect(process.env.CORE_DB_URI);
  const settings = await Settings.findOne({});
  console.log("----- STEPS DUMP -----");
  settings.automation.aiPrompts.prdFlowSteps.forEach(s => {
    console.log(`ID: ${s.id}, TYPE: ${s.type}, MSG: ${s.message || s.text}`);
  });
  console.log("----- QUAL OPTIONS -----");
  console.log(settings.automation.aiPrompts.qualificationOptions);
  console.log("----- PROGRAM MAP KEYS -----");
  console.log(Object.keys(settings.automation.aiPrompts.programMap));
  process.exit(0);
}
run();
