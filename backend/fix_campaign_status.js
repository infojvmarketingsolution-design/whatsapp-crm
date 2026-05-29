
const mongoose = require('mongoose');
const { connectCoreDb, getTenantConnection } = require('./src/config/db');
require('dotenv').config();

async function fix() {
    await mongoose.connect(process.env.CORE_DB_URI);
    const tenantDb = getTenantConnection('infojvmarketingsolution-design');
    const Contact = tenantDb.model('Contact', require('./src/models/tenant/Contact'));
    const Message = tenantDb.model('Message', require('./src/models/tenant/Message'));
    
    const contacts = await Contact.find({ status: { $in: ['NEW LEAD', 'NEW'] } });
    let count = 0;
    
    for (const c of contacts) {
        const lastMsg = await Message.findOne({ contactId: c._id }).sort({ timestamp: -1 });
        if (lastMsg && (lastMsg.type === 'template' || (lastMsg.content && lastMsg.content.includes('[Template:')))) {
            c.status = 'CAMPAIGN';
            await c.save();
            count++;
        }
    }
    
    console.log('Fixed ' + count + ' contacts to CAMPAIGN status');
    process.exit(0);
}
fix();

