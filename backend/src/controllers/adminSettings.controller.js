const GlobalSettings = require('../models/core/GlobalSettings');

const getGlobalSettings = async (req, res) => {
  try {
    let settings = await GlobalSettings.findOne({});
    if (!settings) {
      settings = await GlobalSettings.create({});
    }
    res.json(settings);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const updateGlobalSettings = async (req, res) => {
  try {
    const settings = await GlobalSettings.findOneAndUpdate({}, req.body, { new: true, upsert: true });
    res.json(settings);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { getGlobalSettings, updateGlobalSettings };
