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
    return name.replace(/\s+/g, '_').replace(/[^a-zA-Z0-9\.\-_]/g, '');
}

async function fixUploads() {
    try {
        const coreUri = process.env.CORE_DB_URI || 'mongodb://127.0.0.1:27017/crm_core';
        console.log('Connecting to Core DB:', coreUri);
        await mongoose.connect(coreUri);

        const clients = await Client.find({});
        console.log(`Found ${clients.length} clients to process.`);

        for (const client of clients) {
            const tenantId = client.tenantId;
            const tenantUri = `mongodb://127.0.0.1:27017/jv_tenant_${tenantId}`;
            console.log(`\n--- Processing Tenant: ${tenantId} ---`);

            const conn = mongoose.createConnection(tenantUri);
            await new Promise(resolve => conn.once('open', resolve));

            const Template = conn.model('Template', TemplateSchema);
            const Flow = conn.model('Flow', FlowSchema);
            const Campaign = conn.model('Campaign', CampaignSchema);

            let tenantFixCount = 0;

            const fixPathInString = (str, subDir) => {
                if (typeof str !== 'string' || !str.includes('uploads/')) return str;
                
                const parts = str.split('/');
                const filename = parts[parts.length - 1];
                
                // If filename has spaces or special chars
                if (filename.includes(' ') || /[^a-zA-Z0-9\.\-_]/.test(filename)) {
                    const sanitizedFilename = sanitize(filename);
                    
                    // Physical rename
                    const fileDir = path.join(__dirname, 'public/uploads', subDir, tenantId);
                    const oldPath = path.join(fileDir, filename);
                    const newPath = path.join(fileDir, sanitizedFilename);

                    if (fs.existsSync(oldPath)) {
                        console.log(`Renaming: uploads/${subDir}/${tenantId}/${filename} -> ${sanitizedFilename}`);
                        fs.renameSync(oldPath, newPath);
                        tenantFixCount++;
                        return str.replace(filename, sanitizedFilename);
                    } else {
                        // Sometimes the subDir might be different in the DB vs the physical path
                        // We try templates or media
                        const altDir = subDir === 'templates' ? 'media' : 'templates';
                        const altPath = path.join(__dirname, 'public/uploads', altDir, tenantId, filename);
                        if (fs.existsSync(altPath)) {
                             const altNewPath = path.join(__dirname, 'public/uploads', altDir, tenantId, sanitizedFilename);
                             console.log(`Renaming (Alt Path): uploads/${altDir}/${tenantId}/${filename} -> ${sanitizedFilename}`);
                             fs.renameSync(altPath, altNewPath);
                             tenantFixCount++;
                             return str.replace(filename, sanitizedFilename);
                        }
                        // console.warn(`File not found on disk: uploads/${subDir}/${tenantId}/${filename}`);
                    }
                }
                return str;
            };

            // 1. Fix Templates
            const templates = await Template.find({});
            for (const t of templates) {
                let modified = false;
                if (t.components && Array.isArray(t.components)) {
                    for (const comp of t.components) {
                        if (comp.example && comp.example.header_handle) {
                             const oldHandle = comp.example.header_handle[0];
                             const newHandle = fixPathInString(oldHandle, 'templates');
                             if (oldHandle !== newHandle) {
                                 comp.example.header_handle[0] = newHandle;
                                 modified = true;
                             }
                        }
                    }
                }
                if (modified) {
                    t.markModified('components');
                    await t.save();
                }
            }

            // 2. Fix Flows (Crucial!)
            const flows = await Flow.find({});
            for (const f of flows) {
                let modified = false;
                if (f.nodes && Array.isArray(f.nodes)) {
                    for (const node of f.nodes) {
                        if (node.data) {
                            if (node.data.mediaUrl) {
                                const oldUrl = node.data.mediaUrl;
                                const newUrl = fixPathInString(oldUrl, 'templates');
                                if (oldUrl !== newUrl) {
                                    node.data.mediaUrl = newUrl;
                                    modified = true;
                                }
                            }
                            if (node.data.mediaId && typeof node.data.mediaId === 'string' && node.data.mediaId.includes('.')) {
                                const oldId = node.data.mediaId;
                                const newId = fixPathInString(oldId, 'templates');
                                if (oldId !== newId) {
                                    node.data.mediaId = newId;
                                    modified = true;
                                }
                            }
                        }
                    }
                }
                if (modified) {
                    f.markModified('nodes');
                    await f.save();
                }
            }

            // 3. Fix Campaigns
            const campaigns = await Campaign.find({});
            for (const c of campaigns) {
                let modified = false;
                if (c.templateComponents && c.templateComponents.header) {
                     const header = c.templateComponents.header;
                     if (header.link) {
                         const oldLink = header.link;
                         const newLink = fixPathInString(oldLink, 'templates');
                         if (oldLink !== newLink) {
                             header.link = newLink;
                             modified = true;
                         }
                     }
                }
                if (modified) {
                    c.markModified('templateComponents');
                    await c.save();
                }
            }

            console.log(`Sanitized ${tenantFixCount} files across Templates, Flows, and Campaigns in ${tenantId}`);
            await conn.close();
        }

        console.log('\n--- Full Media Sanitization Complete ---');
        await mongoose.connection.close();
    } catch (err) {
        console.error('Migration Error:', err);
    }
}

fixUploads();
