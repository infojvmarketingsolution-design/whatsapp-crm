const mongoose = require('mongoose');
require('dotenv').config({ path: '../.env' });
const Client = require('../src/models/core/Client');

async function updateConfig() {
  try {
    const uri = process.env.CORE_DB_URI || 'mongodb://127.0.0.1:27017/crm_core';
    console.log('Connecting to MongoDB at', uri);
    await mongoose.connect(uri, { serverSelectionTimeoutMS: 15000 });
    console.log('✅ Connected to MongoDB');

    const client = await Client.findOne({ 
      $or: [
        { name: { $regex: /shreyarth/i } },
        { companyName: { $regex: /shreyarth/i } }
      ]
    });

    if (!client) {
      console.log('❌ Shreyarth university client not found in the database!');
      process.exit(1);
    }

    client.whatsappConfig = {
      phoneNumberId: '1074613152404424',
      wabaId: '1433761851305451',
      accessToken: 'EAAUZAwz8PZCJABRfcA4XgJmp8UzJ4ixXbpVA7CvnldS3pkDXdUkbtE2hyfYFHYsZAcZBgKaDwGpHCLf5N0iQfCTfJZAu0iwLmhrbcy2TON4DBvkEeZBZCKhLsSnZCF0ZBASOjWQwtv8ZA2mSZC2ZB0UtQiWcvuPwukLlzAJbLqdkkkW7QPNzJZAWVUKZAQEnPYo2wxzQZDZD',
      phoneNumber: '+91 63566 00606',
      wabaName: 'Shreyarth university'
    };

    await client.save();
    console.log('✅ Successfully updated WhatsApp Config for:', client.companyName || client.name);
    process.exit(0);
  } catch (err) {
    console.error('❌ Error in script:', err);
    process.exit(1);
  }
}

updateConfig();
