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


module.exports = router;
