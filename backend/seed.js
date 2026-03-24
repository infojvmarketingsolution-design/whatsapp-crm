const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
require('dotenv').config();

const { connectCoreDB, getTenantConnection } = require('./src/config/db');
const User = require('./src/models/core/User');
const Client = require('./src/models/core/Client');
const ContactSchema = require('./src/models/tenant/Contact');
const MessageSchema = require('./src/models/tenant/Message');

async function seed() {
  try {
    console.log('🌱 Starting Database Seeding...');
    await connectCoreDB();

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash('password123', salt);

    // 1. Create Super Admin (Master Control)
    await User.findOneAndUpdate(
      { email: 'akashchavda15@gmail.com' },
      { name: 'Akash Chavda', email: 'akashchavda15@gmail.com', password: hashedPassword, role: 'SUPER_ADMIN' },
      { upsert: true, new: true }
    );
    console.log('✅ Super Admin Created: akashchavda15@gmail.com / password123');

    // 2. Create Regular User (WhatsApp + CRM)
    await User.findOneAndUpdate(
      { email: 'admin@demo.com' },
      { name: 'JV User', email: 'admin@demo.com', password: hashedPassword, role: 'ADMIN', tenantId: 'tenant_demo_001' },
      { upsert: true, new: true }
    );
    console.log('✅ Platform User Created: admin@demo.com / password123');

    // 2. Create Demo SaaS Client Context
    const client = await Client.findOneAndUpdate(
      { tenantId: 'tenant_demo_001' },
      { 
        name: 'Demo Client', 
        email: 'demo@client.com', 
        phone: '1234567890', 
        companyName: 'Urban Studioz', 
        tenantId: 'tenant_demo_001', 
        apiKey: 'demo_key_9999', 
        status: 'ACTIVE',
        whatsappConfig: {
          phoneNumberId: process.env.META_PHONE_NUMBER_ID || '775985475594383',
          wabaId: process.env.META_WABA_ID || '4217981428458339',
          accessToken: process.env.META_ACCESS_TOKEN || 'EAAUZAwz8PZCJABQkp2VU4O99Fml7sNr6eZBQpao8aZAUiS8n5VZBtqpoRiMOzp6aBavpioEZBfEZBmQFSDPGqSW0Y5QFAAFYWpfyhZB0mRo2LtCUyOfT3yXUmnEQCZC1Ep0443yduXZCSlziZCCdVkg59T4z8NZCA8OntO5vx9mEuZBmOcWKFYzI7DjBwgvuqNCGbJd4nfAZDZD',
          phoneNumber: '+91 77598 54755', // Updated from Meta
          wabaName: 'JV Group'
        }
      },
      { upsert: true, new: true }
    );
    console.log(`✅ Client Tenant Created (ID: ${client.tenantId})`);

    // 3. Connect to Tenant DB and Seed Contacts/Messages
    const tenantDb = getTenantConnection(client.tenantId);
    
    const Contact = tenantDb.model('Contact', ContactSchema);
    const Message = tenantDb.model('Message', MessageSchema);

    const contact1 = await Contact.findOneAndUpdate(
      { phone: '+91987654321' },
      { phone: '+91987654321', name: 'Arvind Bajaj', status: 'ACTIVE', source: 'CTWA Lead', tags: ['Hot Lead'] },
      { upsert: true, new: true }
    );

    await Contact.findOneAndUpdate(
      { phone: '+91987654922' },
      { phone: '+91987654922', name: 'Jay Anand', status: 'ACTIVE', source: 'AD', tags: ['CTWA Lead'] },
      { upsert: true, new: true }
    );
    console.log('✅ CRM Contacts Seeded into Tenant DB.');

    await Message.findOneAndUpdate(
      { messageId: 'msg_001' },
      {
        contactId: contact1._id,
        messageId: 'msg_001',
        direction: 'INBOUND',
        type: 'text',
        content: 'Hi, I want to know more about the CRM and how the auto-lead capture works.',
        status: 'RECEIVED'
      },
      { upsert: true }
    );
    console.log('✅ Messages Seeded.');

    console.log('🚀 Seeding Complete! You can now log in.');
    process.exit(0);

  } catch (error) {
    console.error('❌ Seeding Error. Ensure MongoDB is running and MONGO_URI is in your .env file!', error.message);
    process.exit(1);
  }
}

seed();
