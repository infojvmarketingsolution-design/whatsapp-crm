const ContactSchema = require('../models/tenant/Contact');
const MessageSchema = require('../models/tenant/Message');
const WhatsAppService = require('../services/whatsapp.service');
const Client = require('../models/core/Client');
const mongoose = require('mongoose');
const path = require('path');
const fs = require('fs');

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
    const { status } = req.query;
    const Contact = req.tenantDb.model('Contact', ContactSchema);
    const filter = status ? { status } : {};
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
    const { contactId, content } = req.body;
    console.log(`[POST /send] ContactId: ${contactId}, Content: ${content}`);
    let contact;
    
    const Contact = req.tenantDb.model('Contact', ContactSchema);
    contact = await Contact.findById(contactId);
    if (!contact) return res.status(404).json({ error: 'Contact not found' });

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
    
    const Message = req.tenantDb.model('Message', MessageSchema);
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

module.exports = { getContacts, createContact, getMessages, sendMessage, performContactAction };
