const express = require('express');
const router = express.Router();
const controller = require('../controllers/successStory.controller');
const { protect } = require('../middleware/auth');
const tenant = require('../middleware/tenant');

router.use(protect, tenant);

router.get('/', controller.getStories);
router.post('/', controller.createStory);
router.put('/:id', controller.updateStory);
router.delete('/:id', controller.deleteStory);

module.exports = router;
