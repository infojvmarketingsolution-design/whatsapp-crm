const { getTenantConnection } = require('./src/config/db');
const CampaignLogSchema = require('./src/models/tenant/CampaignLog');
const CampaignSchema = require('./src/models/tenant/Campaign');
require('dotenv').config();

async function checkLogs() {
    try {
        const tenantId = 'root'; // Adjust if needed, but 'root' is often the default or first tenant
        const tenantDb = getTenantConnection(tenantId);
        const CampaignLog = tenantDb.model('CampaignLog', CampaignLogSchema);
        const Campaign = tenantDb.model('Campaign', CampaignSchema);

        const latestCampaign = await Campaign.findOne().sort({ createdAt: -1 });
        if (!latestCampaign) {
            console.log('No campaigns found');
            return;
        }

        console.log(`Checking logs for campaign: ${latestCampaign.name} (${latestCampaign._id})`);
        const failedLogs = await CampaignLog.find({ 
            campaignId: latestCampaign._id, 
            status: 'FAILED' 
        }).limit(5);

        console.log(`Found ${failedLogs.length} failed logs.`);
        failedLogs.forEach(log => {
            console.log(`Phone: ${log.phone}, ErrorReason: "${log.errorReason}"`);
        });

        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

checkLogs();
