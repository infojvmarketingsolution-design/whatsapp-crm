const path = require('path');
const dotenv = require('dotenv');
dotenv.config({ path: path.join(__dirname, '../.env') });

const mongoose = require('mongoose');
const Settings = require('../src/models/core/Settings');

async function checkSettings() {
  console.log("URI:", process.env.CORE_DB_URI);
  if (!process.env.CORE_DB_URI) {
     console.error("CORE_DB_URI is undefined!");
     process.exit(1);
  }
  await mongoose.connect(process.env.CORE_DB_URI);
  const settings = await Settings.find({});
  for (const s of settings) {
     console.log(`Tenant: \${s.tenantId}`);
     if (s.automation && s.automation.aiPrompts) {
          console.log("Qualifications:", s.automation.aiPrompts.qualificationOptions);
          console.log("ProgramMap:", JSON.stringify(s.automation.aiPrompts.programMap, null, 2));
     } else {
          console.log("No automation or aiPrompts found.");
     }
  }
  process.exit(0);
}
checkSettings();
