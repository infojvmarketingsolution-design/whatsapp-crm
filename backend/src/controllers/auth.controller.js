const User = require('../models/core/User');
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');

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

const registerSuperAdmin = async (req, res) => {
  const { name, email, password } = req.body;
  try {
    const userExists = await User.findOne({ email });

    if (userExists) {
      return res.status(400).json({ message: 'User already exists' });
    }

    const user = await User.create({
      name,
      email,
      password,
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
    const User = require('../models/core/User');
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
      mobileNumber: mobileNumber || '',
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

module.exports = { authUser, registerSuperAdmin, registerTenant };
