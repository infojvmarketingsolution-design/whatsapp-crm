const mongoose = require('mongoose');
const dotenv = require('dotenv');
dotenv.config();
const SettingsSchema = require('./src/models/core/Settings');

const DEFAULT_PRD_FLOW_STEPS = [
  { id: 'greeting', type: 'messageNode', data: { msgType: 'IMAGE', text: 'Hello 👋 Welcome to JV Marketing Education Support!\n\nWe help you choose the best career path 🚀', mediaUrl: 'https://wapipulse.com/uploads/prompts/tenant_demo_001/prompt_1774743344804.jpeg' } },
  { id: 'ask_name', type: 'messageNode', data: { msgType: 'QUESTION', text: 'May I know your name?', variableName: 'name' } },
  { id: 'qualification', type: 'messageNode', data: { msgType: 'LIST_MESSAGE', text: 'Nice to meet you, {{name}} 😊\n\n{{name}}, please select your last qualification 👇', variableName: 'qualification', listOptions: ['10th Pass', '12th Pass', 'Diploma Completed', 'Graduation Completed', 'Master Completed'] } },
  { id: 'program', type: 'messageNode', data: { msgType: 'LIST_MESSAGE', text: 'Great choice {{name}}! 🎓\n\nHere are programs for you:', variableName: 'program', isProgramSelection: true } },
  { id: 'urgency', type: 'messageNode', data: { msgType: 'TEXT', text: '⚠️ Hurry {{name}}!\n\nOnly limited seats available 🚀\nAdmissions closing soon.' } },
  { id: 'scholarship', type: 'messageNode', data: { msgType: 'TEXT', text: '🎁 Good News {{name}}!\n\nYou may be eligible for up to 30% Scholarship 🎓' } },
  { id: 'social_proof', type: 'messageNode', data: { msgType: 'IMAGE', text: '🎉 Our students are already placed in top companies!\n\nYou could be next, {{name}} 🚀', isSuccessProof: true, mediaUrl: 'https://wapipulse.com/uploads/prompts/tenant_demo_001/prompt_1774743344804.jpeg' } },
  { id: 'call_time', type: 'messageNode', data: { msgType: 'INTERACTIVE', text: '{{name}}, when should our counsellor call you? 📞', variableName: 'time', buttons: ['Morning (10-1)', 'Afternoon (1-5)', 'Evening (5-8)'] } },
  { id: 'thank_you', type: 'messageNode', data: { msgType: 'TEXT', text: 'Thank you {{name}} 🙌\n\n🎓 Qualification: {{qualification}}\n📘 Program: {{program}}\n⏰ Time: {{time}}\n\nOur counsellor will call you at your preferred time 📞\n\nThank you for your time, {{name}} 😊' } },
  { id: 'additional_help', type: 'messageNode', data: { msgType: 'INTERACTIVE', text: 'May I help you with anything else?', variableName: 'additionalHelp', buttons: ['Yes', 'No'] } }
];

async function forceUpdate() {
    // FIX: Using the correct CORE database connection URI
    const coreUri = process.env.CORE_DB_URI || 'mongodb://127.0.0.1:27017/jv_cloud_crm_core';
    console.log("Connecting to:", coreUri);
    
    await mongoose.connect(coreUri);
    const Settings = mongoose.model('Settings', SettingsSchema.schema || SettingsSchema);
    
    const allDocs = await Settings.find({});
    console.log(`Found ${allDocs.length} settings documents.`);
    
    if (allDocs.length === 0) {
        console.log("WARNING: No documents found! Make sure you are pointing to the correct database.");
    }

    for (let doc of allDocs) {
        if (!doc.automation) doc.automation = {};
        if (!doc.automation.aiPrompts) doc.automation.aiPrompts = {};
        
        doc.automation.aiPrompts.prdFlowSteps = DEFAULT_PRD_FLOW_STEPS;
        doc.automation.aiPrompts.qualificationOptions = ['10th Pass', '12th Pass', 'Diploma Completed', 'Graduation Completed', 'Master Completed'];
        
        doc.markModified('automation');
        
        await doc.save();
        console.log(`Updated tenant: ${doc.tenantId}`);
    }
    console.log("FORCE UPDATED! ALL SETTINGS OVERWRITTEN.");
    process.exit(0);
}
forceUpdate().catch(console.error);
