const mongoose = require('mongoose');
const { connectCoreDb, getTenantConnection } = require('./src/config/db');
require('dotenv').config();

async function fix() {
    try {
        await mongoose.connect(process.env.CORE_DB_URI);
        const Client = require('./src/models/core/Client');
        const CampaignLogSchema = require('./src/models/tenant/CampaignLog');
        
        const clients = await Client.find({});
        
        for (const client of clients) {
            const tenantDb = getTenantConnection(client.tenantId);
            const CampaignLog = tenantDb.model('CampaignLog', CampaignLogSchema);
            
            // 1. Update existing 131026 errors
            const res1 = await CampaignLog.updateMany(
                { errorReason: { $regex: /131026/ } },
                { $set: { errorReason: 'Message Undeliverable' } }
            );
            
            // 2. Iterate to find short numbers and set errorReason = 'Number wrong'
            const allFailed = await CampaignLog.find({ status: 'FAILED' });
            let shortCount = 0;
            
            for (const log of allFailed) {
                const sanitizedPhone = String(log.phone).replace(/\D/g, '');
                if (sanitizedPhone.length < 10 && log.errorReason !== 'Number wrong') {
                    log.errorReason = 'Number wrong';
                    await log.save();
                    shortCount++;
                }
            }
            
            console.log(`[${client.tenantId}] Updated 131026: ${res1.modifiedCount}, Updated Short Numbers: ${shortCount}`);
        }
        
        console.log('Update completed successfully.');
        process.exit(0);
    } catch (err) {
        console.error('Error running script:', err);
        process.exit(1);
    }
}

fix();
