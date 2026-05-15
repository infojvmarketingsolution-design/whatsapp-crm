// Removed unused node-cron dependency
const Client = require('../models/core/Client');
const User = require('../models/core/User');
const { getTenantConnection } = require('../config/db');
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
                    const tenantDb = await getTenantConnection(client.tenantId);
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

const startInactivityFollowupWorker = () => {
    setInterval(async () => {
        try {
            const clients = await Client.find({ status: 'ACTIVE' });
            const thirtyMinsAgo = new Date(Date.now() - 30 * 60 * 1000);

            for (const client of clients) {
                try {
                    const tenantDb = await getTenantConnection(client.tenantId);
                    const Contact = tenantDb.model('Contact', ContactSchema);

                    const inactiveContacts = await Contact.find({
                        currentFlowStep: { $exists: true, $ne: null },
                        lastMessageAt: { $lt: thirtyMinsAgo }
                    });

                    if (inactiveContacts.length > 0) {
                        const waService = require('../services/whatsapp.service');
                        // Using Meta Graph API requires credentials from the client, assuming client model has them
                        const ws = new waService({ phoneNumberId: client.metaPhoneNumberId, accessToken: client.metaAccessToken });
                        
                        for (const contact of inactiveContacts) {
                            try {
                                await ws.sendTextMessage(contact.phone, "Would you like to continue your admission inquiry?");
                                // Clear current flow step so we don't send it again
                                await Contact.updateOne({ _id: contact._id }, { $unset: { currentFlowStep: '' } });
                            } catch (err) {
                                console.error(`[InactivityWorker] Error sending to ${contact.phone}`, err);
                            }
                        }
                    }
                } catch (tenantErr) {
                    console.error(`[InactivityWorker] Error processing tenant ${client.tenantId}:`, tenantErr);
                }
            }
        } catch (error) {
            console.error('[InactivityWorker] Error:', error);
        }
    }, 5 * 60 * 1000); // Check every 5 minutes
};

module.exports = { startTaskSuspensionWorker, startInactivityFollowupWorker };
