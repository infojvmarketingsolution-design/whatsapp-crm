const mongoose = require('mongoose');
require('dotenv').config();

const ContactSchema = require('./src/models/tenant/Contact');
const Client = require('./src/models/core/Client');

async function fixDatabase() {
  try {
    const coreUri = process.env.CORE_DB_URI || 'mongodb://127.0.0.1:27017/crm_core';
    console.log('Connecting to Core DB:', coreUri);
    await mongoose.connect(coreUri);
    
    const clients = await Client.find({});
    console.log('Found clients:', clients.length);
    
    for (const client of clients) {
      const tenantId = client.tenantId;
      const tenantUri = `mongodb://127.0.0.1:27017/jv_tenant_${tenantId}`;
      console.log(`Checking Tenant DB: ${tenantId}...`);
      
      const conn = mongoose.createConnection(tenantUri);
      const Contact = conn.model('Contact', ContactSchema);
      
      // Find contacts with invalid status 'LEAD'
      const invalidContacts = await Contact.find({ status: 'LEAD' });
      console.log(`Found ${invalidContacts.length} contacts with invalid status 'LEAD' in ${tenantId}`);
      
      if (invalidContacts.length > 0) {
        const result = await Contact.updateMany(
          { status: 'LEAD' },
          { $set: { status: 'NEW LEAD' } }
        );
        console.log(`✅ Updated ${result.modifiedCount} contacts in ${tenantId}`);
      }
      
      // Also check for any other invalid statuses that might crash validation
      const allContacts = await Contact.find({});
      const validStatuses = ['NEW LEAD', 'CONTACTED', 'INTERESTED', 'FOLLOW_UP', 'CLOSED_WON', 'CLOSED_LOST'];
      
      for (const c of allContacts) {
          if (!validStatuses.includes(c.status)) {
              console.log(`⚠️ Contact ${c.phone} has unknown status: "${c.status}". Resetting to NEW LEAD.`);
              c.status = 'NEW LEAD';
              await c.save();
          }
      }

      await conn.close();
    }
    
    console.log('\n--- Database Cleanup Complete ---');
    await mongoose.connection.close();
  } catch (err) {
    console.error('Error during database cleanup:', err);
  }
}

fixDatabase();
