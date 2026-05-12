const mongoose = require('mongoose');

async function run() {
    try {
        await mongoose.connect('mongodb://127.0.0.1:27017/crm_core');
        console.log('Connected to MongoDB');
        const db = mongoose.connection.db;

        const adminDb = db.admin();
        const dbsInfo = await adminDb.listDatabases();
        
        let found = false;

        for (const dbInfo of dbsInfo.databases) {
            // Ignore system databases
            if (['admin', 'config', 'local'].includes(dbInfo.name)) continue;

            const targetDbConn = await mongoose.createConnection(`mongodb://127.0.0.1:27017/${dbInfo.name}`).asPromise();
            
            const collections = await targetDbConn.db.collections();
            for (let collection of collections) {
                const docs = await collection.find({}).toArray();
                for (const d of docs) {
                    const str = JSON.stringify(d);
                    if (str.includes('6351826262')) {
                        found = true;
                        console.log(`\nFound match in ${dbInfo.name}.${collection.collectionName}`);
                        console.log(JSON.stringify(d, null, 2));
                    }
                }
            }
            
            await targetDbConn.close();
        }

        if (!found) {
            console.log('\nStill nothing found anywhere.');
        }

        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}
run();
