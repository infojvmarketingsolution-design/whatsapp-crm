const { Worker } = require('bullmq');
const { connection } = require('../services/queue.service');
const { getTenantConnection } = require('../config/db');
const axios = require('axios');
const Client = require('../models/core/Client');
const CampaignSchema = require('../models/tenant/Campaign');
const CampaignLogSchema = require('../models/tenant/CampaignLog');
const ContactSchema = require('../models/tenant/Contact');
const MessageSchema = require('../models/tenant/Message');
const TemplateSchema = require('../models/tenant/Template');

const worker = new Worker('campaign-dispatch', async job => {
  if (job.name === 'dispatch-campaign') {
    const { campaignId, tenantId, templateId } = job.data;
    console.log(`[Worker] Processing campaign ${campaignId} for tenant ${tenantId}`);

    const tenantDb = getTenantConnection(tenantId);
    if (!tenantDb) throw new Error('Tenant DB not configured');
    
    const Campaign = tenantDb.model('Campaign', CampaignSchema);
    const CampaignLog = tenantDb.model('CampaignLog', CampaignLogSchema);
    const Template = tenantDb.model('Template', TemplateSchema);

    const [campaign, client] = await Promise.all([
      Campaign.findById(campaignId),
      Client.findOne({ tenantId })
    ]);

    if (!campaign || !client?.whatsappConfig?.accessToken) {
      throw new Error('Campaign or API config missing');
    }

    const template = await Template.findById(templateId);
    if (!template) throw new Error('Template not found');

    const pendingLogs = await CampaignLog.find({ campaignId, status: 'PENDING' });
    
    let sentCount = 0;
    let failCount = 0;

    const { accessToken, phoneNumberId } = client.whatsappConfig;

    for (const log of pendingLogs) {
      try {
        // Build components for WhatsApp API
        const components = [];
        if (campaign.templateComponents) {
            const { header, body } = campaign.templateComponents;
            
            if (header) {
                const headerParams = [];
                if (header.type === 'image') headerParams.push({ type: 'image', image: { link: header.link } });
                else if (header.type === 'video') headerParams.push({ type: 'video', video: { link: header.link } });
                else if (header.type === 'document') headerParams.push({ type: 'document', document: { link: header.link, filename: header.filename || 'Document' } });
                
                if (headerParams.length > 0) {
                    components.push({ type: 'header', parameters: headerParams });
                }
            }

            if (body && body.variables && body.variables.length > 0) {
                const bodyParams = body.variables.map(v => ({ type: 'text', text: v }));
                components.push({ type: 'body', parameters: bodyParams });
            }
        }

        const response = await axios.post(
          `https://graph.facebook.com/v19.0/${phoneNumberId}/messages`,
          {
              messaging_product: 'whatsapp',
              to: log.phone,
              type: 'template',
              template: {
                  name: template.name,
                  language: { code: template.language || 'en' },
                  components: components.length > 0 ? components : undefined
              }
          },
          { headers: { 'Authorization': `Bearer ${accessToken}` } }
        );

        log.status = 'SENT';
        log.sentAt = new Date();
        log.messageId = response.data.messages[0].id;
        await log.save();

        // Save to Message History for Inbox visibility
        try {
            const Contact = tenantDb.model('Contact', ContactSchema);
            const Message = tenantDb.model('Message', MessageSchema);
            
            let contact = await Contact.findOne({ phone: log.phone });
            if (!contact) {
                contact = await Contact.create({ 
                    phone: log.phone, 
                    name: log.name || 'Campaign Lead',
                    source: 'CAMPAIGN'
                });
            }

            const savedMsg = await Message.create({
                contactId: contact._id,
                messageId: log.messageId,
                direction: 'OUTBOUND',
                type: 'template',
                content: `[Template: ${template.name}]`,
                status: 'SENT'
            });

            // Emit via socket
            const io = worker.app?.get?.('io'); // Worker might not have app directly, check if we can pass it
            // Actually, in server.js we don't pass app to workers. 
            // We might need to handle socket emission differently or skip for background workers 
            // if real-time update is not critical for bulk campaigns.
            // But let's try to get io if possible.
        } catch (msgErr) {
            console.error(`[Worker] Failed to save message history for ${log.phone}:`, msgErr.message);
        }

        sentCount++;
      } catch (err) {
        const metaError = err.response?.data?.error;
        console.error(`[Worker CRITICAL] Status: ${err.response?.status}, Phone: ${log.phone}, Error:`, JSON.stringify(err.response?.data || err.message));
        
        log.status = 'FAILED';
        if (metaError) {
          log.errorReason = `${metaError.message || 'Unknown Meta Error'} (Code: ${metaError.code})`;
          if (metaError.error_data?.details) {
            log.errorReason += ` - ${metaError.error_data.details}`;
          }
        } else {
          log.errorReason = err.message || 'Unknown System Error';
        }
        
        // Final fallback to ensure something is always there
        if (!log.errorReason) log.errorReason = 'API Connection Failed';
        
        await log.save();
        failCount++;
      }
      await new Promise(r => setTimeout(r, 100));
    }

    await Campaign.findByIdAndUpdate(campaignId, {
      $inc: { 'metrics.sent': sentCount, 'metrics.failed': failCount },
      $set: { status: 'COMPLETED' }
    });

    return { processed: pendingLogs.length, sent: sentCount, failed: failCount };
  }
}, { connection });

worker.on('completed', job => {
  console.log(`Job ${job.id} has completed!`);
});

worker.on('failed', (job, err) => {
  console.log(`Job ${job.id} has failed with ${err.message}`);
});

module.exports = worker;
