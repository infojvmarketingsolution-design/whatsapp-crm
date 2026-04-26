const Settings = require('../models/core/Settings');
const mongoose = require('mongoose');
const path = require('path');
const fs = require('fs');

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
          automation: { 
            botEnabled: false, 
            botMode: 'PRD',
            customGreetingFlowId: null,
            fallbackToHuman: true, 
            rateLimit: 50,
            aiPrompts: {
              greetingMessage: 'Hello 👋 Welcome to JV Marketing Education Support!\n\nWe help you choose the best career path 🚀\n\nMay I know your name?',
              greetingImage: '',
              namePrompt: 'Great! May I know your name?',
              programListPrompt: '{{name}}, which career path or program are you interested in?',
              successProofMessage: '🎉 Success Stories, {{name}}!\n\nOur students are already working in top companies 🚀\nYou could be next!',
              successProofImage: '',
              callTimePrompt: '{{name}}, what is your preferred time for our counsellor to call you? 📞',
              agentTransferPrompt: 'Transferring you to a human agent... 👨‍💻',
              fallbackMessage: "I'm sorry, I didn't quite get that. Could you please rephrase?"
            }
          },
          security: {
            autoBackup: true,
            gdprConsentTracker: true,
            dataRetention: '365',
            firewallRules: []
          },
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
           security: { ...defaultSettings.security, ...currentOfflineSettings.security },
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

    const validCategories = ['workspace', 'whatsapp', 'crm', 'automation', 'security', 'notifications', 'customization', 'roleAccess'];
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
    if (category === 'roleAccess') {
       settings.set('roleAccess', updates);
    } else {
       const currentData = (settings[category] && typeof settings[category].toObject === 'function') 
           ? settings[category].toObject() 
           : (settings[category] || {});
       settings[category] = { ...currentData, ...updates };
    }
    await settings.save();
    
    res.json(settings);
  } catch (err) {
    console.error('Error updating settings:', err);
    res.status(500).json({ error: 'Failed to update settings' });
  }
};

exports.uploadImage = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No image file uploaded' });
    }

    const tenantId = req.tenantId;
    const targetDir = path.join(__dirname, '../../uploads/prompts', tenantId);
    
    if (!fs.existsSync(targetDir)) {
      fs.mkdirSync(targetDir, { recursive: true });
    }

    const fileExt = path.extname(req.file.originalname);
    const fileName = `prompt_${Date.now()}${fileExt}`;
    const targetPath = path.join(targetDir, fileName);

    fs.renameSync(req.file.path, targetPath);

    const protocol = req.protocol === 'http' && req.get('host').includes('localhost') ? 'http' : 'https';
    const host = req.get('host');
    const publicUrl = `${protocol}://${host}/uploads/prompts/${tenantId}/${fileName}`;
    
    res.json({ success: true, url: publicUrl });
  } catch (err) {
    console.error('Error uploading setting image:', err);
    res.status(500).json({ error: 'Failed to upload image' });
  }
};
