const express = require('express');
const router = express.Router();
const { getGlobalSettings, updateGlobalSettings } = require('../controllers/adminSettings.controller');
const { protect, superAdminOnly } = require('../middleware/auth');

router.use(protect);
router.use(superAdminOnly);

router.route('/')
  .get(getGlobalSettings)
  .put(updateGlobalSettings);

module.exports = router;
