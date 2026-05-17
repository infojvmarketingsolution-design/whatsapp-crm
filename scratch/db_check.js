const mongoose = require('mongoose');

async function run() {
    try {
        await mongoose.connect('mongodb://127.0.0.1:27017/crm_core');
        console.log('✅ Connected to crm_core');
        
        // 1. List core users
        const User = mongoose.connection.model('User', new mongoose.Schema({}, { strict: false }), 'users');
        const users = await User.find({}).lean();
        console.log('\n--- CORE USERS ---');
        users.forEach(u => {
            console.log(`ID: ${u._id} | Name: ${u.name} | Email: ${u.email} | Role: ${u.role} | TenantId: ${u.tenantId}`);
        });

        // 2. List databases
        const db = mongoose.connection.db;
        const adminDb = db.admin();
        const dbsInfo = await adminDb.listDatabases();
        
        for (const dbInfo of dbsInfo.databases) {
            if (dbInfo.name.includes('tenant_')) {
                console.log(`\n--- TENANT DB: ${dbInfo.name} ---`);
                const tenantDbConn = await mongoose.createConnection(`mongodb://127.0.0.1:27017/${dbInfo.name}`).asPromise();
                
                // Get Contacts
                const Contact = tenantDbConn.collection('contacts');
                const totalContacts = await Contact.countDocuments();
                console.log(`Total Contacts: ${totalContacts}`);
                
                if (totalContacts > 0) {
                    const sampleContacts = await Contact.find({}).limit(5).toArray();
                    console.log('Sample Contacts:');
                    sampleContacts.forEach(c => {
                        console.log(`- ID: ${c._id} | Name: ${c.name} | Status: ${c.status} | CreatedAt: ${c.createdAt}`);
                        console.log(`  assignedAgent type: ${typeof c.assignedAgent} | Value: ${c.assignedAgent}`);
                        console.log(`  assignedCounsellor type: ${typeof c.assignedCounsellor} | Value: ${c.assignedCounsellor}`);
                        console.log(`  isArchived: ${c.isArchived}`);
                    });
                }
                
                await tenantDbConn.close();
            }
        }
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}
run();
