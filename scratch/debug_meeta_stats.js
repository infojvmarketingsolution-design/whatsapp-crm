const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../backend/.env') });

const User = require('../backend/src/models/core/User');
const Client = require('../backend/src/models/core/Client');
const ContactSchema = require('../backend/src/models/tenant/Contact');

async function debugMeeta() {
    try {
        await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/whatsapp-crm');
        console.log('Connected to DB');

        const meeta = await User.findOne({ email: 'bde.gandhinagaruniversity@gmail.com' });
        if (!meeta) {
            console.log('Meeta not found by email');
            return;
        }
        console.log(`Found Meeta: ${meeta.name} (${meeta._id}) Role: ${meeta.role}`);

        const client = await Client.findOne({ tenantId: meeta.tenantId });
        if (!client) {
            console.log('Tenant not found');
            return;
        }
        console.log(`Tenant: ${client.name} (${client.tenantId})`);

        // Connect to Tenant DB
        const tenantDb = mongoose.connection.useDb(`tenant_${meeta.tenantId}`);
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

        const sample = await Contact.findOne({
            $or: [
                { assignedAgent: { $exists: true } },
                { assignedCounsellor: { $exists: true } }
            ]
        });

        if (sample) {
            console.log('Sample Lead Assignment Types:');
            console.log(`Agent: ${sample.assignedAgent} (Type: ${typeof sample.assignedAgent})`);
            console.log(`Counsellor: ${sample.assignedCounsellor} (Type: ${typeof sample.assignedCounsellor})`);
        }

        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

debugMeeta();
