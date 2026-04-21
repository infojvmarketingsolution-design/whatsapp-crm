const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../.env') });

const Client = require('../src/models/core/Client');
const User = require('../src/models/core/User');

const mapping = [
  { match: 'gandhinagar', number: '6354070709' },
  { match: 'vidhyadeep', number: '9924515760' },
  { match: 'shreyarth', number: '9106763866' },
  { match: 'progressive', number: '9904015760' },
  { match: 'rai', number: '9904015760' },
  { match: 'j.v', number: '6359700606' }
];

async function migrate() {
  try {
    await mongoose.connect(process.env.CORE_DB_URI || 'mongodb://127.0.0.1:27017/crm_core');
    console.log('🚀 Connected to Core Database');

    const clients = await Client.find({});
    console.log(`🔍 Found ${clients.length} clients to check...`);

    for (const client of clients) {
      const name = client.name.toLowerCase();
      const match = mapping.find(m => name.includes(m.match));

      if (match) {
        console.log(`✨ Matching "${client.name}" to number ${match.number}`);
        
        // Update Client
        client.mobileNumber = match.number;
        await client.save();

        // Update Admin User(s) for this tenant
        const results = await User.updateMany(
          { tenantId: client.tenantId, role: 'ADMIN' },
          { phoneNumber: match.number }
        );
        console.log(`   ✅ Updated Client and ${results.modifiedCount} Admin User(s)`);
      }
    }

    console.log('🎉 Migration completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
}

migrate();
