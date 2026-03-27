const mongoose = require('mongoose');
require('dotenv').config();

async function run() {
  const uri = process.env.CORE_DB_URI || 'mongodb://127.0.0.1:27017/crm_core';
  await mongoose.connect(uri);
  
  const Client = mongoose.connection.collection('clients');
  const clients = await Client.find({}).toArray();
  
  console.log('--- Registered Clients ---');
  clients.forEach(c => {
    console.log(`Name: ${c.name} | Co: ${c.companyName} | Tenant: ${c.tenantId} | WABA: ${c.whatsappConfig?.wabaName}`);
  });
  
  process.exit(0);
}

run();
