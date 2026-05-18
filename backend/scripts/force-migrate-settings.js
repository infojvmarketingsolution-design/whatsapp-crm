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
};

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
        
        doc.automation.aiPrompts.qualificationOptions = ['12th Pass (Bachelor Programs)', 'After Graduation (Master Programs)', 'Other'];
        
        // Ensure prdFlowSteps is seeded if empty or missing, otherwise map categoryMessage
        if (!doc.automation.aiPrompts.prdFlowSteps || doc.automation.aiPrompts.prdFlowSteps.length === 0) {
           doc.automation.aiPrompts.prdFlowSteps = [
             { id: 'ask_name', type: 'NAME_CAPTURE', title: 'Greeting & Name Request', message: 'Welcome to Gandhinagar University 🎓\n\nWe’re excited to help you choose the right career path.\n\nMay I know your name?', image: 'https://wapipulse.com/uploads/prompts/tenant_demo_001/prompt_1774743344804.jpeg' },
             { id: 'qualification', type: 'QUALIFICATION', title: 'Qualification Request', message: 'Nice to meet you {{name}} 😊\n\nPlease select your qualification.' },
             { id: 'program', type: 'PROGRAM_SELECTION', title: 'Program Selection', message: 'Please select your preferred program category.', categoryMessage: 'Please select program category.' },
             { id: 'call_time', type: 'CALL_TIME', title: 'Consultation Call', message: 'Excellent choice 🚀\n\nWhen should our counselor contact you?', buttons: ['Morning', 'Afternoon', 'Evening'] },
             { id: 'thank_you', type: 'CUSTOM_MESSAGE', title: 'Thank You Message', message: 'Thank you {{name}} 🙌\n\n🎓 Qualification: {{qualification}}\n📘 Program: {{program}}\n⏰ Time: {{time}}\n\nOur counselor will call you at your preferred time 📞\n\nThank you for your time, {{name}} 😊' }
           ];
        } else {
           doc.automation.aiPrompts.prdFlowSteps = doc.automation.aiPrompts.prdFlowSteps.map(s => {
              if (s.type === 'PROGRAM_SELECTION' && !s.categoryMessage) {
                 return { ...s, categoryMessage: 'Please select program category.' };
              }
              return s;
           });
        }
        doc.automation.aiPrompts.programMap = DEFAULT_PROGRAM_MAP;
        doc.markModified('automation.aiPrompts.prdFlowSteps');
        
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
