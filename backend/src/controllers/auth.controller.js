const User = require('../models/core/User');
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const NotificationService = require('../services/notification.service');
const bcrypt = require('bcrypt');

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET || 'jv_crm_super_secret', {
    expiresIn: '30d',
  });
};

const authUser = async (req, res) => {
  const { email, password } = req.body;
  try {
    const user = await User.findOne({ email });

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
      res.status(401).json({ message: 'Invalid email or password' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const requestOTP = async (req, res) => {
  const { identifier, method } = req.body; // identifier can be email or phone
  try {
    const user = await User.findOne({
      $or: [{ email: identifier }, { phoneNumber: identifier }]
    });

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
  const { identifier, code } = req.body;
  try {
    const user = await User.findOne({
      $or: [{ email: identifier }, { phoneNumber: identifier }]
    });

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
    const Client = require('../models/core/Client');
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

    const client = await Client.create({
      name: companyName,
      email,
      mobileNumber: mobileNumber || '6354070709', // Default admin number as requested
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
      phoneNumber: mobileNumber || '6354070709', // Store in user model for login
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

