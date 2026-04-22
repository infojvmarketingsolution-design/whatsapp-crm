const mongoose = require('mongoose');
const Settings = require('./backend/src/models/core/Settings');

async function test() {
  await mongoose.connect('mongodb://localhost:27017/whatsapp-crm-test');
  
  let settings = new Settings({ tenantId: 'test-tenant' });
  await settings.save();
  
  try {
    const category = 'roleAccess';
    const updates = { NEW_ROLE: { name: 'Test', allAccess: true, permissions: [] } };
    
    // This is what the controller does
    let toObj = settings[category] && typeof settings[category].toObject === 'function' 
        ? settings[category].toObject() 
        : (settings[category] instanceof Map ? Object.fromEntries(settings[category]) : settings[category]);
        
    console.log("Does toObject exist?", typeof settings[category].toObject);
    
    settings[category] = { ...toObj, ...updates };
    await settings.save();
    console.log("Success!");
  } catch (err) {
    console.error("Error:", err);
  }
  
  mongoose.connection.close();
}
test();
