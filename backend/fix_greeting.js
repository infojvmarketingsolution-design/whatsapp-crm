const mongoose = require('mongoose');
require('dotenv').config();

async function run() {
  try {
    const mongoUri = 'mongodb://127.0.0.1:27017/admin'; // Connect to admin to list all DBs
    console.log('Connecting to:', mongoUri);
    await mongoose.connect(mongoUri, { serverSelectionTimeoutMS: 5000 });
    console.log('Connected to Admin DB');
    
    const admin = mongoose.connection.db.admin();
    const dbs = await admin.listDatabases();
    console.log('--- ALL DATABASES ON SERVER ---');
    dbs.databases.forEach(db => {
      console.log(`- ${db.name} (${db.sizeOnDisk} bytes)`);
    });

    // Strategy 2: For each DB, check for settings
    for (const dbInfo of dbs.databases) {
      if (dbInfo.name === 'admin' || dbInfo.name === 'local' || dbInfo.name === 'config') continue;
      
      const conn = mongoose.createConnection(`mongodb://127.0.0.1:27017/${dbInfo.name}`);
      await conn.asPromise();
      const collections = await conn.db.listCollections().toArray();
      const hasSettings = collections.some(c => c.name.includes('setting'));
      
      if (hasSettings) {
        console.log(`Potential Match: ${dbInfo.name}`);
        const coll = conn.db.collection('settings');
        const count = await coll.countDocuments();
        console.log(`- settings count: ${count}`);
        
        if (count > 0) {
          console.log(`Updating ${dbInfo.name}.settings...`);
          const res = await coll.updateMany({}, {
            $set: {
              'automation.aiPrompts.greetingMessage': 'Hello 👋 Welcome to JV Marketing Education Support!\n\nWe help you choose the best career path 🚀\n\nMay I know your name?'
            }
          });
          console.log(`- Update Result:`, res);
        }
      }
      await conn.close();
    }
    
    await mongoose.connection.close();
    console.log('Fin.')
    process.exit(0);
  } catch (err) {
    console.error('Diagnostic Error:', err);
    process.exit(1);
  }
}
run();
