const mongoose = require('mongoose');

const UserSessionSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  tenantId: { type: String }, // Optional for SuperAdmins
  userName: { type: String, required: true },
  userRole: { type: String, required: true },
  loginAt: { type: Date, default: Date.now },
  logoutAt: { type: Date },
  lastActivityAt: { type: Date, default: Date.now },
  status: { type: String, enum: ['ACTIVE', 'LOGGED_OUT', 'TIMEOUT'], default: 'ACTIVE' },
  activitySummary: [{
    action: String,
    timestamp: { type: Date, default: Date.now }
  }],
  ipAddress: String,
  userAgent: String
}, { timestamps: true });

// Virtual for duration in minutes
UserSessionSchema.virtual('duration').get(function() {
  const end = this.logoutAt || this.lastActivityAt;
  const diffMs = end - this.loginAt;
  return Math.floor(diffMs / 60000); // Minutes
});

UserSessionSchema.set('toJSON', { virtuals: true });
UserSessionSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('UserSession', UserSessionSchema);
