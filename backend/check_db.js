const mongoose = require('mongoose');

async function check() {
  await mongoose.connect('mongodb://127.0.0.1:27017/crm_core');
  
  const Tenant = mongoose.model('Tenant', new mongoose.Schema({}, { strict: false }));
  const tenants = await Tenant.find({ $or: [{ name: /jv/i }, { tenantId: /jv/i }] });
  console.log("Tenants found:", tenants.map(t => ({ id: t.tenantId, name: t.name })));

  if (tenants.length > 0) {
    const tenantId = tenants[0].tenantId;
    console.log("Using tenantId:", tenantId);
    
    // Connect to tenant DB
    const tenantDb = mongoose.connection.useDb(`tenant_${tenantId}`);
    const Message = tenantDb.model('Message', new mongoose.Schema({}, { strict: false }));
    
    const messages = await Message.find({ type: { $in: ['image', 'interactive'] }, direction: 'OUTBOUND' })
      .sort({ createdAt: -1 })
      .limit(5);
      
    console.log("Latest Outbound Media Messages:");
    messages.forEach(m => {
      console.log(`- Type: ${m.type}`);
      console.log(`- Content: ${m.content ? m.content.substring(0, 100) : null}`);
    });
  }

  process.exit(0);
}

check().catch(console.error);
