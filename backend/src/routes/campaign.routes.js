const express = require('express');
const router = express.Router();
const { createCampaign, getCampaigns, getCampaignReport, deleteCampaign, getErrorDashboard, getErrorReports } = require('../controllers/campaign.controller');
const { protect } = require('../middleware/auth');
const tenantMiddleware = require('../middleware/tenant');

router.use(protect, tenantMiddleware);

router.get('/errors/dashboard', getErrorDashboard);
router.get('/errors/report', getErrorReports);

router.post('/', createCampaign);
router.get('/', getCampaigns);
router.get('/:id/report', getCampaignReport);
router.delete('/:id', deleteCampaign);

module.exports = router;
