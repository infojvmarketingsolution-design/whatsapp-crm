const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

const Client = mongoose.model('Client', new mongoose.Schema({}, { strict: false }));

async function run() {
    try {
        const uri = process.env.CORE_DB_URI || 'mongodb://127.0.0.1:27017/crm_core';
        await mongoose.connect(uri);
        const clients = await Client.find({});
        console.log('Clients:', JSON.stringify(clients.map(c => ({ name: c.name, tenantId: c.tenantId, company: c.companyName })), null, 2));
        
        for (const client of clients) {
            if (client.tenantId) {
                const tenantUri = `mongodb://127.0.0.1:27017/jv_tenant_${client.tenantId}`;
                const conn = mongoose.createConnection(tenantUri);
                const Contact = conn.model('Contact', new mongoose.Schema({}, { strict: false }));
                const count = await Contact.countDocuments({});
                console.log(`Tenant ${client.tenantId} has ${count} contacts`);
                await conn.close();
            }
        }
        
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

run();
