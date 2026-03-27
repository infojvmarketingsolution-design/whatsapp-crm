const mongoose = require('mongoose');

// Define connection URIs
const CORE_DB_URI = 'mongodb://127.0.0.1:27017/crm_core';

const checkMessages = async () => {
    try {
        console.log('Connecting to core database...');
        const coreDb = mongoose.createConnection(CORE_DB_URI, { maxPoolSize: 10 });

        coreDb.on('connected', async () => {
            console.log('Connected to core DB successfully.');
            
            // Client Schema Model
            const ClientSchema = new mongoose.Schema({ tenantId: String, name: String }, { strict: false });
            const Client = coreDb.model('Client', ClientSchema);
            
            const clients = await Client.find({});
            console.log(`Found ${clients.length} clients.`);

            for (const client of clients) {
                if (!client.tenantId) continue;
                
                console.log(`\n--- Tenant: ${client.tenantId} ---`);
                
                // Tenant DB connection
                const tenantUri = `mongodb://127.0.0.1:27017/tenant_${client.tenantId}`;
                const tenantDb = mongoose.createConnection(tenantUri, { maxPoolSize: 10 });
                
                try {
                    await new Promise((resolve, reject) => {
                       tenantDb.on('connected', resolve);
                       tenantDb.on('error', reject);
                    });
                    
                    const MessageSchema = new mongoose.Schema({
                        type: String,
                        content: mongoose.Schema.Types.Mixed,
                        direction: String,
                        status: String,
                        createdAt: Date
                    }, { strict: false });
                    
                    const Message = tenantDb.model('Message', MessageSchema);
                    
                    const msgs = await Message.find({ direction: 'OUTBOUND' }).sort({ createdAt: -1 }).limit(10);
                    
                    if(msgs.length === 0) {
                       console.log("No outbound messages found.");
                    } else {
                        console.log("Recent Outbound Messages:");
                        msgs.forEach(m => {
                            console.log(`[${m.createdAt}] Type: ${m.type} | Content: ${JSON.stringify(m.content)}`);
                        });
                    }
                } catch (err) {
                    console.log(`Error connecting to tenant DB: ${err.message}`);
                } finally {
                    await tenantDb.close();
                }
            }
            
            await coreDb.close();
            console.log('\nFinished check.');
            process.exit(0);
        });

        coreDb.on('error', (err) => {
            console.error('Core DB connection error:', err);
            process.exit(1);
        });

    } catch (e) {
        console.error('General Error:', e.message);
        process.exit(1);
    }
};

checkMessages();
