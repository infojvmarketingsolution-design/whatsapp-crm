const { getTenantConnection } = require('./src/config/db');
const Client = require('./src/models/core/Client');
const WhatsAppService = require('./src/services/whatsapp.service');
const dotenv = require('dotenv');
dotenv.config();

const mongoose = require('mongoose');

async function testLiveMedia(phone) {
    try {
        console.log('🔌 Connecting to MongoDB...');
        await mongoose.connect(process.env.CORE_DB_URI);
        console.log('✅ Connected to MongoDB.');

        const client = await Client.findOne({ status: 'ACTIVE' });
        if (!client) throw new Error('No client found');

        const waService = new WhatsAppService({
            accessToken: client.whatsappConfig.accessToken,
            phoneNumberId: client.whatsappConfig.phoneNumberId
        });

        console.log(`🚀 Sending test image to ${phone}...`);
        console.log(`Using Base URL: ${process.env.BASE_URL || 'https://wapipulse.com'}`);
        
        // Use a 100% public, stable URL
        const testUrl = 'https://images.unsplash.com/photo-1579546929518-9e396f3cc809?w=800';
        
        const response = await waService.sendMedia(
            phone,
            'image',
            null,
            'TEST IMAGE FROM SERVER',
            testUrl
        );

        console.log('✅ Success! Meta Response:', response);
        process.exit(0);
    } catch (err) {
        console.error('❌ FATAL ERROR:');
        console.error(err.message);
        if (err.response) console.error(JSON.stringify(err.response.data, null, 2));
        process.exit(1);
    }
}

const targetPhone = process.argv[2] || '917383503632';
testLiveMedia(targetPhone);
