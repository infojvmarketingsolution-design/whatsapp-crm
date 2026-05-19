const path = require('path');
const dotenv = require('dotenv');
dotenv.config({ path: path.join(__dirname, '../.env') });

const mongoose = require('mongoose');
const User = require('../src/models/core/User');
const { getTenantConnection } = require('../src/config/db');
const ContactSchema = require('../src/models/tenant/Contact').schema;

async function checkDetails() {
  try {
    console.log("Connecting to Core DB...");
    await mongoose.connect(process.env.CORE_DB_URI);
    
    // Find users named Akash
    const users = await User.find({ name: /Akash/i });
    console.log("\n--- USERS MATCHING 'Akash' ---");
    for (const u of users) {
      console.log({
        id: u._id,
        name: u.name,
        email: u.email,
        role: u.role,
        tenantId: u.tenantId
      });
    }

    // Let's find all tenants/clients to get their tenant IDs
    const Client = mongoose.model('Client', new mongoose.Schema({ tenantId: String, name: String }));
    const clients = await Client.find({});
    console.log("\n--- CLIENTS/TENANTS ---");
    for (const c of clients) {
      console.log({ name: c.name, tenantId: c.tenantId });
      
      // Let's connect to this tenant database and look for the lead Akash
      const tenantDb = getTenantConnection(c.tenantId);
      const Contact = tenantDb.model('Contact', ContactSchema);
      const contacts = await Contact.find({ phone: '916354070709' });
      
      console.log(`\n--- LEAD IN TENANT: ${c.name} (${c.tenantId}) ---`);
      for (const lead of contacts) {
        console.log({
          id: lead._id,
          name: lead.name,
          phone: lead.phone,
          assignedAgent: lead.assignedAgent,
          assignedCounsellor: lead.assignedCounsellor,
          currentFlowStep: lead.currentFlowStep,
          isBotPaused: lead.isBotPaused
        });
      }
    }
  } catch (err) {
    console.error("Error checking details:", err);
  } finally {
    process.exit(0);
  }
}

checkDetails();
