const mongoose = require('mongoose');
const { getTenantConnection } = require('../config/db');
const Client = require('../models/core/Client');

/**
 * Middleware to identify tenant from request and attach tenant DB connection
 */
const tenantMiddleware = async (req, res, next) => {
  try {
    // 1. SAFETY CHECK: If MongoDB is offline, return 503 or handle gracefully
    if (mongoose.connection.readyState !== 1) {
       // Allow health check or public routes even if tenant check would fail
       if (req.path.startsWith('/api/health')) return next();
       
       return res.status(503).json({ 
         error: 'Database is currently offline. Please try again in a few minutes.' 
       });
    }

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

    if (!tenantIdStr || tenantIdStr === 'null' || tenantIdStr === 'undefined') {
      console.warn(`[TenantMiddleware] Invalid tenantId rejected: "${tenantIdStr}" | URL: ${req.url}`);
      return res.status(401).json({ error: 'Valid Tenant ID is required.' });
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
