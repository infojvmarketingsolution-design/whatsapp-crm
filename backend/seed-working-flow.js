const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });
const { connectCoreDB, getTenantConnection } = require('./src/config/db');
const FlowSchema = require('./src/models/tenant/Flow');

async function seedWorkingFlow() {
  try {
    console.log('🌱 Seeding Working Flow with Image...');
    await connectCoreDB();

    // Use a tenant ID. If unknown, we'll try to find one.
    const tenantId = 'tenant_demo_001'; 
    const tenantDb = getTenantConnection(tenantId);
    const Flow = tenantDb.model('Flow', FlowSchema);

    const workingFlow = {
      name: 'Working Image Flow',
      description: 'A flow that sends an image to the user.',
      status: 'ACTIVE',
      triggerType: 'KEYWORD',
      triggerKeywords: ['image', 'photo', 'picture'],
      isSmartMatch: true,
      nodes: [
        {
          id: 'trigger-1',
          type: 'triggerNode',
          position: { x: 250, y: 50 },
          data: { triggerWords: 'image, photo, picture' }
        },
        {
          id: 'msg-1',
          type: 'messageNode',
          position: { x: 250, y: 250 },
          data: { 
            msgType: 'IMAGE',
            text: 'Here is the image you requested! 📸',
            mediaUrl: 'https://images.unsplash.com/photo-1579546929518-9e396f3cc809?w=800&auto=format&fit=crop&q=60', // Public safe image
          }
        }
      ],
      edges: [
        { id: 'e-1-2', source: 'trigger-1', target: 'msg-1' }
      ]
    };

    const flow = await Flow.findOneAndUpdate(
      { name: 'Working Image Flow' },
      workingFlow,
      { upsert: true, new: true }
    );

    console.log(`✅ Working Image Flow Seeded successfully (ID: ${flow._id})!`);
    console.log('--- TEST IT ---');
    console.log('Send "image" to your WhatsApp Number to test.');
    process.exit(0);
  } catch (error) {
    console.error('❌ Seeding Error:', error.message);
    process.exit(1);
  }
}

seedWorkingFlow();
