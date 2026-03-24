const Client = require('../models/core/Client');
const GlobalSettings = require('../models/core/GlobalSettings');

/**
 * Middleware to check if the client's plan supports the requested feature
 * and if the feature is enabled globally.
 * @param {string} feature - The feature to check (e.g., 'crm', 'campaigns', 'flows')
 */
const checkPlanAccess = (feature) => {
  return async (req, res, next) => {
    try {
      // 1. Check Global Settings first (Master Switch)
      const globalSettings = await GlobalSettings.findOne({});
      if (globalSettings && globalSettings.allowedModules) {
        // Map feature name to global module key if necessary
        const moduleKey = feature.toLowerCase();
        if (globalSettings.allowedModules[moduleKey] === false) {
          return res.status(403).json({ 
            message: `The ${feature.toUpperCase()} module is currently disabled platform-wide by the administrator.` 
          });
        }
      }

      if (!req.tenantId) {
        return res.status(400).json({ message: 'Tenant context missing' });
      }

      const client = await Client.findOne({ tenantId: req.tenantId });
      if (!client) {
        return res.status(404).json({ message: 'Client not found' });
      }

      const plan = client.plan;

      // 2. Check Plan-Specific Logic
      if (feature === 'crm') {
        if (plan === 'BASIC') {
          return res.status(403).json({ message: 'CRM access is not available in Basic plan. Please upgrade to PRO.' });
        }
      }

      if (feature === 'flows' || feature === 'automation') {
        if (plan === 'BASIC') {
            return res.status(403).json({ message: 'Automation/Flows are not available in your current plan.' });
        }
      }

      if (feature === 'campaigns') {
        // Add specific campaign logic if needed
      }

      next();
    } catch (error) {
      console.error('Plan access error:', error);
      res.status(500).json({ message: 'Error checking plan access' });
    }
  };
};

module.exports = { checkPlanAccess };
