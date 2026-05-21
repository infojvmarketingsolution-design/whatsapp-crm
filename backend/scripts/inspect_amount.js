const mongoose = require('mongoose');
require('dotenv').config({path: '../.env'});

async function main() {
  await mongoose.connect(process.env.MONGO_URI);
  const db = mongoose.connection.useDb('tenant_infojvmarketingsolution-design'); // Wait, the tenant id might be different for "rai university". Let's get all tenants first.
  
  const tenants = await mongoose.connection.db.admin().listDatabases();
  for (let dbInfo of tenants.databases) {
    if (dbInfo.name.startsWith('tenant_')) {
      const tDb = mongoose.connection.useDb(dbInfo.name.replace('tenant_', '')); // mongoose uses raw db name in some versions or prefixes it? Actually, useDb takes the db name. Let's just use the raw name.
      const Contact = tDb.collection('contacts');
      const docs = await Contact.find({ collectionAmount: { $exists: true, $ne: 0 } }).toArray();
      if (docs.length > 0) {
        console.log(`Database: ${dbInfo.name}`);
        console.log(docs.map(d => ({ id: d._id, amount: d.collectionAmount, type: typeof d.collectionAmount })));
      }
    }
  }
  process.exit(0);
}
main();
