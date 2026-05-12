const User = require('../models/core/User');
const ContactSchema = require('../models/tenant/Contact');
const BotAnalyticsSchema = require('../models/tenant/BotAnalytics');
const mongoose = require('mongoose');

/**
 * Get Team Performance Stats for Managers/Business Heads
 */
const getTeamStats = async (req, res) => {
  try {
    const Contact = req.tenantDb.model('Contact', ContactSchema);
    
    // 1. Fetch all team members in this tenant
    const teamMembers = await User.find({ 
      tenantId: req.tenantId,
      status: 'ACTIVE',
      role: { $in: ['TELECALLER', 'MANAGER_COUNSELLOUR', 'MANAGER COUNSELLOUR', 'AGENT', 'BUSINESS_HEAD', 'BUSINESS HEAD', 'COUNSELLOUR', 'COUNSELLOR', 'ADMIN', 'SUPER_ADMIN', 'OWNER'] }
    }).select('name role email phoneNumber isAvailableForAutoAssign');

    // 2. Aggregate stats for each member
    const stats = await Promise.all(teamMembers.map(async (member) => {
      const newLeads = await Contact.countDocuments({
        $or: [{ assignedAgent: member._id }, { assignedCounsellor: member._id }],
        status: 'NEW LEAD',
        isArchived: { $ne: true }
      });

      const openLeads = await Contact.countDocuments({
        $or: [{ assignedAgent: member._id }, { assignedCounsellor: member._id }],
        status: { $nin: ['CLOSED_WON', 'CLOSED_LOST'] },
        isArchived: { $ne: true }
      });

      const closedLeads = await Contact.countDocuments({
        $or: [{ assignedAgent: member._id }, { assignedCounsellor: member._id }],
        status: { $in: ['CLOSED_WON', 'CLOSED_LOST'] },
        isArchived: { $ne: true }
      });

      const admissions = await Contact.countDocuments({
        $or: [{ assignedAgent: member._id }, { assignedCounsellor: member._id }],
        admissionStatus: 'Admitted',
        isArchived: { $ne: true }
      });

      const pendingAdmissions = await Contact.countDocuments({
        $or: [{ assignedAgent: member._id }, { assignedCounsellor: member._id }],
        admissionStatus: 'Pending',
        isArchived: { $ne: true }
      });

      const collections = await Contact.aggregate([
        { 
          $match: { 
            $or: [{ assignedAgent: member._id }, { assignedCounsellor: member._id }],
            isArchived: { $ne: true }
          } 
        },
        { $group: { _id: null, total: { $sum: "$collectionAmount" }, pending: { $sum: "$pendingCollectionAmount" } } }
      ]);

      const collectionTotal = collections.length > 0 ? collections[0].total : 0;
      const collectionPending = collections.length > 0 ? collections[0].pending : 0;

      const contactsWithTasks = await Contact.find({
        $or: [{ assignedAgent: member._id }, { assignedCounsellor: member._id }],
        'tasks.0': { $exists: true }
      }).select('tasks');

      let totalTasks = 0;
      let completedTasks = 0;
      let pendingTasks = 0;

      contactsWithTasks.forEach(c => {
        c.tasks.forEach(t => {
          totalTasks++;
          if (t.status === 'COMPLETED') completedTasks++;
          if (t.status === 'PENDING' || t.status === 'IN_PROGRESS') pendingTasks++;
        });
      });

      const statusBreakdown = await Contact.aggregate([
        { 
          $match: { 
            $or: [{ assignedAgent: member._id }, { assignedCounsellor: member._id }],
            isArchived: { $ne: true }
          } 
        },
        { $group: { _id: "$status", count: { $sum: 1 } } }
      ]);

      return {
        _id: member._id,
        name: member.name,
        role: member.role,
        email: member.email,
        phone: member.phoneNumber,
        isAvailable: member.isAvailableForAutoAssign,
        leadCount: openLeads + closedLeads,
        newLeads,
        openLeads,
        closedLeads,
        admissions,
        pendingAdmissions,
        collectionTotal,
        collectionPending,
        totalTasks,
        completedTasks,
        pendingTasks,
        taskEfficiency: totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0,
        statusBreakdown: statusBreakdown.reduce((acc, curr) => {
          acc[curr._id] = curr.count;
          return acc;
        }, {})
      };
    }));

    res.json(stats);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getBotStats = async (req, res) => {
  try {
    const BotAnalytics = req.tenantDb.model('BotAnalytics', BotAnalyticsSchema);
    
    const stats = await BotAnalytics.aggregate([
      { $match: { tenantId: req.tenantId } },
      { $group: { 
          _id: "$nodeId", 
          views: { $sum: 1 },
          conversions: { $sum: { $cond: [{ $eq: ["$eventType", "CONVERSION"] }, 1, 0] } }
      } },
      { $sort: { views: -1 } }
    ]);

    res.json(stats);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { getTeamStats, getBotStats };
