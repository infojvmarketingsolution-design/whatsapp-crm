const mongoose = require('mongoose');
const { connectCoreDB, getTenantConnection } = require('./src/config/db');
const AIService = require('./src/services/ai.service');
require('dotenv').config();

(async () => {
  try {
    await connectCoreDB();
    const Settings = require('./src/models/core/Settings');
    const allSettings = await Settings.find({});
    
    for (const s of allSettings) {
      const tenantId = s.tenantId;
      console.log('Processing tenant:', tenantId);
      const db = getTenantConnection(tenantId);
      const Contact = db.model('Contact', require('./src/models/tenant/Contact'));
      const Message = db.model('Message', require('./src/models/tenant/Message'));
      
      const contacts = await Contact.find({ isArchived: { $ne: true } });
      let updated = 0;
      for (const c of contacts) {
        const msgs = await Message.find({ contactId: c._id }).sort({ timestamp: -1 }).limit(10);
        const { score, heatLevel, botQuestionsAnswered } = await AIService.calculateLeadScore(c, msgs);
        
        if (c.score !== score || c.botQuestionsAnswered !== botQuestionsAnswered || c.heatLevel !== heatLevel) {
            await Contact.updateOne({ _id: c._id }, { $set: { score, heatLevel, botQuestionsAnswered }});
            updated++;
        }
      }
      console.log('Updated', updated, 'contacts for tenant', tenantId);
    }
    process.exit(0);
  } catch (err) {
    console.error('Error:', err);
    process.exit(1);
  }
})();
