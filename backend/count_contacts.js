const mongoose = require('mongoose');

async function run() {
    try {
        await mongoose.connect('mongodb://127.0.0.1:27017/crm_core');
        const db = mongoose.connection.db;
        const adminDb = db.admin();
        const dbsInfo = await adminDb.listDatabases();
        
        for (const dbInfo of dbsInfo.databases) {
            if (dbInfo.name.includes('tenant_')) {
                const tenantDbConn = await mongoose.createConnection(`mongodb://127.0.0.1:27017/${dbInfo.name}`).asPromise();
                const Contact = tenantDbConn.collection('contacts');
                const count = await Contact.countDocuments();
                console.log(`${dbInfo.name} -> ${count} contacts`);
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
