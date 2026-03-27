const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');
require('dotenv').config({ path: path.join(__dirname, '.env') });

const TemplateSchema = require('./src/models/tenant/Template');
const Client = require('./src/models/core/Client');

/**
 * Sanitizes a filename the same way the new Multer config does.
 */
function sanitize(name) {
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
            const templates = await Template.find({});

            let tenantFixCount = 0;

            for (const template of templates) {
                let modified = false;

                // Check and fix components (headers/body media)
                if (template.components && Array.isArray(template.components)) {
                    for (const comp of template.components) {
                        if (comp.example && comp.example.header_handle) {
                            // Check header handles for internal URIs
                            const handle = comp.example.header_handle[0];
                            if (typeof handle === 'string' && handle.includes('uploads/templates')) {
                                const parts = handle.split('/');
                                const filename = parts[parts.length - 1];
                                if (filename.includes(' ') || /[^a-zA-Z0-9\.\-_]/.test(filename)) {
                                    const sanitizedFilename = sanitize(filename);
                                    
                                    // Physical rename
                                    const fileDir = path.join(__dirname, 'public/uploads/templates', tenantId);
                                    const oldPath = path.join(fileDir, filename);
                                    const newPath = path.join(fileDir, sanitizedFilename);

                                    if (fs.existsSync(oldPath)) {
                                        console.log(`Renaming: ${filename} -> ${sanitizedFilename}`);
                                        fs.renameSync(oldPath, newPath);
                                        comp.example.header_handle[0] = handle.replace(filename, sanitizedFilename);
                                        modified = true;
                                        tenantFixCount++;
                                    } else {
                                        console.warn(`File not found on disk: ${filename}`);
                                    }
                                }
                            }
                        }
                    }
                }

                if (modified) {
                    template.markModified('components');
                    await template.save();
                }
            }

            console.log(`Fixed ${tenantFixCount} files/templates in ${tenantId}`);
            await conn.close();
        }

        console.log('\n--- Media Sanitization Complete ---');
        await mongoose.connection.close();
    } catch (err) {
        console.error('Migration Error:', err);
    }
}

fixUploads();
