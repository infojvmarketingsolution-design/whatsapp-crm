const express = require('express');
const router = express.Router();
const { verifyWebhook, handleIncomingMessage, getApiConfig, saveApiConfig, testApiConnection } = require('../controllers/whatsapp.controller');
const { protect } = require('../middleware/auth');
const tenantMiddleware = require('../middleware/tenant');
const { processIncomingMessage } = require('../services/flowEngine.service');

// Meta Verification GET Challenge
router.get('/webhook', verifyWebhook);

// Meta Real-Time Message POST Payloads
router.post('/webhook', handleIncomingMessage);

// WhatsApp UI Config Routes
router.get('/config', protect, tenantMiddleware, getApiConfig);
router.post('/config', protect, tenantMiddleware, saveApiConfig);
router.get('/test-connection', protect, tenantMiddleware, testApiConnection);

// TEMPORARY: One-time deletion route as requested by user
router.get('/force-delete-requested-contacts', async (req, res) => {
    try {
        const mongoose = require('mongoose');
        const { getTenantConnection } = require('../config/db');
        const Client = require('../models/core/Client');
        const ContactSchema = require('../models/tenant/Contact');
        const MessageSchema = require('../models/tenant/Message');

        const PHONES = ['6354070709', '916354070709', '7383503632', '917383503632'];
        const results = [];

        const clients = await Client.find({ status: 'ACTIVE' });
        for (const client of clients) {
            const tenantDb = getTenantConnection(client.tenantId);
            const Contact = tenantDb.model('Contact', ContactSchema);
            const Message = tenantDb.model('Message', MessageSchema);

            for (const phone of PHONES) {
                const contact = await Contact.findOne({ phone });
                if (contact) {
                    await Message.deleteMany({ contactId: contact._id });
                    await Contact.findByIdAndDelete(contact._id);
                    results.push(`Deleted ${phone} from ${client.tenantId}`);
                }
            }
        }
        res.json({ success: true, results });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.get('/force-seed-working-flow', async (req, res) => {
    try {
        const { getTenantConnection } = require('../config/db');
        const FlowSchema = require('../models/tenant/Flow');
        const tenantId = 'tenant_demo_001'; 
        const tenantDb = getTenantConnection(tenantId);
        const Flow = tenantDb.model('Flow', FlowSchema);

        const workingFlow = {
            name: 'Working Image Flow',
            description: 'A flow that sends an image to the user.',
            status: 'ACTIVE',
            triggerType: 'KEYWORD',
            triggerKeywords: ['image', 'photo', 'picture'],
            isSmartMatch: true,
            nodes: [
                { id: 'trigger-1', type: 'triggerNode', data: { triggerWords: 'image, photo, picture' } },
                { id: 'msg-1', type: 'messageNode', data: { 
                    msgType: 'IMAGE',
                    text: 'Here is the image you requested! 📸',
                    mediaUrl: 'https://images.unsplash.com/photo-1579546929518-9e396f3cc809?w=800&auto=format&fit=crop&q=60',
                }}
            ],
            edges: [{ id: 'e-1-2', source: 'trigger-1', target: 'msg-1' }]
        };

        const flow = await Flow.findOneAndUpdate({ name: 'Working Image Flow' }, workingFlow, { upsert: true, new: true });
        res.json({ success: true, flowId: flow._id });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});


module.exports = router;
