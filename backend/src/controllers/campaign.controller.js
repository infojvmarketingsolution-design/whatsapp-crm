const { getTenantConnection } = require('../config/db');
const mongoose = require('mongoose');
const CampaignSchema = require('../models/tenant/Campaign');
const CampaignLogSchema = require('../models/tenant/CampaignLog');
const ContactSchema = require('../models/tenant/Contact');
const TemplateSchema = require('../models/tenant/Template');
const { addCampaignJob } = require('../services/queue.service');
const axios = require('axios');
const Client = require('../models/core/Client');

const createCampaign = async (req, res) => {
  try {
    const tenantId = req.tenantId;
    const { name, whatsappNumber, templateId, scheduledAt, audienceTags } = req.body;    const tenantDb = getTenantConnection(tenantId);
    const Campaign = tenantDb.model('Campaign', CampaignSchema);
    const Contact = tenantDb.model('Contact', ContactSchema);
    const CampaignLog = tenantDb.model('CampaignLog', CampaignLogSchema);

    let contactQuery = { optInStatus: true };
    if (audienceTags && audienceTags.length > 0) {
      contactQuery.tags = { $in: audienceTags };
    }
    
    const targetContacts = await Contact.find(contactQuery);

    const newCampaign = await Campaign.create({
      name,
      whatsappNumber,
      templateId,
      scheduledAt,
      status: scheduledAt ? 'SCHEDULED' : 'RUNNING',
      audience: { tags: audienceTags || [] },
      metrics: { totalContacts: targetContacts.length }
    });

    const logsToInsert = targetContacts.map(c => ({
      campaignId: newCampaign._id,
      contactId: c._id,
      phone: c.phone,
      status: 'PENDING'
    }));
    
    if (logsToInsert.length > 0) {
      await CampaignLog.insertMany(logsToInsert);
    }

    if (!scheduledAt && targetContacts.length > 0) {
       const job = await addCampaignJob('dispatch-campaign', {
          campaignId: newCampaign._id.toString(),
          tenantId,
          templateId: templateId.toString()
       });

       // Redis-less Fallback: If job is null (Redis offline), process immediately in background
       if (!job) {
          console.log(`[Campaign Controller] Redis offline. Triggering fallback dispatch for ${newCampaign._id}`);
          processCampaignSync(tenantId, newCampaign._id);
       }
    }

    res.status(201).json(newCampaign);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * Background fallback for processing campaigns when Redis is offline.
 * This mimics the logic in the worker.
 */
const processCampaignSync = async (tenantId, campaignId) => {
    try {
        // Wait a bit to ensure the response was sent to the client
        await new Promise(r => setTimeout(r, 1000));
        
        const tenantDb = getTenantConnection(tenantId);
        const Campaign = tenantDb.model('Campaign', CampaignSchema);
        const CampaignLog = tenantDb.model('CampaignLog', CampaignLogSchema);
        const Template = tenantDb.model('Template', TemplateSchema);

        const [campaign, client] = await Promise.all([
            Campaign.findById(campaignId),
            Client.findOne({ tenantId })
        ]);

        if (!campaign || !client?.whatsappConfig?.accessToken) {
            console.error('[Campaign Controller] Missing campaign or API config');
            return;
        }

        const template = await Template.findById(campaign.templateId);
        if (!template) return;

        const pendingLogs = await CampaignLog.find({ campaignId, status: 'PENDING' });
        
        let sentCount = 0;
        let failCount = 0;

        const { accessToken, phoneNumberId } = client.whatsappConfig;

        for (const log of pendingLogs) {
            try {
                const response = await axios.post(
                    `https://graph.facebook.com/v19.0/${phoneNumberId}/messages`,
                    {
                        messaging_product: 'whatsapp',
                        to: log.phone,
                        type: 'template',
                        template: {
                            name: template.name,
                            language: { code: template.language || 'en' }
                        }
                    },
                    { headers: { 'Authorization': `Bearer ${accessToken}` } }
                );

                log.status = 'SENT';
                log.sentAt = new Date();
                log.messageId = response.data.messages[0].id;
                await log.save();
                sentCount++;
            } catch (err) {
                console.error(`[Campaign Controller] Failed to send to ${log.phone}:`, err.response?.data || err.message);
                log.status = 'FAILED';
                log.errorReason = err.response?.data?.error?.message || err.message;
                await log.save();
                failCount++;
            }
            // Small throttle to avoid hitting Meta rate limits too aggressively in a single thread
            await new Promise(r => setTimeout(r, 100));
        }

        await Campaign.findByIdAndUpdate(campaignId, {
            $inc: { 'metrics.sent': sentCount, 'metrics.failed': failCount },
            $set: { status: 'COMPLETED' }
        });
        
        console.log(`[Campaign Controller] Fallback dispatch complete for ${campaignId}. Sent: ${sentCount}`);
    } catch (err) {
        console.error('[Campaign Controller] Fallback dispatch failed:', err);
    }
};

const getCampaigns = async (req, res) => {
  try {
    const tenantDb = getTenantConnection(req.tenantId);
    const Campaign = tenantDb.model('Campaign', CampaignSchema);
    const Template = tenantDb.model('Template', TemplateSchema);
    
    const campaigns = await Campaign.find().populate('templateId').sort({ createdAt: -1 });
    res.json(campaigns);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getCampaignReport = async (req, res) => {
  try {
    const { id } = req.params;
    const tenantDb = getTenantConnection(req.tenantId);
    const Campaign = tenantDb.model('Campaign', CampaignSchema);
    const CampaignLog = tenantDb.model('CampaignLog', CampaignLogSchema);

    const [campaign, logs] = await Promise.all([
      Campaign.findById(id).populate('templateId'),
      CampaignLog.find({ campaignId: id }).sort({ sentAt: -1 })
    ]);

    if (!campaign) return res.status(404).json({ message: 'Campaign not found' });

    res.json({ campaign, logs });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const deleteCampaign = async (req, res) => {
  try {
    const { id } = req.params;
    const tenantDb = getTenantConnection(req.tenantId);
    const Campaign = tenantDb.model('Campaign', CampaignSchema);
    const CampaignLog = tenantDb.model('CampaignLog', CampaignLogSchema);

    await Promise.all([
      Campaign.findByIdAndDelete(id),
      CampaignLog.deleteMany({ campaignId: id })
    ]);

    res.json({ message: 'Campaign and associated logs deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  createCampaign,
  getCampaigns,
  getCampaignReport,
  deleteCampaign
};
