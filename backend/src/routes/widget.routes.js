const express = require('express');
const router = express.Router();
const { getWidgetConfig, updateWidgetConfig, getPublicWidget, submitWidgetLead } = require('../controllers/widget.controller');
const { protect } = require('../middleware/auth');
const tenantMiddleware = require('../middleware/tenant');

// Public endpoints for widget requests
router.get('/public/:clientId', getPublicWidget);
router.post('/public/:clientId/lead', submitWidgetLead);

// Protected CRM bounds
router.use(protect);
router.use(tenantMiddleware);
router.route('/')
  .get(getWidgetConfig)
  .put(updateWidgetConfig);

module.exports = router;
