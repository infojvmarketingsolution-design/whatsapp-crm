const mongoose = require('mongoose');
const { getTenantConnection } = require('./src/config/db');
const FlowSchema = require('./src/models/tenant/Flow');

const SEED_DATA = {
  name: 'Universal Catch-All (Returning Users)',
  status: 'ACTIVE',
  triggerType: 'KEYWORD',
  triggerKeywords: [''], // Catch-all for keywords
  isSmartMatch: false,
  nodes: [
    {
      id: 'trigger-1',
      type: 'triggerNode',
      position: { x: 250, y: 0 },
      data: { label: 'Catch-all Trigger' }
    },
    {
      id: 'msg-1',
      type: 'messageNode',
      position: { x: 250, y: 150 },
      data: { 
        msgType: 'TEXT',
        text: 'I\'m still learning! 🤖 I didn\'t quite catch that. Would you like to speak with a human agent or explore our services?'
      }
    },
    {
      id: 'msg-2',
      type: 'messageNode',
      position: { x: 250, y: 350 },
      data: { 
        msgType: 'INTERACTIVE_MESSAGE',
        text: 'How can we help you today?',
        buttons: ['Talk to Agent', 'Main Menu']
      }
    },
    {
       id: 'msg-agent',
       type: 'messageNode',
       position: { x: 100, y: 550 },
       data: { msgType: 'TEXT', text: 'Connecting you to an agent... 🧑‍💻' }
    },
    {
       id: 'msg-menu',
       type: 'messageNode',
       position: { x: 400, y: 550 },
       data: { msgType: 'TEXT', text: 'Type "Hi" to see our main menu anytime! 🏠' }
    }
  ],
  edges: [
    { id: 'e1', source: 'trigger-1', target: 'msg-1' },
    { id: 'e2', source: 'msg-1', target: 'msg-2' },
    { id: 'e-btn0', source: 'msg-2', target: 'msg-agent', sourceHandle: 'btn_0' },
    { id: 'e-btn1', source: 'msg-2', target: 'msg-menu', sourceHandle: 'btn_1' }
  ]
};

async function seed() {
  const tenantId = 'tenant_demo_001';
  const mongoUri = 'mongodb://127.0.0.1:27017/jv_tenant_tenant_demo_001';

  try {
    await mongoose.connect(mongoUri);
    console.log('Connected to Tenant Database');
    const Flow = mongoose.model('Flow', FlowSchema);

    const existingFlow = await Flow.findOne({ name: SEED_DATA.name });
    if (existingFlow) {
      await Flow.findByIdAndUpdate(existingFlow._id, SEED_DATA);
      console.log('Updated existing "Catch-All" flow.');
    } else {
      await Flow.create(SEED_DATA);
      console.log('Created new "Catch-All" flow.');
    }

    process.exit(0);
  } catch (err) {
    console.error('Seed error:', err);
    process.exit(1);
  }
}

seed();
