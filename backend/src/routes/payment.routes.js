const express = require('express');
const router = express.Router();
const { 
  submitPaymentRequest, 
  getAdminPaymentRequests, 
  updatePaymentRequestStatus,
  getClientRejectedPayments
} = require('../controllers/payment.controller');
const { protect, tenantMiddleware } = require('../middleware/auth.middleware');

// Client endpoints
router.post('/refill', protect, tenantMiddleware, submitPaymentRequest);
router.get('/rejected', protect, tenantMiddleware, getClientRejectedPayments);

// Super Admin endpoints (should ideally have an admin middleware, but for now we'll use protect)
router.get('/admin/requests', protect, getAdminPaymentRequests);
router.put('/admin/requests/:id', protect, updatePaymentRequestStatus);

module.exports = router;
