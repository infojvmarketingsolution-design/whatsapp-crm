const mongoose = require('mongoose');
const ContactSchema = require('./backend/src/models/tenant/Contact');

async function checkContact(tenantId, phone) {
    const uri = `mongodb://127.0.0.1:27017/jv_tenant_${tenantId}`;
    const conn = await mongoose.createConnection(uri).asPromise();
    const Contact = conn.model('Contact', ContactSchema);
    
    const contact = await Contact.findOne({ phone });
    console.log('Contact Data:', JSON.stringify(contact, null, 2));
    
    await conn.close();
}

const tenantId = process.argv[2];
const phone = process.argv[3];

if (!tenantId || !phone) {
    console.log('Usage: node check_contact.js <tenantId> <phone>');
    process.exit(1);
}

checkContact(tenantId, phone).catch(console.error);
