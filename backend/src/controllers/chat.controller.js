const ContactSchema = require('../models/tenant/Contact');
const MessageSchema = require('../models/tenant/Message');
const WhatsAppService = require('../services/whatsapp.service');
const Client = require('../models/core/Client');
const mongoose = require('mongoose');
const path = require('path');
const fs = require('fs');
const CampaignSchema = require('../models/tenant/Campaign');

const createContact = async (req, res) => {
  try {
    const Contact = req.tenantDb.model('Contact', ContactSchema);
    const newContact = await Contact.create({ ...req.body, status: req.body.status || 'NEW LEAD' });
    res.status(201).json(newContact);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getContacts = async (req, res) => {
  try {
    const { status, qualification } = req.query;
    const Contact = req.tenantDb.model('Contact', ContactSchema);
    const filter = { isArchived: { $ne: true } };
    if (status) filter.status = status;
    if (qualification) filter.qualification = qualification;

    const contacts = await Contact.find(filter).sort({ lastMessageAt: -1 }).populate('assignedAgent', 'name email');
    res.json(contacts);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const performContactAction = async (req, res) => {
  try {
    const { contactId } = req.params;
    const { action, payload } = req.body;
    
    let contact;
    let ContactModel = req.tenantDb.model('Contact', ContactSchema);
    
    contact = await ContactModel.findById(contactId);
    if (!contact) return res.status(404).json({ error: 'Contact not found' });

    if (action === 'update_status') {
       contact.status = payload.status;
       contact.timeline.push({ eventType: 'STATUS_CHANGE', description: `Moved to ${payload.status}`, timestamp: new Date() });
    } else if (action === 'add_note') {
       const newNote = { content: payload.note, createdBy: req.user?._id || 'System', createdAt: new Date() };
       if (!contact.notes) contact.notes = [];
       contact.notes.push(newNote);
       contact.timeline.push({ eventType: 'NOTE_ADDED', description: `Note added`, timestamp: new Date() });
    } else if (action === 'assign_agent') {
       contact.assignedAgent = payload.agentId;
       contact.timeline.push({ eventType: 'AGENT_ASSIGNED', description: `Assigned to agent ${payload.agentId}`, timestamp: new Date() });
    } else if (action === 'log_call') {
       contact.timeline.push({ eventType: 'CALL_LOGGED', description: `Call Logged - Outcome: ${payload.outcome}`, timestamp: new Date() });
       const newNote = { content: `Duration: ${payload.duration} mins\nNotes: ${payload.notes}`, createdBy: req.user?._id || 'System', createdAt: new Date() };
       if (!contact.notes) contact.notes = [];
       contact.notes.push(newNote);
    } else if (action === 'schedule_meeting') {
       if (!contact.tasks) contact.tasks = [];
       contact.tasks.push({ 
         type: 'MEETING', title: `Meeting: ${payload.mode}`, dueDate: new Date(payload.dateTime), status: 'PENDING', metadata: { location: payload.location }
       });
       contact.timeline.push({ eventType: 'MEETING_SCHEDULED', description: `Scheduled ${payload.mode} Meeting for ${new Date(payload.dateTime).toLocaleString()}`, timestamp: new Date() });
    } else if (action === 'add_followup') {
       if (!contact.tasks) contact.tasks = [];
       contact.tasks.push({
         type: 'FOLLOW_UP', 
         title: payload.title || 'Follow-up Reminder', 
         dueDate: new Date(payload.dateTime), 
         status: 'PENDING',
         description: payload.description || ''
       });
       contact.timeline.push({ 
         eventType: 'FOLLOWUP_SET', 
         description: `Follow-up: ${payload.title || 'Reminder'} set for ${new Date(payload.dateTime).toLocaleString()}`, 
         timestamp: new Date() 
       });
    } else if (action === 'archive_lead') {
       contact.isArchived = true;
       contact.timeline.push({ eventType: 'LEAD_ARCHIVED', description: 'Lead archived (Hidden from Inbox)', timestamp: new Date() });
    } else if (action === 'hard_delete_lead') {
       const MessageModel = req.tenantDb.model('Message', MessageSchema);
       await MessageModel.deleteMany({ contactId: contact._id });
       const ContactModel = req.tenantDb.model('Contact', ContactSchema);
       await ContactModel.deleteOne({ _id: contact._id });
       return res.json({ success: true, message: 'Lead and messages permanently deleted' });
    } else if (action === 'add_tag') {
       if (!contact.tags) contact.tags = [];
       if (!contact.tags.includes(payload.tag)) {
          contact.tags.push(payload.tag);
          contact.timeline.push({ eventType: 'TAG_ADDED', description: `Tag added: ${payload.tag}`, timestamp: new Date() });
       }
    } else if (action === 'remove_tag') {
       contact.tags = (contact.tags || []).filter(t => t !== payload.tag);
       contact.timeline.push({ eventType: 'TAG_REMOVED', description: `Tag removed: ${payload.tag}`, timestamp: new Date() });
    } else if (action === 'complete_task') {
       if (!contact.tasks) contact.tasks = [];
       const taskIndex = contact.tasks.findIndex(t => t._id.toString() === payload.taskId);
       if (taskIndex > -1) {
           contact.tasks[taskIndex].status = 'COMPLETED';
           contact.timeline.push({ eventType: 'TASK_COMPLETED', description: `Task completed: ${contact.tasks[taskIndex].title}`, timestamp: new Date() });
       }
    } else if (action === 'reschedule_task') {
       if (!contact.tasks) contact.tasks = [];
       const taskIndex = contact.tasks.findIndex(t => t._id.toString() === payload.taskId);
       if (taskIndex > -1) {
           const oldDate = new Date(contact.tasks[taskIndex].dueDate).toLocaleString();
           contact.tasks[taskIndex].dueDate = new Date(payload.newDueDate);
           contact.timeline.push({ 
             eventType: 'TASK_RESCHEDULED', 
             description: `Task "${contact.tasks[taskIndex].title}" rescheduled from ${oldDate} to ${new Date(payload.newDueDate).toLocaleString()}`, 
             timestamp: new Date() 
           });
       }
    } else {
       return res.status(400).json({ error: 'Invalid action type' });
    }

    await contact.save();
    res.json({ success: true, contact });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const performBulkContactAction = async (req, res) => {
  try {
    const { contactIds, action, payload } = req.body;
    if (!Array.isArray(contactIds) || contactIds.length === 0) {
      return res.status(400).json({ error: 'No contact IDs provided' });
    }

    const ContactModel = req.tenantDb.model('Contact', ContactSchema);
    const MessageModel = req.tenantDb.model('Message', MessageSchema);

    if (action === 'archive_leads') {
      await ContactModel.updateMany(
        { _id: { $in: contactIds } },
        { 
          $set: { isArchived: true },
          $push: { 
            timeline: { 
              eventType: 'LEAD_ARCHIVED', 
              description: 'Lead archived in bulk', 
              timestamp: new Date() 
            } 
          }
        }
      );
      return res.json({ success: true, message: `${contactIds.length} leads archived` });
    } else if (action === 'hard_delete_leads') {
      await MessageModel.deleteMany({ contactId: { $in: contactIds } });
      await ContactModel.deleteMany({ _id: { $in: contactIds } });
      return res.json({ success: true, message: `${contactIds.length} leads and their messages permanently deleted` });
    } else {
      return res.status(400).json({ error: 'Invalid bulk action type' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getMessages = async (req, res) => {
  try {
    console.log(`[GET /messages] Request received for contactId: ${req.params.contactId}`);
    const Message = req.tenantDb.model('Message', MessageSchema);
    const messages = await Message.find({ contactId: req.params.contactId }).sort({ timestamp: 1 });
    res.json(messages);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const sendMessage = async (req, res) => {
  try {
    const { contactId, content, isInternal } = req.body;
    console.log(`[POST /send] ContactId: ${contactId}, Content: ${content}, Internal: ${isInternal}`);
    
    const Contact = req.tenantDb.model('Contact', ContactSchema);
    const Message = req.tenantDb.model('Message', MessageSchema);
    const User = require('../models/core/User');

    const contact = await Contact.findById(contactId);
    if (!contact) return res.status(404).json({ error: 'Contact not found' });

    // Handle Internal Team Note
    if (isInternal) {
      const user = await User.findById(req.userId);
      const internalMsg = await Message.create({
        contactId: contact._id,
        messageId: `note_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
        direction: 'OUTBOUND',
        type: 'text',
        content: content,
        status: 'SENT',
        isInternal: true,
        sender: { id: user?._id, name: user?.name || 'Agent' }
      });

      // Emit to socket for real-time team view
      if (req.app.get('io')) {
        req.app.get('io').to(req.tenantId).emit('new_message', { ...internalMsg._doc, contact });
      }

      return res.json(internalMsg);
    }

    // 2. Get Client credentials
    let client = await Client.findOne({ tenantId: req.tenantId });
    
    let accessToken = client?.whatsappConfig?.accessToken || process.env.META_ACCESS_TOKEN;
    let phoneNumberId = client?.whatsappConfig?.phoneNumberId || process.env.META_PHONE_NUMBER_ID;

    if (!accessToken || !phoneNumberId || accessToken === 'DUMMY') {
        console.warn(`[POST /send] Missing credentials for tenant ${req.tenantId}. Using dummy fallback.`);
        accessToken = 'DUMMY';
        phoneNumberId = 'DUMMY';
    }

    // 3. Send via WhatsApp Meta API
    const waService = new WhatsAppService({
       accessToken: accessToken, 
       phoneNumberId: phoneNumberId
    });
    
    let result;
    let messageType = 'text';
    let messageContent = content;
    let isFailed = false;

    if (req.file) {
      const mimeType = req.file.mimetype;
      if (mimeType.startsWith('image/')) messageType = 'image';
      else if (mimeType.startsWith('video/')) messageType = 'video';
      else messageType = 'document';

      const targetDir = path.join(__dirname, '../../public/uploads/media', req.tenantId);
      if (!fs.existsSync(targetDir)) fs.mkdirSync(targetDir, { recursive: true });
      
      const fileName = `out_${Date.now()}_${req.file.originalname}`;
      const targetPath = path.join(targetDir, fileName);
      fs.renameSync(req.file.path, targetPath);
      messageContent = `/uploads/media/${req.tenantId}/${fileName}`;

      if (accessToken !== 'DUMMY') {
          try {
             const mediaRes = await waService.uploadMedia(targetPath, mimeType);
             result = await waService.sendMedia(contact.phone, messageType, mediaRes.id, content);
          } catch(err) {
             console.error("❌ Meta API Media Error:", err.message);
             isFailed = true;
             messageContent = `[FAILED] ${err.message}`;
          }
      }
    } else {
      if (accessToken !== 'DUMMY') {
          try {
             console.log(`[POST /send] Attempting real Meta API call to ${contact.phone}`);
             result = await waService.sendText(contact.phone, content);
             console.log(`[POST /send] Meta API Response: SUCCESS`, result);
          } catch(err) {
             console.error(`[POST /send] ❌ Meta API ERROR: ${err.message}`);
             isFailed = true;
             messageContent = `[FAILED] ${err.message}`;
          }
      }
    }

    // 4. Save to DB
    const msgData = {
       contactId: contact._id,
       messageId: result?.messages?.[0]?.id || `out_${Date.now()}_${isFailed ? 'fail' : 'sent'}`,
       direction: 'OUTBOUND',
       type: messageType,
       content: messageContent,
       status: isFailed ? 'FAILED' : 'SENT'
    };
    
    let newMessage = await Message.create(msgData);

    // 4b. Update Contact's Last Message Timestamp
    await Contact.findByIdAndUpdate(contactId, { lastMessageAt: new Date() });

    // 5. Emit via socket
    const io = req.app.get('io');
    if (io) {
       console.log(`[POST /send] Emitting via socket to room ${req.tenantId || 'offline'}`);
       io.to(req.tenantId || 'offline').emit('new_message', Object.assign({}, newMessage._doc, { contact: contact.toObject() }));
    }

    console.log(`[POST /send] Success! Returning msg: ${newMessage.messageId}`);
    res.json(newMessage);
  } catch (error) {
     console.error(`[POST /send] FAILED! Error:`, error);
     res.status(500).json({ message: error.message });
  }
};

const getDashboardStats = async (req, res) => {
  try {
    const Contact = req.tenantDb.model('Contact', ContactSchema);
    const Campaign = req.tenantDb.model('Campaign', CampaignSchema);
    
    const totalContacts = await Contact.countDocuments({});
    
    // Active chats: contacts with activity in the last 24 hours
    const activeThreshold = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const activeChats = await Contact.countDocuments({ lastMessageAt: { $gte: activeThreshold } });
    
    const totalCampaigns = await Campaign.countDocuments({});
    
    // Qualified Leads: contacts with a qualification field set
    const qualifiedLeads = await Contact.countDocuments({ qualification: { $exists: true, $ne: null } });
    
    // Waiting for Agent: FOLLOW_UP status
    const waitingForAgent = await Contact.countDocuments({ status: 'FOLLOW_UP' });
    
    // Priority Leads: Hot and Warm
    const hotLeads = await Contact.countDocuments({ heatLevel: 'Hot' });
    const warmLeads = await Contact.countDocuments({ heatLevel: 'Warm' });
    
    res.json({
      leads: totalContacts,
      activeChats,
      campaigns: totalCampaigns,
      qualifiedLeads,
      waitingForAgent,
      hotLeads,
      warmLeads
    });
  } catch (error) {
    console.error(`[GET /stats] FAILED! Error:`, error);
    res.status(500).json({ message: error.message });
  }
};

const getContactStats = async (req, res) => {
  try {
    const Contact = req.tenantDb.model('Contact', ContactSchema);
    const qualStats = await Contact.aggregate([
      { $match: { qualification: { $exists: true, $ne: null } } },
      { $group: { _id: "$qualification", count: { $sum: 1 } } }
    ]);
    
    const heatStats = await Contact.aggregate([
      { $group: { _id: "$heatLevel", count: { $sum: 1 } } }
    ]);

    res.json({
      qualifications: qualStats,
      heatLevels: heatStats,
      avgScore: (await Contact.aggregate([{ $group: { _id: null, avg: { $avg: "$score" } } }]))[0]?.avg || 0
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getAgents = async (req, res) => {
  try {
    const User = require('../models/core/User');
    const agents = await User.find({ tenantId: req.tenantId, status: 'ACTIVE' }).select('name email role');
    res.json(agents);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const updateFcmToken = async (req, res) => {
  try {
    const User = require('../models/core/User');
    const { token, action } = req.body; // action: 'register' or 'unregister'

    if (action === 'register') {
      await User.findByIdAndUpdate(req.userId, { $addToSet: { fcmTokens: token } });
    } else {
      await User.findByIdAndUpdate(req.userId, { $pull: { fcmTokens: token } });
    }
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const summarizeLead = async (req, res) => {
  try {
    const { contactId } = req.params;
    const Contact = req.tenantDb.model('Contact', ContactSchema);
    const Message = req.tenantDb.model('Message', MessageSchema);
    const aiService = require('../services/ai.service');

    const contact = await Contact.findById(contactId);
    if (!contact) return res.status(404).json({ error: 'Contact not found' });

    // Fetch last 50 messages for context
    const messages = await Message.find({ contactId }).sort({ timestamp: -1 }).limit(50);
    const summary = await aiService.summarizeConversation(messages.reverse(), contact);

    if (!summary) {
      if (!aiService.apiKey) {
         return res.status(400).json({ message: 'AI service is not configured. Please check your OPENAI_API_KEY inside the .env file.' });
      } else {
         return res.status(500).json({ message: 'Failed to generate summary from OpenAI. Check server logs for the detailed error.' });
      }
    }

    res.json(summary);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getContacts,
  getMessages,
  sendMessage,
  performContactAction,
  performBulkContactAction,
  createContact,
  getDashboardStats,
  getContactStats,
  getAgents,
  updateFcmToken,
  summarizeLead
};
