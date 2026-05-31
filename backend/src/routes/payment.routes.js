const express = require('express');
const router = express.Router();
const { 
  submitPaymentRequest, 
  getAdminPaymentRequests, 
  updatePaymentRequestStatus,
  getClientRejectedPayments,
  getAdminDashboardStats
} = require('../controllers/payment.controller');
const { protect, superAdminOnly } = require('../middleware/auth');
const tenantMiddleware = require('../middleware/tenant');

// Client endpoints
router.post('/refill', protect, tenantMiddleware, submitPaymentRequest);
router.get('/rejected', protect, tenantMiddleware, getClientRejectedPayments);

// Super Admin endpoints 
router.get('/admin/dashboard', protect, superAdminOnly, getAdminDashboardStats);
router.get('/admin/requests', protect, superAdminOnly, getAdminPaymentRequests);
router.put('/admin/requests/:id', protect, superAdminOnly, updatePaymentRequestStatus);

module.exports = router;
