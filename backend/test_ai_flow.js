const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

// Load env
dotenv.config({ path: path.join(__dirname, '.env') });

const { getTenantConnection } = require('./src/config/db');
const Client = require('./src/models/core/Client');
const ContactSchema = require('./src/models/tenant/Contact');
const { processIncomingMessage } = require('./src/services/flowEngine.service');

async function test() {
  try {
    console.log('Connecting to Core DB...');
    await mongoose.connect(process.env.CORE_DB_URI);
    
    const client = await Client.findOne({ status: 'ACTIVE' });
    if (!client) {
      console.error('No active client found for testing.');
      process.exit(1);
    }
    console.log(`Testing with Tenant: ${client.tenantId}`);

    const tenantDb = getTenantConnection(client.tenantId);
    const Contact = tenantDb.model('Contact', ContactSchema);

    const testPhone = '919876543210';
    // Clear existing session
    await Contact.findOneAndUpdate({ phone: testPhone }, { $unset: { currentFlowStep: "", lastFlowId: "", flowVariables: "" } });
    
    let contact = await Contact.findOne({ phone: testPhone });
    if (!contact) {
      contact = await Contact.create({ phone: testPhone, name: 'Test User' });
    }

    console.log('--- TEST 1: Initial Greeting (AI Intent: START_FLOW) ---');
    await processIncomingMessage(client.tenantId, contact.toObject(), 'Hello there!', null, true);

    // Re-fetch contact to check state
    const updatedContact = await Contact.findOne({ phone: testPhone });
    console.log(`Current Step: ${updatedContact.currentFlowStep}`);
    
    if (updatedContact.currentFlowStep === 'AWAITING_NAME') {
      console.log('✅ Success: Flow transitioned to AWAITING_NAME');
    } else {
      console.log('❌ Failure: Flow did not transition correctly');
    }

    console.log('\n--- TEST 2: Capture Name ---');
    await processIncomingMessage(client.tenantId, updatedContact.toObject(), 'My name is John Doe', null, false);
    
    const finalContact = await Contact.findOne({ phone: testPhone });
    console.log(`Current Step: ${finalContact.currentFlowStep}`);
    console.log(`Captured Name: ${finalContact.name}`);

    if (finalContact.currentFlowStep === 'AWAITING_QUALIFICATION') {
      console.log('✅ Success: Flow transitioned to AWAITING_QUALIFICATION');
    }

    process.exit(0);
  } catch (err) {
    console.error('Test Error:', err);
    process.exit(1);
  }
}

test();
