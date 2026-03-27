const mongoose = require('mongoose');
const { getTenantConnection } = require('./src/config/db');
const FlowSchema = require('./src/models/tenant/Flow');

async function debug() {
  const tenantId = 'tenant_demo_001';
  const repoPath = 'o:/OneDrive/Business/Development/Whatsapp Api + CRM (19 March 2026)/backend';
  const mongoUri = 'mongodb://127.0.0.1:27017/jv_tenant_tenant_demo_001';

  try {
    await mongoose.connect(mongoUri);
    const Flow = mongoose.model('Flow', FlowSchema);
    const flow = await Flow.findOne({ status: 'ACTIVE' }).sort({ updatedAt: -1 });

    if (!flow) {
      console.log('No active flow found');
      return;
    }

    console.log(`Flow: ${flow.name} (${flow.id})`);
    console.log('--- Nodes ---');
    flow.nodes.forEach(n => {
      console.log(`Node: ${n.id} | Type: ${n.type} | MsgType: ${n.data?.msgType}`);
      if (n.type === 'messageNode') {
        console.log(`  Text: ${n.data?.text}`);
        console.log(`  MediaURL: ${n.data?.mediaUrl}`);
        console.log(`  MediaID: ${n.data?.mediaId}`);
      }
    });

    console.log('--- Edges ---');
    flow.edges.forEach(e => {
        console.log(`Edge: ${e.source} -> ${e.target} | Handle: ${e.sourceHandle}`);
    });

    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

debug();
