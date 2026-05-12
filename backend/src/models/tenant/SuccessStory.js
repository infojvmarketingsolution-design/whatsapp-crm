const mongoose = require('mongoose');

const SuccessStorySchema = new mongoose.Schema({
  studentName: { type: String, required: true },
  program: { type: String },
  company: { type: String },
  package: { type: String },
  quote: { type: String },
  mediaUrl: { type: String },
  mediaType: { type: String, enum: ['image', 'video'], default: 'image' },
  status: { type: String, enum: ['ACTIVE', 'INACTIVE'], default: 'ACTIVE' }
}, { timestamps: true });

module.exports = SuccessStorySchema;
