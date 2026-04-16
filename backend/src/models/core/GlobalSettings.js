const mongoose = require('mongoose');

const GlobalSettingsSchema = new mongoose.Schema({
  platformName: { type: String, default: 'WhatsApp API SaaS' },
  maintenanceMode: { type: Boolean, default: false },
  allowedModules: {
    chat: { type: Boolean, default: true },
    crm: { type: Boolean, default: true },
    campaigns: { type: Boolean, default: true },
    flows: { type: Boolean, default: true },
    api: { type: Boolean, default: true },
    webWidget: { type: Boolean, default: true }
  },
  apiLimits: {
    defaultMessagesPerDay: { type: Number, default: 1000 },
    maxTenants: { type: Number, default: 100 }
  },
  systemConfigs: {
    metaApiVersion: { type: String, default: 'v19.0' },
    webhookUrl: { type: String, default: '' }
  }
}, { timestamps: true });

module.exports = mongoose.model('GlobalSettings', GlobalSettingsSchema);
