const mongoose = require('mongoose');
const { getTenantConnection } = require('../src/config/db');
require('dotenv').config({ path: __dirname + '/../.env' });

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
     console.log(`Content: ${m.content ? m.content.substring(0, 100).replace(/\n/g, ' ') : m.content}...`);
     if (m.status === 'FAILED') {
        console.log(`Error Data:`, JSON.stringify(m.errorData || m._doc.errorData, null, 2));
     }
  }
  
  process.exit(0);
}
run().catch(console.error);
