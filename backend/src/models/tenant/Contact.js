const mongoose = require('mongoose');

const ContactSchema = new mongoose.Schema({
  phone: { type: String, required: true, unique: true },
  name: { type: String },
  tags: [{ type: String }],
  optInStatus: { type: Boolean, default: true },
  assignedAgent: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  status: { type: String, enum: ['LEAD', 'NEW LEAD', 'CONTACTED', 'INTERESTED', 'FOLLOW_UP', 'CLOSED_WON', 'CLOSED_LOST'], default: 'NEW LEAD' },
  notes: [{ content: String, createdBy: String, createdAt: { type: Date, default: Date.now } }],
  timeline: [{ eventType: String, description: String, timestamp: { type: Date, default: Date.now } }],
  tasks: [{ 
    type: { type: String, enum: ['MEETING', 'FOLLOW_UP', 'CALL'] },
    title: String,
    description: String,
    dueDate: Date,
    status: { type: String, enum: ['PENDING', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'], default: 'PENDING' },
    outcome: String,
    metadata: mongoose.Schema.Types.Mixed
  }],
  lastActivity: { type: Date },
  lastMessageAt: { type: Date },
  currentFlowStep: { type: String }, // Node ID for session tracking
  lastFlowId: { type: mongoose.Schema.Types.ObjectId, ref: 'Flow' },
  flowVariables: { type: mongoose.Schema.Types.Mixed, default: {} },
  email: { type: String },
  address: { type: String },
  // AI Bot & PRD Specific explicit fields
  qualification: { type: String },
  selectedProgram: { type: String },
  preferredCallTime: { type: String },
  score: { type: Number, default: 0 },
  heatLevel: { type: String, enum: ['Cold', 'Warm', 'Hot'], default: 'Cold' },
  budget: { type: String }, // e.g. "< 50k", "50k-1L", "> 1L"
  purchaseTimeline: { type: String }, // e.g. "Immediate", "1-3 Months"
  decisionMakerStatus: { type: String }, // e.g. "Self", "Family", "Other"
  isArchived: { type: Boolean, default: false }
}, { timestamps: true });

// Exporting Schema, not model, because models are bound to tenant DB dynamically
module.exports = ContactSchema;
