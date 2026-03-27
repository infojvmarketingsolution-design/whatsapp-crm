const mongoose = require('mongoose');
require('dotenv').config();
const Client = require('./src/models/core/Client');

async function debug() {
    try {
        await mongoose.connect(process.env.CORE_DB_URI || 'mongodb://127.0.0.1:27017/crm_core');
        console.log('Connected to Core DB');
        
        const clients = await Client.find({});
        console.log('Total Clients:', clients.length);
        clients.forEach(c => {
            console.log(`- Tenant: ${c.tenantId}, Status: ${c.status}, PhoneId: ${c.whatsappConfig?.phoneNumberId}`);
        });

        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

debug();
