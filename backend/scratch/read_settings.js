require('dotenv').config();
const { connectCoreDB } = require('../src/config/db');
const Settings = require('../src/models/core/Settings');

async function run() {
    try {
        await connectCoreDB();
        console.log('Connected to MongoDB');
        const settings = await Settings.find({});
        console.log(`Found ${settings.length} settings:`);
        for (const s of settings) {
            console.log(`\nTenant ID: ${s.tenantId}`);
            console.log(`botEnabled: ${s.automation?.botEnabled}`);
            console.log(`botMode: ${s.automation?.botMode}`);
            console.log('prdFlowSteps:', JSON.stringify(s.automation?.aiPrompts?.prdFlowSteps, null, 2));
        }
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}
run();
