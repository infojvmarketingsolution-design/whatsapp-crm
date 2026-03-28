const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const { getTenantConnection } = require('../src/config/db');
const ContactSchema = require('../src/models/tenant/Contact');
const MessageSchema = require('../src/models/tenant/Message');

async function deleteContacts() {
    try {
        console.log('Connecting to Core DB...');
        await mongoose.connect(process.env.CORE_DB_URI);
        
        const tenantId = 'tenant_demo_001'; 
        const tenantDb = getTenantConnection(tenantId);
        const Contact = tenantDb.model('Contact', ContactSchema);
        const Message = tenantDb.model('Message', MessageSchema);

        const numbersToDelete = [
            '916354070709',
            '919924715760',
            '917383503632'
        ];

        console.log(`Searching for contacts: ${numbersToDelete.join(', ')}...`);
        
        for (const phone of numbersToDelete) {
            console.log(`Processing ${phone}...`);
            const contact = await Contact.findOne({ phone });
            
            if (contact) {
                // Delete messages for this contact first to clean up inbox
                const msgResult = await Message.deleteMany({ contactId: contact._id });
                
                // Delete the contact
                const result = await Contact.deleteOne({ _id: contact._id });
                
                console.log(`✅ Deleted contact ${phone} and ${msgResult.deletedCount} messages.`);
            } else {
                console.log(`⚠️ Contact ${phone} not found.`);
            }
        }
        
        console.log('--- Deletion Finished ---');
        process.exit(0);
    } catch (err) {
        console.error('Deletion Error:', err.message);
        process.exit(1);
    }
}

deleteContacts();
