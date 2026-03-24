const Client = require('../models/core/Client');
const { getTenantConnection } = require('../config/db');
const MessageSchema = require('../models/tenant/Message');
const CampaignLogSchema = require('../models/tenant/CampaignLog');

const checkBillingStatus = async (req, res, next) => {
    try {
        const tenantId = req.tenantId;
        if (!tenantId) {
            return res.status(401).json({ message: 'Tenant context missing' });
        }

        const client = await Client.findOne({ tenantId });
        if (!client) {
            return res.status(404).json({ message: 'Client configuration not found' });
        }

        // 1. Check Status
        if (client.status !== 'ACTIVE') {
            return res.status(403).json({ 
                message: 'Account is suspended. Please contact support.',
                billingError: 'SUSPENDED'
            });
        }

        // 2. Check Subscription Expiry
        if (client.subscriptionEndsAt && new Date(client.subscriptionEndsAt) < new Date()) {
            return res.status(403).json({ 
                message: 'Your subscription has expired. Please renew to continue messaging.',
                billingError: 'EXPIRED'
            });
        }

        // 3. Check Daily Message Limits
        const startOfDay = new Date();
        startOfDay.setHours(0, 0, 0, 0);

        const tenantDb = getTenantConnection(tenantId);
        
        // Safety check for model definitions
        const Message = tenantDb.models['Message'] || tenantDb.model('Message', MessageSchema);
        const CampaignLog = tenantDb.models['CampaignLog'] || tenantDb.model('CampaignLog', CampaignLogSchema);

        // Count both manual messages and campaign logs sent today
        const [msgCount, logCount] = await Promise.all([
            Message.countDocuments({ 
                direction: 'OUTBOUND', 
                createdAt: { $gte: startOfDay } 
            }),
            CampaignLog.countDocuments({ 
                status: { $in: ['SENT', 'DELIVERED', 'READ'] }, 
                sentAt: { $gte: startOfDay } 
            })
        ]);

        const totalSentToday = msgCount + logCount;
        const limit = client.maxMessagesPerDay || 1000;

        if (totalSentToday >= limit) {
          return res.status(403).json({ 
              message: `Daily message limit reached (${limit}/${limit}). Upgrade your plan for more.`,
              billingError: 'LIMIT_EXCEEDED',
              limit: limit,
              current: totalSentToday
          });
        }

        next();
    } catch (error) {
        console.error('[Billing Middleware] Error:', error);
        res.status(500).json({ message: 'Error checking billing status' });
    }
};

module.exports = { checkBillingStatus };
