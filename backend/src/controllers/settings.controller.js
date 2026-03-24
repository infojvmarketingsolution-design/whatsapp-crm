const Settings = require('../models/core/Settings');
const mongoose = require('mongoose');

let offlineSettingsStore = {}; // Memory store for offline mode

exports.getSettings = async (req, res) => {
  try {
    const tenantId = req.tenantId;

    if (!tenantId) {
       return res.status(400).json({ error: 'Tenant ID required in request context' });
    }

    if (mongoose.connection.readyState !== 1) {
       const defaultSettings = {
          tenantId,
          workspace: { name: 'Demo Workspace', timezone: 'UTC', language: 'en', industry: 'Other' },
          whatsapp: { defaultSender: null, optInHandling: false },
          crm: { duplicateDetection: true, autoAssignment: false },
          automation: { botEnabled: false, fallbackToHuman: true, rateLimit: 50 },
          notifications: { email: true, whatsapp: true, inApp: true },
          customization: { themeColor: '#10b981', customLogin: false }
       };
       const currentOfflineSettings = offlineSettingsStore[tenantId] || {};
       const mergedSettings = {
           ...defaultSettings,
           workspace: { ...defaultSettings.workspace, ...currentOfflineSettings.workspace },
           whatsapp: { ...defaultSettings.whatsapp, ...currentOfflineSettings.whatsapp },
           crm: { ...defaultSettings.crm, ...currentOfflineSettings.crm },
           automation: { ...defaultSettings.automation, ...currentOfflineSettings.automation },
           notifications: { ...defaultSettings.notifications, ...currentOfflineSettings.notifications },
           customization: { ...defaultSettings.customization, ...currentOfflineSettings.customization }
       };
       return res.json(mergedSettings);
    }

    let settings = await Settings.findOne({ tenantId });
    if (!settings) {
       settings = new Settings({ tenantId });
       await settings.save();
    }

    res.json(settings);
  } catch (err) {
    console.error('Error fetching settings:', err);
    res.status(500).json({ error: 'Failed to fetch settings' });
  }
};

exports.updateSettings = async (req, res) => {
  try {
    const tenantId = req.tenantId;
    const { category } = req.params;
    const updates = req.body;

    if (!tenantId) {
       return res.status(400).json({ error: 'Tenant ID required in request context' });
    }

    const validCategories = ['workspace', 'whatsapp', 'crm', 'automation', 'notifications', 'customization'];
    if (!validCategories.includes(category)) {
       return res.status(400).json({ error: 'Invalid settings category' });
    }

    if (mongoose.connection.readyState !== 1) {
       if (!offlineSettingsStore[tenantId]) {
          offlineSettingsStore[tenantId] = {};
       }
       offlineSettingsStore[tenantId][category] = { ...(offlineSettingsStore[tenantId][category] || {}), ...updates };
       return res.json({ success: true, message: 'Simulated save (DB offline)' });
    }

    let settings = await Settings.findOne({ tenantId });
    if (!settings) {
       settings = new Settings({ tenantId });
    }

    // Merge updates into the specific category
    settings[category] = { ...settings[category]?.toObject(), ...updates };
    
    await settings.save();
    
    res.json(settings);
  } catch (err) {
    console.error('Error updating settings:', err);
    res.status(500).json({ error: 'Failed to update settings' });
  }
};
