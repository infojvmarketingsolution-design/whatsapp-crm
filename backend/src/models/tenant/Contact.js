const mongoose = require('mongoose');

const ContactSchema = new mongoose.Schema({
  phone: { type: String, required: true, unique: true },
  name: { type: String },
  tags: [{ type: String }],
  optInStatus: { type: Boolean, default: true },
  assignedAgent: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  status: { type: String, enum: ['New Lead', 'Interested', 'Follow-up', 'Converted', 'Closed Lost'], default: 'New Lead' },
  notes: [{ content: String, createdBy: String, createdAt: { type: Date, default: Date.now } }],
  timeline: [{ eventType: String, description: String, timestamp: { type: Date, default: Date.now } }],
  tasks: [{ 
    type: { type: String, enum: ['MEETING', 'FOLLOW_UP', 'CALL'] },
    title: String,
    description: String,
    dueDate: Date,
    status: { type: String, enum: ['PENDING', 'COMPLETED', 'CANCELLED'], default: 'PENDING' },
    outcome: String,
    metadata: mongoose.Schema.Types.Mixed
  }],
  lastActivity: { type: Date },
  lastMessageAt: { type: Date }
}, { timestamps: true });

// Exporting Schema, not model, because models are bound to tenant DB dynamically
module.exports = ContactSchema;
