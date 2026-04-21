const UserSession = require('../models/core/UserSession');

const sessionTracker = async (req, res, next) => {
  if (!req.user || !req.user._id) return next();

  try {
    // Find the current active session for this user
    const session = await UserSession.findOne({ 
      userId: req.user._id, 
      status: 'ACTIVE' 
    });

    if (session) {
      session.lastActivityAt = new Date();
      
      // Log interaction summary for mutations (POST, PUT, DELETE)
      if (['POST', 'PUT', 'DELETE'].includes(req.method)) {
        const actionDesc = `${req.method} ${req.originalUrl}`;
        // Simplify descriptive names for common routes
        let summary = actionDesc;
        if (req.originalUrl.includes('/contacts')) summary = `${req.method === 'POST' ? 'Created' : 'Updated'} Lead/Contact`;
        if (req.originalUrl.includes('/messages/send')) summary = 'Sent WhatsApp Message';
        if (req.originalUrl.includes('/campaigns')) summary = 'Managed Campaign';
        
        session.activitySummary.push({ action: summary });
      }

      await session.save();
    }
  } catch (error) {
    console.error('Session Tracking Error:', error);
  }
  
  next();
};

module.exports = sessionTracker;
