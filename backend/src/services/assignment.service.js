const User = require('../models/core/User');

/**
 * Implements Round-Robin lead assignment for a specific tenant.
 * Picks the active agent or telecaller who was assigned a lead longest ago.
 */
exports.getNextAgentForTenant = async (tenantId) => {
  try {
    // 1. Find all active users for this tenant with appropriate roles
    const eligibleAgents = await User.find({
      tenantId,
      status: 'ACTIVE',
      role: { $in: ['TELECALLER', 'AGENT', 'MANAGER_COUNSELLOUR'] }
    }).sort({ lastLeadAssignedAt: 1 }); // Oldest first (nulls will be first)

    if (!eligibleAgents || eligibleAgents.length === 0) {
      console.log(`[AssignmentService] No eligible agents found for tenant ${tenantId}`);
      return null;
    }

    // 2. Pick the first one (the one who's been waiting the longest)
    const selectedAgent = eligibleAgents[0];

    // 3. Update their last assignment timestamp
    selectedAgent.lastLeadAssignedAt = new Date();
    await selectedAgent.save();

    console.log(`[AssignmentService] Assigned lead to ${selectedAgent.name} (${selectedAgent.role}) for tenant ${tenantId}`);
    return selectedAgent._id;
  } catch (err) {
    console.error('[AssignmentService] Error in Round-Robin logic:', err);
    return null;
  }
};
