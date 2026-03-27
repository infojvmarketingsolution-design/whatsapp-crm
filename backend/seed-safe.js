const mongoose = require('mongoose');

// Minimal schema for seeding
const demoFlowData = {
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

async function seed() {
  try {
    const tenantId = 'tenant_demo_001';
    const uri = `mongodb://127.0.0.1:27017/jv_tenant_${tenantId}`;
    console.log(`Connecting to ${uri}...`);
    
    await mongoose.connect(uri);
    
    // Check if the collection exists, or it will be created
    const Flow = mongoose.connection.collection('flows');
    
    await Flow.updateOne(
      { name: 'JV Group Demo Flow' },
      { $set: { ...demoFlowData, updatedAt: new Date(), createdAt: new Date() } },
      { upsert: true }
    );

    console.log('✅ Demo Flow Seeded successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

seed();
