const mongoose = require('mongoose');
require('dotenv').config();
const Client = require('./src/models/core/Client');
const MessageSchema = require('./src/models/tenant/Message');

async function debug() {
    try {
        await mongoose.connect(process.env.CORE_DB_URI || 'mongodb://127.0.0.1:27017/crm_core');
        console.log('Connected to Core DB');
        
        const clients = await Client.find({});
        console.log('Found', clients.length, 'clients');

        for (const client of clients) {
            console.log(`\nChecking Tenant: ${client.tenantId}`);
            const tenantUri = `mongodb://127.0.0.1:27017/jv_tenant_${client.tenantId}`;
            const conn = mongoose.createConnection(tenantUri);
            const Message = conn.model('Message', MessageSchema);
            
            const count = await Message.countDocuments({});
            console.log(`- Total Messages: ${count}`);
            
            const lastMsgs = await Message.find({}).sort({ createdAt: -1 }).limit(3);
            lastMsgs.forEach(m => {
                console.log(`  [${m.direction}] ${m.type}: "${m.content.substring(0, 30)}" (${m.createdAt})`);
            });
            
            await conn.close();
        }

        process.exit(0);
    } catch (err) {
        console.error('Debug failed:', err);
        process.exit(1);
    }
}

debug();
