const express = require('express');
const router = express.Router();
const { getContacts, getMessages, sendMessage, performContactAction, performBulkContactAction, createContact, getDashboardStats, getContactStats, getAgents, updateFcmToken, summarizeLead, getLeadAnalysis, getUserBreakdownStats } = require('../controllers/chat.controller');
const tenantMiddleware = require('../middleware/tenant');
const { protect } = require('../middleware/auth');
const multer = require('multer');
const upload = multer({ dest: 'uploads/' });

router.use(protect, tenantMiddleware);

router.get('/contacts', getContacts);
router.post('/contacts', createContact);
router.post('/bulk-action', performBulkContactAction);
router.post('/action', performContactAction); // Fix for current frontend
router.put('/contacts/:contactId/action', performContactAction);
router.get('/stats', getDashboardStats);
router.get('/stats/contacts', getContactStats);
router.get('/stats/user-breakdown', getUserBreakdownStats);
router.get('/analysis', getLeadAnalysis);
router.get('/messages/:contactId', getMessages);
router.post('/send', upload.single('media'), sendMessage);
router.get('/agents', getAgents);
router.post('/fcm-token', updateFcmToken);
router.get('/summarize/:contactId', summarizeLead);

module.exports = router;
