const mongoose = require('mongoose');

const nodeSchema = new mongoose.Schema({
  id: { type: String, required: true },
  type: { type: String, required: true },
  position: {
    x: { type: Number, required: true },
    y: { type: Number, required: true }
  },
  data: { type: mongoose.Schema.Types.Mixed, default: {} }
}, { _id: false });

const edgeSchema = new mongoose.Schema({
  id: { type: String, required: true },
  source: { type: String, required: true },
  target: { type: String, required: true },
  sourceHandle: { type: String },
  targetHandle: { type: String }
}, { _id: false });

const FlowSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please provide a flow name'],
    trim: true,
  },
  description: {
    type: String,
    default: ''
  },
  status: {
    type: String,
    enum: ['DRAFT', 'ACTIVE', 'PAUSED'],
    default: 'DRAFT',
  },
  triggerType: {
    type: String,
    enum: ['KEYWORD', 'NEW_MESSAGE', 'CAMPAIGN_REPLY', 'API', 'MANUAL'],
    default: 'KEYWORD'
  },
  triggerKeywords: {
    type: [String],
    default: []
  },
  isSmartMatch: {
    type: Boolean,
    default: false
  },
  nodes: {
    type: [nodeSchema],
    default: []
  },
  edges: {
    type: [edgeSchema],
    default: []
  },
  metrics: {
    triggeredCount: { type: Number, default: 0 },
    completionCount: { type: Number, default: 0 },
  },
  version: { type: Number, default: 1 }
}, {
  timestamps: true,
});

module.exports = FlowSchema;
