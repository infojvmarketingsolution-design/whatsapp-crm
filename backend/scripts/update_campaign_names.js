const mongoose = require('mongoose');
require('dotenv').config({ path: '../.env' });
const { connectCoreDB, getTenantConnection } = require('../src/config/db');
const Client = require('../src/models/core/Client');
const CampaignSchema = require('../src/models/tenant/Campaign');
const CampaignLogSchema = require('../src/models/tenant/CampaignLog');
const MessageSchema = require('../src/models/tenant/Message');

async function run() {
    try {
        await connectCoreDB();
        const clients = await Client.find({});
        console.log(`Found ${clients.length} clients.`);

        for (const client of clients) {
            console.log(`Processing tenant: ${client.tenantId}`);
            const tenantDb = getTenantConnection(client.tenantId);
            const Campaign = tenantDb.model('Campaign', CampaignSchema);
            const CampaignLog = tenantDb.model('CampaignLog', CampaignLogSchema);
            const Message = tenantDb.model('Message', MessageSchema);

            const logs = await CampaignLog.find({ status: 'SENT' });
            console.log(`Found ${logs.length} sent logs in tenant ${client.tenantId}`);
            
            // Map campaign ID to name
            const campaigns = await Campaign.find({});
            const campaignMap = {};
            for (const c of campaigns) {
                campaignMap[c._id.toString()] = c.name;
            }

            let updatedCount = 0;
            for (const log of logs) {
                if (!log.messageId) continue;
                const campaignName = campaignMap[log.campaignId.toString()];
                if (!campaignName) continue;

                const msg = await Message.findOne({ messageId: log.messageId });
                if (msg) {
                    if (typeof msg.content === 'string' && !msg.content.includes('[Campaign: ')) {
                        msg.content = `[Campaign: ${campaignName}] ` + msg.content;
                        await msg.save();
                        updatedCount++;
                    }
                }
            }
            console.log(`Updated ${updatedCount} messages in tenant ${client.tenantId}`);
        }

        console.log("Done.");
        process.exit(0);
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
}

run();
