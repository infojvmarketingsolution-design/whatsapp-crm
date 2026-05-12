const { getTenantConnection } = require('../config/db');
const ContactSchema = require('../models/tenant/Contact');
const notificationService = require('../services/notification.service');

const getAvailableSlots = async (tenantId) => {
    // In a real implementation, this would call Google/Outlook Calendar API
    // For now, we return mock slots for the next 3 days
    const slots = [];
    const now = new Date();
    for (let i = 1; i <= 3; i++) {
        const date = new Date(now);
        date.setDate(now.getDate() + i);
        date.setHours(10, 0, 0, 0); // 10:00 AM
        slots.push({
            id: `slot_${i}_am`,
            label: `${date.toLocaleDateString('en-IN')} at 10:00 AM`,
            value: date.toISOString()
        });
        
        const pmDate = new Date(date);
        pmDate.setHours(15, 0, 0, 0); // 3:00 PM
        slots.push({
            id: `slot_${i}_pm`,
            label: `${pmDate.toLocaleDateString('en-IN')} at 03:00 PM`,
            value: pmDate.toISOString()
        });
    }
    return slots;
};

const bookAppointment = async (tenantId, contact, slotValue) => {
    try {
        const tenantDb = getTenantConnection(tenantId);
        const Contact = tenantDb.model('Contact', ContactSchema);

        const appointmentDate = new Date(slotValue);
        
        // Update contact tasks
        await Contact.updateOne(
            { _id: contact._id },
            { 
                $push: { 
                    tasks: {
                        type: 'MEETING',
                        title: 'Bot Scheduled Meeting',
                        description: `Automated booking for ${contact.selectedProgram || 'Inquiry'}`,
                        dueDate: appointmentDate,
                        status: 'PENDING'
                    }
                },
                $set: { nextFollowUp: appointmentDate }
            }
        );

        // Notify Admin
        notificationService.sendAdminAlert(tenantId, {
            subject: 'New Meeting Scheduled! 🗓️',
            text: `Lead *${contact.name || contact.phone}* has booked a slot for *${appointmentDate.toLocaleString()}*.`
        });

        return true;
    } catch (error) {
        console.error('[Scheduling Service] Error:', error);
        return false;
    }
};

module.exports = { getAvailableSlots, bookAppointment };
