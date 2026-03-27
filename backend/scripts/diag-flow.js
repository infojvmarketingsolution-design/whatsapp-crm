const mongoose = require('mongoose');
const { getTenantConnection } = require('../src/config/db');
const Client = require('../src/models/core/Client');
const ContactSchema = require('../src/models/tenant/Contact');
const FlowSchema = require('../src/models/tenant/Flow');
require('dotenv').config({ path: require('path').join(__dirname, '../.env') });

const PHONES = ['916354070709', '917383503632', '6354070709', '7383503632'];

async function diag() {
  try {
    await mongoose.connect(process.env.CORE_DB_URI);
    const clients = await Client.find({ status: 'ACTIVE' });

    for (const client of clients) {
        const tenantDb = getTenantConnection(client.tenantId);
        const Contact = tenantDb.model('Contact', ContactSchema);
        const Flow = tenantDb.model('Flow', FlowSchema);

        for (const phone of PHONES) {
            const contact = await Contact.findOne({ phone });
            if (contact) {
                console.log(`\n--- CONTACT FOUND [Tenant: ${client.tenantId}] ---`);
                console.log(`Phone: ${contact.phone}`);
                console.log(`Current Step: ${contact.currentFlowStep || 'NONE'}`);
                console.log(`Last Flow: ${contact.lastFlowId || 'NONE'}`);
                console.log(`Variables:`, contact.flowVariables);
                
                if (contact.lastFlowId) {
                    const flow = await Flow.findById(contact.lastFlowId);
                    if (flow) {
                        const node = flow.nodes.find(n => n.id === contact.currentFlowStep);
                        console.log(`Node Content:`, node?.data?.text || 'No text');
                        console.log(`Node Type:`, node?.type);
                    }
                }
            }
        }
    }
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}
diag();
