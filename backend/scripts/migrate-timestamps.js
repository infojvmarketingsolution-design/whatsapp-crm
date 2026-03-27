const mongoose = require('mongoose');
const { getTenantConnection } = require('../src/config/db');
const Client = require('../src/models/core/Client');
const ContactSchema = require('../src/models/tenant/Contact');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

async function migrate() {
  try {
    console.log('--- STARTING TIMESTAMP MIGRATION ---');
    await mongoose.connect(process.env.CORE_DB_URI);
    
    const clients = await Client.find({ status: 'ACTIVE' });
    console.log(`Found ${clients.length} active clients.`);

    for (const client of clients) {
        console.log(`Processing Tenant: ${client.tenantId}`);
        const tenantDb = getTenantConnection(client.tenantId);
        const Contact = tenantDb.model('Contact', ContactSchema);

        const result = await Contact.updateMany(
            { lastMessageAt: { $exists: false } },
            [ { $set: { lastMessageAt: '$updatedAt' } } ]
        );
        console.log(`Updated ${result.modifiedCount} contacts for ${client.tenantId}`);
    }

    console.log('--- MIGRATION COMPLETE ---');
    process.exit(0);
  } catch (err) {
    console.error('Migration Failed:', err);
    process.exit(1);
  }
}

migrate();
