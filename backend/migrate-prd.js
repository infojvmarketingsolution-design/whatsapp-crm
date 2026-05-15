const mongoose = require('mongoose');
const dotenv = require('dotenv');
dotenv.config();

const SettingsSchema = require('./src/models/core/Settings');
const PRDFlowService = require('./src/services/prdFlow.service');

async function migrate() {
    console.log("Connecting to MongoDB...");
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/whatsapp-crm');
    console.log("Connected.");

    const Settings = mongoose.model('Settings', SettingsSchema.schema || SettingsSchema);
    
    // We get the new 10-step array from the service
    const prdService = new PRDFlowService();
    const newSteps = prdService.DEFAULT_PRD_FLOW_STEPS;

    console.log("Updating Settings...");
    // Clear out the old cached prdFlowSteps and qualificationOptions for all tenants
    await Settings.updateMany({}, {
        $set: { 
            'automation.aiPrompts.prdFlowSteps': newSteps,
            'automation.aiPrompts.qualificationOptions': ['10th Pass', '12th Pass', 'Diploma Completed', 'Graduation Completed', 'Master Completed']
        }
    });

    console.log("Update Complete! The frontend will now show the new 10-step flow.");
    process.exit(0);
}

migrate().catch(console.error);
