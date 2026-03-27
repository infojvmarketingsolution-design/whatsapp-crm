const mongoose = require('mongoose');
const { getTenantConnection } = require('../src/config/db');
const Client = require('../src/models/core/Client');
const FlowSchema = require('../src/models/tenant/Flow');
require('dotenv').config({ path: require('path').join(__dirname, '../.env') });

async function listFlows() {
  try {
    await mongoose.connect(process.env.CORE_DB_URI);
    const clients = await Client.find({ status: 'ACTIVE' });

    for (const client of clients) {
        console.log(`\n--- TENANT: ${client.tenantId} ---`);
        const tenantDb = getTenantConnection(client.tenantId);
        const Flow = tenantDb.model('Flow', FlowSchema);

        const activeFlows = await Flow.find({ status: 'ACTIVE' });
        if (activeFlows.length === 0) {
            console.log('No ACTIVE flows found.');
        } else {
            activeFlows.forEach(f => {
                console.log(`- FLOW: "${f.name}" [ID: ${f._id}]`);
                console.log(`  Trigger: ${f.triggerType}`);
                if (f.triggerType === 'KEYWORD') console.log(`  Keywords: ${f.triggerKeywords.join(', ')}`);
                console.log(`  Nodes: ${f.nodes.length}`);
            });
        }
    }
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}
listFlows();
