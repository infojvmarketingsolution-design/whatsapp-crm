const express = require('express');
const router = express.Router();
const settingsController = require('../controllers/settings.controller');
const authMiddleware = require('../middleware/auth');
const tenantMiddleware = require('../middleware/tenant');
const multer = require('multer');
const upload = multer({ dest: 'uploads/' });

// Apply auth and tenant middlewares for all settings routes
router.use(authMiddleware.protect);
router.use(tenantMiddleware);

router.get('/', settingsController.getSettings);
router.put('/:category', settingsController.updateSettings);

// Image upload for settings prompts
router.post('/upload-image', upload.single('image'), settingsController.uploadImage);

module.exports = router;
