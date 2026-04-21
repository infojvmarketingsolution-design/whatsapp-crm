const jwt = require('jsonwebtoken');
const User = require('../models/core/User');
const UserSession = require('../models/core/UserSession');
const mongoose = require('mongoose');

const protect = async (req, res, next) => {
  let token;
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      token = req.headers.authorization.split(' ')[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'jv_crm_super_secret');
      req.user = await User.findById(decoded.id).select('-password');
      
      if (req.user && req.user.status === 'SUSPENDED') {
          return res.status(403).json({ message: 'Account suspended. Please contact your Administrator.' });
      }

      // Track Session Activity
      if (req.user) {
        try {
          const session = await UserSession.findOne({ userId: req.user._id, status: 'ACTIVE' });
          if (session) {
            session.lastActivityAt = new Date();
            // Log interactions for mutations
            if (['POST', 'PUT', 'DELETE'].includes(req.method)) {
              let summary = `${req.method} ${req.originalUrl}`;
              if (req.originalUrl.includes('/contacts')) summary = `${req.method === 'POST' ? 'Created' : 'Updated'} Lead/Contact`;
              if (req.originalUrl.includes('/messages/send')) summary = 'Sent WhatsApp Message';
              session.activitySummary.push({ action: summary });
            }
            await session.save();
          }
        } catch (e) {
          console.error('Session track fail:', e);
        }
      }

      return next();
    } catch (error) {
      return res.status(401).json({ message: 'Not authorized, token failed' });
    }
  }

  if (!token) {
    return res.status(401).json({ message: 'Not authorized, no token provided' });
  }
};

const superAdminOnly = (req, res, next) => {
  if (req.user && req.user.role === 'SUPER_ADMIN') {
    next();
  } else {
    res.status(403).json({ message: 'Not authorized as super admin' });
  }
};

module.exports = { protect, superAdminOnly };
