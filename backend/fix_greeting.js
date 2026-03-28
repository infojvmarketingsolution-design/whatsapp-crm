const mongoose = require('mongoose');
require('dotenv').config();
const Settings = require('./src/models/core/Settings');

async function run() {
  try {
    const mongoUri = 'mongodb://127.0.0.1:27017/crm_core';
    console.log('Connecting to:', mongoUri);
    await mongoose.connect(mongoUri, { serverSelectionTimeoutMS: 5000 });
    console.log('Connected to DB');
    
    const update = {
      'automation.aiPrompts.greetingMessage': 'Hello 👋 Welcome to JV Marketing Education Support!\n\nWe help you choose the best career path 🚀\n\nMay I know your name?'
    };
    
    const res = await Settings.updateOne({}, { $set: update });
    console.log('Update Result:', res);
    
    await mongoose.connection.close();
    process.exit(0);
  } catch (err) {
    console.error('Update Error:', err);
    process.exit(1);
  }
}
run();
