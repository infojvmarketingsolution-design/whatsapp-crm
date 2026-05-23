const mongoose = require('mongoose');
const { getTenantConnection } = require('../config/db');
const Client = require('../models/core/Client');
const CampaignSchema = require('../models/tenant/Campaign');
const { addCampaignJob } = require('./queue.service');
const { processCampaignSync } = require('../controllers/campaign.controller');

let isSchedulingRunning = false;

const startCampaignScheduler = () => {
    if (isSchedulingRunning) return;
    isSchedulingRunning = true;

    console.log('[Scheduler] Started Background Campaign Scheduler 🕒');

    // Polling every 60 seconds
    setInterval(async () => {
        try {
            // Find all active clients (tenants)
            const activeClients = await Client.find({ status: 'active', 'whatsappConfig.accessToken': { $exists: true } });
            
            for (const client of activeClients) {
                const tenantId = client.tenantId;
                const tenantDb = getTenantConnection(tenantId);
                const Campaign = tenantDb.model('Campaign', CampaignSchema);

                const now = new Date();

                // Find campaigns that are scheduled to run on or before right now
                const ripeCampaigns = await Campaign.find({
                    status: 'SCHEDULED',
                    scheduledAt: { $lte: now }
                });

                for (const campaign of ripeCampaigns) {
                    console.log(`[Scheduler] Tenant: ${tenantId} | Campaign: ${campaign._id} is ripe. Dispatching...`);
                    
                    // Immediately update status to RUNNING to prevent double-dispatch
                    campaign.status = 'RUNNING';
                    await campaign.save();

                    // Try to push to Redis BullMQ
                    const job = await addCampaignJob('dispatch-campaign', {
                        campaignId: campaign._id.toString(),
                        tenantId: tenantId,
                        templateId: campaign.templateId.toString()
                    });

                    // Redis-less Fallback
                    if (!job) {
                        console.log(`[Scheduler] Redis offline. Triggering fallback dispatch for ${campaign._id}`);
                        processCampaignSync(tenantId, campaign._id);
                    }
                }
            }
        } catch (error) {
            console.error('[Scheduler] Error checking scheduled campaigns:', error);
        }
    }, 60000); // 60,000ms = 1 minute
};

module.exports = {
    startCampaignScheduler
};
