const mongoose = require('mongoose');
const { getTenantConnection } = require('./src/config/db');
require('dotenv').config();

async function run() {
    await mongoose.connect(process.env.MONGO_URI);
    const Client = require('./src/models/core/Client');
    const clients = await Client.find();
    
    if (clients.length > 0) {
        const tenantId = clients[0].tenantId;
        const db = getTenantConnection(tenantId);
        const Campaign = db.model('Campaign', require('./src/models/tenant/Campaign'));
        
        const latest = await Campaign.find().sort({createdAt: -1}).limit(3);
        for (let c of latest) {
            console.log("Campaign:", c.name, "Status:", c.status, "ScheduledAt:", c.scheduledAt, "CreatedAt:", c.createdAt);
        }
    }
    
    console.log("Current time (new Date()):", new Date());
    process.exit(0);
}
run();
