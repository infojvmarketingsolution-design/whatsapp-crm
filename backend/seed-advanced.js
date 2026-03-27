const mongoose = require('mongoose');
const { getTenantConnection } = require('./src/config/db');
const FlowSchema = require('./src/models/tenant/Flow');

const SEED_DATA = {
  name: 'JV Group Advanced Automation',
  status: 'ACTIVE',
  triggerType: 'NEW_MESSAGE', // TRIGGER FOR NEW VISITORS
  triggerKeywords: [],
  isSmartMatch: true,
  nodes: [
    {
      id: 'trigger-1',
      type: 'triggerNode',
      position: { x: 250, y: 0 },
      data: { label: 'New Message Trigger' }
    },
    {
      id: 'msg-1',
      type: 'messageNode',
      position: { x: 250, y: 150 },
      data: { 
        msgType: 'IMAGE',
        text: 'Thank you for contacting JV Group! 🚀 We are here to transform your business with AI and WhatsApp Automation.',
        mediaUrl: 'https://images.unsplash.com/photo-1551434678-e076c223a692?q=80&w=2070&auto=format&fit=crop', // Premium Tech Office
        mediaId: '' 
      }
    },
    {
      id: 'msg-2',
      type: 'messageNode',
      position: { x: 250, y: 350 },
      data: { 
        msgType: 'QUESTION',
        text: 'To get started, may I know your name? 👤',
        variableName: 'visitor_name'
      }
    },
    {
      id: 'msg-3',
      type: 'messageNode',
      position: { x: 250, y: 550 },
      data: { 
        msgType: 'TEXT',
        text: 'Hello hello! 👋 It is a pleasure to meet you. Which industry do you work in? Select from the menu below.'
      }
    },
    {
      id: 'msg-4',
      type: 'messageNode',
      position: { x: 250, y: 750 },
      data: { 
        msgType: 'LIST_MESSAGE',
        text: 'Our specialized solutions for your industry:',
        buttonText: 'View Industries',
        listOptions: ['Real Estate', 'E-commerce', 'Healthcare', 'Education']
      }
    },
    // Industry Branches
    {
      id: 'msg-real-estate',
      type: 'messageNode',
      position: { x: -200, y: 950 },
      data: { 
        msgType: 'TEXT',
        text: 'Our Real Estate CRM helps you manage leads and automate site visit scheduling effortlessly. 🏘️'
      }
    },
    {
      id: 'msg-ecommerce',
      type: 'messageNode',
      position: { x: 100, y: 950 },
      data: { 
        msgType: 'TEXT',
        text: 'Boost your sales with our E-commerce bot that handles abandoned carts and order tracking. 🛒'
      }
    },
    {
      id: 'msg-healthcare',
      type: 'messageNode',
      position: { x: 400, y: 950 },
      data: { 
        msgType: 'TEXT',
        text: 'Simplify patient appointments and medical record management with our HIPAA-aligned tools. 🏥'
      }
    },
    {
      id: 'msg-education',
      type: 'messageNode',
      position: { x: 700, y: 950 },
      data: { 
        msgType: 'TEXT',
        text: 'Automate student inquiries and fee reminders to save your administration hours of work. 🎓'
      }
    },
    // Re-converge
    {
      id: 'msg-interest',
      type: 'messageNode',
      position: { x: 250, y: 1150 },
      data: { 
        msgType: 'INTERACTIVE_MESSAGE',
        text: 'Would you be interested in a FREE consultation with our experts?',
        buttons: ['Yes, Let\'s go!', 'Maybe later']
      }
    },
    {
      id: 'msg-time',
      type: 'messageNode',
      position: { x: 100, y: 1350 },
      data: { 
        msgType: 'QUESTION',
        text: 'Great! Please provide your preferred time for a callback (e.g., tomorrow at 10 AM). ⏰',
        variableName: 'contact_time'
      }
    },
    {
      id: 'msg-thanks',
      type: 'messageNode',
      position: { x: 100, y: 1550 },
      data: { 
        msgType: 'TEXT',
        text: 'Got it, {{visitor_name}}! 🚀 Our team will contact you at {{contact_time}}. Thank you for your interest!'
      }
    },
    {
      id: 'msg-help',
      type: 'messageNode',
      position: { x: 250, y: 1750 },
      data: { 
        msgType: 'INTERACTIVE_MESSAGE',
        text: 'Need any other help right now?',
        buttons: ['Talk to Agent', 'I\'m good']
      }
    },
    {
      id: 'msg-agent',
      type: 'messageNode',
      position: { x: 100, y: 1950 },
      data: { 
        msgType: 'TEXT',
        text: 'Connecting you to a human agent... please wait a moment. 🧑‍💻'
      }
    },
    {
      id: 'msg-final',
      type: 'messageNode',
      position: { x: 400, y: 1950 },
      data: { 
        msgType: 'TEXT',
        text: 'Thank you for your time! Have a wonderful day. ✨'
      }
    }
  ],
  edges: [
    { id: 'e1', source: 'trigger-1', target: 'msg-1' },
    { id: 'e2', source: 'msg-1', target: 'msg-2' },
    { id: 'e3', source: 'msg-2', target: 'msg-3' },
    { id: 'e4', source: 'msg-3', target: 'msg-4' },
    // List Menu Branches
    { id: 'e-l0', source: 'msg-4', target: 'msg-real-estate', sourceHandle: 'list_0' },
    { id: 'e-l1', source: 'msg-4', target: 'msg-ecommerce', sourceHandle: 'list_1' },
    { id: 'e-l2', source: 'msg-4', target: 'msg-healthcare', sourceHandle: 'list_2' },
    { id: 'e-l3', source: 'msg-4', target: 'msg-education', sourceHandle: 'list_3' },
    // Conforming back to Interest
    { id: 'e-r1', source: 'msg-real-estate', target: 'msg-interest' },
    { id: 'e-r2', source: 'msg-ecommerce', target: 'msg-interest' },
    { id: 'e-r3', source: 'msg-healthcare', target: 'msg-interest' },
    { id: 'e-r4', source: 'msg-education', target: 'msg-interest' },
    // Interest buttons
    { id: 'e-int-y', source: 'msg-interest', target: 'msg-time', sourceHandle: 'btn_0' },
    { id: 'e-int-n', source: 'msg-interest', target: 'msg-help', sourceHandle: 'btn_1' },
    
    { id: 'e-time', source: 'msg-time', target: 'msg-thanks' },
    { id: 'e-thanks', source: 'msg-thanks', target: 'msg-help' },
    
    { id: 'e-help-y', source: 'msg-help', target: 'msg-agent', sourceHandle: 'btn_0' },
    { id: 'e-help-n', source: 'msg-help', target: 'msg-final', sourceHandle: 'btn_1' }
  ]
};

async function seed() {
  const tenantId = 'tenant_demo_001';
  const mongoUri = 'mongodb://127.0.0.1:27017/jv_tenant_tenant_demo_001';

  try {
    await mongoose.connect(mongoUri);
    console.log('Connected to Tenant Database');

    const Flow = mongoose.model('Flow', FlowSchema);

    // Deactivate existing flows to ensure clean trigger
    await Flow.updateMany({}, { status: 'INACTIVE' });

    const existingFlow = await Flow.findOne({ name: SEED_DATA.name });
    if (existingFlow) {
      await Flow.findByIdAndUpdate(existingFlow._id, SEED_DATA);
      console.log('Updated existing "Advanced Automation" flow.');
    } else {
      await Flow.create(SEED_DATA);
      console.log('Created new "Advanced Automation" flow.');
    }

    process.exit(0);
  } catch (err) {
    console.error('Seed error:', err);
    process.exit(1);
  }
}

seed();
