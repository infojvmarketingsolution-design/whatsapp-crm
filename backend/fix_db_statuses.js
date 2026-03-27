const mongoose = require('mongoose');
const path = require('path');
// Load .env from the same directory as the script
require('dotenv').config({ path: path.join(__dirname, '.env') });

const ContactSchema = require('./src/models/tenant/Contact');
const Client = require('./src/models/core/Client');

async function fixDatabase() {
  try {
    const coreUri = process.env.CORE_DB_URI || 'mongodb://127.0.0.1:27017/crm_core';
    console.log('Connecting to Core DB:', coreUri);
    await mongoose.connect(coreUri);
    
    let tenantIds = [];

    // Attempt 1: Get from Clients collection
    try {
        const clients = await Client.find({});
        console.log('Found clients in core:', clients.length);
        tenantIds = clients.map(c => c.tenantId);
    } catch (e) {
        console.log('Could not read Clients collection, trying manual discovery...');
    }
    
    // Attempt 2: If no clients found, manually discover jv_tenant_ databases
    if (tenantIds.length === 0) {
        const admin = new mongoose.mongo.Admin(mongoose.connection.db);
        const dbs = await admin.listDatabases();
        tenantIds = dbs.databases
            .map(db => db.name)
            .filter(name => name.startsWith('jv_tenant_'))
            .map(name => name.replace('jv_tenant_', ''));
        console.log('Manually discovered tenant IDs:', tenantIds.length);
    }

    if (tenantIds.length === 0) {
        console.log('❌ No tenants found. Please ensure MongoDB is running and has jv_tenant_... databases.');
        await mongoose.connection.close();
        return;
    }

    for (const tenantId of tenantIds) {
      const tenantUri = `mongodb://127.0.0.1:27017/jv_tenant_${tenantId}`;
      console.log(`\nChecking Tenant DB: ${tenantId}...`);
      
      const conn = mongoose.createConnection(tenantUri);
      
      // Wait for connection
      await new Promise((resolve) => conn.once('open', resolve));

      const Contact = conn.model('Contact', ContactSchema);
      
      // Find contacts with invalid status 'LEAD'
      const invalidContacts = await Contact.find({ status: 'LEAD' });
      console.log(`Found ${invalidContacts.length} contacts with invalid status 'LEAD'`);
      
      if (invalidContacts.length > 0) {
        const result = await Contact.updateMany(
          { status: 'LEAD' },
          { $set: { status: 'NEW LEAD' } }
        );
        console.log(`✅ Updated ${result.modifiedCount} contacts with 'LEAD' -> 'NEW LEAD'`);
      }
      
      // Check for OTHER invalid statuses
      const validStatuses = ['NEW LEAD', 'CONTACTED', 'INTERESTED', 'FOLLOW_UP', 'CLOSED_WON', 'CLOSED_LOST'];
      const allContacts = await Contact.find({});
      let fixedCount = 0;
      
      for (const c of allContacts) {
          if (!validStatuses.includes(c.status)) {
              console.log(`⚠️ Contact ${c.phone} has unknown status: "${c.status}". Resetting to NEW LEAD.`);
              c.status = 'NEW LEAD';
              await c.save();
              fixedCount++;
          }
      }
      
      if (fixedCount > 0) console.log(`✅ Fixed ${fixedCount} other invalid statuses.`);

      await conn.close();
    }
    
    console.log('\n--- Database Cleanup Complete ---');
    await mongoose.connection.close();
  } catch (err) {
    console.error('Error during database cleanup:', err);
  }
}

fixDatabase();
