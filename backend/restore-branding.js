const mongoose = require('mongoose');
const dotenv = require('dotenv');
dotenv.config();
const SettingsSchema = require('./src/models/core/Settings');

const DEFAULT_PRD_FLOW_STEPS = [
  { id: 'greeting', type: 'GREETING', title: 'Greeting Message', message: 'Hello 👋 Welcome to JV Marketing Education Support!\n\nWe help you choose the best career path 🚀', image: 'https://wapipulse.com/uploads/prompts/tenant_demo_001/prompt_1774743344804.jpeg' },
  { id: 'ask_name', type: 'NAME_CAPTURE', title: 'Name Request', message: 'May I know your name?' },
  { id: 'qualification', type: 'QUALIFICATION', title: 'Qualification Choice', message: 'Nice to meet you, {{name}} 😊\n\n{{name}}, please select your last qualification 👇' },
  { id: 'program', type: 'PROGRAM_SELECTION', title: 'Program Selection', message: 'Great choice {{name}}! 🎓\n\nHere are programs for you:' },
  { id: 'urgency', type: 'CUSTOM_MESSAGE', title: 'Urgency Push', message: '⚠️ Hurry {{name}}!\n\nOnly limited seats available 🚀\nAdmissions closing soon.' },
  { id: 'scholarship', type: 'CUSTOM_MESSAGE', title: 'Scholarship Offer', message: '🎁 Good News {{name}}!\n\nYou may be eligible for up to 30% Scholarship 🎓' },
  { id: 'social_proof', type: 'SUCCESS_PROOF', title: 'Success & Proof', message: '🎉 Our students are already placed in top companies!\n\nYou could be next, {{name}} 🚀', image: 'https://wapipulse.com/uploads/prompts/tenant_demo_001/prompt_1774743344804.jpeg' },
  { id: 'call_time', type: 'CALL_TIME', title: 'Consultation Call', message: '{{name}}, when should our counsellor call you? 📞', buttons: ['Morning (10-1)', 'Afternoon (1-5)', 'Evening (5-8)'] },
  { id: 'thank_you', type: 'CUSTOM_MESSAGE', title: 'Thank You Message', message: 'Thank you {{name}} 🙌\n\n🎓 Qualification: {{qualification}}\n📘 Program: {{program}}\n⏰ Time: {{time}}\n\nOur counsellor will call you at your preferred time 📞\n\nThank you for your time, {{name}} 😊' },
  { id: 'additional_help', type: 'CUSTOM_QUESTION', title: 'Additional Help', message: 'May I help you with anything else?', buttons: ['Yes', 'No'] }
];

// Dynamic name formatter
function formatTenantName(tenantId) {
    let clean = tenantId.split('_')[0];
    
    if (clean.toLowerCase().includes('gandhinagaruniversity')) return 'Gandhinagar University';
    if (clean.toLowerCase().includes('shreyarthuniversity')) return 'Shreyarth University';
    if (clean.toLowerCase().includes('vidhyadeepuniversity')) return 'Vidhyadeep University';
    if (clean.toLowerCase().includes('raiuniversity')) return 'Rai University';
    if (clean.toLowerCase().includes('thenewprogressivecollege')) return 'The New Progressive College';
    if (clean.toLowerCase().includes('campusdekho')) return 'Campus Dekho';
    if (clean.toLowerCase().includes('jvbot')) return 'JV Bot';
    if (clean.toLowerCase().includes('jvmarketingsolutions')) return 'JV Marketing Solutions';
    if (clean.toLowerCase().includes('fivestep')) return 'Five Step';
    
    // Fallback: capitalize first letters
    clean = clean.replace(/university/i, ' University');
    clean = clean.replace(/college/i, ' College');
    return clean.charAt(0).toUpperCase() + clean.slice(1);
}

async function restoreBranding() {
    const coreUri = process.env.CORE_DB_URI || 'mongodb://127.0.0.1:27017/jv_cloud_crm_core';
    console.log("Connecting to:", coreUri);
    await mongoose.connect(coreUri);
    const Settings = mongoose.model('Settings', SettingsSchema.schema || SettingsSchema);
    
    const allDocs = await Settings.find({});
    console.log(`Found ${allDocs.length} settings documents.`);
    
    for (let doc of allDocs) {
        const universityName = formatTenantName(doc.tenantId);
        console.log(`Formatting branding for ${doc.tenantId} -> "${universityName}"`);
        
        if (!doc.automation) doc.automation = {};
        if (!doc.automation.aiPrompts) doc.automation.aiPrompts = {};
        
        // 🔄 SELF-HEALING: Re-seed steps if missing or empty
        if (!doc.automation.aiPrompts.prdFlowSteps || doc.automation.aiPrompts.prdFlowSteps.length === 0) {
            console.log(`   ⚠️ Steps empty for ${doc.tenantId}. Seeding defaults...`);
            doc.automation.aiPrompts.prdFlowSteps = JSON.parse(JSON.stringify(DEFAULT_PRD_FLOW_STEPS));
            doc.automation.aiPrompts.qualificationOptions = ['10th Pass', '12th Pass', 'Diploma Completed', 'Graduation Completed', 'Master Completed'];
            doc.automation.aiPrompts.programMap = {
              '10th Pass': { 'Diploma Programs': ['IT Diploma', 'Mechanical Diploma', 'Civil Diploma'] },
              '12th Pass': { 
                'Trending Programs': ['B.Sc Cyber Security', 'B.Sc AI & ML', 'B.Sc Animation', 'B.Sc Cloud Automation', 'B.Sc Software Development', 'B.Sc Blockchain Technology', 'B.Sc Data Analytics'],
                'Traditional Programs': ['B.Com', 'B.Tech', 'BBA']
              },
              'Graduation Completed': { 'Master Programs': ['MBA', 'MCA', 'M.Tech', 'M.Sc'] }
            };
        }

        const steps = doc.automation.aiPrompts.prdFlowSteps;
        
        // 1. Update Greeting step message
        const greetingStep = steps.find(s => s.id === 'greeting');
        if (greetingStep) {
            greetingStep.message = `Welcome to ${universityName} 👋\n\nI’m here to help you choose the right program.`;
        }
        
        // 2. Update Qualification step message
        const qualificationStep = steps.find(s => s.id === 'qualification');
        if (qualificationStep) {
            qualificationStep.message = `Nice to meet you, {{name}} 😊\n\n{{name}}, please select your last qualification 👇`;
        }
        
        // 3. Update Program step message
        const programStep = steps.find(s => s.id === 'program');
        if (programStep) {
            programStep.message = `Great choice {{name}}! 🎓\n\nHere are programs for you:`;
        }
        
        // 4. Update Call Time step message
        const callTimeStep = steps.find(s => s.id === 'call_time');
        if (callTimeStep) {
            callTimeStep.message = `{{name}}, when should our counsellor call you? 📞`;
        }
        
        // 5. Update Thank You step message
        const thankYouStep = steps.find(s => s.id === 'thank_you');
        if (thankYouStep) {
            thankYouStep.message = `Thank you {{name}} 🙌\n\n🎓 Qualification: {{qualification}}\n📘 Program: {{program}}\n⏰ Time: {{time}}\n\nOur counsellor will call you at your preferred time 📞\n\nThank you for your time, {{name}} 😊`;
        }

        doc.markModified('automation');
        await doc.save();
        console.log(`   ✅ Restored and branded ${doc.tenantId} welcome steps successfully.`);
    }
    
    console.log("RESTORE BRANDING COMPLETED!");
    process.exit(0);
}

restoreBranding().catch(console.error);
