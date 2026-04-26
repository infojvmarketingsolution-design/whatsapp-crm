const User = require('../models/core/User');

/**
 * Implements Round-Robin lead assignment for a specific tenant.
 * Picks the active agent or telecaller who was assigned a lead longest ago.
 */
exports.getNextAgentForTenant = async (tenantId) => {
  try {
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    // 1. Find all potentially active users for this tenant
    const [allAgents, settings] = await Promise.all([
      User.find({
        tenantId,
        status: 'ACTIVE',
        isAvailableForAutoAssign: { $ne: false },
        role: { $nin: ['ADMIN', 'SUPER_ADMIN', 'OWNER'] }
      }),
      Settings.findOne({ tenantId })
    ]);

    if (!allAgents || allAgents.length === 0) {
      console.log(`[AssignmentService] No eligible agents found for tenant ${tenantId}`);
      return null;
    }

    const rules = settings?.crm?.autoAssignmentRules || [];

    // 2. Filter based on Role/User Specific Rules
    const eligibleList = allAgents.filter(agent => {
      const role = (agent.role || 'AGENT').toUpperCase().replace(/\s/g, '_');
      const userId = agent._id.toString();

      // Find applicable rules (User rule takes priority)
      const userRule = rules.find(r => r.type === 'USER' && r.targetId === userId);
      const roleRule = rules.find(r => r.type === 'ROLE' && r.targetId === role);
      
      // Apply the most specific rule found
      const activeRule = userRule || roleRule;
      
      // Dynamic Limit check
      if (activeRule && activeRule.limitPerDay > 0) {
        const lastReset = new Date(agent.lastLeadResetAt || 0).getTime();
        if (lastReset < todayStart.getTime()) {
          agent.dailyLeadCount = 0;
          return true;
        }
        return (agent.dailyLeadCount || 0) < activeRule.limitPerDay;
      }

      // Hardcoded Fallback for Business Head if no dynamic rule exists
      if (role === 'BUSINESS_HEAD') {
        const lastReset = new Date(agent.lastLeadResetAt || 0).getTime();
        if (lastReset < todayStart.getTime()) {
          agent.dailyLeadCount = 0;
          return true;
        }
        return (agent.dailyLeadCount || 0) < 5;
      }
      
      // TELECALLER, COUNSELLOR, AGENT: Unlimited by default
      return true;
    });

    if (eligibleList.length === 0) {
      console.log(`[AssignmentService] All agents for tenant ${tenantId} have reached their daily limits.`);
      return null;
    }

    // 3. Sort by lastLeadAssignedAt (Round-Robin)
    eligibleList.sort((a, b) => (a.lastLeadAssignedAt || 0) - (b.lastLeadAssignedAt || 0));

    const selectedAgent = eligibleList[0];
    const selectedRole = (selectedAgent.role || 'AGENT').toUpperCase().replace(/\s/g, '_');

    // 4. Update the User stats
    const lastReset = new Date(selectedAgent.lastLeadResetAt || 0).getTime();
    if (lastReset < todayStart.getTime()) {
      selectedAgent.dailyLeadCount = 0;
      selectedAgent.lastLeadResetAt = new Date();
    }

    selectedAgent.lastLeadAssignedAt = new Date();
    
    // Increment daily count for restricted roles
    if (selectedRole === 'BUSINESS_HEAD') {
      selectedAgent.dailyLeadCount = (selectedAgent.dailyLeadCount || 0) + 1;
    }

    await selectedAgent.save();

    console.log(`[AssignmentService] Assigned lead to ${selectedAgent.name} (${selectedAgent.role}) for tenant ${tenantId}. Daily Count: ${selectedAgent.dailyLeadCount || 0}`);
    return selectedAgent._id;
  } catch (err) {
    console.error('[AssignmentService] Error in Assignment logic:', err);
    return null;
  }
};
