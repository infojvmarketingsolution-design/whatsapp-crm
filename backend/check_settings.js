const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });
const Settings = require('./src/models/core/Settings');

async function checkSettings() {
    try {
        console.log('Connecting to Core DB...');
        await mongoose.connect(process.env.CORE_DB_URI);
        
        const tenantId = 'tenant_demo_001'; 
        const settings = await Settings.findOne({ tenantId });
        
        if (settings && settings.automation && settings.automation.aiPrompts) {
            console.log('--- Current AI Prompts Settings ---');
            console.log('Greeting Image:', settings.automation.aiPrompts.greetingImage);
            console.log('Greeting Message:', settings.automation.aiPrompts.greetingMessage);
            console.log('---------------------------------');
            
            // OPTIONAL: Auto-fix if redundant question is there
            let msg = settings.automation.aiPrompts.greetingMessage;
            if (msg.includes('May I know your name?')) {
                console.log('Found redundant question. Cleaning up...');
                settings.automation.aiPrompts.greetingMessage = msg.replace(/May I know your name\??/gi, '').trim();
                await settings.save();
                console.log('✅ Greeting Message cleaned.');
            }
        } else {
            console.log('No settings found for tenant.');
        }
        
        process.exit(0);
    } catch (err) {
        console.error('Check Error:', err.message);
        process.exit(1);
    }
}

checkSettings();
