const mongoose = require('mongoose');
require('dotenv').config();

const MessageSchema = require('./src/models/tenant/Message');
const ContactSchema = require('./src/models/tenant/Contact');
const Client = require('./src/models/core/Client');

async function check() {
  try {
    const coreUri = process.env.CORE_DB_URI || 'mongodb://127.0.0.1:27017/crm_core';
    console.log('Connecting to Core DB:', coreUri);
    await mongoose.connect(coreUri);
    
    const clients = await Client.find({});
    console.log('Found clients:', clients.length);
    
    for (const client of clients) {
      const tenantId = client.tenantId;
      const tenantUri = `mongodb://127.0.0.1:27017/jv_tenant_${tenantId}`;
      console.log(`Checking Tenant: ${tenantId} at ${tenantUri}`);
      
      const conn = mongoose.createConnection(tenantUri);
      const Message = conn.model('Message', MessageSchema);
      const Contact = conn.model('Contact', ContactSchema);
      
      const lastMessages = await Message.find({ direction: 'INBOUND' }).sort({ createdAt: -1 }).limit(5);
      console.log(`Last 5 INBOUND messages for ${tenantId}:`);
      for (const m of lastMessages) {
        const contact = await Contact.findById(m.contactId);
        console.log(`- From: ${contact?.phone || 'Unknown'} | Type: ${m.type} | Content: "${m.content}" | CreatedAt: ${m.createdAt}`);
      }
      await conn.close();
    }
    
    await mongoose.connection.close();
  } catch (err) {
    console.error('Error:', err);
  }
}

check();
