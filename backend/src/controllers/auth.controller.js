const User = require('../models/core/User');
const Client = require('../models/core/Client');
const UserSession = require('../models/core/UserSession');
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const NotificationService = require('../services/notification.service');
const bcrypt = require('bcrypt');

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET || 'jv_crm_super_secret', {
    expiresIn: '30d',
  });
};

/**
 * HELPER: Create a new user session
 */
const createSession = async (user, req) => {
  try {
    // Close any previous active sessions for this user
    await UserSession.updateMany(
      { userId: user._id, status: 'ACTIVE' },
      { $set: { status: 'TIMEOUT', logoutAt: new Date() } }
    );

    await UserSession.create({
      userId: user._id,
      tenantId: user.tenantId,
      userName: user.name,
      userRole: user.role,
      ipAddress: req.headers['x-forwarded-for'] || req.socket.remoteAddress,
      userAgent: req.headers['user-agent']
    });
  } catch (error) {
    console.error('Session Creation Error:', error);
  }
};

/**
 * HELPER: Get secondary number mapping based on organization name
 */
const getSecondaryNumber = (orgName) => {
  const name = (orgName || '').toLowerCase();
  if (name.includes('gandhinagar')) return '6354070709';
  if (name.includes('vidhyadeep')) return '9924515760';
  if (name.includes('shreyarth')) return '9106763866';
  if (name.includes('progressive') || name.includes('rai')) return '9904015760';
  if (name.includes('j.v')) return '6359700606';
  return '6354070709'; // Default fallback
};

const authUser = async (req, res) => {
  const { email, password, apiNumber } = req.body;
  try {
    let query = { email };
    
    if (apiNumber) {
      const cleanInput = apiNumber.replace(/[^\d]/g, '');
      if (!cleanInput) return res.status(400).json({ message: 'Invalid API Number format.' });
      const searchDigits = cleanInput.length > 10 ? cleanInput.slice(-10) : cleanInput;
      const regexPattern = searchDigits.split('').join('[^0-9]*');
      const regex = new RegExp(regexPattern);
      const client = await Client.findOne({ 
        $or: [
          { 'whatsappConfig.phoneNumber': { $regex: regex } },
          { 'mobileNumber': { $regex: regex } },
          { 'phone': { $regex: regex } }
        ]
      });
      if (!client) return res.status(404).json({ message: 'Invalid API Number. Account not found.' });
      query.tenantId = client.tenantId;
    }

    const user = await User.findOne(query);

    if (user && user.status === 'SUSPENDED') {
      return res.status(403).json({ message: 'Account suspended. Please contact your Administrator.' });
    }

    if (user && (await user.matchPassword(password))) {
      await createSession(user, req);
      res.json({
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        tenantId: user.tenantId,
        token: generateToken(user._id),
      });
    } else {
      res.status(401).json({ message: 'Invalid credentials or workspace combination' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const logout = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (user) {
      // Trigger Logout Alert via WhatsApp
      await NotificationService.sendLogoutAlert(user);
    }

    await UserSession.updateOne(
      { userId: req.user._id, status: 'ACTIVE' },
      { $set: { status: 'LOGGED_OUT', logoutAt: new Date() } }
    );
    res.json({ message: 'Logged out successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const loginWithMpin = async (req, res) => {
  const { phoneNumber, mpin, apiNumber } = req.body;
  try {
    let query = { phoneNumber };
    
    if (apiNumber) {
      const cleanInput = apiNumber.replace(/[^\d]/g, '');
      if (!cleanInput) return res.status(400).json({ message: 'Invalid API Number format.' });
      const searchDigits = cleanInput.length > 10 ? cleanInput.slice(-10) : cleanInput;
      const regexPattern = searchDigits.split('').join('[^0-9]*');
      const regex = new RegExp(regexPattern);
      const client = await Client.findOne({ 
        $or: [
          { 'whatsappConfig.phoneNumber': { $regex: regex } },
          { 'mobileNumber': { $regex: regex } },
          { 'phone': { $regex: regex } }
        ]
      });
      if (!client) return res.status(404).json({ message: 'Invalid API Number. Workspace not found.' });
      query.tenantId = client.tenantId;
    }

    const user = await User.findOne(query);

    if (!user) {
      return res.status(404).json({ message: 'Account not found with this number' });
    }

    if (user.status === 'SUSPENDED') {
      return res.status(403).json({ message: 'Account suspended' });
    }

    const isMatch = await user.matchMpin(mpin);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid MPIN' });
    }

    await createSession(user, req);

    // Send Login Alert
    const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
    NotificationService.sendLoginAlert(user, ip);

    res.json({
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      tenantId: user.tenantId,
      token: generateToken(user._id),
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const requestOTP = async (req, res) => {
  const { identifier, method, apiNumber } = req.body; 
  try {
    let query = { $or: [{ email: identifier }, { phoneNumber: identifier }] };

    if (apiNumber) {
      const cleanInput = apiNumber.replace(/[^\d]/g, '');
      if (!cleanInput) return res.status(400).json({ message: 'Invalid API Number format.' });
      const searchDigits = cleanInput.length > 10 ? cleanInput.slice(-10) : cleanInput;
      const regexPattern = searchDigits.split('').join('[^0-9]*');
      const regex = new RegExp(regexPattern);
      const client = await Client.findOne({ 
        $or: [
          { 'whatsappConfig.phoneNumber': { $regex: regex } },
          { 'mobileNumber': { $regex: regex } },
          { 'phone': { $regex: regex } }
        ]
      });
      if (!client) return res.status(404).json({ message: 'Invalid API Number. Workspace not found.' });
      query.tenantId = client.tenantId;
    }

    const user = await User.findOne(query);

    if (!user) {
      return res.status(404).json({ message: 'No account found with this identifier' });
    }

    if (user.status === 'SUSPENDED') {
      return res.status(403).json({ message: 'Account suspended' });
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpExpiresAt = new Date(Date.now() + 5 * 60000); 

    const salt = await bcrypt.genSalt(10);
    user.otp = {
      code: await bcrypt.hash(otp, salt),
      expiresAt: otpExpiresAt,
      method: method || 'EMAIL'
    };
    await user.save();

    const sent = await NotificationService.sendOTP(user, otp, method || 'EMAIL');

    if (sent) {
      res.json({ message: `OTP sent successfully via ${method || 'EMAIL'}`, method: method || 'EMAIL' });
    } else {
      res.status(500).json({ message: 'Failed to send OTP. Please try again or use another method.' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const verifyOTP = async (req, res) => {
  const { identifier, code, apiNumber } = req.body;
  try {
    let query = { $or: [{ email: identifier }, { phoneNumber: identifier }] };

    if (apiNumber) {
      const cleanInput = apiNumber.replace(/[^\d]/g, '');
      if (!cleanInput) return res.status(400).json({ message: 'Invalid API Number format.' });
      const searchDigits = cleanInput.length > 10 ? cleanInput.slice(-10) : cleanInput;
      const regexPattern = searchDigits.split('').join('[^0-9]*');
      const regex = new RegExp(regexPattern);
      const client = await Client.findOne({ 
        $or: [
          { 'whatsappConfig.phoneNumber': { $regex: regex } },
          { 'mobileNumber': { $regex: regex } },
          { 'phone': { $regex: regex } }
        ]
      });
      if (client) query.tenantId = client.tenantId;
    }

    const user = await User.findOne(query);

    if (!user || !user.otp || !user.otp.code) {
      return res.status(401).json({ message: 'OTP not requested or invalid' });
    }

    if (new Date() > user.otp.expiresAt) {
      return res.status(401).json({ message: 'OTP has expired' });
    }

    const isMatch = await bcrypt.compare(code, user.otp.code);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid OTP' });
    }

    user.otp = undefined;
    await user.save();

    await createSession(user, req);

    res.json({
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      tenantId: user.tenantId,
      token: generateToken(user._id),
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const registerSuperAdmin = async (req, res) => {
  const { name, email, password, phoneNumber } = req.body;
  try {
    const userExists = await User.findOne({ email });

    if (userExists) {
      return res.status(400).json({ message: 'User already exists' });
    }

    const user = await User.create({
      name,
      email,
      password,
      phoneNumber,
      mpin: req.body.mpin || '123456', // Default MPIN for new super admins
      role: 'SUPER_ADMIN'
    });

    if (user) {
      await createSession(user, req);
      res.status(201).json({
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        token: generateToken(user._id),
      });
    } else {
      res.status(400).json({ message: 'Invalid user data to create Super Admin' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const registerTenant = async (req, res) => {
  const { name, email, password, mobileNumber, alternativeNumber } = req.body;
  try {
    const crypto = require('crypto');

    const clientExists = await Client.findOne({ email });
    const userExists = await User.findOne({ email });

    if (clientExists || userExists) {
      return res.status(400).json({ message: 'Account with this email already exists' });
    }

    const companyName = name || 'My SaaS Organization';
    const tenantId = companyName.toLowerCase().replace(/[^a-z0-9]/g, '') + '_' + Date.now().toString().slice(-6);
    const apiKey = crypto.randomBytes(32).toString('hex');

    const secondaryOtpNumber = mobileNumber || getSecondaryNumber(companyName);

    const client = await Client.create({
      name: companyName,
      email,
      mobileNumber: secondaryOtpNumber,
      alternativeNumber: alternativeNumber || '',
      companyName,
      tenantId,
      apiKey,
      plan: 'BASIC'
    });

    const user = await User.create({
      name,
      email,
      password,
      phoneNumber: secondaryOtpNumber,
      mpin: req.body.mpin || '123456', // User-defined or default MPIN
      role: 'ADMIN',
      tenantId
    });

    if (user && client) {
      await createSession(user, req);
      res.status(201).json({
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        tenantId: user.tenantId,
        token: generateToken(user._id),
      });
    } else {
      res.status(400).json({ message: 'Invalid user data to create account' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const updateAvailability = async (req, res) => {
  try {
    const { isAvailable } = req.body;
    
    // Find the current logged in user and update their status
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    user.isAvailableForAutoAssign = isAvailable;
    await user.save();
    
    res.json({ message: 'Availability status updated', isAvailable: user.isAvailableForAutoAssign });
  } catch (error) {
    res.status(500).json({ message: 'Error updating availability status', error: error.message });
  }
};

module.exports = { 
  authUser, 
  logout, 
  registerSuperAdmin, 
  registerTenant, 
  requestOTP, 
  verifyOTP, 
  updateAvailability,
  loginWithMpin
};


