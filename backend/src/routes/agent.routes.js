const express = require('express');
const router = express.Router();
const { getAgents, createAgent, updateAgent, updateAgentStatus, deleteAgent } = require('../controllers/agent.controller');
const { protect } = require('../middleware/auth');
const tenantMiddleware = require('../middleware/tenant');

// All agent routes heavily protected and securely fenced into SaaS tenant sandbox
router.use(protect);
router.use(tenantMiddleware);

router.route('/')
  .get(getAgents)
  .post(createAgent);

router.route('/:id')
  .put(updateAgent)
  .delete(deleteAgent);

router.route('/:id/status')
  .put(updateAgentStatus);

module.exports = router;
