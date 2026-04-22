const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

const UserSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, default: 'ADMIN' },
  tenantId: { type: String }, // Binds Agents and Admins to explicit SaaS instances
  status: { type: String, enum: ['ACTIVE', 'INACTIVE', 'SUSPENDED'], default: 'ACTIVE' },
  isAvailableForAutoAssign: { type: Boolean, default: true },
  phoneNumber: { type: String },
  lastLeadAssignedAt: { type: Date },
  otp: {
    code: { type: String },
    expiresAt: { type: Date },
    method: { type: String, enum: ['EMAIL', 'SMS', 'WHATSAPP'] }
  },
  fcmTokens: [String] // Store multiple device tokens for cloud messaging
}, { timestamps: true });

UserSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

UserSchema.methods.matchPassword = async function(enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

const User = mongoose.model('User', UserSchema);
if (!mongoose.models.users) {
  mongoose.model('users', UserSchema);
}

module.exports = User;
