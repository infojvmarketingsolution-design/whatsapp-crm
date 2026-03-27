const express = require('express');
const path = require('path');
const router = express.Router();
const { syncTemplates, getTemplates, createTemplate, deleteTemplate, uploadTemplateMedia } = require('../controllers/template.controller');
const { protect } = require('../middleware/auth');
const tenantMiddleware = require('../middleware/tenant');
const multer = require('multer');
const upload = multer({ 
  storage: multer.diskStorage({
    destination: (req, file, cb) => {
      const dir = path.join(process.cwd(), 'backend', 'public', 'uploads', 'templates');
      const fs = require('fs');
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      cb(null, dir);
    },
    filename: (req, file, cb) => {
      // Sanitize: replace spaces with underscores and remove non-alphanumeric chars (except . and -)
      const sanitizedName = file.originalname.replace(/\s+/g, '_').replace(/[^a-zA-Z0-9\.\-_]/g, '');
      cb(null, Date.now() + '-' + sanitizedName);
    }
  })
});

router.use(protect, tenantMiddleware);

router.post('/sync', syncTemplates);
router.post('/', createTemplate);
router.get('/', getTemplates);
router.delete('/:id', deleteTemplate);
router.post('/upload', upload.single('file'), uploadTemplateMedia);

module.exports = router;
