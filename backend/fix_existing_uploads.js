const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');
require('dotenv').config({ path: path.join(__dirname, '.env') });

const TemplateSchema = require('./src/models/tenant/Template');
const FlowSchema = require('./src/models/tenant/Flow');
const CampaignSchema = require('./src/models/tenant/Campaign');
const Client = require('./src/models/core/Client');

/**
 * Robustly sanitizes a filename (replaces spaces with underscores and removes special chars).
 */
function sanitize(name) {
    return name.replace(/\s+/g, '_').replace(/[^a-zA-Z0-9\.\-_]/g, '');
}

/**
 * Recursively find all files in a directory and its subdirectories.
 */
function walk(dir, results = []) {
    const list = fs.readdirSync(dir);
    list.forEach(file => {
        const filePath = path.join(dir, file);
        const stat = fs.statSync(filePath);
        if (stat && stat.isDirectory()) {
            walk(filePath, results);
        } else {
            results.push({ name: file, path: filePath, dir: dir });
        }
    });
    return results;
}

async function universalRepair() {
    try {
        const coreUri = process.env.CORE_DB_URI || 'mongodb://127.0.0.1:27017/crm_core';
        console.log('--- UNIVERSAL FORCE REPAIR STARTING ---');
        await mongoose.connect(coreUri);

        const clients = await Client.find({});
        console.log(`Found ${clients.length} clients to process.`);

        const renameMap = new Map(); // Map old filename to new filename

        // 1. Scan the filesystem for all malformed files
        const possibleRoots = [
            path.join(process.cwd(), 'backend/backend/public/uploads'),
            path.join(process.cwd(), 'backend/public/uploads'),
            path.join(process.cwd(), 'public/uploads')
        ];

        for (const root of possibleRoots) {
            if (fs.existsSync(root)) {
                console.log(`Scanning Filesystem Root: ${root}`);
                const allFiles = walk(root);
                for (const f of allFiles) {
                    if (f.name.includes(' ') || f.name.includes('(') || f.name.includes(')')) {
                        const newName = sanitize(f.name);
                        const newPath = path.join(f.dir, newName);
                        
                        console.log(`  🔄 RENAMING FILE: ${f.name} -> ${newName}`);
                        fs.renameSync(f.path, newPath);
                        renameMap.set(f.name, newName);
                    }
                }
            }
        }

        if (renameMap.size === 0) {
            console.warn('No malformed files found on disk during scan.');
            // We still proceed to heal the database in case files were renamed but DB not updated
        }

        // 2. Heal the database for each tenant
        for (const client of clients) {
            const tenantId = client.tenantId;
            const tenantUri = `mongodb://127.0.0.1:27017/jv_tenant_${tenantId}`;
            console.log(`\n--- Healing Database for ${tenantId} ---`);

            const conn = mongoose.createConnection(tenantUri);
            await new Promise(resolve => conn.once('open', resolve));

            const Template = conn.model('Template', TemplateSchema);
            const Flow = conn.model('Flow', FlowSchema);
            const Campaign = conn.model('Campaign', CampaignSchema);

            const updateField = (val) => {
                if (typeof val !== 'string') return val;
                
                // If it contains one of our known fixed filenames, update it
                for (let [old, newly] of renameMap) {
                    if (val.includes(old)) return val.replace(old, newly);
                }
                
                // If it has spaces but not in map (maybe already renamed on disk), try a predictive fix
                if (val.includes(' ') || val.includes('(') || val.includes(')')) {
                    const filename = val.split('/').pop();
                    const sanitized = sanitize(filename);
                    return val.replace(filename, sanitized);
                }
                
                return val;
            };

            // Fix Templates
            const templates = await Template.find({});
            for (const t of templates) {
                let mod = false;
                if (t.components && Array.isArray(t.components)) {
                    for (const c of t.components) {
                        if (c.example && c.example.header_handle) {
                            const old = c.example.header_handle[0];
                            const fixed = updateField(old);
                            if (old !== fixed) { c.example.header_handle[0] = fixed; mod = true; }
                        }
                    }
                }
                if (mod) { t.markModified('components'); await t.save(); }
            }

            // Fix Flows
            const flows = await Flow.find({});
            for (const f of flows) {
                let mod = false;
                for (const n of f.nodes) {
                    if (n.data) {
                        if (n.data.mediaUrl) {
                            const old = n.data.mediaUrl;
                            const fixed = updateField(old);
                            if (old !== fixed) { n.data.mediaUrl = fixed; mod = true; }
                        }
                        if (n.data.mediaId) {
                            const old = n.data.mediaId;
                            const fixed = updateField(old);
                            if (old !== fixed) { n.data.mediaId = fixed; mod = true; }
                        }
                    }
                }
                if (mod) { f.markModified('nodes'); await f.save(); }
            }

            console.log(`  Database update check complete for ${tenantId}.`);
            await conn.close();
        }

        console.log('\n--- UNIVERSAL REPAIR FINISHED! ---');
        await mongoose.connection.close();
    } catch (err) {
        console.error('Universal Repair Error:', err);
    }
}

universalRepair();
