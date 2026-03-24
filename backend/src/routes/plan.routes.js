const express = require('express');
const router = express.Router();
const { getPlans, createPlan, updatePlan, deletePlan } = require('../controllers/plan.controller');
const { protect, superAdminOnly } = require('../middleware/auth');

router.use(protect);
router.use(superAdminOnly);

router.route('/')
  .get(getPlans)
  .post(createPlan);

router.route('/:id')
  .put(updatePlan)
  .delete(deletePlan);

module.exports = router;
