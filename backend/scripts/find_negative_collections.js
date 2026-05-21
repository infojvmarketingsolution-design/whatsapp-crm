const mongoose = require('mongoose');
require('dotenv').config({ path: __dirname + '/../.env' });

async function run() {
    try {
        console.log("Connecting to database...");
        await mongoose.connect(process.env.CORE_DB_URI || process.env.MONGO_URI);
        console.log("Connected to MongoDB.\n");

        const admin = mongoose.connection.db.admin();
        const { databases } = await admin.listDatabases();

        let foundAny = false;

        for (const dbInfo of databases) {
            if (!dbInfo.name.startsWith('jv_tenant_') && !dbInfo.name.startsWith('tenant_')) continue;

            const tDb = mongoose.connection.useDb(dbInfo.name);
            const Contact = tDb.collection('contacts');

            // Find contacts where collectionAmount is less than 0
            const badContacts = await Contact.find({ collectionAmount: { $lt: 0 } }).toArray();

            if (badContacts.length > 0) {
                foundAny = true;
                console.log(`\n=== Found ${badContacts.length} negative collections in tenant: ${dbInfo.name} ===`);
                badContacts.forEach(c => {
                    console.log(`Lead Name: ${c.name} | Phone: ${c.phone} | collectionAmount: ${c.collectionAmount}`);
                });
            }
        }

        if (!foundAny) {
            console.log("No contacts with negative collection amounts were found.");
            // Just in case, let's also find what the actual total sum is for each tenant to debug
            console.log("\nCalculating actual sums to verify...");
            for (const dbInfo of databases) {
                if (!dbInfo.name.startsWith('jv_tenant_') && !dbInfo.name.startsWith('tenant_')) continue;
                const tDb = mongoose.connection.useDb(dbInfo.name);
                const Contact = tDb.collection('contacts');
                const sum = await Contact.aggregate([
                    { $group: { _id: null, total: { $sum: "$collectionAmount" } } }
                ]).toArray();
                if (sum.length > 0 && sum[0].total !== 0) {
                    console.log(`${dbInfo.name} -> Total DB Sum: ${sum[0].total}`);
                }
            }
        }

    } catch (err) {
        console.error("Error:", err);
    } finally {
        await mongoose.disconnect();
        process.exit(0);
    }
}

run();
