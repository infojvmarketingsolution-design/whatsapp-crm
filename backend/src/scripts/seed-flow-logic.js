const mongoose = require('mongoose');
const { getTenantConnection } = require('../config/db');
const FlowSchema = require('../models/tenant/Flow');

async function seedDemoFlow() {
  try {
    console.log('🌱 Seeding JV Group Demo Flow via Startup...');
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
        { id: 'e-1-2', source: 'trigger-1', target: 'msg-1', sourceHandle: null, targetHandle: null },
        { id: 'e-2-3', source: 'msg-1', target: 'msg-2', sourceHandle: null, targetHandle: null },
        { id: 'e-3-4', source: 'msg-2', target: 'msg-3', sourceHandle: null, targetHandle: null }
      ]
    };

    await Flow.findOneAndUpdate(
      { name: 'JV Group Demo Flow' },
      demoFlow,
      { upsert: true, new: true }
    );

    console.log('✅ JV Group Demo Flow Seeded successfully!');
  } catch (error) {
    console.error('❌ Seeding Error:', error.message);
  }
}

module.exports = { seedDemoFlow };
