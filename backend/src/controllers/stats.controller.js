const User = require('../models/core/User');
const ContactSchema = require('../models/tenant/Contact');
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
      role: { $in: ['TELECALLER', 'MANAGER_COUNSELLOUR', 'AGENT', 'BUSINESS_HEAD'] }
    }).select('name role email phoneNumber isAvailableForAutoAssign');

    // 2. Aggregate stats for each member
    const stats = await Promise.all(teamMembers.map(async (member) => {
      const memberIdStr = member._id.toString();
      
      // Count Leads
      const leadCount = await Contact.countDocuments({
        $or: [
          { assignedAgent: member._id },
          { assignedCounsellor: member._id }
        ],
        isArchived: { $ne: true }
      });

      // Count Tasks
      const contactsWithTasks = await Contact.find({
        $or: [
          { assignedAgent: member._id },
          { assignedCounsellor: member._id }
        ],
        'tasks.0': { $exists: true }
      }).select('tasks');

      let totalTasks = 0;
      let completedTasks = 0;

      contactsWithTasks.forEach(c => {
        c.tasks.forEach(t => {
          totalTasks++;
          if (t.status === 'COMPLETED') completedTasks++;
        });
      });

      // Get Status Breakdown for this user
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
        leadCount,
        totalTasks,
        completedTasks,
        taskEfficiency: totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0,
        statusBreakdown: statusBreakdown.reduce((acc, curr) => {
          acc[curr._id] = curr.count;
          return acc;
        }, {})
      };
    }));

    res.json(stats);
  } catch (error) {
    console.error('Get Team Stats Error:', error);
    res.status(500).json({ message: error.message });
  }
};

module.exports = { getTeamStats };
