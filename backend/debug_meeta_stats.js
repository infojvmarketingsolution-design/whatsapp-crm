const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

const User = require('./src/models/core/User');
const Client = require('./src/models/core/Client');
const ContactSchema = require('./src/models/tenant/Contact');

async function debugMeeta() {
    try {
        const uri = process.env.CORE_DB_URI || 'mongodb://127.0.0.1:27017/crm_core';
        console.log(`Connecting to: ${uri}`);
        await mongoose.connect(uri);
        console.log('Connected to DB');

        const UserSession = require('./src/models/core/UserSession');
        const sessions = await UserSession.find({}).sort({ updatedAt: -1 }).limit(20);
        console.log(`Recent Sessions: ${sessions.length}`);
        
        const userIds = [...new Set(sessions.map(s => s.userId))];
        const users = await User.find({ _id: { $in: userIds } });
        
        users.forEach(u => console.log(`- ${u.name} | ${u.email} | ${u.phoneNumber} | Tenant: ${u.tenantId} | Role: ${u.role}`));
        return;

        // Connect to Tenant DB
        const tenantDb = mongoose.connection.useDb(`tenant_${client.tenantId}`);
        const Contact = tenantDb.model('Contact', ContactSchema);

        const uid = meeta._id;
        const uidStr = String(uid);

        console.log(`Checking leads for UID: ${uid} (Type: ${typeof uid}) and String: ${uidStr}`);

        const countById = await Contact.countDocuments({
            $or: [
                { assignedAgent: uid },
                { assignedCounsellor: uid }
            ]
        });

        const countByStr = await Contact.countDocuments({
            $or: [
                { assignedAgent: uidStr },
                { assignedCounsellor: uidStr }
            ]
        });

        console.log(`Count by ObjectId: ${countById}`);
        console.log(`Count by String: ${countByStr}`);

        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

debugMeeta();
