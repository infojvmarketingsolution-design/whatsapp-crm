// Removed unused node-cron dependency
const Client = require('../models/core/Client');
const User = require('../models/core/User');
const { getTenantDB } = require('../config/db');
const ContactSchema = require('../models/tenant/Contact');

// We use setInterval instead of node-cron if node-cron is not installed. 
// Wait, we can just export a function that runs setInterval.
const startTaskSuspensionWorker = () => {
    // Run every 10 minutes
    setInterval(async () => {
        try {
            // console.log('[TaskWorker] Checking for 49-hour overdue tasks...');
            const clients = await Client.find({ status: 'ACTIVE' });

            const now = new Date();
            const fortyNineHoursAgo = new Date(now.getTime() - 49 * 60 * 60 * 1000);

            for (const client of clients) {
                try {
                    const tenantDb = await getTenantDB(client.tenantId);
                    const Contact = tenantDb.model('Contact', ContactSchema);

                    // Find contacts that have at least one PENDING task older than 49 hours
                    const contactsWithOverdue = await Contact.find({
                        'tasks': {
                            $elemMatch: {
                                status: 'PENDING',
                                dueDate: { $lt: fortyNineHoursAgo }
                            }
                        }
                    });

                    if (contactsWithOverdue.length > 0) {
                        const agentsToSuspend = new Set();
                        
                        contactsWithOverdue.forEach(contact => {
                            if (contact.assignedAgent) {
                                agentsToSuspend.add(contact.assignedAgent.toString());
                            }
                        });

                        // If there are agents to suspend, update their status to SUSPENDED
                        if (agentsToSuspend.size > 0) {
                            const agentIds = Array.from(agentsToSuspend);
                            // Avoid suspending ADMINs or SUPER_ADMINs if possible, or just suspend the Agent.
                            await User.updateMany(
                                { _id: { $in: agentIds }, role: { $nin: ['SUPER_ADMIN', 'ADMIN'] } },
                                { $set: { status: 'SUSPENDED' } }
                            );
                            // console.log(`[TaskWorker] Suspended agents ${agentIds.join(', ')} in tenant ${client.tenantId} due to 49h overdue tasks.`);
                        }
                    }
                } catch (tenantErr) {
                    console.error(`[TaskWorker] Error processing tenant ${client.tenantId}:`, tenantErr);
                }
            }
        } catch (error) {
            console.error('[TaskWorker] Error in suspension worker:', error);
        }
    }, 10 * 60 * 1000); // 10 minutes
};

module.exports = { startTaskSuspensionWorker };
