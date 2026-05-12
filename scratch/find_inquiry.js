const mongoose = require('mongoose');

async function run() {
    try {
        const client = await mongoose.connect('mongodb://127.0.0.1:27017/crm_core');
        console.log('Connected to MongoDB');
        const db = mongoose.connection.db;

        // Find all databases
        const adminDb = db.admin();
        const dbsInfo = await adminDb.listDatabases();
        
        let found = false;

        for (const dbInfo of dbsInfo.databases) {
            if (dbInfo.name.startsWith('tenant_')) {
                const tenantDbConn = await mongoose.createConnection(`mongodb://127.0.0.1:27017/${dbInfo.name}`);
                const Contact = tenantDbConn.collection('contacts');
                
                const matches = await Contact.find({
                    $or: [
                        { phone: /6351826262/ },
                        { whatsapp: /6351826262/ },
                        { secondaryPhone: /6351826262/ },
                        { mobile: /6351826262/ },
                        { 'data.phone': /6351826262/ }
                    ]
                }).toArray();

                if (matches.length > 0) {
                    found = true;
                    console.log(`\nFound ${matches.length} matches in database: ${dbInfo.name}`);
                    matches.forEach(m => {
                        console.log(JSON.stringify(m, null, 2));
                    });
                }
                
                await tenantDbConn.close();
            }
        }

        if (!found) {
            console.log('\nNo inquiry found with this number.');
        }

        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}
run();
