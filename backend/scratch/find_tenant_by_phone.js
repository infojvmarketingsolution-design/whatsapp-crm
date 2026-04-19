const mongoose = require('mongoose');
require('dotenv').config();

async function findTenant() {
  const uri = process.env.CORE_DB_URI || 'mongodb://127.0.0.1:27017/crm_core';
  await mongoose.connect(uri);
  
  const Client = mongoose.connection.collection('clients');
  const phoneNumber = '916359200606'; // normalized
  
  // Search for the client by phoneNumber in whatsappConfig
  const client = await Client.findOne({ 
    $or: [
      { 'whatsappConfig.phoneNumber': phoneNumber },
      { 'whatsappConfig.phoneNumber': '+' + phoneNumber },
      { 'whatsappConfig.phoneNumber': phoneNumber.replace(/^91/, '') }
    ]
  });
  
  if (client) {
    console.log('--- Client Found ---');
    console.log(`Tenant ID: ${client.tenantId}`);
    console.log(`Name: ${client.name}`);
    console.log(`Phone: ${client.whatsappConfig.phoneNumber}`);
  } else {
    console.log('Client not found for number: ' + phoneNumber);
    // Let's check all clients just in case
    const all = await Client.find({}).toArray();
    console.log('--- All Clients ---');
    all.forEach(c => {
      console.log(`Tenant: ${c.tenantId} | Phone: ${c.whatsappConfig?.phoneNumber} | Name: ${c.name}`);
    });
  }
  
  process.exit(0);
}

findTenant();
