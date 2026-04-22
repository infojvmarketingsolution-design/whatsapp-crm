const Client = require('../models/core/Client');
const crypto = require('crypto');

const User = require('../models/core/User');
const { getTenantConnection } = require('../config/db');
const ContactSchema = require('../models/tenant/Contact');

const getClients = async (req, res) => {
  try {
    const clients = await Client.find({});
    // Bypass MongoDB for Shreyarth
    const modifiedClients = clients.map(c => {
      const clientObj = c.toObject();
      if (clientObj.name && clientObj.name.toLowerCase().includes('shreyarth')) {
        clientObj.whatsappConfig = {
          phoneNumberId: '1074613152404424',
          wabaId: '1433761851305451',
          accessToken: 'EAAUZAwz8PZCJABRfcA4XgJmp8UzJ4ixXbpVA7CvnldS3pkDXdUkbtE2hyfYFHYsZAcZBgKaDwGpHCLf5N0iQfCTfJZAu0iwLmhrbcy2TON4DBvkEeZBZCKhLsSnZCF0ZBASOjWQwtv8ZA2mSZC2ZB0UtQiWcvuPwukLlzAJbLqdkkkW7QPNzJZAWVUKZAQEnPYo2wxzQZDZD',
          phoneNumber: '+91 63566 00606',
          wabaName: 'Shreyarth university'
        };
      }
      return clientObj;
    });
    res.json(modifiedClients);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const createClient = async (req, res) => {
  const { name, email, phone, mobileNumber, alternativeNumber, companyName, plan, adminName, password } = req.body;
  try {
    const clientExists = await Client.findOne({ email });
    if (clientExists) {
      return res.status(400).json({ message: 'Client already exists with this email' });
    }

    // Generate unique tenantId and API Key
    const tenantId = companyName.toLowerCase().replace(/[^a-z0-9]/g, '') + '_' + Date.now().toString().slice(-6);
    const apiKey = crypto.randomBytes(32).toString('hex');

    const client = await Client.create({
      name: name || companyName,
      email,
      phone: phone || '',
      mobileNumber: mobileNumber || phone || '',
      alternativeNumber: alternativeNumber || '',
      companyName,
      tenantId,
      apiKey,
      plan: plan || 'BASIC'
    });

    // Create default ADMIN user for this tenant
    await User.create({
      name: adminName || name,
      email: email,
      password: password || 'admin123', // Should be provided by UI
      role: 'ADMIN',
      tenantId: tenantId
    });

    res.status(201).json(client);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getClientById = async (req, res) => {
  try {
    const client = await Client.findById(req.params.id);
    if (client) {
      res.json(client);
    } else {
      res.status(404).json({ message: 'Client not found' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const updateClient = async (req, res) => {
  console.log('--- updateClient CALLED ---', req.params.id);
  console.log('req.body:', req.body);
  const { 
    companyName, 
    email, 
    mobileNumber, 
    loginEmail, 
    password, 
    status, 
    plan,
    whatsappConfig
  } = req.body;

  try {
    const client = await Client.findById(req.params.id);
    if (!client) {
      console.log('Client not found');
      return res.status(404).json({ message: 'Client not found' });
    }

    const updateFields = {};
    if (companyName) {
      updateFields.companyName = companyName;
      updateFields.name = companyName;
    }
    if (email) updateFields.email = email;
    if (mobileNumber) updateFields.mobileNumber = mobileNumber;
    if (status) updateFields.status = status;
    if (plan) updateFields.plan = plan;
    
    if (whatsappConfig) {
      updateFields.whatsappConfig = whatsappConfig;
    }
    
    console.log('updateFields:', updateFields);

    const updatedClient = await Client.findByIdAndUpdate(
      client._id,
      { $set: updateFields },
      { new: true }
    );
    
    console.log('updatedClient after save:', updatedClient.whatsappConfig);

    // 2. Find and Update the Admin User for this tenant
    const adminUser = await User.findOne({ 
      tenantId: client.tenantId, 
      role: 'ADMIN' 
    });

    if (adminUser) {
      if (loginEmail) adminUser.email = loginEmail;
      if (mobileNumber) adminUser.phoneNumber = mobileNumber;
      if (password) adminUser.password = password;
      if (status) adminUser.status = status;
      await adminUser.save();
      console.log(`[Sync] Updated Admin User (${adminUser.email}) for tenant ${client.tenantId}`);
    }

    // 3. Optional: Sync all other agents if status changed to ACTIVE
    if (status === 'ACTIVE') {
      await User.updateMany(
        { tenantId: client.tenantId },
        { $set: { status: 'ACTIVE' } }
      );
    }

    res.json(updatedClient);
  } catch (error) {
    console.error('❌ UpdateClient Error:', error);
    res.status(500).json({ message: error.message });
  }
};

const deleteClient = async (req, res) => {
  try {
    const client = await Client.findById(req.params.id);
    if (!client) {
      return res.status(404).json({ message: 'Client not found' });
    }
    
    const tenantId = client.tenantId;

    // 1. Drop the tenant-specific database
    try {
      const tenantDb = getTenantConnection(tenantId);
      if (tenantDb) {
        await tenantDb.dropDatabase();
        console.log(`[Deep Delete] Dropped database for tenant: ${tenantId}`);
      }
    } catch (dbErr) {
      console.error(`[Deep Delete] Error dropping database for ${tenantId}:`, dbErr);
      // Continue even if database drop fails, as we want to clean up core records
    }

    // 2. Delete associated users from core DB
    await User.deleteMany({ tenantId: tenantId });
    console.log(`[Deep Delete] Deleted users for tenant: ${tenantId}`);
    
    // 3. Delete the client entry from core DB
    await Client.findByIdAndDelete(req.params.id);
    console.log(`[Deep Delete] Deleted client record for: ${tenantId}`);
    
    res.json({ message: 'Client and all associated data permanently deleted' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getGlobalAnalytics = async (req, res) => {
  try {
    const totalClients = await Client.countDocuments({});
    const activeClients = await Client.countDocuments({ status: 'ACTIVE' });
    const totalUsers = await User.countDocuments({ role: { $ne: 'SUPER_ADMIN' } });
    
    // For more complex analytics (messages, revenue), we'd need to aggregate across tenant DBs or store global stats
    // For now, let's provide basic counts
    res.json({
      totalClients,
      activeClients,
      totalUsers,
      totalRevenue: totalClients * 1999, // Placeholder calculation
      planDistribution: {
        basic: await Client.countDocuments({ plan: 'BASIC' }),
        pro: await Client.countDocuments({ plan: 'PRO' }),
        premium: await Client.countDocuments({ plan: 'PREMIUM' })
      }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getClients,
  createClient,
  getClientById,
  updateClient,
  deleteClient,
  getGlobalAnalytics
};
