const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

// Load environment variables
dotenv.config({ path: path.join(__dirname, '.env') });

const CORE_DB_URI = process.env.CORE_DB_URI || 'mongodb://127.0.0.1:27017/crm_core';

// The phone numbers to delete (checking both with and without country code)
const targetPhones = [
    '916354070709', '6354070709',
    '917383503632', '7383503632',
    '919924715760', '9924715760',
    '+916354070709', '+917383503632', '+919924715760'
];

const deleteContacts = async () => {
    try {
        console.log('Connecting to core database...', CORE_DB_URI);
        const coreDb = mongoose.createConnection(CORE_DB_URI, { maxPoolSize: 10 });

        coreDb.on('connected', async () => {
            console.log('✅ Connected to core DB successfully.');
            
            // Client Schema Model
            const ClientSchema = new mongoose.Schema({ tenantId: String, name: String }, { strict: false });
            const Client = coreDb.model('Client', ClientSchema);
            
            const clients = await Client.find({});
            console.log(`Found ${clients.length} clients.`);

            for (const client of clients) {
                if (!client.tenantId) continue;
                
                console.log(`\n--- Searching in Tenant: ${client.tenantId} ---`);
                
                // Tenant DB connection
                const tenantUri = `mongodb://127.0.0.1:27017/tenant_${client.tenantId}`;
                const tenantDb = mongoose.createConnection(tenantUri, { maxPoolSize: 10 });
                
                try {
                    await new Promise((resolve, reject) => {
                       tenantDb.on('connected', resolve);
                       tenantDb.on('error', reject);
                    });
                    
                    const ContactSchema = new mongoose.Schema({ phone: String }, { strict: false });
                    const MessageSchema = new mongoose.Schema({ contactId: mongoose.Schema.Types.ObjectId }, { strict: false });
                    
                    const Contact = tenantDb.model('Contact', ContactSchema);
                    const Message = tenantDb.model('Message', MessageSchema);
                    
                    // Find the contacts
                    const contactsToDelete = await Contact.find({ phone: { $in: targetPhones } });

                    if (contactsToDelete.length === 0) {
                        console.log('No matching contacts found in this tenant.');
                    } else {
                        for (const contact of contactsToDelete) {
                            console.log(`🗑️ Deleting Contact: ${contact.phone} (ID: ${contact._id})`);
                            
                            // Delete Messages for this contact
                            const msgRes = await Message.deleteMany({ contactId: contact._id });
                            console.log(`   -> Deleted ${msgRes.deletedCount} chat messages.`);
                            
                            // Delete the Contact itself
                            await Contact.deleteOne({ _id: contact._id });
                            console.log(`   -> Contact deleted successfully.`);
                        }
                    }
                } catch (err) {
                    console.log(`❌ Error connecting to tenant DB: ${err.message}`);
                } finally {
                    await tenantDb.close();
                }
            }
            
            await coreDb.close();
            console.log('\n✅ Cleanup Finished.');
            process.exit(0);
        });

        coreDb.on('error', (err) => {
            console.error('❌ Core DB connection error:', err);
            process.exit(1);
        });

    } catch (e) {
        console.error('❌ General Error:', e.message);
        process.exit(1);
    }
};

deleteContacts();
