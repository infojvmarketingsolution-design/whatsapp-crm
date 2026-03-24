const express = require('express');
const router = express.Router();
const { syncTemplates, getTemplates, createTemplate, deleteTemplate, uploadTemplateMedia } = require('../controllers/template.controller');
const { protect } = require('../middleware/auth');
const tenantMiddleware = require('../middleware/tenant');
const multer = require('multer');
const upload = multer({ dest: 'public/uploads/templates/' });

router.use(protect, tenantMiddleware);

router.post('/sync', syncTemplates);
router.post('/', createTemplate);
router.get('/', getTemplates);
router.delete('/:id', deleteTemplate);
router.post('/upload', upload.single('file'), uploadTemplateMedia);

module.exports = router;
