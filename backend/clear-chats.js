const mongoose = require('mongoose');
const { getTenantConnection } = require('./src/config/db');
const Client = require('./src/models/core/Client');
const ContactSchema = require('./src/models/tenant/Contact');
const MessageSchema = require('./src/models/tenant/Message');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, './.env') }); // It's in the same folder as scripts if we run from backend, but if in root it's in backend/.env

// The numbers provided by the user (adding common country codes automatically to be sure)
const INPUT_PHONES = ['6354070709', '7383503632'];
const PHONES = [];
INPUT_PHONES.forEach(p => {
    PHONES.push(p);
    PHONES.push(`91${p}`);
    PHONES.push(`+91${p}`);
});

async function clear() {
  try {
    console.log('--- STARTING GLOBAL CHAT CLEARANCE ---');
    await mongoose.connect(process.env.CORE_DB_URI);
    
    const clients = await Client.find({ status: 'ACTIVE' });
    console.log(`Searching across ${clients.length} active tenants...`);

    for (const client of clients) {
        console.log(`\nChecking Tenant: ${client.tenantId}`);
        const tenantDb = getTenantConnection(client.tenantId);
        const Contact = tenantDb.model('Contact', ContactSchema);
        const Message = tenantDb.model('Message', MessageSchema);
        const results = []; // Initialize results array for each client

        for (const phone of PHONES) {
            const contact = await Contact.findOne({ phone });
            if (contact) {
                // Instead of completely deleting, we clear all messages and RESET the session
                const result = await Contact.findOneAndUpdate(
                    { phone: phone.replace('+', '') }, 
                    { 
                        $unset: { currentFlowStep: "", lastFlowId: "" },
                        $set: { status: 'LEAD' } // Reset status
                    }
                );
                
                if (result) {
                    const msgDeleted = await Message.deleteMany({ contactId: result._id });
                    results.push(`[${client.tenantId}] Cleared ${phone} and ${msgDeleted.deletedCount} messages.`);
                }
            }
        }
        if (results.length > 0) {
            console.log(results.join('\n'));
        } else {
            console.log(`[${client.tenantId}] No matching contacts found for specified phones.`);
        }
    }

    console.log('\n--- ALL SPECIFIED CHATS CLEARED ---');
    process.exit(0);
  } catch (err) {
    console.error('Clear error:', err);
    process.exit(1);
  }
}

clear();
