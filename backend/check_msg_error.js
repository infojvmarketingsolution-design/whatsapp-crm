const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });
const Client = require('./src/models/core/Client');
const MessageSchema = require('./src/models/tenant/Message');
const { getTenantConnection } = require('./src/config/db');

async function check() {
    try {
        console.log('Connecting to Core DB...');
        await mongoose.connect(process.env.CORE_DB_URI);
        
        const tenantId = 'tenant_demo_001'; 
        const tenantDb = getTenantConnection(tenantId);
        const Message = tenantDb.model('Message', MessageSchema);

        const lastMsgs = await Message.find({ direction: 'OUTBOUND' }).sort({ createdAt: -1 }).limit(10);
        
        console.log(`--- Last 10 Outbound Messages for ${tenantId} ---`);
        for (const m of lastMsgs) {
            console.log(`[${m.createdAt.toISOString()}] ID: ${m.messageId}`);
            console.log(`   Type: ${m.type} | Status: ${m.status}`);
            console.log(`   Content: ${m.content.substring(0, 100)}...`);
            if (m.errorReason) {
                console.log(`   ❌ ERROR: ${m.errorReason}`);
            }
            console.log('-------------------');
        }
        
        process.exit(0);
    } catch (err) {
        console.error('Check Error:', err.message);
        process.exit(1);
    }
}

check();
