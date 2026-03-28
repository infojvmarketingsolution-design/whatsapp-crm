const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });
const Settings = require('./src/models/core/Settings');

async function check() {
    try {
        await mongoose.connect(process.env.CORE_DB_URI);
        console.log('Connected to DB');

        const settings = await Settings.findOne({ tenantId: 'tenant_demo_001' });
        if (!settings) {
            console.log('No settings found for tenant_demo_001');
        } else {
            console.log('Settings for tenant_demo_001:');
            console.log(JSON.stringify(settings.automation.aiPrompts, null, 2));
        }
        
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

check();
