const express = require('express');
const router = express.Router();
const { authUser, registerSuperAdmin, registerTenant } = require('../controllers/auth.controller');

// @desc    Auth user & get token
// @route   POST /api/auth/login
// @access  Public
router.post('/login', authUser);

// @desc    Register super admin (Initial Setup Endpoint)
// @route   POST /api/auth/setup
// @access  Public
router.post('/setup', registerSuperAdmin);

// @desc    Register new SaaS Tenant (Public Registration)
// @route   POST /api/auth/register
// @access  Public
router.post('/register', registerTenant);

module.exports = router;
