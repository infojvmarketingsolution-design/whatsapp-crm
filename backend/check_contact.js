const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });
const { getTenantConnection } = require('./src/config/db');
const ContactSchema = require('./src/models/tenant/Contact');

async function check(phone) {
    try {
        await mongoose.connect(process.env.CORE_DB_URI);
        const tenantId = 'tenant_demo_001'; // From user logs
        const tenantDb = getTenantConnection(tenantId);
        const Contact = tenantDb.model('Contact', ContactSchema);

        const contact = await Contact.findOne({ phone });
        if (!contact) {
            console.log(`No contact found for phone: ${phone}`);
        } else {
            console.log(`Contact status for ${phone}:`);
            console.log(JSON.stringify(contact, null, 2));
        }
        
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

// Check with the phone number from the user's logs
check('917383503632');
