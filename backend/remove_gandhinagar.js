require('dotenv').config();
const mongoose = require('mongoose');

async function run() {
    const uri = process.env.CORE_DB_URI || 'mongodb://127.0.0.1:27017/crm_core';
    await mongoose.connect(uri, { useNewUrlParser: true, useUnifiedTopology: true });
    
    const Tenant = mongoose.model('Tenant', new mongoose.Schema({}, { strict: false }));
    const TenantSettings = mongoose.model('TenantSettings', new mongoose.Schema({}, { strict: false }));
    
    // First let's fix it specifically for Shreyarth
    const tenant = await Tenant.findOne({ name: /shreyarth/i });
    if (tenant) {
        console.log('Found Tenant:', tenant.name);
        
        const settings = await TenantSettings.findOne({ tenantId: tenant._id });
        if (settings && settings.automation && settings.automation.aiPrompts && settings.automation.aiPrompts.prdFlowSteps) {
            let updated = false;
            
            settings.automation.aiPrompts.prdFlowSteps = settings.automation.aiPrompts.prdFlowSteps.map(step => {
                if (step.type === 'GREETING' && step.message && step.message.includes('Gandhinagar')) {
                    step.message = step.message.replace(/Gandhinagar University/g, 'Shreyarth University');
                    updated = true;
                }
                return step;
            });
            
            if (updated) {
                await TenantSettings.updateOne(
                    { tenantId: tenant._id }, 
                    { $set: { 'automation.aiPrompts.prdFlowSteps': settings.automation.aiPrompts.prdFlowSteps } }
                );
                console.log('Successfully updated Greeting message to Shreyarth University for this tenant.');
            } else {
                console.log('No Gandhinagar University string found in Shreyarth greeting.');
            }
        }
    } else {
        console.log('Tenant "shreyarth" not found');
    }
    
    // Let's also fix it globally for all tenants who might have accidentally saved "Gandhinagar University"
    // We will replace "Gandhinagar" with "our" for all other tenants
    const allSettings = await TenantSettings.find({});
    let globalUpdates = 0;
    
    for (let s of allSettings) {
        // Skip Shreyarth as we just updated them specifically
        if (tenant && s.tenantId.toString() === tenant._id.toString()) continue;
        
        if (s.automation && s.automation.aiPrompts && s.automation.aiPrompts.prdFlowSteps) {
            let updated = false;
            
            s.automation.aiPrompts.prdFlowSteps = s.automation.aiPrompts.prdFlowSteps.map(step => {
                if (step.type === 'GREETING' && step.message && step.message.includes('Gandhinagar')) {
                    step.message = step.message.replace(/Gandhinagar/g, 'our');
                    updated = true;
                }
                return step;
            });
            
            if (updated) {
                await TenantSettings.updateOne(
                    { _id: s._id }, 
                    { $set: { 'automation.aiPrompts.prdFlowSteps': s.automation.aiPrompts.prdFlowSteps } }
                );
                globalUpdates++;
            }
        }
    }
    
    if (globalUpdates > 0) {
        console.log(`Successfully replaced Gandhinagar University with "our University" for ${globalUpdates} other tenants.`);
    }

    console.log('Done!');
    process.exit(0);
}

run().catch(err => {
    console.error(err);
    process.exit(1);
});
