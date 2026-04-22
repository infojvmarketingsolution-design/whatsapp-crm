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

module.exports = mongoose.model('Client', ClientSchema);
