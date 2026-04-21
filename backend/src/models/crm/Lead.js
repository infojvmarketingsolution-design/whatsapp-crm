const mongoose = require('mongoose');

const LeadSchema = new mongoose.Schema({
  name: { type: String, required: true },
  phone: { type: String, required: true },
  email: { type: String },
  message: { type: String },
  source: { type: String, default: 'web_widget' },
  status: { type: String, enum: ['NEW', 'CONTACTED', 'QUALIFIED', 'LOST', 'WON'], default: 'NEW' },
  tags: [{ type: String }],
  // AI Bot specific fields
  qualification: { type: String },
  selectedProgram: { type: String },
  preferredCallTime: { type: String },
  leadSource: { type: String, default: 'whatsapp_ai_bot' },
  assignedAgent: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, { timestamps: true });

module.exports = LeadSchema;
