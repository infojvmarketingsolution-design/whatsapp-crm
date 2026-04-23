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
  currentFlowId: { type: mongoose.Schema.Types.ObjectId, ref: 'Flow' }, // [RENAMED from lastFlowId]
  flowVariables: { type: mongoose.Schema.Types.Mixed, default: {} },
  isFlowActive: { type: Boolean, default: false },
  flowVersion: { type: Number, default: 1 },
  lastProcessedMessageId: { type: String },
  lastExecutedNode: { type: String }, // Node ID for session tracking (prevents duplicate sends)
  flowSnapshot: {
    nodes: { type: Array, default: [] },
    edges: { type: Array, default: [] }
  },
  email: { type: String },
  address: { type: String },
  pincode: { type: String },
  state: { type: String },
  // AI Bot & PRD Specific explicit fields
  qualification: { type: String },
  selectedProgram: { type: String },
  preferredCallTime: { type: String },
  score: { type: Number, default: 0 },
  heatLevel: { type: String, enum: ['Cold', 'Warm', 'Hot'], default: 'Cold' },
  budget: { type: String }, // e.g. "< 50k", "50k-1L", "> 1L"
  purchaseTimeline: { type: String }, // e.g. "Immediate", "1-3 Months"
  decisionMakerStatus: { type: String }, // e.g. "Self", "Family", "Other"
  profession: { type: String },
  companyName: { type: String },
  linkedinUrl: { type: String },
  firstName: { type: String },
  lastName: { type: String },
  secondaryPhone: { type: String },
  altMobile: { type: String },
  statusUpdatedAt: { type: Date, default: Date.now },
  interests: [{ type: String }],
  leadConsiderDate: { type: Date },
  pipelineStage: { type: String, enum: ['Discovery', 'Qualified', 'Proposal', 'Negotiation', 'Closing', 'Won', 'Lost'], default: 'Discovery' },
  estimatedValue: { type: Number, default: 0 },
  leadSource: { type: String, default: 'Manual Entry' },
  nextFollowUp: { type: Date },
  // Counselling & Admission Tracking
  visitStatus: { type: String, default: 'Not Done' }, // 'Done', 'Not Done'
  visitType: { type: String }, // 'University Visit', 'Campus Visit'
  admissionStatus: { type: String, enum: ['None', 'Pending', 'Admitted', 'Cancelled'], default: 'None' },
  houseNo: { type: String },
  societyName: { type: String },
  streetAddress: { type: String },
  city: { type: String },
  collectionAmount: { type: Number, default: 0 },
  pendingCollectionAmount: { type: Number, default: 0 },
  isClosed: { type: Boolean, default: false },
  isArchived: { type: Boolean, default: false },
  assignedCounsellor: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  meetingType: { type: String }, 
  meetingRemark: { type: String }
}, { timestamps: true });

// Exporting Schema, not model, because models are bound to tenant DB dynamically
module.exports = ContactSchema;
