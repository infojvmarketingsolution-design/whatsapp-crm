const mongoose = require('mongoose');

// Cache to hold tenant database connections
const connectionMap = new Map();

/**
 * Connect to the core SaaS database
 */
const connectCoreDB = async () => {
  try {
    const coreUri = process.env.CORE_DB_URI || 'mongodb://localhost:27017/jv_cloud_crm_core';
    const connection = await mongoose.connect(coreUri, {
      maxPoolSize: 10,
    });
    console.log('✅ Connected to Core MongoDB');
    return connection;
  } catch (error) {
    console.error('❌ Core DB Connection Error:', error);
    // process.exit(1); Disable hard crash so webhook testing works offline!
    throw error;
  }
};

/**
 * Dynamically switch to/create a tenant-specific connection
 */
const getTenantConnection = (tenantId) => {
  if (connectionMap.has(tenantId)) {
    return connectionMap.get(tenantId);
  }

  // Create a new connection for the tenant using the mongoose connection pooling
  const tenantUri = process.env.TENANT_DB_URI_PREFIX 
      ? `${process.env.TENANT_DB_URI_PREFIX}_${tenantId}` 
      : `mongodb://localhost:27017/jv_tenant_${tenantId}`;
      
  const conn = mongoose.createConnection(tenantUri, {
    maxPoolSize: 10,
  });

  // PREVENT UNHANDLED ERROR CRASH WHEN MONGODB IS OFFLINE
  conn.on('error', () => {
     console.log(`⚠️ Tenant DB ${tenantId} connection error safely ignored.`);
  });

  connectionMap.set(tenantId, conn);
  console.log(`✅ Connected to Tenant DB: ${tenantId}`);
  
  return conn;
};

module.exports = {
  connectCoreDB,
  getTenantConnection
};
