const mongoose = require('mongoose');

const BotAnalyticsSchema = new mongoose.Schema({
  tenantId: { type: String, required: true },
  contactId: { type: mongoose.Schema.Types.ObjectId, ref: 'Contact' },
  nodeId: { type: String, required: true },
  nodeType: { type: String },
  eventType: { type: String, enum: ['VIEW', 'INTERACTION', 'CONVERSION'], default: 'VIEW' },
  variableName: { type: String },
  variableValue: { type: String },
  timestamp: { type: Date, default: Date.now }
}, { timestamps: true });

// Index for fast analytics queries
BotAnalyticsSchema.index({ tenantId: 1, nodeId: 1, eventType: 1 });

module.exports = BotAnalyticsSchema;
