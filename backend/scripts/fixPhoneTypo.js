const mongoose = require('mongoose');
require('dotenv').config();

async function fixTypo() {
  try {
    await mongoose.connect(process.env.CORE_DB_URI || 'mongodb://127.0.0.1:27017/crm_core');
    const User = require('../src/models/core/User');
    const Client = require('../src/models/core/Client');
    
    await User.updateMany(
      { phoneNumber: { $regex: '6359700606' } },
      { $set: { phoneNumber: '6359400606' } }
    );
    
    await Client.updateMany(
      { mobileNumber: { $regex: '6359700606' } },
      { $set: { mobileNumber: '6359400606' } }
    );
    
    console.log('Successfully fixed your phone number in the database.');
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

fixTypo();
