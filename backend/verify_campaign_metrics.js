const mongoose = require('mongoose');
const path = require('path');
const { getTenantConnection } = require('./src/config/db');
require('dotenv').config({ path: path.join(__dirname, './.env') });

const CampaignSchema = require('./src/models/tenant/Campaign');
const CampaignLogSchema = require('./src/models/tenant/CampaignLog');

async function testMetrics() {
    const tenantId = 'test_tenant_' + Date.now();
    const db = getTenantConnection(tenantId);
    const Campaign = db.model('Campaign', CampaignSchema);
    const CampaignLog = db.model('CampaignLog', CampaignLogSchema);

    console.log('--- TEST: Creating Mock Campaign ---');
    const campaign = await Campaign.create({
        name: 'Test Campaign',
        metrics: { totalContacts: 2, sent: 2, delivered: 0, read: 0, failed: 0 }
    });

    const log1 = await CampaignLog.create({
        campaignId: campaign._id,
        contactId: new mongoose.Types.ObjectId(),
        phone: '1234567890',
        messageId: 'msg_1',
        status: 'SENT',
        sentAt: new Date()
    });

    const log2 = await CampaignLog.create({
        campaignId: campaign._id,
        contactId: new mongoose.Types.ObjectId(),
        phone: '0987654321',
        messageId: 'msg_2',
        status: 'SENT',
        sentAt: new Date()
    });

    console.log('Initial Campaign Metrics:', campaign.metrics);

    // Mocking the status update logic from whatsapp.controller.js
    async function simulateStatusUpdate(msgId, status) {
        console.log(`Simulating status "${status}" for ${msgId}...`);
        const log = await CampaignLog.findOne({ messageId: msgId });
        if (log && log.campaignId) {
            const updates = {};
            const incQuery = {};
            const Status = status.toUpperCase();

            if (Status === 'DELIVERED' && !log.deliveredAt) {
                updates.deliveredAt = new Date();
                updates.status = 'DELIVERED';
                incQuery['metrics.delivered'] = 1;
                if (!log.sentAt) updates.sentAt = new Date();
            } else if (Status === 'READ' && !log.readAt) {
                updates.readAt = new Date();
                updates.status = 'READ';
                incQuery['metrics.read'] = 1;
                if (!log.deliveredAt) {
                    incQuery['metrics.delivered'] = 1;
                    updates.deliveredAt = new Date();
                }
                if (!log.sentAt) updates.sentAt = new Date();
            } else if (Status === 'FAILED' && log.status !== 'FAILED') {
                updates.status = 'FAILED';
                incQuery['metrics.failed'] = 1;
            }

            if (Object.keys(updates).length > 0) {
                await CampaignLog.updateOne({ _id: log._id }, { $set: updates });
            }
            if (Object.keys(incQuery).length > 0) {
                await Campaign.findByIdAndUpdate(log.campaignId, { $inc: incQuery });
            }
        }
    }

    // Step 1: msg_1 delivered
    await simulateStatusUpdate('msg_1', 'delivered');
    // Step 2: msg_1 delivered AGAIN (should NOT increment)
    await simulateStatusUpdate('msg_1', 'delivered');
    // Step 3: msg_1 read
    await simulateStatusUpdate('msg_1', 'read');
    // Step 4: msg_2 read (skipping delivered)
    await simulateStatusUpdate('msg_2', 'read');
    // Step 5: msg_3 (non-existent)
    await simulateStatusUpdate('msg_3', 'failed');

    const updatedCampaign = await Campaign.findById(campaign._id);
    console.log('Final Campaign Metrics:', updatedCampaign.metrics);

    const expected = { sent: 2, delivered: 2, read: 2, failed: 0 };
    const success = updatedCampaign.metrics.sent === expected.sent &&
                    updatedCampaign.metrics.delivered === expected.delivered &&
                    updatedCampaign.metrics.read === expected.read &&
                    updatedCampaign.metrics.failed === expected.failed;

    if (success) {
        console.log('✅ TEST PASSED: Metrics are 100% correct.');
    } else {
        console.error('❌ TEST FAILED: Metrics mismatch.');
        console.log('Expected:', expected);
    }

    await db.dropDatabase();
    await mongoose.disconnect();
}

testMetrics().catch(err => {
    console.error(err);
    process.exit(1);
});
