const mongoose = require('mongoose');
const dotenv = require('dotenv');
dotenv.config();
const SettingsSchema = require('./src/models/core/Settings');

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
        
        if (doc.automation && doc.automation.aiPrompts && doc.automation.aiPrompts.prdFlowSteps) {
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
            console.log(`   ✅ Updated ${doc.tenantId} welcome steps successfully.`);
        }
    }
    
    console.log("RESTORE BRANDING COMPLETED!");
    process.exit(0);
}

restoreBranding().catch(console.error);
