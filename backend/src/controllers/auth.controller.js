const User = require('../models/core/User');
const Client = require('../models/core/Client');
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
    
    // If API Number is provided, identify the tenant first
    if (apiNumber) {
      const client = await Client.findOne({ 'whatsappConfig.phoneNumber': apiNumber });
      if (!client) return res.status(404).json({ message: 'Invalid API Number. Account not found.' });
      query.tenantId = client.tenantId;
    }

    const user = await User.findOne(query);

    if (user && user.status === 'SUSPENDED') {
      return res.status(403).json({ message: 'Account suspended. Please contact your Administrator.' });
    }

    if (user && (await user.matchPassword(password))) {
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

const requestOTP = async (req, res) => {
  const { identifier, method, apiNumber } = req.body; // identifier can be email or phone
  try {
    let query = { $or: [{ email: identifier }, { phoneNumber: identifier }] };

    // If API Number is provided, identify the tenant first
    if (apiNumber) {
      const client = await Client.findOne({ 'whatsappConfig.phoneNumber': apiNumber });
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

    // Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpExpiresAt = new Date(Date.now() + 5 * 60000); // 5 minutes

    // Store hashed OTP
    const salt = await bcrypt.genSalt(10);
    user.otp = {
      code: await bcrypt.hash(otp, salt),
      expiresAt: otpExpiresAt,
      method: method || 'EMAIL'
    };
    await user.save();

    // Send OTP via service
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
      const client = await Client.findOne({ 'whatsappConfig.phoneNumber': apiNumber });
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

    // Clear OTP after successful use
    user.otp = undefined;
    await user.save();

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
      role: 'SUPER_ADMIN'
    });

    if (user) {
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

    // Generate unique tenantId and API Key
    const companyName = name || 'My SaaS Organization';
    const tenantId = companyName.toLowerCase().replace(/[^a-z0-9]/g, '') + '_' + Date.now().toString().slice(-6);
    const apiKey = crypto.randomBytes(32).toString('hex');

    // Dynamic secondary number mapping
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
      role: 'ADMIN',
      tenantId
    });

    if (user && client) {
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

module.exports = { authUser, registerSuperAdmin, registerTenant, requestOTP, verifyOTP };


