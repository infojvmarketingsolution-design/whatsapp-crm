const express = require('express');
const router = express.Router();
const { createCampaign, getCampaigns } = require('../controllers/campaign.controller');
const { protect } = require('../middleware/auth');
const tenantMiddleware = require('../middleware/tenant');

router.use(protect, tenantMiddleware);

router.post('/', createCampaign);
router.get('/', getCampaigns);

module.exports = router;
