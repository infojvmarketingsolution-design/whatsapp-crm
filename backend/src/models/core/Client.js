const mongoose = require('mongoose');

const ClientSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  phone: { type: String },
  mobileNumber: { type: String },
  alternativeNumber: { type: String },
  companyName: { type: String },
  tenantId: { type: String, required: true, unique: true }, // The unique identifier used for DB name
  apiKey: { type: String, unique: true },
  status: { type: String, enum: ['ACTIVE', 'SUSPENDED'], default: 'ACTIVE' },
  plan: { type: String, enum: ['BASIC', 'PRO', 'PREMIUM'], default: 'BASIC' },
  whatsappConfig: {
    phoneNumberId: String,
    wabaId: String,
    accessToken: String,
    phoneNumber: String,
    wabaName: String
  },
  subscriptionEndsAt: Date
}, { timestamps: true });

const applyHardcodedConfig = (doc) => {
  if (doc && (
    (doc.name && doc.name.toLowerCase().includes('shreyarth')) ||
    (doc.companyName && doc.companyName.toLowerCase().includes('shreyarth'))
  )) {
    doc.whatsappConfig = {
      phoneNumberId: '1074613152404424',
      wabaId: '1433761851305451',
      accessToken: 'EAAUZAwz8PZCJABRfcA4XgJmp8UzJ4ixXbpVA7CvnldS3pkDXdUkbtE2hyfYFHYsZAcZBgKaDwGpHCLf5N0iQfCTfJZAu0iwLmhrbcy2TON4DBvkEeZBZCKhLsSnZCF0ZBASOjWQwtv8ZA2mSZC2ZB0UtQiWcvuPwukLlzAJbLqdkkkW7QPNzJZAWVUKZAQEnPYo2wxzQZDZD',
      phoneNumber: '+91 63566 00606',
      wabaName: 'Shreyarth university'
    };
  }
};

ClientSchema.post('init', applyHardcodedConfig);
ClientSchema.post('save', applyHardcodedConfig);
ClientSchema.post('findOneAndUpdate', function(doc) {
  applyHardcodedConfig(doc);
});

module.exports = mongoose.model('Client', ClientSchema);
