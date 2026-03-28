const mongoose = require('mongoose');
const { getTenantConnection } = require('../config/db');
const FlowSchema = require('../models/tenant/Flow');
require('dotenv').config();

async function seedPremiumDemo() {
  try {
    const dbUri = process.env.CORE_DB_URI || 'mongodb://127.0.0.1:27017/crm_core';
    await mongoose.connect(dbUri);
    
    // Dynamically find the main client/tenant
    const Client = require('../models/core/Client');
    const firstClient = await Client.findOne({});
    if (!firstClient) {
      console.error('❌ No Client found in database!');
      process.exit(1);
    }

    const tenantId = firstClient.tenantId;
    console.log(`🌱 Seeding for Tenant: ${tenantId}`);
    const tenantDb = getTenantConnection(tenantId);
    const Flow = tenantDb.model('Flow', FlowSchema);

    const demoFlow = {
      name: 'Premium Education Demo',
      description: 'Educational flow with Video, Image, and CTA Buttons.',
      status: 'ACTIVE',
      triggerType: 'KEYWORD',
      triggerKeywords: ['demo', 'learn', 'course'],
      nodes: [
        {
          id: 'start-1',
          type: 'triggerNode',
          position: { x: 100, y: 100 },
          data: { label: 'Keyword: demo, learn' }
        },
        {
          id: 'node-hero',
          type: 'messageNode',
          position: { x: 100, y: 300 },
          data: { 
            msgType: 'INTERACTIVE_MESSAGE',
            header: { 
              type: 'image', 
              link: 'https://images.unsplash.com/photo-1523050335102-c89b1811565d?auto=format&fit=crop&q=80&w=1000' 
            },
            text: '*Welcome to JV Academy* 🎓\n\nYour journey to becoming a professional marketer starts here. How can we help you today?',
            buttons: ['Explore Courses', 'Watch Preview', 'Contact Support']
          }
        },
        {
          id: 'node-video',
          type: 'messageNode',
          position: { x: 500, y: 100 },
          data: { 
            msgType: 'INTERACTIVE_MESSAGE',
            header: { 
              type: 'video', 
              link: 'https://www.w3schools.com/html/mov_bbb.mp4' 
            },
            text: '*Our Campus & Programs*\n\nWatch this brief overview of our 2026 digital marketing bootcamp.',
            buttons: ['Enroll Now', 'Main Menu']
          }
        },
        {
          id: 'node-cta-link',
          type: 'messageNode',
          position: { x: 500, y: 350 },
          data: { 
            msgType: 'CTA_URL',
            text: '*Success Stories* 🏆\n\nCheck out our graduates who now work at top MNCs across the globe.',
            ctaTitle: 'View Testimonials',
            ctaValue: 'https://wapipulse.com/success'
          }
        },
        {
          id: 'node-cta-call',
          type: 'messageNode',
          position: { x: 500, y: 600 },
          data: { 
            msgType: 'CTA_CALL',
            text: '*Talk to Expert* 📞\n\nNeed immediate guidance? Speak with our career counselor directly.',
            ctaTitle: 'Call Counselor',
            ctaValue: '+919909700606'
          }
        }
      ],
      edges: [
        { id: 'e1', source: 'start-1', target: 'node-hero' },
        { id: 'e2', source: 'node-hero', target: 'node-video', sourceHandle: 'Explore Courses' },
        { id: 'e3', source: 'node-hero', target: 'node-cta-link', sourceHandle: 'Success Stories' },
        { id: 'e4', source: 'node-hero', target: 'node-cta-call', sourceHandle: 'Contact Support' },
        { id: 'e5', source: 'node-video', target: 'node-hero', sourceHandle: 'Main Menu' }
      ]
    };

    await Flow.findOneAndUpdate(
      { name: 'Premium Education Demo' },
      demoFlow,
      { upsert: true, new: true }
    );

    console.log('✅ Premium Education Demo seeded!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

seedPremiumDemo();
