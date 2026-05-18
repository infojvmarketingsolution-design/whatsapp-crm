const mongoose = require('mongoose');
const dotenv = require('dotenv');
dotenv.config();
const SettingsSchema = require('../src/models/core/Settings');

const DEFAULT_PROGRAM_MAP = {
  "12th Pass": {
    "Trending Programs": [
      "B.Voc Cyber Security",
      "B.Voc Fintech",
      "B.Sc IT Ai & ML",
      "B.Sc IT Data Analytics"
    ],
    "Traditional Programs": [
      "B.Com",
      "B.Tech",
      "BBA"
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
}};

async function forceUpdate() {
    const coreUri = process.env.CORE_DB_URI || 'mongodb://127.0.0.1:27017/jv_cloud_crm_core';
    console.log("Connecting to:", coreUri);
    
    await mongoose.connect(coreUri);
    const Settings = mongoose.model('Settings', SettingsSchema.schema || SettingsSchema);
    
    const allDocs = await Settings.find({});
    console.log(`Found ${allDocs.length} settings documents.`);
    
    for (let doc of allDocs) {
        if (!doc.automation) doc.automation = {};
        if (!doc.automation.aiPrompts) doc.automation.aiPrompts = {};
        
        doc.automation.aiPrompts.qualificationOptions = ['12th Pass', 'Graduation', 'Other'];
        
        // Ensure PROGRAM_SELECTION step has a categoryMessage field
        if (doc.automation.aiPrompts.prdFlowSteps) {
           doc.automation.aiPrompts.prdFlowSteps = doc.automation.aiPrompts.prdFlowSteps.map(s => {
              if (s.type === 'PROGRAM_SELECTION' && !s.categoryMessage) {
                 return { ...s, categoryMessage: 'Please select program category.' };
              }
              return s;
           });
        }
        doc.automation.aiPrompts.programMap = DEFAULT_PROGRAM_MAP;
        
        doc.markModified('automation');
        doc.markModified('automation.aiPrompts');
        doc.markModified('automation.aiPrompts.qualificationOptions');
        doc.markModified('automation.aiPrompts.programMap');
        
        await doc.save();
        console.log(`Updated tenant settings for: ${doc.tenantId}`);
    }
    console.log("FORCE UPDATED! ALL TENANT SETTINGS RE-CONFIGURED.");
    process.exit(0);
}
forceUpdate().catch(console.error);
