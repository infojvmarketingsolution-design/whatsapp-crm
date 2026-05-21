const mongoose = require('mongoose');
require('dotenv').config({ path: __dirname + '/../.env' }); // Adjust path if necessary

async function run() {
    try {
        console.log("Connecting to database...");
        await mongoose.connect(process.env.CORE_DB_URI || process.env.MONGO_URI);
        console.log("Connected to MongoDB.");

        const admin = mongoose.connection.db.admin();
        const { databases } = await admin.listDatabases();

        let totalUpdated = 0;

        for (const dbInfo of databases) {
            // Only target tenant databases
            if (!dbInfo.name.startsWith('tenant_')) continue;

            const tDb = mongoose.connection.useDb(dbInfo.name.replace('tenant_', ''));
            const Contact = tDb.collection('contacts');

            // Find all contacts that have collectionAmount or pendingCollectionAmount
            const cursor = Contact.find({
                $or: [
                    { collectionAmount: { $exists: true } },
                    { pendingCollectionAmount: { $exists: true } }
                ]
            });

            const bulkOps = [];

            await cursor.forEach(doc => {
                let needsUpdate = false;
                const updateDoc = {};

                const cleanNumber = (val) => {
                    if (val === undefined || val === null || val === "") return 0;
                    if (typeof val === 'number') return val;
                    if (typeof val === 'string') {
                        // Remove commas, currency symbols, and spaces
                        const cleaned = val.replace(/[^0-9.-]+/g, "");
                        const num = parseFloat(cleaned);
                        return isNaN(num) ? 0 : num;
                    }
                    return 0;
                };

                const oldCol = doc.collectionAmount;
                const newCol = cleanNumber(oldCol);
                if (oldCol !== newCol && typeof oldCol !== 'number') {
                    updateDoc.collectionAmount = newCol;
                    needsUpdate = true;
                }

                const oldPending = doc.pendingCollectionAmount;
                const newPending = cleanNumber(oldPending);
                if (oldPending !== newPending && typeof oldPending !== 'number') {
                    updateDoc.pendingCollectionAmount = newPending;
                    needsUpdate = true;
                }

                if (needsUpdate) {
                    bulkOps.push({
                        updateOne: {
                            filter: { _id: doc._id },
                            update: { $set: updateDoc }
                        }
                    });
                }
            });

            if (bulkOps.length > 0) {
                console.log(`Updating ${bulkOps.length} contacts in database: ${dbInfo.name}`);
                await Contact.bulkWrite(bulkOps);
                totalUpdated += bulkOps.length;
            }
        }

        console.log(`\nSuccess! Fixed collection amounts for ${totalUpdated} total contacts across all tenants.`);
    } catch (err) {
        console.error("Error running script:", err);
    } finally {
        await mongoose.disconnect();
        process.exit(0);
    }
}

run();
