const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');
const Client = require('./src/models/core/Client');

dotenv.config();

const migrate = async () => {
  try {
    await mongoose.connect(process.env.CORE_DB_URI || 'mongodb://127.0.0.1:27017/crm_core');
    console.log('Connected to Core DB for migration...');

    const result = await Client.updateMany(
      { 
        $or: [
          { maxMessagesPerDay: { $exists: false } },
          { subscriptionEndsAt: { $exists: false } }
        ]
      },
      { 
        $set: { 
          maxMessagesPerDay: 1000,
          subscriptionEndsAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days trial
        }
      }
    );

    console.log(`Migration complete. Updated ${result.modifiedCount} clients.`);
    process.exit(0);
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
};

migrate();
