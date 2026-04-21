const express = require('express');
const router = express.Router();
const { getSessions } = require('../controllers/session.controller');
const { protect, admin } = require('../middleware/auth');

// @desc    Get user session logs
// @route   GET /api/sessions
// @access  Private/Admin
router.route('/').get(protect, getSessions);

module.exports = router;
