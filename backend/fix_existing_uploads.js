const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');
require('dotenv').config({ path: path.join(__dirname, '.env') });

const TemplateSchema = require('./src/models/tenant/Template');
const FlowSchema = require('./src/models/tenant/Flow');
const CampaignSchema = require('./src/models/tenant/Campaign');
const Client = require('./src/models/core/Client');

/**
 * Sanitizes a filename the same way the new Multer config does.
 */
function sanitize(name) {
    if (!name) return name;
    // Extract actual filename if it's a path
    const isPath = name.includes('/');
    const filename = isPath ? name.split('/').pop() : name;
    
    const sanitizedFilename = filename.replace(/\s+/g, '_').replace(/[^a-zA-Z0-9\.\-_]/g, '');
    
    return isPath ? name.replace(filename, sanitizedFilename) : sanitizedFilename;
}

async function fixUploads() {
    try {
        const coreUri = process.env.CORE_DB_URI || 'mongodb://127.0.0.1:27017/crm_core';
        console.log('--- FINAL MEDIA REPAIR ---');
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

            const fixAndRename = (val, subDir) => {
                if (typeof val !== 'string' || (!val.includes(' ') && !/[^a-zA-Z0-9\.\-_]/.test(val))) return val;
                
                const filename = val.includes('/') ? val.split('/').pop() : val;
                const sanitizedFilename = sanitize(filename);

                // Possible file locations
                const searchDirs = [
                    path.join(__dirname, 'public/uploads', subDir, tenantId),
                    path.join(__dirname, 'uploads', subDir, tenantId),
                    path.join(process.cwd(), 'backend/public/uploads', subDir, tenantId),
                    path.join(process.cwd(), 'public/uploads', subDir, tenantId)
                ];

                let found = false;
                for (const dir of searchDirs) {
                    const oldPath = path.join(dir, filename);
                    const newPath = path.join(dir, sanitizedFilename);
                    if (fs.existsSync(oldPath)) {
                        console.log(`  ✅ RENAMED: ${filename} -> ${sanitizedFilename}`);
                        fs.renameSync(oldPath, newPath);
                        found = true;
                        tenantFixCount++;
                        break;
                    }
                }

                if (!found) {
                    // Try the other subDir just in case
                    const altDir = subDir === 'templates' ? 'media' : 'templates';
                    for (const dir of searchDirs) {
                        const altOldPath = path.join(dir.replace(subDir, altDir), filename);
                        const altNewPath = path.join(dir.replace(subDir, altDir), sanitizedFilename);
                        if (fs.existsSync(altOldPath)) {
                             console.log(`  ✅ RENAMED (found in ${altDir}): ${filename} -> ${sanitizedFilename}`);
                             fs.renameSync(altOldPath, altNewPath);
                             found = true;
                             tenantFixCount++;
                             break;
                        }
                    }
                }

                return val.replace(filename, sanitizedFilename);
            };

            // 1. Templates
            const templates = await Template.find({});
            for (const t of templates) {
                let mod = false;
                if (t.components && Array.isArray(t.components)) {
                    for (const c of t.components) {
                        if (c.example && c.example.header_handle) {
                            const old = c.example.header_handle[0];
                            const fixed = fixAndRename(old, 'templates');
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
                            const fixed = fixAndRename(old, 'templates');
                            if (old !== fixed) { n.data.mediaUrl = fixed; mod = true; }
                        }
                        if (n.data.mediaId) {
                            const old = n.data.mediaId;
                            const fixed = fixAndRename(old, 'templates');
                            if (old !== fixed) { n.data.mediaId = fixed; mod = true; }
                        }
                    }
                }
                if (mod) { f.markModified('nodes'); await f.save(); }
            }

            console.log(`  Done. Sanitized ${tenantFixCount} entries.`);
            await conn.close();
        }
        await mongoose.connection.close();
        console.log('\n--- ALL MEDIA REPAIRED ---');
    } catch (err) {
        console.error(err);
    }
}

fixUploads();
