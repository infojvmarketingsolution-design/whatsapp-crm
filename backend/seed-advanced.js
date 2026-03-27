const mongoose = require('mongoose');

// Advanced Flow Data
const advancedFlow = {
  name: 'JV Group Advanced Automation',
  description: 'Pro-level flow with variables, branching, and agent handoff.',
  status: 'ACTIVE',
  triggerType: 'KEYWORD',
  triggerKeywords: [''], // Catch-all (empty keyword)
  nodes: [
    {
      id: 'trigger-1',
      type: 'triggerNode',
      position: { x: 0, y: 0 },
      data: { triggerWords: "" }
    },
    {
      id: 'msg-1',
      type: 'messageNode',
      position: { x: 0, y: 150 },
      data: { 
        msgType: 'IMAGE',
        text: 'Thank you for contacting JV Group! 🚀 We are here to transform your business with AI and WhatsApp Automation.',
        mediaUrl: "https://placehold.co/600x400/blue/white?text=Welcome+to+JV+Group",
        mediaId: "demo_welcome_image"
      }
    },
    {
      id: 'msg-2',
      type: 'messageNode',
      position: { x: 0, y: 350 },
      data: { 
        msgType: 'QUESTION',
        text: 'To get started, may I know your name? 👤',
        variableName: 'visitor_name'
      }
    },
    {
      id: 'msg-3',
      type: 'messageNode',
      position: { x: 0, y: 550 },
      data: { 
        msgType: 'TEXT',
        text: 'Hello {{visitor_name}}! 👋 It is a pleasure to meet you. Which industry do you work in? Select from the menu below.'
      }
    },
    {
      id: 'msg-4',
      type: 'messageNode',
      position: { x: 0, y: 750 },
      data: { 
        msgType: 'LIST_MESSAGE',
        text: 'Our specialized solutions for your industry:',
        buttonText: 'View Industries',
        listOptions: ['Real Estate', 'E-commerce', 'Education', 'Healthcare']
      }
    },
    // Industry Branches
    {
      id: 'msg-real-estate',
      type: 'messageNode',
      position: { x: 500, y: 600 },
      data: { msgType: 'TEXT', text: 'Our Real Estate CRM is trusted by 500+ agencies! 🏠 We automate lead capture from Property Portals and WhatsApp.' }
    },
    {
      id: 'msg-ecommerce',
      type: 'messageNode',
      position: { x: 500, y: 700 },
      data: { msgType: 'TEXT', text: 'Boost your E-commerce sales! 🛒 Our Shopify & WooCommerce bots handle orders and tracking automatically.' }
    },
    {
      id: 'msg-education',
      type: 'messageNode',
      position: { x: 500, y: 800 },
      data: { msgType: 'TEXT', text: 'Scale your admissions globally! 🎓 We provide automated student counseling and course enrollment bots.' }
    },
    {
      id: 'msg-healthcare',
      type: 'messageNode',
      position: { x: 500, y: 900 },
      data: { msgType: 'TEXT', text: 'Enhance patient care! 🏥 Our Healthcare bots manage appointments and report delivery seamlessly.' }
    },
    // Interested?
    {
      id: 'msg-interest',
      type: 'messageNode',
      position: { x: 1000, y: 750 },
      data: { 
        msgType: 'INTERACTIVE_MESSAGE',
        text: 'Would you be interested in a FREE consultation with our experts?',
        buttons: ["Yes, Let's go!", "Maybe later"]
      }
    },
    {
      id: 'msg-time',
      type: 'messageNode',
      position: { x: 1500, y: 700 },
      data: { 
        msgType: 'QUESTION',
        text: 'Perfect! Please type your preferred date and time for the call (e.g. tomorrow at 2 PM). ⏰',
        variableName: 'contact_time'
      }
    },
    {
      id: 'msg-thanks',
      type: 'messageNode',
      position: { x: 1500, y: 900 },
      data: { 
        msgType: 'TEXT',
        text: 'Got it, {{visitor_name}}! 🚀 Our team will contact you at {{contact_time}}. Thank you for your interest!'
      }
    },
    {
      id: 'msg-help',
      type: 'messageNode',
      position: { x: 2000, y: 750 },
      data: { 
        msgType: 'INTERACTIVE_MESSAGE',
        text: 'Need any other help right now?',
        buttons: ["Talk to Agent", "I'm good"]
      }
    },
    {
      id: 'action-agent',
      type: 'actionNode',
      position: { x: 2500, y: 700 },
      data: { actionType: 'ADD', tag: 'AGENT_REQUESTED' }
    },
    {
      id: 'msg-agent-soon',
      type: 'messageNode',
      position: { x: 3000, y: 700 },
      data: { msgType: 'TEXT', text: 'An agent will be with you shortly, {{visitor_name}}. Please wait a moment. 🧑‍💻' }
    },
    {
      id: 'msg-bye',
      type: 'messageNode',
      position: { x: 2500, y: 850 },
      data: { msgType: 'TEXT', text: 'Thank you for your time, {{visitor_name}}! Have a wonderful day. 👋✨' }
    }
  ],
  edges: [
    { id: 'e1', source: 'trigger-1', target: 'msg-1' },
    { id: 'e2', source: 'msg-1', target: 'msg-2' },
    { id: 'e3', source: 'msg-2', target: 'msg-3' },
    { id: 'e4', source: 'msg-3', target: 'msg-4' },
    // List Branches
    { id: 'e-l0', source: 'msg-4', target: 'msg-real-estate', sourceHandle: 'list_0' },
    { id: 'e-l1', source: 'msg-4', target: 'msg-ecommerce', sourceHandle: 'list_1' },
    { id: 'e-l2', source: 'msg-4', target: 'msg-education', sourceHandle: 'list_2' },
    { id: 'e-l3', source: 'msg-4', target: 'msg-healthcare', sourceHandle: 'list_3' },
    // Rejoin from branches
    { id: 'e-r1', source: 'msg-real-estate', target: 'msg-interest' },
    { id: 'e-r2', source: 'msg-ecommerce', target: 'msg-interest' },
    { id: 'e-r3', source: 'msg-education', target: 'msg-interest' },
    { id: 'e-r4', source: 'msg-healthcare', target: 'msg-interest' },
    // Interest Buttons
    { id: 'e-btn0', source: 'msg-interest', target: 'msg-time', sourceHandle: 'btn_0' }, // Yes
    { id: 'e-btn1', source: 'msg-interest', target: 'msg-help', sourceHandle: 'btn_1' }, // Maybe later
    
    { id: 'e-t1', source: 'msg-time', target: 'msg-thanks' },
    { id: 'e-t2', source: 'msg-thanks', target: 'msg-help' },
    
    // Help Buttons
    { id: 'e-h0', source: 'msg-help', target: 'action-agent', sourceHandle: 'btn_0' }, // Talk to Agent
    { id: 'e-h1', source: 'msg-help', target: 'msg-bye', sourceHandle: 'btn_1' }, // I'm good
    
    { id: 'e-a1', source: 'action-agent', target: 'msg-agent-soon' }
  ]
};

async function seed() {
  try {
    const mongoose = require('mongoose');
    const tenantId = 'tenant_demo_001';
    const uri = `mongodb://127.0.0.1:27017/jv_tenant_${tenantId}`;
    console.log(`📡 Connecting to JV Group Database...`);
    
    await mongoose.connect(uri);
    
    const Flow = mongoose.connection.collection('flows');
    
    await Flow.updateOne(
      { name: 'JV Group Advanced Automation' },
      { $set: { ...advancedFlow, updatedAt: new Date(), createdAt: new Date() } },
      { upsert: true }
    );

    console.log('✅ JV Group Advanced Automation Seeded successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error Seeding:', error);
    process.exit(1);
  }
}

seed();
