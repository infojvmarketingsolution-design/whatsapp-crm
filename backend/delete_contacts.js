const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });
const { getTenantConnection } = require('./src/config/db');
const ContactSchema = require('./src/models/tenant/Contact');
const MessageSchema = require('./src/models/tenant/Message');

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
            // Delete messages for this contact first
            const msgResult = await Message.deleteMany({ direction: { $in: ['INBOUND', 'OUTBOUND'] }, from: phone });
            const msgResultTo = await Message.deleteMany({ to: phone });
            
            // Delete the contact
            const result = await Contact.deleteOne({ phone });
            
            if (result.deletedCount > 0) {
                console.log(`✅ Deleted contact ${phone} and ${msgResult.deletedCount + msgResultTo.deletedCount} messages.`);
            } else {
                console.log(`⚠️ Contact ${phone} not found (might already be deleted).`);
            }
        }
        
        process.exit(0);
    } catch (err) {
        console.error('Deletion Error:', err.message);
        process.exit(1);
    }
}

deleteContacts();
