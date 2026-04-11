const mongoose = require('mongoose');
require('dotenv').config();

const connectDB = async () => {
  try {
    const uri = process.env.CORE_DB_URI || 'mongodb://127.0.0.1:27017/crm_core';
    await mongoose.connect(uri);
    console.log('Connected to DB');

    const User = mongoose.model('User', new mongoose.Schema({}, { strict: false }));
    const Client = mongoose.model('Client', new mongoose.Schema({}, { strict: false }));

    const client = await Client.findOne({ companyName: 'JV Group' });
    console.log('\n--- CLIENT INFO ---');
    console.log(JSON.stringify(client, null, 2));

    if (client) {
      const users = await User.find({ 
        $or: [
          { tenantId: client.tenantId },
          { email: client.email }
        ]
      });
      console.log('\n--- ASSOCIATED USERS ---');
      console.log(JSON.stringify(users, null, 2));
    }

    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
};

connectDB();
