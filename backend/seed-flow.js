const mongoose = require('mongoose');
require('dotenv').config();
const { connectCoreDB, getTenantConnection } = require('./src/config/db');
const FlowSchema = require('./src/models/tenant/Flow');

async function seedFlow() {
  try {
    console.log('🌱 Seeding JV Group Demo Flow...');
    await connectCoreDB();

    const tenantId = 'tenant_demo_001';
    const tenantDb = getTenantConnection(tenantId);
    const Flow = tenantDb.model('Flow', FlowSchema);

    const demoFlow = {
      name: 'JV Group Demo Flow',
      description: 'A complete working demo of JV Group automation.',
      status: 'ACTIVE',
      triggerType: 'KEYWORD',
      triggerKeywords: ['demo', 'hi', 'start'],
      nodes: [
        {
          id: 'trigger-1',
          type: 'triggerNode',
          position: { x: 400, y: 50 },
          data: { triggerWords: 'demo, hi, start' }
        },
        {
          id: 'msg-1',
          type: 'messageNode',
          position: { x: 400, y: 200 },
          data: { 
            msgType: 'TEXT',
            text: 'Welcome to JV Group! 🚀 We are excited to show you our WhatsApp Automation. How can we help you today?'
          }
        },
        {
          id: 'msg-2',
          type: 'messageNode',
          position: { x: 400, y: 400 },
          data: { 
            msgType: 'INTERACTIVE_MESSAGE',
            header: { type: 'text', text: 'Our Services' },
            text: 'Select an option below to explore our expertise.',
            footer: 'Expertise in AI & Marketing',
            buttons: ['Marketing', 'Development', 'Consulting']
          }
        },
        {
          id: 'msg-3',
          type: 'messageNode',
          position: { x: 800, y: 400 },
          data: { 
            msgType: 'QUESTION',
            text: 'Great! To get started, please type your Business Email. 📧',
            variableName: 'customer_email'
          }
        }
      ],
      edges: [
        { id: 'e-1-2', source: 'trigger-1', target: 'msg-1' },
        { id: 'e-2-3', source: 'msg-1', target: 'msg-2' },
        { id: 'e-3-4', source: 'msg-2', target: 'msg-3' }
      ]
    };

    await Flow.findOneAndUpdate(
      { name: 'JV Group Demo Flow' },
      demoFlow,
      { upsert: true, new: true }
    );

    console.log('✅ JV Group Demo Flow Seeded successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Seeding Error:', error.message);
    process.exit(1);
  }
}

seedFlow();
