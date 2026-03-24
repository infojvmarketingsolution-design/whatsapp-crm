const mongoose = require('mongoose');

const PlanSchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true }, // BASIC, PRO, PREMIUM
  price: { type: Number, required: true },
  features: {
    whatsappApi: { type: Boolean, default: true },
    crm: { type: Boolean, default: false },
    campaigns: { type: String, enum: ['LIMITED', 'FULL', 'NONE'], default: 'NONE' },
    automation: { type: String, enum: ['LIMITED', 'FULL', 'NONE'], default: 'NONE' },
    userLimit: { type: Number, default: 1 } // 1, 5, -1 (unlimited)
  }
}, { timestamps: true });

module.exports = mongoose.model('Plan', PlanSchema);
