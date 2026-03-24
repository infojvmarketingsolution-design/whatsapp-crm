const Client = require('../models/core/Client');
const crypto = require('crypto');

const User = require('../models/core/User');

const getClients = async (req, res) => {
  try {
    const clients = await Client.find({});
    res.json(clients);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const createClient = async (req, res) => {
  const { name, email, phone, companyName, plan, adminName, password, maxMessagesPerDay, subscriptionEndsAt } = req.body;
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
      companyName,
      tenantId,
      apiKey,
      plan: plan || 'BASIC',
      maxMessagesPerDay: maxMessagesPerDay || (plan === 'PREMIUM' ? 10000 : plan === 'PRO' ? 5000 : 1000),
      subscriptionEndsAt: subscriptionEndsAt || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // Default 30 days
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
  try {
    const client = await Client.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (client) {
      res.json(client);
    } else {
      res.status(404).json({ message: 'Client not found' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const deleteClient = async (req, res) => {
  try {
    const client = await Client.findById(req.params.id);
    if (!client) {
      return res.status(404).json({ message: 'Client not found' });
    }
    
    // In a real SaaS, you might want to archive the DB or delete it
    // For now, just remove the client entry and admin user
    await Client.findByIdAndDelete(req.params.id);
    await User.deleteMany({ tenantId: client.tenantId });
    
    res.json({ message: 'Client and associated users deleted' });
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
