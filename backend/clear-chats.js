const mongoose = require('mongoose');
const { getTenantConnection } = require('./src/config/db');
const ContactSchema = require('./src/models/tenant/Contact');
const MessageSchema = require('./src/models/tenant/Message');

const PHONES = ['916354070709', '917383503632'];

async function clear() {
  const tenantId = 'tenant_demo_001';
  const mongoUri = 'mongodb://127.0.0.1:27017/jv_tenant_tenant_demo_001';

  try {
    await mongoose.connect(mongoUri);
    console.log('Connected to Tenant Database');

    const Contact = mongoose.model('Contact', ContactSchema);
    const Message = mongoose.model('Message', MessageSchema);

    for (const phone of PHONES) {
      const contact = await Contact.findOne({ phone });
      if (contact) {
        console.log(`Clearing contact and messages for ${phone}...`);
        await Message.deleteMany({ contactId: contact._id });
        await Contact.findByIdAndDelete(contact._id);
        console.log(`Successfully cleared ${phone}.`);
      } else {
        console.log(`Contact ${phone} not found.`);
      }
    }

    process.exit(0);
  } catch (err) {
    console.error('Clear error:', err);
    process.exit(1);
  }
}

clear();
