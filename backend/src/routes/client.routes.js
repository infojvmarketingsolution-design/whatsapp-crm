const express = require('express');
const router = express.Router();
const { getClients, createClient, getClientById, updateClient, deleteClient, getGlobalAnalytics } = require('../controllers/client.controller');
const { protect, superAdminOnly } = require('../middleware/auth');

router.get('/analytics', protect, superAdminOnly, getGlobalAnalytics);

router.route('/')
  .get(protect, superAdminOnly, getClients)
  .post(protect, superAdminOnly, createClient);

router.route('/:id')
  .get(protect, superAdminOnly, getClientById)
  .put(protect, superAdminOnly, updateClient)
  .delete(protect, superAdminOnly, deleteClient);

module.exports = router;
