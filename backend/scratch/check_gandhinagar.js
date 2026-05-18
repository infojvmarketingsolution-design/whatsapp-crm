const mongoose = require('mongoose');
const dotenv = require('dotenv');
dotenv.config();
const SettingsSchema = require('../src/models/core/Settings');

async function checkDb() {
    const coreUri = process.env.CORE_DB_URI || 'mongodb://127.0.0.1:27017/jv_cloud_crm_core';
    await mongoose.connect(coreUri);
    const Settings = mongoose.model('Settings', SettingsSchema.schema || SettingsSchema);
    
    // Find all settings
    const docs = await Settings.find({});
    for (let doc of docs) {
       if (doc.tenantId.includes('gandhinagar')) {
          console.log(`Tenant: ${doc.tenantId}`);
          const greetingStep = doc.automation?.aiPrompts?.prdFlowSteps?.find(s => s.type === 'GREETING' || s.id === 'ask_name');
          console.log(`  Greeting Step Buttons:`, greetingStep?.buttons);
       }
    }
    process.exit(0);
}
checkDb().catch(console.error);
