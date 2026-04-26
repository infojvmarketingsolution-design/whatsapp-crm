const mongoose = require('mongoose');
require('dotenv').config();
const { connectCoreDB, getTenantConnection } = require('./src/config/db');
const Client = require('./src/models/core/Client');
const ContactSchema = require('./src/models/tenant/Contact');

async function run() {
  try {
    await connectCoreDB();
    const clients = await Client.find({});
    
    for (const client of clients) {
      console.log(`\nChecking tenant: ${client.name} (${client.tenantId})`);
      const tenantDb = getTenantConnection(client.tenantId);
      const Contact = tenantDb.model('Contact', ContactSchema);
      
      const lastContacts = await Contact.find({})
        .sort({ createdAt: -1 })
        .limit(5);
      
      if (lastContacts.length === 0) {
        console.log('  No contacts found.');
      } else {
        lastContacts.forEach(c => {
          console.log(`  - ${c.name} (${c.phone}) | Status: ${c.status} | Created: ${c.createdAt}`);
        });
      }
    }
    
    mongoose.connection.close();
    process.exit(0);
  } catch (err) {
    console.error('Error:', err);
    process.exit(1);
  }
}

run();
