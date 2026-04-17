const Client = require('../models/core/Client');
const crypto = require('crypto');

const User = require('../models/core/User');
const { getTenantConnection } = require('../config/db');
const ContactSchema = require('../models/tenant/Contact');

const getClients = async (req, res) => {
  try {
    const clients = await Client.find({});
    res.json(clients);
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
  try {
    const client = await Client.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (client) {
      // If client status was updated (e.g. to ACTIVE), also update the associated admin and agents status
      if (req.body.status) {
        console.log(`[Reactivation] Detected status update to: ${req.body.status} for tenant: ${client.tenantId}`);
        // 1. Sync User account statuses (MATCH BY TENANT OR EMAIL)
        const userSyncResult = await User.updateMany(
          { 
            $or: [
              { tenantId: client.tenantId },
              { email: client.email }
            ]
          },
          { $set: { status: 'ACTIVE' } }
        );
        console.log(`[Reactivation] User status sync complete. Matched/Updated: ${userSyncResult.matchedCount}/${userSyncResult.modifiedCount}`);

        // 2. Handle Password Reset if provided
        if (req.body.password) {
          console.log(`[Reactivation] Resetting password for tenant email: ${client.email}`);
          const user = await User.findOne({ 
            $or: [
              { tenantId: client.tenantId },
              { email: client.email }
            ]
          });
          if (user) {
            user.password = req.body.password;
            await user.save();
            console.log(`[Reactivation] Password hashed and saved successfully for: ${user.email}`);
          } else {
            console.log(`[Reactivation] WARNING: Could not find specific user to reset password for ${client.email}`);
          }
        }

        // 3. Sync User Email if provided
        if (req.body.email) {
          console.log(`[Reactivation] Syncing email to: ${req.body.email}`);
          await User.updateOne(
            { tenantId: client.tenantId },
            { $set: { email: req.body.email } }
          );
          console.log(`[Reactivation] Email sync query executed for tenantId: ${client.tenantId}`);
        }

        // EXTRA HARDENING: If Reactivating to ACTIVE (or Syncing), clear overdue tasks in tenant DB
        if (req.body.status === 'ACTIVE') {
          try {
            console.log(`[Reactivation] Forced task clearance started for tenant: ${client.tenantId}`);
            const tenantDb = getTenantConnection(client.tenantId);
            if (!tenantDb) throw new Error("Could not establish tenant DB connection");

            const Contact = tenantDb.model('Contact', ContactSchema);
            const fortyEightHoursAgo = new Date(Date.now() - 48 * 60 * 60 * 1000);
            
            // Find contacts that HAVE overdue tasks
            const contactsWithOverdue = await Contact.find({
              'tasks.status': 'PENDING',
              'tasks.dueDate': { $lt: fortyEightHoursAgo }
            });

            console.log(`[Reactivation] Found ${contactsWithOverdue.length} contacts with overdue tasks for ${client.tenantId}`);

            for (const contact of contactsWithOverdue) {
              let modified = false;
              contact.tasks.forEach(task => {
                if (task.status === 'PENDING' && new Date(task.dueDate) < fortyEightHoursAgo) {
                  task.status = 'COMPLETED';
                  task.outcome = 'Auto-completed during reactivation';
                  modified = true;
                }
              });
              if (modified) {
                await contact.save();
              }
            }
            console.log(`[Reactivation] All task violations resolved for: ${client.tenantId}`);
          } catch (taskErr) {
            console.error(`[Reactivation] CRITICAL FAILURE clearing tasks for ${client.tenantId}:`, taskErr);
          }
        }
      }
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
