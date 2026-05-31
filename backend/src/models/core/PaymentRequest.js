const mongoose = require('mongoose');

const PaymentRequestSchema = new mongoose.Schema({
  clientId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Client',
    required: true
  },
  tenantId: {
    type: String,
    required: true
  },
  category: {
    type: String,
    enum: ['MARKETING', 'UTILITY', 'AUTHENTICATION', 'SERVICE'],
    required: true
  },
  messageQuantity: {
    type: Number,
    required: true
  },
  amount: {
    type: Number,
    required: true
  },
  utrNumber: {
    type: String,
    required: true
  },
  status: {
    type: String,
    enum: ['PENDING', 'APPROVED', 'REJECTED'],
    default: 'PENDING'
  },
  rejectedMessageNotifiedCount: {
    type: Number,
    default: 0
  }
}, { timestamps: true });

module.exports = mongoose.model('PaymentRequest', PaymentRequestSchema);
