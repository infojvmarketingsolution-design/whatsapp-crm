const mongoose = require('mongoose');

const CampaignLogSchema = new mongoose.Schema({
  campaignId: { type: mongoose.Schema.Types.ObjectId, ref: 'Campaign', required: true },
  contactId: { type: mongoose.Schema.Types.ObjectId, ref: 'Contact', required: true },
  phone: { type: String, required: true },
  messageId: { type: String, sparse: true },
  status: { type: String, enum: ['PENDING', 'SENT', 'DELIVERED', 'READ', 'FAILED'], default: 'PENDING' },
  errorReason: { type: String },
  sentAt: { type: Date },
  deliveredAt: { type: Date },
  readAt: { type: Date }
}, { timestamps: true });

CampaignLogSchema.index({ campaignId: 1, status: 1 });

module.exports = CampaignLogSchema;
