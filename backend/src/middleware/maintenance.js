const GlobalSettings = require('../models/core/GlobalSettings');

const maintenanceMiddleware = async (req, res, next) => {
  try {
    // 1. Check if it's an excluded route (Login, Health, Admin Settings)
    const excludedPaths = [
      '/api/auth/login',
      '/api/admin/settings'
    ];
    
    if (excludedPaths.some(path => req.path.startsWith(path))) {
      return next();
    }

    // 2. Fetch platform settings
    const settings = await GlobalSettings.findOne({});
    
    if (settings && settings.maintenanceMode) {
      // 3. Allow SUPER_ADMIN to bypass
      // Note: This requires req.user to be populated by auth middleware
      if (req.user && req.user.role === 'SUPER_ADMIN') {
        return next();
      }

      return res.status(503).json({ 
        maintenance: true,
        message: 'The platform is currently under maintenance for a scheduled update. Please try again soon.' 
      });
    }
    
    next();
  } catch (error) {
    console.error('Maintenance middleware error:', error);
    next();
  }
};

module.exports = maintenanceMiddleware;
