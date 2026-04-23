const express = require('express');
const router = express.Router();
const { getTeamStats } = require('../controllers/stats.controller');
const { protect } = require('../middleware/auth');

// Team Performance routes - protected by authentication
router.get('/team', protect, getTeamStats);

module.exports = router;
