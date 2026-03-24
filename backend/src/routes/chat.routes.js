const express = require('express');
const router = express.Router();
const { getContacts, getMessages, sendMessage, performContactAction, createContact } = require('../controllers/chat.controller');
const tenantMiddleware = require('../middleware/tenant');
const { protect } = require('../middleware/auth');
const multer = require('multer');
const upload = multer({ dest: 'uploads/' });

router.use(protect, tenantMiddleware);

router.get('/contacts', getContacts);
router.post('/contacts', createContact);
router.put('/contacts/:contactId/action', performContactAction);
router.get('/messages/:contactId', getMessages);
router.post('/send', upload.single('media'), sendMessage);

module.exports = router;
