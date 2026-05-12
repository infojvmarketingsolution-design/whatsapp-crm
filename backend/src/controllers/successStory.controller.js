const SuccessStorySchema = require('../models/tenant/SuccessStory');
const { getTenantConnection } = require('../config/db');

const getStories = async (req, res) => {
  try {
    const tenantDb = getTenantConnection(req.tenantId);
    const SuccessStory = tenantDb.model('SuccessStory', SuccessStorySchema);
    const stories = await SuccessStory.find({ status: 'ACTIVE' }).sort({ createdAt: -1 });
    res.json(stories);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const createStory = async (req, res) => {
  try {
    const tenantDb = getTenantConnection(req.tenantId);
    const SuccessStory = tenantDb.model('SuccessStory', SuccessStorySchema);
    const story = await SuccessStory.create(req.body);
    res.status(201).json(story);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const updateStory = async (req, res) => {
  try {
    const { id } = req.params;
    const tenantDb = getTenantConnection(req.tenantId);
    const SuccessStory = tenantDb.model('SuccessStory', SuccessStorySchema);
    const story = await SuccessStory.findByIdAndUpdate(id, req.body, { new: true });
    res.json(story);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const deleteStory = async (req, res) => {
  try {
    const { id } = req.params;
    const tenantDb = getTenantConnection(req.tenantId);
    const SuccessStory = tenantDb.model('SuccessStory', SuccessStorySchema);
    await SuccessStory.findByIdAndDelete(id);
    res.json({ message: 'Story deleted' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { getStories, createStory, updateStory, deleteStory };
