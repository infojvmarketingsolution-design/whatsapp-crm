const express = require('express');
const router = express.Router();
const { getTeamStats } = require('../controllers/stats.controller');
const { protect } = require('../middleware/auth');
const tenantMiddleware = require('../middleware/tenant');

// Team Performance routes - protected by authentication and tenant isolation
router.get('/team', protect, tenantMiddleware, getTeamStats);

module.exports = router;
