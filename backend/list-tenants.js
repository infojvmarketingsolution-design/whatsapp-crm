const mongoose = require('mongoose');
require('dotenv').config();
const { connectCoreDB, getTenantConnection } = require('./src/config/db');
const Client = require('./src/models/core/Client');

async function run() {
  await connectCoreDB();
  const clients = await Client.find({});
  console.log('Total Clients:', clients.length);
  clients.forEach(c => {
    console.log(`- ${c.name} (${c.tenantId})`);
  });
  mongoose.connection.close();
}

run();
