const mongoose = require('mongoose');
require('dotenv').config();
const ContactSchema = require('./src/models/tenant/Contact');
const MessageSchema = require('./src/models/tenant/Message');
const Client = require('./src/models/core/Client');

async function run() {
  try {
    const mongoUri = process.env.CORE_DB_URI || 'mongodb://127.0.0.1:27017/crm_core';
    console.log('Connecting to:', mongoUri);
    await mongoose.connect(mongoUri);
    const clients = await Client.find({});
    
    // Normalize targets
    const targets = ['+91 6354070709', '916354070709', '6354070709', '+91 9924715760', '+919924715760', '919924715760', '9924715760'];
    
    console.log(`Searching for targets in ${clients.length} tenants...`);

    for (const client of clients) {
      const dbName = `jv_tenant_${client.tenantId}`;
      const tenantUri = `mongodb://127.0.0.1:27017/${dbName}`;
      
      const conn = await mongoose.createConnection(tenantUri).asPromise();
      const Contact = conn.model('Contact', ContactSchema);
      const Message = conn.model('Message', MessageSchema);
      
      const found = await Contact.find({ phone: { $in: targets } });
      if (found.length > 0) {
        console.log(`Found ${found.length} contacts to delete in tenant ${client.tenantId}`);
        for (const c of found) {
          const mRes = await Message.deleteMany({ contactId: c._id });
          const cRes = await Contact.deleteOne({ _id: c._id });
          console.log(`Deleted contact ${c.phone} (ID: ${c._id}). Messages removed: ${mRes.deletedCount}`);
        }
      }
      await conn.close();
    }
    await mongoose.connection.close();
    console.log('Cleanup finished.');
  } catch (err) {
    console.error('Cleanup Error:', err);
  }
}
run();
