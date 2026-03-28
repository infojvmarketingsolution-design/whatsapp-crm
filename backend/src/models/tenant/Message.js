const mongoose = require('mongoose');

const MessageSchema = new mongoose.Schema({
  contactId: { type: mongoose.Schema.Types.ObjectId, ref: 'Contact', required: true },
  messageId: { type: String, required: true, unique: true }, // Meta Message ID
  direction: { type: String, enum: ['INBOUND', 'OUTBOUND'], required: true },
  type: { type: String, enum: ['text', 'image', 'document', 'audio', 'template', 'video', 'interactive', 'button', 'location', 'reaction', 'sticker', 'contacts'], required: true },
  content: { type: mongoose.Schema.Types.Mixed, required: true },
  status: { type: String, enum: ['SENT', 'DELIVERED', 'READ', 'FAILED', 'RECEIVED'], default: 'SENT' },
  timestamp: { type: Date, default: Date.now },
  isInternal: { type: Boolean, default: false }, // Internal Team Note
  sender: { // Attribution for internal notes
    id: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    name: { type: String }
  }
}, { timestamps: true });

// Exporting Schema, not model
module.exports = MessageSchema;
