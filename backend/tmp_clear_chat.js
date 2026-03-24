const mongoose = require('mongoose');
require('dotenv').config();

const { connectCoreDB, getTenantConnection } = require('./src/config/db');
const Client = require('./src/models/core/Client');
const ContactSchema = require('./src/models/tenant/Contact');
const MessageSchema = require('./src/models/tenant/Message');

async function run() {
    try {
        await connectCoreDB();
        const clients = await Client.find({});
        console.log(`Searching across ${clients.length} tenants...`);

        const targetPhone = '9909700606';

        for (const client of clients) {
            const tenantId = client.tenantId;
            const tenantDb = getTenantConnection(tenantId);
            const Contact = tenantDb.model('Contact', ContactSchema);
            const Message = tenantDb.model('Message', MessageSchema);

            const contact = await Contact.findOne({ phone: new RegExp(targetPhone + '$') });
            if (contact) {
                console.log(`Found contact in tenant: ${tenantId}. Full phone: ${contact.phone}`);
                const deleteResult = await Message.deleteMany({ contactId: contact._id });
                console.log(`Deleted ${deleteResult.deletedCount} messages for contact ${contact._id}`);
                
                // Also clear last message timestamp in contact
                contact.lastMessageAt = null;
                contact.lastActivity = null;
                await contact.save();
                console.log(`Cleared last message metadata for contact.`);
            }
        }

        console.log('Done.');
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

run();
