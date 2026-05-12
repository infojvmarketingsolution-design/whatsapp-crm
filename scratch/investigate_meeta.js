const mongoose = require('mongoose');

async function run() {
    try {
        await mongoose.connect('mongodb://127.0.0.1:27017/crm_core');
        console.log('Connected to crm_core');
        const db = mongoose.connection.db;

        const User = db.collection('users');
        const meeta = await User.findOne({ email: 'bde.gandhinagaruniversity@gmail.com' });
        if (!meeta) {
            console.log('Meeta not found by email. Trying by phone 9328870404...');
            const meetaPhone = await User.findOne({ phone: /9328870404/ });
            if (!meetaPhone) {
                console.log('Meeta not found at all.');
                process.exit(0);
            }
            console.log('Meeta found by phone:', meetaPhone._id, meetaPhone.tenantId);
            Object.assign(meeta, meetaPhone);
        } else {
            console.log('Meeta ID:', meeta._id.toString());
            console.log('Meeta Tenant:', meeta.tenantId);
        }

        const tenantDbName = 'tenant_' + meeta.tenantId;
        const tenantDbConn = await mongoose.createConnection(`mongodb://127.0.0.1:27017/${tenantDbName}`);
        
        const Contact = tenantDbConn.collection('contacts');
        const allContacts = await Contact.countDocuments();
        console.log('Total contacts in tenant:', allContacts);

        const assignedMatches = await Contact.find({
            $or: [
                { assignedAgent: meeta._id.toString() },
                { assignedCounsellor: meeta._id.toString() },
                { assignedAgent: meeta._id },
                { assignedCounsellor: meeta._id }
            ]
        }).toArray();
        console.log(`Found ${assignedMatches.length} contacts currently assigned to Meeta`);

        // Check if there are contacts with "in bulk" in timeline recently
        const bulkActions = await Contact.find({
            'timeline.description': { $regex: /in bulk/i }
        }).project({ timeline: 1 }).toArray();

        let bulkCount = 0;
        let bulkDeleteCount = 0;
        let bulkArchiveCount = 0;
        let bulkUnassignCount = 0;
        let unassignedToMeeta = 0;
        let assignedToMeetaBulk = 0;

        bulkActions.forEach(c => {
            const bulks = c.timeline.filter(t => t.description && t.description.includes('in bulk'));
            bulkCount += bulks.length;
            bulks.forEach(b => {
                if (b.description.includes('archived')) bulkArchiveCount++;
                if (b.description.includes('unassigned')) bulkUnassignCount++;
                if (b.description.includes('Meeta')) assignedToMeetaBulk++;
            });
        });

        console.log(`Total bulk actions found in timelines: ${bulkCount}`);
        console.log(`Archived in bulk: ${bulkArchiveCount}`);
        console.log(`Unassigned in bulk: ${bulkUnassignCount}`);
        console.log(`Assigned to Meeta in bulk: ${assignedToMeetaBulk}`);
        
        // Also let's check recent logs if there is a logs collection in core
        const logs = await db.collection('logs').find({}).sort({createdAt: -1}).limit(20).toArray();
        if (logs.length > 0) {
            console.log('Found logs collection, recent logs:', logs.length);
        } else {
            console.log('No recent logs in core db.');
        }

        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}
run();
