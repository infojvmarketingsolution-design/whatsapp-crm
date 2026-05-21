require('dotenv').config();
const mongoose = require('mongoose');

async function run() {
    const uri = process.env.CORE_DB_URI || 'mongodb://127.0.0.1:27017/crm_core';
    await mongoose.connect(uri, { useNewUrlParser: true, useUnifiedTopology: true });
    
    const Tenant = mongoose.model('Tenant', new mongoose.Schema({}, { strict: false }));
    const TenantSettings = mongoose.model('TenantSettings', new mongoose.Schema({}, { strict: false }));
    
    const tenant = await Tenant.findOne({ name: /shreyarth/i });
    if (!tenant) {
        console.log('Tenant "shreyarth" not found');
        process.exit(0);
    }
    console.log('Found Tenant:', tenant.name, tenant._id);
    
    const settings = await TenantSettings.findOne({ tenantId: tenant._id });
    if (!settings) {
        console.log('Tenant settings not found');
        process.exit(0);
    }

    const programMap = {
      "12th Pass": {
        "Trending Programs": [
          "B.Sc. IT (Hons) Artificial Intelligence & Machine Learning",
          "B.Sc. IT (Hons) Data Analytics",
          "B.Voc. Cyber Security & Cloud Technology",
          "B.Voc. Fintech"
        ],
        "Traditional Programs": [
          "B.Com",
          "BBA",
          "B.Tech",
          "B.Sc"
        ]
      },
      "Graduation": {
        "Trending Programs": [
          "Cyber Security & Digital Forensics",
          "Cloud Automation",
          "Data Analytics",
          "Animation, VFX & Game Design",
          "Blockchain Technology",
          "Software & Mobile App Development"
        ],
        "Traditional Programs": [
          "M.Com",
          "MBA",
          "M.Tech",
          "M.Sc",
          "Other"
        ]
      }
    };

    if (!settings.automation) settings.automation = {};
    if (!settings.automation.aiPrompts) settings.automation.aiPrompts = {};
    
    await TenantSettings.updateOne(
        { tenantId: tenant._id }, 
        { $set: { 'automation.aiPrompts.programMap': programMap } }
    );
    
    console.log('Successfully updated AI Chatbot Dynamic Program Mapping for Shreyarth University');
    process.exit(0);
}

run().catch(err => {
    console.error(err);
    process.exit(1);
});
