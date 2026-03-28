const mongoose = require('mongoose');
require('dotenv').config();

async function run() {
  try {
    const mongoUri = 'mongodb://127.0.0.1:27017/crm_core';
    console.log('Connecting to:', mongoUri);
    await mongoose.connect(mongoUri, { serverSelectionTimeoutMS: 5000 });
    console.log('Connected to DB');
    
    const db = mongoose.connection.db;
    const collections = await db.listCollections().toArray();
    console.log('--- ALL COLLECTIONS IN crm_core ---');
    console.log(collections.map(c => c.name));

    // Try to find ANY collection that might have settings
    const searchTerms = ['setting', 'client', 'tenant'];
    for (const collInfo of collections) {
      const collName = collInfo.name;
      if (searchTerms.some(term => collName.toLowerCase().includes(term))) {
        console.log(`Checking collection: ${collName}`);
        const count = await db.collection(collName).countDocuments();
        console.log(`- Count: ${count}`);
        
        if (count > 0) {
          const doc = await db.collection(collName).findOne({});
          console.log(`- Sample Doc keys: ${Object.keys(doc)}`);
          
          // If it looks like a settings doc, update it!
          if (doc.automation || doc.tenantId) {
            console.log(`Updating ${collName}...`);
            const updateRes = await db.collection(collName).updateMany({}, {
              $set: {
                'automation.aiPrompts.greetingMessage': 'Hello 👋 Welcome to JV Marketing Education Support!\n\nWe help you choose the best career path 🚀\n\nMay I know your name?'
              }
            });
            console.log(`- Update Result:`, updateRes);
          }
        }
      }
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
