const { getTenantConnection } = require('../config/db');
const fs = require('fs');
const Client = require('../models/core/Client');
const ContactSchema = require('../models/tenant/Contact');
const MessageSchema = require('../models/tenant/Message');
const CampaignLogSchema = require('../models/tenant/CampaignLog');
const CampaignSchema = require('../models/tenant/Campaign');
const mongoose = require('mongoose');
const { processIncomingMessage } = require('../services/flowEngine.service');
const TemplateSchema = require('../models/tenant/Template');
const WhatsAppService = require('../services/whatsapp.service');

const verifyWebhook = (req, res) => {
  console.log('--- WEBHOOK VERIFICATION ATTEMPT ---');
  try {
     const fs = require('fs');
     const path = require('path');
     const logPath = path.join(__dirname, '../../webhook_debug.log');
     fs.appendFileSync(logPath, `[${new Date().toISOString()}] VERIFICATION GET: ${JSON.stringify(req.query)}\n`);
     console.log('✅ Verification GET logged to:', logPath);
  } catch(e) {
     console.error('❌ Failed to write verification log:', e.message);
  }
  const mode = req.query['hub.mode'];
  const token = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];

  if (mode && token) {
    if (mode === 'subscribe' && token === (process.env.META_WEBHOOK_VERIFY_TOKEN || 'jv_crm_webhook_token_2026')) {
      console.log('✅ Meta Webhook Verified');
      res.status(200).send(challenge);
    } else {
      res.sendStatus(403);
    }
  } else {
    res.sendStatus(400);
  }
};

const handleIncomingMessage = async (req, res) => {
  try {
    console.log("🔥 WEBHOOK HIT");
    
    // 🔍 DEBUG HOOK: Log raw body to verify reception
    try {
       const fs = require('fs');
       const path = require('path');
       const logPath = path.join(__dirname, '../../webhook_debug.log');
       fs.appendFileSync(logPath, `[${new Date().toISOString()}] body: ${JSON.stringify(req.body)}\n`);
       console.log('✅ Webhook body appended to:', logPath);
    } catch(e) {
       console.error('❌ Failed to write to log file:', e.message);
    }

    const entry = req.body.entry?.[0];
    const changes = entry?.changes?.[0];
    const value = changes?.value;

    if (!value) {
      return res.status(200).send('EVENT_RECEIVED');
    }

    const phoneNumberId = value.metadata?.phone_number_id;
    if (!phoneNumberId) {
      return res.status(200).send('EVENT_RECEIVED');
    }

    // 1. Core DB Lookup to find the correct Tenant
    const client = await Client.findOne({ 'whatsappConfig.phoneNumberId': phoneNumberId, status: 'ACTIVE' });
    
    if (!client) {
      console.warn(`⚠️ No active client found for phoneNumberId: ${phoneNumberId}`);
      return res.status(200).send('EVENT_RECEIVED');
    }

    const tenantDb = getTenantConnection(client.tenantId);
    const Contact = tenantDb.model('Contact', ContactSchema);
    const Message = tenantDb.model('Message', MessageSchema);
    const io = req.app.get('io');

    // 2. Handle Messages
    if (value.messages && value.messages[0]) {
      const message = value.messages[0];
      const from = message.from;
      const msgId = message.id;
      const text = message.text?.body || `[Received ${message.type}]`;

      console.log(`📩 [Tenant: ${client.tenantId}] Incoming Message:`, from, text);

      let contact = await Contact.findOne({ phone: from });
      if (!contact) {
         const contactName = value.contacts?.[0]?.profile?.name || 'Unknown';
         contact = await Contact.create({ phone: from, name: contactName, lastMessageAt: new Date() });
      } else {
         contact.lastMessageAt = new Date();
         await contact.save();
      }

      let msgBody = text;
      
      const waService = new WhatsAppService({
          accessToken: client.whatsappConfig.accessToken,
          phoneNumberId: client.whatsappConfig.phoneNumberId
      });

      if (['image', 'video', 'document', 'audio'].includes(message.type)) {
          const mediaId = message[message.type]?.id;
          if (mediaId) {
              const mediaPath = await waService.downloadMedia(mediaId, client.tenantId);
              if (mediaPath) msgBody = mediaPath;
          }
      }
      
      const savedMsg = await Message.create({
         contactId: contact._id,
         messageId: msgId,
         direction: 'INBOUND',
         type: message.type,
         content: msgBody,
         status: 'RECEIVED'
      });

      if (io) {
        io.to(client.tenantId).emit('new_message', Object.assign({}, savedMsg._doc, { contact: contact.toObject() }));
      }
      
      // Trigger Automation Engine
      await processIncomingMessage(client.tenantId, contact.toObject(), msgBody, io);
    }

    // 3. Handle Status Updates
    if (value.statuses && value.statuses[0]) {
      const statusEvent = value.statuses[0];
      console.log(`📊 [Tenant: ${client.tenantId}] Status Update:`, statusEvent.id, statusEvent.status);

      await Message.findOneAndUpdate(
         { messageId: statusEvent.id },
         { status: statusEvent.status.toUpperCase() }
      );
      
      const CampaignLog = tenantDb.model('CampaignLog', CampaignLogSchema);
      const Campaign = tenantDb.model('Campaign', CampaignSchema);
      
      const log = await CampaignLog.findOneAndUpdate(
         { messageId: statusEvent.id },
         { 
           status: statusEvent.status.toUpperCase(),
           ...(statusEvent.status === 'delivered' ? { deliveredAt: new Date() } : {}),
           ...(statusEvent.status === 'read' ? { readAt: new Date() } : {})
         }
      );

      if (log && log.campaignId) {
         const incQuery = {};
         if (statusEvent.status === 'delivered') incQuery['metrics.delivered'] = 1;
         if (statusEvent.status === 'read') incQuery['metrics.read'] = 1;
         if (statusEvent.status === 'failed') incQuery['metrics.failed'] = 1;
         
         if (Object.keys(incQuery).length > 0) {
           await Campaign.findByIdAndUpdate(log.campaignId, { $inc: incQuery });
         }
      }
    }

    // 4. Handle Template Status Updates
    if (value.message_template_status_update) {
       const update = value.message_template_status_update;
       console.log(`📋 [Tenant: ${client.tenantId}] Template Status Update:`, update.event, update.message_template_name);
       
       const Template = tenantDb.model('Template', TemplateSchema);
       const updatedTemplate = await Template.findOneAndUpdate(
          { name: update.message_template_name },
          { status: update.event === 'APPROVED' ? 'APPROVED' : update.event === 'REJECTED' ? 'REJECTED' : 'PENDING' },
          { new: true }
       );

       if (io) {
          io.to(client.tenantId).emit('template_status_update', {
             name: update.message_template_name,
             status: update.event,
             templateId: updatedTemplate?._id
          });
       }
    }

    res.status(200).send('EVENT_RECEIVED');

  } catch (error) {
    console.error("❌ Webhook Error:", error);
    res.sendStatus(500);
  }
};

const getApiConfig = async (req, res) => {
  try {
    const client = await Client.findOne({ tenantId: req.tenantId });
    if (!client) return res.status(404).json({ message: 'Client not found' });
    
    let configData = client.whatsappConfig ? client.whatsappConfig.toObject() : {};

    // Calculate Sent Today from Tenant DB
    try {
        const tenantDb = getTenantConnection(req.tenantId);
        const Message = tenantDb.model('Message', MessageSchema);
        const CampaignLog = tenantDb.model('CampaignLog', CampaignLogSchema);

        const startOfDay = new Date();
        startOfDay.setHours(0, 0, 0, 0);

        const [msgCount, logCount] = await Promise.all([
            Message.countDocuments({ direction: 'OUTBOUND', createdAt: { $gte: startOfDay } }),
            CampaignLog.countDocuments({ status: 'SENT', sentAt: { $gte: startOfDay } })
        ]);

        configData.sentToday = msgCount + logCount;
    } catch (err) {
        console.error('Failed to calculate sentToday:', err.message);
        configData.sentToday = 0;
    }
    
    // Attempt to fetch live verified name and phone from Meta Graph API
    if (configData.accessToken && configData.phoneNumberId) {
      try {
        const metaRes = await fetch(`https://graph.facebook.com/v19.0/${configData.phoneNumberId}`, {
          method: 'GET',
          headers: { 'Authorization': `Bearer ${configData.accessToken}` }
        });
        
        if (metaRes.ok) {
          const metaData = await metaRes.json();
          if (metaData.verified_name) configData.wabaName = metaData.verified_name;
          if (metaData.display_phone_number) configData.phoneNumber = metaData.display_phone_number;
        }

        // Fetch WABA Specific Limits
        if (configData.wabaId) {
            const wabaRes = await fetch(`https://graph.facebook.com/v17.0/${configData.wabaId}?fields=id,name,messaging_limit_tier`, {
                headers: { 'Authorization': `Bearer ${configData.accessToken}` }
            });
            if (wabaRes.ok) {
                const wabaData = await wabaRes.json();
                configData.limitTier = wabaData.messaging_limit_tier;
            }
        }
      } catch (err) {
        console.error('Failed to fetch verified name from Meta:', err.message);
      }
    }
    
    res.json(configData);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const saveApiConfig = async (req, res) => {
  try {
    const { phoneNumberId, wabaId, accessToken, phoneNumber, wabaName } = req.body;
    
    if (!phoneNumberId || !wabaId || !accessToken) {
      return res.status(400).json({ message: 'Phone Number ID, WABA ID, and Access Token are required' });
    }

    const client = await Client.findOneAndUpdate(
      { tenantId: req.tenantId },
      { 
        $set: { 
          'whatsappConfig.phoneNumberId': phoneNumberId,
          'whatsappConfig.wabaId': wabaId,
          'whatsappConfig.accessToken': accessToken,
          'whatsappConfig.phoneNumber': phoneNumber,
          'whatsappConfig.wabaName': wabaName
        } 
      },
      { new: true }
    );

    if (!client) return res.status(404).json({ message: 'Client not found' });
    
    res.json({ message: 'API Configuration saved successfully', config: client.whatsappConfig });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const testApiConnection = async (req, res) => {
  try {
    let phoneNumberId, accessToken;

    const client = await Client.findOne({ tenantId: req.tenantId });
    if (!client || !client.whatsappConfig || !client.whatsappConfig.accessToken || !client.whatsappConfig.phoneNumberId) {
      return res.status(400).json({ success: false, message: 'API Configuration is incomplete. Please save your credentials first.' });
    }
    phoneNumberId = client.whatsappConfig.phoneNumberId;
    accessToken = client.whatsappConfig.accessToken;
    
    // Call Meta Graph API to test token validity
    const response = await fetch(`https://graph.facebook.com/v17.0/${phoneNumberId}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${accessToken}`
      }
    });

    const data = await response.json();

    if (response.ok) {
      if (data.id === phoneNumberId) {
        return res.json({ success: true, message: 'Connection successful! Credentials are valid.' });
      } else {
        return res.json({ success: false, message: 'Connection succeeded, but returned unexpected data.' });
      }
    } else {
      return res.status(400).json({ success: false, message: `Meta API Error: ${data.error?.message || 'Invalid credentials'}` });
    }
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  verifyWebhook,
  handleIncomingMessage,
  getApiConfig,
  saveApiConfig,
  testApiConnection
};
