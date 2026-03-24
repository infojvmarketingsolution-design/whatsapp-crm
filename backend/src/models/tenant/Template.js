const mongoose = require('mongoose');

const TemplateSchema = new mongoose.Schema({
  name: { type: String, required: true },
  externalId: { type: String }, // WhatsApp template ID
  category: { type: String, enum: ['MARKETING', 'UTILITY', 'AUTHENTICATION'] },
  language: { type: String, default: 'en' },
  status: { type: String, enum: ['APPROVED', 'PENDING', 'REJECTED'] },
  components: { type: mongoose.Schema.Types.Mixed },
  variables: [{ type: String }]
}, { timestamps: true });

module.exports = TemplateSchema;
