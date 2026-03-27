const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');
require('dotenv').config({ path: path.join(__dirname, '.env') });

const TemplateSchema = require('./src/models/tenant/Template');
const FlowSchema = require('./src/models/tenant/Flow');
const CampaignSchema = require('./src/models/tenant/Campaign');
const Client = require('./src/models/core/Client');

async function fixUploads() {
    try {
        const coreUri = process.env.CORE_DB_URI || 'mongodb://127.0.0.1:27017/crm_core';
        console.log('--- DEFINITIVE MEDIA REPAIR ---');
        await mongoose.connect(coreUri);

        const clients = await Client.find({});
        for (const client of clients) {
            const tenantId = client.tenantId;
            const tenantUri = `mongodb://127.0.0.1:27017/jv_tenant_${tenantId}`;
            console.log(`\nTenant: ${tenantId}`);

            const conn = mongoose.createConnection(tenantUri);
            await new Promise(resolve => conn.once('open', resolve));

            const Template = conn.model('Template', TemplateSchema);
            const Flow = conn.model('Flow', FlowSchema);
            const Campaign = conn.model('Campaign', CampaignSchema);

            let tenantFixCount = 0;

            const processValue = (val, subDir) => {
                if (typeof val !== 'string') return val;
                
                // Check if it's a problematic filename (has spaces or parentheses)
                if (val.includes(' ') || val.includes('(') || val.includes(')')) {
                    const filename = val.includes('/') ? val.split('/').pop() : val;
                    const sanitizedFilename = filename.replace(/\s+/g, '_').replace(/[^a-zA-Z0-9\.\-_]/g, '');

                    // We use the EXACT base path discovered via 'find'
                    const baseUploads = path.join(process.cwd(), 'backend/backend/public/uploads');
                    const oldPath = path.join(baseUploads, subDir, tenantId, filename);
                    const newPath = path.join(baseUploads, subDir, tenantId, sanitizedFilename);

                    // Also try the fallback path (just backend/public)
                    const fallbackPath = path.join(process.cwd(), 'backend/public/uploads', subDir, tenantId, filename);
                    const fallbackNewPath = path.join(process.cwd(), 'backend/public/uploads', subDir, tenantId, sanitizedFilename);

                    if (fs.existsSync(oldPath)) {
                        console.log(`  ✅ RENAMED: ${filename} -> ${sanitizedFilename}`);
                        fs.renameSync(oldPath, newPath);
                        tenantFixCount++;
                        return val.replace(filename, sanitizedFilename);
                    } else if (fs.existsSync(fallbackPath)) {
                        console.log(`  ✅ RENAMED (Fallback): ${filename} -> ${sanitizedFilename}`);
                        fs.renameSync(fallbackPath, fallbackNewPath);
                        tenantFixCount++;
                        return val.replace(filename, sanitizedFilename);
                    } else {
                        // console.log(`  ❌ NOT ON DISK: ${filename}`);
                        return val;
                    }
                }
                return val;
            };

            // 1. Templates
            const templates = await Template.find({});
            for (const t of templates) {
                let mod = false;
                if (t.components && Array.isArray(t.components)) {
                    for (const c of t.components) {
                        if (c.example && c.example.header_handle) {
                            const old = c.example.header_handle[0];
                            const fixed = processValue(old, 'templates');
                            if (old !== fixed) { c.example.header_handle[0] = fixed; mod = true; }
                        }
                    }
                }
                if (mod) { t.markModified('components'); await t.save(); }
            }

            // 2. Flows
            const flows = await Flow.find({});
            for (const f of flows) {
                let mod = false;
                for (const n of f.nodes) {
                    if (n.data) {
                        if (n.data.mediaUrl) {
                            const old = n.data.mediaUrl;
                            const fixed = processValue(old, 'templates');
                            if (old !== fixed) { n.data.mediaUrl = fixed; mod = true; }
                        }
                        if (n.data.mediaId) {
                            const old = n.data.mediaId;
                            const fixed = processValue(old, 'templates');
                            if (old !== fixed) { n.data.mediaId = fixed; mod = true; }
                        }
                    }
                }
                if (mod) { f.markModified('nodes'); await f.save(); }
            }

            console.log(`  Done. Cleaned ${tenantFixCount} files in DB and Disk.`);
            await conn.close();
        }
        await mongoose.connection.close();
        console.log('\n--- SYSTEM REPAIRED ---');
    } catch (err) {
        console.error(err);
    }
}

fixUploads();
