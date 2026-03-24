const mongoose = require('mongoose');

const LeadSchema = new mongoose.Schema({
  name: { type: String, required: true },
  phone: { type: String, required: true },
  email: { type: String },
  message: { type: String },
  source: { type: String, default: 'web_widget' },
  status: { type: String, enum: ['New Lead', 'Interested', 'Follow-up', 'Converted', 'Closed Lost'], default: 'New Lead' },
  tags: [{ type: String }]
}, { timestamps: true });

module.exports = LeadSchema;
