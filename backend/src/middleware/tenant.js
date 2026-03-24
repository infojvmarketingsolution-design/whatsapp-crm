const { getTenantConnection } = require('../config/db');
const Client = require('../models/core/Client');

/**
 * Middleware to identify tenant from request and attach tenant DB connection
 */
const tenantMiddleware = async (req, res, next) => {
  try {
    // Determine tenantId from header, token, or query parameter
    let tenantIdStr = req.headers['x-tenant-id'] || req.query.tenantId;

    // Optional: Determine tenant from an API Key if provided
    const apiKey = req.headers['x-api-key'];
    if (apiKey && !tenantIdStr) {
      const client = await Client.findOne({ apiKey, status: 'ACTIVE' });
      if (client) {
        tenantIdStr = client.tenantId;
      }
    }

    if (!tenantIdStr) {
      return res.status(401).json({ error: 'Tenant identifier not provided.' });
    }

    // Connect to tenant DB and attach to request
    req.tenantDb = getTenantConnection(tenantIdStr);
    req.tenantId = tenantIdStr;
    next();
  } catch (error) {
    console.error('Tenant Resolution Error:', error);
    res.status(500).json({ error: 'Failed to resolve tenant configuration.' });
  }
};

module.exports = tenantMiddleware;
