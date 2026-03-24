const express = require('express');
const router = express.Router();
const { getFlows, getFlowById, createFlow, updateFlow, deleteFlow } = require('../controllers/flow.controller');
const { protect } = require('../middleware/auth');
const tenantMiddleware = require('../middleware/tenant');

router.use(protect, tenantMiddleware);

router.get('/', getFlows);
router.post('/', createFlow);
router.get('/:id', getFlowById);
router.put('/:id', updateFlow);
router.delete('/:id', deleteFlow);

module.exports = router;
