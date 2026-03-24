const mongoose = require('mongoose');

const ClientSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  phone: { type: String },
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
  subscriptionEndsAt: Date,
  maxMessagesPerDay: { type: Number, default: 1000 }
}, { timestamps: true });

module.exports = mongoose.model('Client', ClientSchema);
