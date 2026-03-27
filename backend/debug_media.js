const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

const TemplateSchema = require('./src/models/tenant/Template');
const FlowSchema = require('./src/models/tenant/Flow');
const Client = require('./src/models/core/Client');

async function debugMedia() {
    try {
        const coreUri = process.env.CORE_DB_URI || 'mongodb://127.0.0.1:27017/crm_core';
        console.log('--- Media Diagnostic ---');
        await mongoose.connect(coreUri);

        const clients = await Client.find({});
        for (const client of clients) {
            const tenantId = client.tenantId;
            const tenantUri = `mongodb://127.0.0.1:27017/jv_tenant_${tenantId}`;
            console.log(`\nTenant: ${tenantId}`);

            const conn = mongoose.createConnection(tenantUri);
            await new Promise(resolve => conn.once('open', resolve));

            const Template = conn.model('Template', TemplateSchema);
            const templates = await Template.find({});
            for (const t of templates) {
                if (t.components) {
                    const str = JSON.stringify(t.components);
                    if (str.includes('uploads/')) {
                         console.log(`  [Template: ${t.name}] handles media.`);
                    }
                }
            }

            const Flow = conn.model('Flow', FlowSchema);
            const flows = await Flow.find({});
            for (const f of flows) {
                for (const node of f.nodes) {
                    if (node.data && (node.data.mediaUrl || node.data.mediaId)) {
                        console.log(`  [Flow: ${f.name}] Node: ${node.id} | mediaUrl: "${node.data.mediaUrl}" | mediaId: "${node.data.mediaId}"`);
                    }
                }
            }
            await conn.close();
        }
        await mongoose.connection.close();
    } catch (err) {
        console.error(err);
    }
}

debugMedia();
