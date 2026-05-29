const cron = require('node-cron');
const { getTenantConnection } = require('../config/db');
const Client = require('../models/core/Client');
const CampaignLogSchema = require('../models/tenant/CampaignLog');
const CampaignSchema = require('../models/tenant/Campaign');
const TemplateSchema = require('../models/tenant/Template');
const ContactSchema = require('../models/tenant/Contact');
const axios = require('axios');

// Defaults based on PRD & assumptions
const MAX_RETRIES = 3;
const RETRY_INTERVAL_HOURS = 24;

const startRetryEngine = () => {
  // Run every hour to check for eligible retries
  cron.schedule('0 * * * *', async () => {
    console.log('[Retry Engine] Starting hourly check for failed campaign messages...');
    try {
      // Get all active clients to iterate over their databases
      const clients = await Client.find({ status: 'ACTIVE' });

      for (const client of clients) {
        if (!client.whatsappConfig || !client.whatsappConfig.accessToken) continue;
        
        const tenantDb = getTenantConnection(client.tenantId);
        const CampaignLog = tenantDb.model('CampaignLog', CampaignLogSchema);
        const Campaign = tenantDb.model('Campaign', CampaignSchema);
        const Template = tenantDb.model('Template', TemplateSchema);
        
        // Find logs that failed with 131049 (Meta Chose Not To Deliver / Rate limit / Unreachable)
        // And haven't reached max retries
        const thresholdDate = new Date();
        thresholdDate.setHours(thresholdDate.getHours() - RETRY_INTERVAL_HOURS);

        const logsToRetry = await CampaignLog.find({
          status: 'FAILED',
          errorCode: 131049,
          retryCount: { $lt: MAX_RETRIES },
          $or: [
             { lastRetryAt: { $exists: false } },
             { lastRetryAt: { $lte: thresholdDate } }
          ]
        }).populate('campaignId').limit(100); // Process in batches of 100 per tenant

        if (logsToRetry.length > 0) {
            console.log(`[Retry Engine] Found ${logsToRetry.length} messages to retry for ${client.tenantId}`);
        }

        const { accessToken, phoneNumberId } = client.whatsappConfig;

        for (const log of logsToRetry) {
          try {
            const campaign = log.campaignId;
            if (!campaign) continue;

            const template = await Template.findById(campaign.templateId);
            if (!template) continue;

            // Prepare components
            const components = [];
            if (campaign.templateComponents) {
                const { header, body } = campaign.templateComponents;
                if (header) {
                    const headerParams = [];
                    let mediaLink = header.link;
                    if (mediaLink && mediaLink.startsWith('http://')) mediaLink = mediaLink.replace('http://', 'https://');
                    if (header.type === 'image') headerParams.push({ type: 'image', image: { link: mediaLink } });
                    else if (header.type === 'video') headerParams.push({ type: 'video', video: { link: mediaLink } });
                    else if (header.type === 'document') headerParams.push({ type: 'document', document: { link: mediaLink, filename: header.filename || 'Document' } });
                    
                    if (headerParams.length > 0) components.push({ type: 'header', parameters: headerParams });
                }
                if (body && body.variables && body.variables.length > 0) {
                    const bodyParams = body.variables.map(v => ({ type: 'text', text: v }));
                    components.push({ type: 'body', parameters: bodyParams });
                }
            }

            const sanitizedPhone = String(log.phone).replace(/\D/g, '');
            const finalPhone = sanitizedPhone.length === 10 ? `91${sanitizedPhone}` : sanitizedPhone;

            const response = await axios.post(
                `https://graph.facebook.com/v22.0/${phoneNumberId}/messages`,
                {
                    messaging_product: 'whatsapp',
                    to: finalPhone,
                    type: 'template',
                    template: {
                        name: template.name,
                        language: { code: template.language || 'en' },
                        components: components.length > 0 ? components : undefined
                    }
                },
                { headers: { 'Authorization': `Bearer ${accessToken}` } }
            );

            log.status = 'SENT'; // Actually it's just queued, webhook will update to delivered/read/failed
            log.messageId = response.data.messages[0].id;
            log.retryCount += 1;
            log.lastRetryAt = new Date();
            log.errorReason = '';
            log.errorCode = null;
            await log.save();

            // Adjust campaign metrics: remove one fail, add one sent
            await Campaign.findByIdAndUpdate(campaign._id, {
                $inc: { 'metrics.failed': -1, 'metrics.sent': 1 }
            });

          } catch (err) {
             log.retryCount += 1;
             log.lastRetryAt = new Date();
             await log.save();
             console.log(`[Retry Engine] Retry failed for ${log.phone} in ${client.tenantId}`);
          }

          // Throttle
          await new Promise(r => setTimeout(r, 200));
        }
      }
    } catch (err) {
      console.error('[Retry Engine] Error:', err);
    }
  });
  console.log('[Retry Engine] Initialized.');
};

module.exports = { startRetryEngine };
