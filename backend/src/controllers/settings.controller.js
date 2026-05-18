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
    } else {
       let updated = false;
       if (!settings.automation) {
          settings.automation = { botEnabled: false, botMode: 'PRD', aiPrompts: {} };
          updated = true;
       }
       if (!settings.automation.aiPrompts) {
          settings.automation.aiPrompts = {};
          updated = true;
       }
       const qualOptionsCleaned = (settings.automation.aiPrompts.qualificationOptions || []).filter(o => o && o.trim() !== "");
       if (qualOptionsCleaned.length === 0) {
          settings.automation.aiPrompts.qualificationOptions = ['12th Pass', 'Graduation', 'Other'];
          updated = true;
       }
       if (!settings.automation.aiPrompts.programMap || Object.keys(settings.automation.aiPrompts.programMap).length === 0) {
          settings.automation.aiPrompts.programMap = {
            '12th Pass': {
              'Trending Programs': ['B.Voc Cyber Security', 'B.Voc Fintech', 'B.Sc IT Ai & ML', 'B.Sc IT Data Analytics'],
              'Traditional Programs': ['B.Com', 'B.Tech', 'BBA']
            },
            'Graduation': {
              'Master Traditional Program': ['M.Com', 'MBA', 'M.Tech', 'M.Sc', 'Other'],
              'Master Trending Program': [
                'M.Sc IT in Cyber Security & Digital Forensics',
                'M.Sc IT in Cloud Automation',
                'M.Sc IT in Data Analytics',
                'M.Sc IT in Animation, VFX & Game Design',
                'M.Sc IT in Blockchain Technology',
                'M.Sc IT in Software & Mobile App Development'
              ]
            }
          }
          updated = true;
       }
       if (!settings.automation.aiPrompts.prdFlowSteps || settings.automation.aiPrompts.prdFlowSteps.length === 0) {
          settings.automation.aiPrompts.prdFlowSteps = [
            { id: 'ask_name', type: 'NAME_CAPTURE', title: 'Greeting & Name Request', message: 'Welcome to Gandhinagar University 🎓\n\nWe’re excited to help you choose the right career path.\n\nMay I know your name?', image: 'https://wapipulse.com/uploads/prompts/tenant_demo_001/prompt_1774743344804.jpeg' },
            { id: 'qualification', type: 'QUALIFICATION', title: 'Qualification Request', message: 'Nice to meet you {{name}} 😊\n\nPlease select your qualification.' },
            { id: 'program', type: 'PROGRAM_SELECTION', title: 'Program Selection', message: 'Please select your preferred program category.' },
            { id: 'call_time', type: 'CALL_TIME', title: 'Consultation Call', message: 'Excellent choice 🚀\n\nWhen should our counselor contact you?', buttons: ['Morning', 'Afternoon', 'Evening'] },
            { id: 'thank_you', type: 'CUSTOM_MESSAGE', title: 'Thank You Message', message: 'Thank you {{name}} 🙌\n\n🎓 Qualification: {{qualification}}\n📘 Program: {{program}}\n⏰ Time: {{time}}\n\nOur counselor will call you at your preferred time 📞\n\nThank you for your time, {{name}} 😊' }
          ];
          updated = true;
       }
       if (updated) {
          settings.markModified('automation');
          settings.markModified('automation.aiPrompts');
          settings.markModified('automation.aiPrompts.qualificationOptions');
          settings.markModified('automation.aiPrompts.programMap');
          settings.markModified('automation.aiPrompts.prdFlowSteps');
          await settings.save();
          console.log("✅ Seeded default settings for tenant:", tenantId);
       }
    }

    console.log("Tenant:", tenantId, "qualificationOptions:", settings?.automation?.aiPrompts?.qualificationOptions);
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
    settings.markModified(category);
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

    const fileExt = path.extname(req.file.originalname).toLowerCase();
    if (fileExt === '.webp') {
      return res.status(400).json({ error: 'Meta API does not support WebP images. Please upload a PNG or JPEG.' });
    }

    const tenantId = req.tenantId;
    const targetDir = path.join(__dirname, '../../uploads/prompts', tenantId);
    
    if (!fs.existsSync(targetDir)) {
      fs.mkdirSync(targetDir, { recursive: true });
    }

    const originalExt = path.extname(req.file.originalname);
    const fileName = `prompt_${Date.now()}${originalExt}`;
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
exports.uploadBranding = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No logo file uploaded' });
    }

    const tenantId = req.tenantId;
    const targetDir = path.join(__dirname, '../../uploads/branding', tenantId);
    
    if (!fs.existsSync(targetDir)) {
      fs.mkdirSync(targetDir, { recursive: true });
    }

    const fileExt = path.extname(req.file.originalname);
    const fileName = `logo_${Date.now()}${fileExt}`;
    const targetPath = path.join(targetDir, fileName);

    fs.renameSync(req.file.path, targetPath);

    const protocol = req.protocol === 'http' && req.get('host').includes('localhost') ? 'http' : 'https';
    const host = req.get('host');
    const publicUrl = `${protocol}://${host}/uploads/branding/${tenantId}/${fileName}`;
    
    res.json({ success: true, url: publicUrl });
  } catch (err) {
    console.error('Error uploading branding logo:', err);
    res.status(500).json({ error: 'Failed to upload logo' });
  }
};
