const mongoose = require('mongoose');

const CampaignSchema = new mongoose.Schema({
  name: { type: String, required: true },
  whatsappNumber: { type: String },
  templateId: { type: mongoose.Schema.Types.ObjectId, ref: 'Template' },
  status: { type: String, enum: ['DRAFT', 'SCHEDULED', 'RUNNING', 'PAUSED', 'COMPLETED', 'FAILED'], default: 'DRAFT' },
  scheduledAt: { type: Date },
  audience: {
    tags: [{ type: String }],
    segments: [{ type: String }]
  },
  metrics: {
    totalContacts: { type: Number, default: 0 },
    sent: { type: Number, default: 0 },
    delivered: { type: Number, default: 0 },
    read: { type: Number, default: 0 },
    failed: { type: Number, default: 0 }
  },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, { timestamps: true });

module.exports = CampaignSchema;
