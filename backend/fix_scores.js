const mongoose = require('mongoose');
const { connectCoreDB, getTenantConnection } = require('./src/config/db');
const AIService = require('./src/services/ai.service');

(async () => {
  try {
    await connectCoreDB();
    const db = getTenantConnection('infojvmarketingsolution-design-whatsapp-crm');
    const Contact = db.model('Contact', require('./src/models/tenant/Contact'));
    const Message = db.model('Message', require('./src/models/tenant/Message'));
    
    const contacts = await Contact.find({});
    let updated = 0;
    for (const c of contacts) {
      const msgs = await Message.find({ contactId: c._id }).sort({ timestamp: -1 }).limit(10);
      const { score, heatLevel, botQuestionsAnswered } = await AIService.calculateLeadScore(c, msgs);
      
      if (c.score !== score || c.botQuestionsAnswered !== botQuestionsAnswered || c.heatLevel !== heatLevel) {
          c.score = score;
          c.heatLevel = heatLevel;
          c.botQuestionsAnswered = botQuestionsAnswered;
          await c.save();
          updated++;
      }
    }
    console.log('Retroactively updated', updated, 'contacts');
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
})();
