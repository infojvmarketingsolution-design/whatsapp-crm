const express = require('express');
const router = express.Router();
const { createCampaign, getCampaigns, getCampaignReport, deleteCampaign } = require('../controllers/campaign.controller');
const { protect } = require('../middleware/auth');
const { checkBillingStatus } = require('../middleware/billing');
const tenantMiddleware = require('../middleware/tenant');

router.use(protect, tenantMiddleware);

router.route('/campaigns')
  .get(protect, getCampaigns)
  .post(protect, checkBillingStatus, createCampaign);
router.get('/:id/report', getCampaignReport);
router.delete('/:id', deleteCampaign);

module.exports = router;
