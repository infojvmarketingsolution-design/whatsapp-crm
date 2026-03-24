const mongoose = require('mongoose');

const WorkspaceSettingsSchema = new mongoose.Schema({
  name: { type: String, default: 'My Workspace' },
  logoUrl: { type: String, default: null },
  timezone: { type: String, default: 'UTC' },
  language: { type: String, default: 'en' },
  industry: { type: String, default: 'Other' },
  customDomain: { type: String, default: null },
});

const WhatsAppSettingsSchema = new mongoose.Schema({
  phoneNumberId: { type: String, default: null },
  wabaId: { type: String, default: null },
  accessToken: { type: String, default: null },
  phoneNumber: { type: String, default: null },
  defaultSender: { type: String, default: null },
  optInHandling: { type: Boolean, default: false }
});

const CRMSettingsSchema = new mongoose.Schema({
  defaultPipelineId: { type: String, default: null },
  duplicateDetection: { type: Boolean, default: true },
  autoAssignment: { type: Boolean, default: false }
});

const AutomationSettingsSchema = new mongoose.Schema({
  botEnabled: { type: Boolean, default: false },
  fallbackToHuman: { type: Boolean, default: true },
  workingHours: { type: Object, default: {} },
  rateLimit: { type: Number, default: 0 }
});

const SettingsSchema = new mongoose.Schema({
  tenantId: { type: String, required: true, unique: true },
  workspace: { type: WorkspaceSettingsSchema, default: () => ({}) },
  whatsapp: { type: WhatsAppSettingsSchema, default: () => ({}) },
  crm: { type: CRMSettingsSchema, default: () => ({}) },
  automation: { type: AutomationSettingsSchema, default: () => ({}) },
  notifications: {
    email: { type: Boolean, default: true },
    whatsapp: { type: Boolean, default: true },
    inApp: { type: Boolean, default: true }
  },
  customization: {
    themeColor: { type: String, default: '#10b981' }, // Teal default
    customLogin: { type: Boolean, default: false }
  }
}, { timestamps: true });

module.exports = mongoose.model('Settings', SettingsSchema);
