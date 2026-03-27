const { getTenantConnection } = require('./src/config/db');
const FlowSchema = require('./src/models/tenant/Flow');

async function dumpFlows() {
    try {
        const tenantDb = getTenantConnection('tenant_demo_001');
        const Flow = tenantDb.model('Flow', FlowSchema);
        const flows = await Flow.find({ status: 'ACTIVE' });
        
        console.log('--- ACTIVE FLOWS DUMP ---');
        flows.forEach(f => {
            console.log(`Flow: ${f.name} (${f._id}) | Trigger: ${f.triggerType}`);
            f.nodes.forEach(n => {
                if (n.type === 'messageNode') {
                    console.log(`  - Node ${n.id}: type=${n.data.msgType} | text=${n.data.text?.substring(0, 20)}... | mediaId=${n.data.mediaId} | mediaUrl=${n.data.mediaUrl}`);
                }
            });
        });
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}
dumpFlows();
