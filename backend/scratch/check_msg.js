const mongoose = require('mongoose');
const { getTenantConnection } = require('../src/config/db');
require('dotenv').config({ path: '../.env' });

async function run() {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('Connected to DB');
  
  // Find tenant 
  const tenantDb = getTenantConnection('tenant_demo_001');
  const MessageSchema = require('../src/models/tenant/Message');
  const Message = tenantDb.model('Message', MessageSchema);
  
  // Get last 5 outbound messages
  const msgs = await Message.find({ direction: 'OUTBOUND' }).sort({ timestamp: -1 }).limit(5);
  for (const m of msgs) {
     console.log(`\n--- MESSAGE ---`);
     console.log(`Type: ${m.type}`);
     console.log(`Status: ${m.status}`);
     console.log(`Content: ${m.content.substring(0, 50)}...`);
     if (m.status === 'FAILED') {
        console.log(`Error Data:`, m.errorData || m._doc);
     }
  }
  
  process.exit(0);
}
run().catch(console.error);
