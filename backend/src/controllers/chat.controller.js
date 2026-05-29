const AIService = require('../services/ai.service');
const ContactSchema = require('../models/tenant/Contact');
const MessageSchema = require('../models/tenant/Message');
const Settings = require('../models/core/Settings');
const WhatsAppService = require('../services/whatsapp.service');
const Client = require('../models/core/Client');
const mongoose = require('mongoose');
const path = require('path');
const fs = require('fs');
const CampaignSchema = require('../models/tenant/Campaign');
const User = require('../models/core/User');

const createContact = async (req, res) => {
  try {
    const Contact = req.tenantDb.model('Contact', ContactSchema);
    const newContact = await Contact.create({ 
      ...req.body, 
      status: req.body.status || 'NEW LEAD',
      timeline: [{
        eventType: 'LEAD_ESTABLISHED',
        description: `Lead profile established via ${req.body.source || 'Manual Entry'}`,
        timestamp: new Date()
      }]
    });
    
    // Notify clients about the new lead
    req.app.get('io')?.to(req.tenantId).emit('new_message', { 
       contact: newContact.toObject(),
       content: 'New Lead Established',
       direction: 'INBOUND',
       type: 'text'
    });

    res.status(201).json(newContact);
  } catch (error) {
    if (error.code === 11000) {
       return res.status(400).json({ message: 'A profile with this phone number already exists in the workspace.' });
    }
    res.status(500).json({ message: error.message });
  }
};

const getContacts = async (req, res) => {
  try {
    const { status, qualification } = req.query;
    const Contact = req.tenantDb.model('Contact', ContactSchema);
    
    // Check Permissions for Assigned-Only Restriction
    const settings = await Settings.findOne({ tenantId: req.tenantId });
    const userRole = (req.user?.role || 'AGENT').toUpperCase();
    // Role Normalization for lookup (Underscore preferred for Map keys)
    
    // Strict High-Level check: Only actual owners/admins see everything
    const isHighLevel = ['ADMIN', 'SUPER_ADMIN', 'BUSINESS_HEAD', 'BUSINESS HEAD', 'OWNER'].includes(userRole);
    
    // Normalization for settings lookup
    const normalizedRole = userRole.replace(/\s/g, '_');
    const roleAccess = settings?.roleAccess instanceof Map ? 
                       (settings.roleAccess.get(normalizedRole) || settings.roleAccess.get(userRole)) : 
                       (settings?.roleAccess?.[normalizedRole] || settings?.roleAccess?.[userRole]);

    // Apply "Show Assigned Only" filter if NOT high level
    // We enforce this for everyone EXCEPT high-level roles, unless they have 'allAccess' explicitly set to true in settings
    const mustRestrict = !isHighLevel && (!roleAccess || roleAccess.allAccess !== true);

    // Base match for active leads
    const matchStage = { isArchived: { $ne: true } };
    
    if (mustRestrict) {
      const uid = new mongoose.Types.ObjectId(req.user._id);
      matchStage.$or = [
        { assignedAgent: uid },
        { assignedCounsellor: uid }
      ];
    }
    // Removed logging for production stability

    if (status) matchStage.status = status;

    if (qualification) matchStage.qualification = qualification;

    const totalMatching = await Contact.countDocuments(matchStage);
    // Removed logging for production stability

    const pipeline = [

      { $match: matchStage },
      {
        $lookup: {
          from: 'messages',
          let: { contactId: '$_id' },
          pipeline: [
            { $match: { $expr: { $eq: ['$contactId', '$$contactId'] } } },
            { $sort: { timestamp: -1 } },
            { $limit: 1 }
          ],
          as: 'latestMessage'
        }
      },
      {
        $addFields: {
          lastMsgDoc: { $arrayElemAt: ['$latestMessage', 0] }
        }
      },
      {
        $project: {
          _id: 1,
          name: 1,
          phone: 1,
          status: 1,
          qualification: 1,
          score: 1,
          heatLevel: 1,
          source: { $ifNull: ['$leadSource', '$source'] }, // Support both for compatibility
          leadSource: 1,
          tasks: 1, 
          email: 1,
          address: 1,
          pincode: 1,
          state: 1,
          timeline: 1,
          createdAt: 1,
          assignedAgent: { $toString: '$assignedAgent' },
          assignedCounsellor: { $toString: '$assignedCounsellor' },
          pipelineStage: 1,
          estimatedValue: 1,
          selectedProgram: 1,
          preferredCallTime: 1,
          budget: 1,
          purchaseTimeline: 1,
          decisionMakerStatus: 1,
          profession: 1,
          companyName: 1,
          linkedinUrl: 1,
          firstName: 1,
          lastName: 1,
          secondaryPhone: 1,
          altMobile: 1,
          nextFollowUp: 1,
          followUpCount: 1,
          nextFollowUpTime: 1,
          lastMessageAt: { $ifNull: ['$lastMsgDoc.timestamp', '$updatedAt'] },
          lastMessage: { $ifNull: ['$lastMsgDoc.content', ''] },
          lastMessageType: { $ifNull: ['$lastMsgDoc.type', 'text'] },
          visitStatus: 1,
          visitType: 1,
          admissionStatus: 1,
          collectionAmount: 1,
          pendingCollectionAmount: 1,
          houseNo: 1,
          societyName: 1,
          streetAddress: 1,
          city: 1,
          isClosed: 1,
          closeReason: 1,
          meetingType: 1,
          meetingRemark: 1,
          notes: 1,
          leadSourceType: 1,
          socialMediaSource: 1,
          referenceName: 1,
          referencePhone: 1,
          b2bOrgName: 1,
          b2bPersonName: 1,
          b2bPhone: 1,
          botQuestionsAnswered: 1,
          flowVariables: 1
        }
      },
      { $sort: { lastMessageAt: -1 } }
    ];

    const contacts = await Contact.aggregate(pipeline);

    // Enrich with Agent/Counsellor names
    const userIds = new Set();
    contacts.forEach(c => {
      if (c.assignedAgent) userIds.add(c.assignedAgent);
      if (c.assignedCounsellor) userIds.add(c.assignedCounsellor);
    });

    if (userIds.size > 0) {
      const users = await User.find({ _id: { $in: Array.from(userIds) } }).select('name');
      const userMap = users.reduce((acc, u) => {
        acc[u._id.toString()] = u.name;
        return acc;
      }, {});

      contacts.forEach(c => {
        c.assignedAgentName = userMap[c.assignedAgent] || null;
        c.assignedCounsellorName = userMap[c.assignedCounsellor] || null;
      });
    }

    res.json(contacts);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};



const performContactAction = async (req, res) => {
  try {
    const contactId = req.params.contactId || req.body.contactId;
    const { action, payload } = req.body;
    
    // Ensure Lead Source Granular fields are explicitly added to the schema if they are missing (prevents model caching issues)
    if (!ContactSchema.path('leadSourceType')) {
       ContactSchema.add({
          leadSourceType: { type: String, enum: ['Social media', 'Reference', 'B2B agents', 'Manual Entry', 'Direct', 'Other'], default: 'Manual Entry' },
          socialMediaSource: { type: String },
          referenceName: { type: String },
          referencePhone: { type: String },
          b2bOrgName: { type: String },
          b2bPersonName: { type: String },
          b2bPhone: { type: String }
       });
    }

    let ContactModel = req.tenantDb.model('Contact', ContactSchema);
    let contact;
    
    contact = await ContactModel.findById(contactId);
    if (!contact) return res.status(404).json({ error: 'Contact not found' });

    // Security Check: Visibility Enforcement
    const settings = await Settings.findOne({ tenantId: req.tenantId });
    const userRole = (req.user?.role || 'AGENT').toUpperCase();
    const normalizedRole = userRole.replace(/\s/g, '_');
    const isHighLevel = ['ADMIN', 'SUPER_ADMIN', 'BUSINESS_HEAD', 'BUSINESS HEAD', 'OWNER', 'MANAGER_COUNSELLOUR', 'MANAGER COUNSELLOUR'].includes(userRole);
    
    const roleAccess = settings?.roleAccess instanceof Map ? 
                       (settings.roleAccess.get(normalizedRole) || settings.roleAccess.get(userRole)) : 
                       (settings?.roleAccess?.[normalizedRole] || settings?.roleAccess?.[userRole]);

    const mustRestrict = !isHighLevel && (
      (roleAccess && roleAccess.permissions.includes('chat_show_assigned_only')) ||
      (!roleAccess || roleAccess.allAccess === false)
    );

    if (mustRestrict) {
       const isAssigned = (contact.assignedAgent?.toString() === req.user._id.toString()) || 
                          (contact.assignedCounsellor?.toString() === req.user._id.toString());
       
       if (!isAssigned) {
          return res.status(403).json({ message: 'Access denied: You can only perform actions on leads assigned to you.' });
       }
    }

    if (action === 'delete_task') {
       if (!contact.tasks) contact.tasks = [];
       const taskIndex = contact.tasks.findIndex(t => t._id.toString() === payload.taskId);
       if (taskIndex > -1) {
          const removedTask = contact.tasks.splice(taskIndex, 1)[0];
          contact.timeline.push({ 
            eventType: 'TASK_DELETED', 
            description: `Task deleted: ${removedTask.title}`, 
            timestamp: new Date() 
          });
       }
    } else if (action === 'reschedule_task') {
       const task = contact.tasks.id(payload.taskId);
       if (task) {
          const oldDate = task.dueDate;
          task.dueDate = new Date(payload.newDueDate);
          contact.timeline.push({ 
            eventType: 'TASK_RESCHEDULED', 
            description: `Task "${task.title}" rescheduled from ${new Date(oldDate).toLocaleString()} to ${new Date(payload.newDueDate).toLocaleString()}`, 
            timestamp: new Date() 
          });
       }
    } else if (action === 'edit_task') {
       const task = contact.tasks.id(payload.taskId);
       if (task) {
           task.title = payload.title || task.title;
          task.description = payload.description !== undefined ? payload.description : task.description;
          task.dueDate = payload.dueDate ? new Date(payload.dueDate) : task.dueDate;
          task.type = payload.type || task.type;
          contact.timeline.push({ 
            eventType: 'TASK_UPDATED', 
            description: `Task updated: ${task.title}`, 
            timestamp: new Date() 
          });
       }
    } else if (action === 'update_status') {
        let status = payload.status;
        // Map frontend values to backend Enum values
        if (status === 'CLOSE') status = 'CLOSED';
        if (status === 'PENDING VISIT') status = 'PENDING_VISIT';
        
        contact.status = status;
        
        // Synchronize isClosed state
        if (['CLOSED', 'CLOSED_LOST', 'CLOSED_WON', 'ADMISSION'].includes(status)) {
            contact.isClosed = true;
        } else if (['NEW', 'NEW LEAD', 'OPEN', 'CONTACTED', 'INTERESTED', 'FOLLOW_UP', 'VISITED', 'PENDING_VISIT'].includes(status)) {
            contact.isClosed = false;
        }

        contact.timeline.push({ 
           eventType: 'STATUS_UPDATED', 
           description: `Status updated to ${status}`, 
           timestamp: new Date() 
        });
     } else if (action === 'generate_brief') {
          const Message = req.tenantDb.model('Message', MessageSchema);
          const messages = await Message.find({ contactId }).sort({ createdAt: 1 });
          const brief = await AIService.generateStrategicBrief(messages, contact);
          if (!brief) return res.status(400).json({ message: 'AI Brief generation failed' });
          
          return res.json({ brief });
        } else if (action === 'update_contact') {
          // 1. Specialized logic for Counsellor Assignment (Requires Timeline Event)
          if (payload.assignedCounsellor !== undefined) {
             const newCounsellor = payload.assignedCounsellor && payload.assignedCounsellor !== "" ? payload.assignedCounsellor : null;
             if (newCounsellor?.toString() !== contact.assignedCounsellor?.toString()) {
                let agentName = 'Unassigned';
                if (newCounsellor) {
                   const agent = await User.findById(newCounsellor);
                   agentName = agent ? agent.name : 'Unknown';
                }
                contact.timeline.push({ 
                   eventType: 'COUNSELLOR_ASSIGNED', 
                   description: newCounsellor ? `Assigned to Counsellor: ${agentName}` : 'Counsellor unassigned', 
                   timestamp: new Date() 
                });
             }
             payload.assignedCounsellor = newCounsellor;
          }

          if (payload.assignedAgent !== undefined) {
             payload.assignedAgent = payload.assignedAgent && payload.assignedAgent !== "" ? payload.assignedAgent : null;
          }

          // 2. Synchronize Status with isClosed toggle
          if (payload.isClosed !== undefined) {
             if (payload.isClosed) {
                payload.status = 'CLOSED';
             } else if (contact.status === 'CLOSED' || contact.status === 'CLOSE') {
                payload.status = 'OPEN';
             }
          }

          // 3. SECURE DATABASE UPDATE: Hyper-explicit mapping for Lead Source
          const updatePayload = { ...payload };
          const protectedFields = ['_id', '__v', 'createdAt', 'updatedAt', 'tasks', 'notes', 'timeline', 'assignedAgentName', 'assignedCounsellorName'];
          protectedFields.forEach(f => delete updatePayload[f]);

          // Extract values for explicit persistence
          const type = updatePayload.leadSourceType || contact.leadSourceType || 'Manual Entry';
          const social = updatePayload.socialMediaSource || contact.socialMediaSource || '';
          const ref = updatePayload.referenceName || contact.referenceName || '';
          const b2b = updatePayload.b2bOrgName || contact.b2bOrgName || '';

          let summary = type;
          if (type === 'Social media' && social) summary = `Social: ${social}`;
          else if (type === 'Reference' && ref) summary = `Ref: ${ref}`;
          else if (type === 'B2B agents' && b2b) summary = `B2B: ${b2b}`;
          
          updatePayload.leadSource = summary;

          // Perform atomic update using the raw MongoDB driver for 100% reliability
          const rawId = new mongoose.Types.ObjectId(contactId);
          
          // Calculate explicit changes (Added, Updated, Removed) for the timeline
          const diffs = [];
          const normalize = (val) => (val === undefined || val === null) ? '' : val;
          Object.keys(updatePayload).forEach(key => {
             const oldVal = normalize(contact[key]);
             const newVal = normalize(updatePayload[key]);
             
             if (oldVal === '' && newVal !== '') {
                 diffs.push({ key, action: 'Added', new: newVal });
             } else if (oldVal !== '' && newVal === '') {
                 diffs.push({ key, action: 'Removed', old: oldVal });
             } else if (oldVal !== newVal) {
                 diffs.push({ key, action: 'Updated', old: oldVal, new: newVal });
             }
          });
          
          let diagnostic = '';
          if (diffs.length === 0) {
              diagnostic = `Profile Sync [Diff: No changes]`;
          } else {
              diagnostic = `Profile Sync JSON: ${JSON.stringify(diffs)}`;
          }
          
          await ContactModel.collection.updateOne(
             { _id: rawId },
             { 
                $set: {
                   ...updatePayload,
                   leadSource: summary,
                   leadSourceType: type,
                   socialMediaSource: social,
                   referenceName: ref,
                   referencePhone: updatePayload.referencePhone || contact.referencePhone || '',
                   b2bOrgName: b2b
                },
                $push: { 
                   timeline: { 
                      eventType: 'FIELD_UPDATED', 
                      description: diagnostic, 
                      timestamp: new Date() 
                   }
                }
             }
          );

          // 4. VERIFY & RETURN: Use lean() to guarantee no schema-stripping in response
          const freshDoc = await ContactModel.findById(contactId).lean();
          if (!freshDoc) return res.status(404).json({ error: 'Failed to retrieve updated profile' });
          
          return res.json({ success: true, contact: freshDoc });

        } else if (action === 'update_profile') {
           // Alias for update_contact to handle variations in frontend requests
           return performContactAction({ ...req, body: { ...req.body, action: 'update_contact' } }, res);
        } else if (action === 'add_note') {
       const newNote = { content: payload.note, createdBy: req.user?.name || req.user?._id || 'System', createdAt: new Date() };
       if (!contact.notes) contact.notes = [];
       contact.notes.push(newNote);
       contact.timeline.push({ eventType: 'NOTE_ADDED', description: `Note added${payload.note ? ` - ${payload.note}` : ''}`, timestamp: new Date() });
    } else if (action === 'assign_agent') {
       const agentId = payload.agentId || payload.assignedAgent; // Support both keys
       contact.assignedAgent = agentId && agentId !== "" ? agentId : null;
       contact.timeline.push({ eventType: 'AGENT_ASSIGNED', description: agentId ? `Assigned to agent ${agentId}` : 'Lead unassigned', timestamp: new Date() });
    } else if (action === 'log_call') {
       contact.timeline.push({ eventType: 'CALL_LOGGED', description: `Call Logged - Outcome: ${payload.outcome}`, timestamp: new Date() });
       
       let callDetails = `Outcome: ${payload.outcome}`;
        if (payload.date) callDetails += `\n1st Call Date: ${payload.date}`;
        if (payload.time) callDetails += `\n1st Call Time: ${payload.time}`;
        if (payload.count) callDetails += `\nCall Count: ${payload.count}`;
        if (payload.nextDate) callDetails += `\nNext Follow Up Date: ${payload.nextDate}`;
        if (payload.nextTime) callDetails += `\nNext Follow Up Time: ${payload.nextTime}`;
        callDetails += `\nDescription: ${payload.notes || 'N/A'}`;

       const newNote = { content: callDetails, createdBy: req.user?._id || 'System', createdAt: new Date() };
       if (!contact.notes) contact.notes = [];
       contact.notes.push(newNote);

       if (payload.nextDate && payload.nextTime) {
           if (!contact.tasks) contact.tasks = [];
           if (!contact.followUpCount) contact.followUpCount = 0;
           contact.followUpCount = 1;
           contact.nextFollowUp = new Date(`${payload.nextDate}T${payload.nextTime}`);
           contact.nextFollowUpTime = payload.nextTime;
           contact.tasks.push({
             type: 'FOLLOW_UP', 
             title: `Follow-up #${contact.followUpCount}`, 
             dueDate: new Date(`${payload.nextDate}T${payload.nextTime}`), 
             status: 'PENDING',
             description: payload.notes || `Scheduled from call log`
           });
           contact.timeline.push({ eventType: 'FOLLOWUP_SET', description: `1st Follow-Up Scheduled for ${payload.nextDate} ${payload.nextTime}`, timestamp: new Date() });
       }
    } else if (action === 'schedule_meeting') {
       if (!contact.tasks) contact.tasks = [];
       contact.tasks.push({ 
         type: 'MEETING', title: `Meeting: ${payload.mode}`, dueDate: new Date(payload.dateTime), status: 'PENDING', description: payload.description || '', metadata: { location: payload.location }
       });
       contact.timeline.push({ eventType: 'MEETING_SCHEDULED', description: `Scheduled ${payload.mode} Meeting for ${new Date(payload.dateTime).toLocaleString()}${payload.description ? ` - ${payload.description}` : ''}`, timestamp: new Date() });
    } else if (action === 'add_followup') {
       if (!contact.tasks) contact.tasks = [];
       
       // Complete previous pending followup
       const pendingIdx = contact.tasks.findIndex(t => t.type === 'FOLLOW_UP' && t.status === 'PENDING');
       if (pendingIdx > -1) {
           contact.tasks[pendingIdx].status = 'COMPLETED';
           const count = contact.followUpCount || 1;
           let ord = 'th';
           if (count % 10 === 1 && count % 100 !== 11) ord = 'st';
           else if (count % 10 === 2 && count % 100 !== 12) ord = 'nd';
           else if (count % 10 === 3 && count % 100 !== 13) ord = 'rd';
           contact.timeline.push({ eventType: 'TASK_COMPLETED', description: `${count}${ord} Follow-Up Completed`, timestamp: new Date() });
       }
       
       contact.followUpCount = (contact.followUpCount || 0) + 1;
       contact.nextFollowUp = new Date(payload.dateTime);
       if (payload.time) contact.nextFollowUpTime = payload.time;

       contact.tasks.push({
         type: 'FOLLOW_UP', 
         title: `Follow-up #${contact.followUpCount}`, 
         dueDate: new Date(payload.dateTime), 
         status: 'PENDING',
         description: payload.description || '',
         metadata: payload.metadata || {} // Store visit types here
       });
       
       const count = contact.followUpCount;
       let ord = 'th';
       if (count % 10 === 1 && count % 100 !== 11) ord = 'st';
       else if (count % 10 === 2 && count % 100 !== 12) ord = 'nd';
       else if (count % 10 === 3 && count % 100 !== 13) ord = 'rd';

       contact.timeline.push({ 
         eventType: 'FOLLOWUP_SET', 
         description: `${count}${ord} Follow-up scheduled for ${new Date(payload.dateTime).toLocaleString()}${payload.description ? ` - ${payload.description}` : ''}`, 
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
           const task = contact.tasks[taskIndex];
           task.status = 'COMPLETED';
           task.outcome = payload.remark || 'Task completed';
           
           // Update Contact Metadata if meeting outcome is provided
           if (payload.assignedCounsellor) {
              contact.assignedCounsellor = payload.assignedCounsellor;
              const counsellor = await User.findById(payload.assignedCounsellor);
              contact.timeline.push({ 
                 eventType: 'COUNSELLOR_ASSIGNED', 
                 description: `Enquiry lead by: ${counsellor?.name || 'Counsellor'}`, 
                 timestamp: new Date() 
              });
           }

           if (payload.remark) {
              contact.meetingRemark = payload.remark;
              if (task.metadata?.visitType) {
                 contact.meetingType = task.metadata.visitType;
                 contact.visitStatus = 'Visited';
              }
           }

           contact.timeline.push({ eventType: 'TASK_COMPLETED', description: `Task completed: ${task.title}${payload.remark ? ` - ${payload.remark}` : ''}`, timestamp: new Date() });
       }
    } else if (action === 'in_progress_task') {
        if (!contact.tasks) contact.tasks = [];
        const taskIndex = contact.tasks.findIndex(t => t._id.toString() === payload.taskId);
        if (taskIndex > -1) {
            contact.tasks[taskIndex].status = 'IN_PROGRESS';
            contact.timeline.push({ eventType: 'TASK_IN_PROGRESS', description: `Task set to Changing: ${contact.tasks[taskIndex].title}`, timestamp: new Date() });
        }
     } else if (action === 'cancel_task') {
        if (!contact.tasks) contact.tasks = [];
        const taskIndex = contact.tasks.findIndex(t => t._id.toString() === payload.taskId);
        if (taskIndex > -1) {
            contact.tasks[taskIndex].status = 'CANCELLED';
            contact.timeline.push({ eventType: 'TASK_CANCELLED', description: `Task cancelled: ${contact.tasks[taskIndex].title}`, timestamp: new Date() });
        }
     } else {
        return res.status(400).json({ error: 'Invalid action type' });
     }

    // Failsafe: Ensure no empty strings sneak into ObjectId fields before saving
    ContactSchema.eachPath((pathname, schemaType) => {
       if (schemaType.instance === 'ObjectID' || schemaType.instance === 'ObjectId') {
          if (contact.get(pathname) === "") {
             contact.set(pathname, null);
          }
       }
    });

    await contact.save();
    req.app.get("io")?.to(req.tenantId).emit("contact_updated", { contactId: contact._id, contact: contact.toObject() }); res.json({ success: true, contact: contact.toObject() });
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

    // Security Check: Filter contactIds by visibility
    const settings = await Settings.findOne({ tenantId: req.tenantId });
    const userRole = (req.user?.role || 'AGENT').toUpperCase();
    const normalizedRole = userRole.replace(/\s/g, '_');
    const isHighLevel = ['ADMIN', 'SUPER_ADMIN', 'BUSINESS_HEAD', 'BUSINESS HEAD', 'OWNER', 'MANAGER_COUNSELLOUR', 'MANAGER COUNSELLOUR'].includes(userRole);
    
    const roleAccess = settings?.roleAccess instanceof Map ? 
                       (settings.roleAccess.get(normalizedRole) || settings.roleAccess.get(userRole)) : 
                       (settings?.roleAccess?.[normalizedRole] || settings?.roleAccess?.[userRole]);

    const mustRestrict = !isHighLevel && (
      (roleAccess && roleAccess.permissions.includes('chat_show_assigned_only')) ||
      (!roleAccess || roleAccess.allAccess === false)
    );

    let finalContactIds = contactIds;
    if (mustRestrict) {
       const visibleContacts = await ContactModel.find({
          _id: { $in: contactIds },
          $or: [
             { assignedAgent: String(req.user._id) },
             { assignedCounsellor: String(req.user._id) }
          ]
       }).select('_id');
       finalContactIds = visibleContacts.map(c => c._id);
       if (finalContactIds.length === 0) {
          return res.status(403).json({ error: 'Access denied: None of these leads are assigned to you.' });
       }
    }

    // Process Actions with real-time updates
    const updatedLeads = [];
    
    if (action === 'archive_leads') {
       for (const id of finalContactIds) {
          const updated = await ContactModel.findByIdAndUpdate(id, {
             $set: { isArchived: true },
             $push: { timeline: { eventType: 'LEAD_ARCHIVED', description: 'Lead archived in bulk', timestamp: new Date() } }
          }, { new: true });
          if (updated) updatedLeads.push(updated);
       }
    } else if (action === 'transfer_leads' || action === 'assignedAgent') {
       const agentId = typeof payload === 'string' ? payload : (payload.agentId || payload);
       let agentName = 'Unassigned';
       if (agentId && agentId !== "") {
          const agent = await User.findById(agentId);
          agentName = agent ? agent.name : 'Unknown Agent';
       }
       for (const id of finalContactIds) {
          const updated = await ContactModel.findByIdAndUpdate(id, {
             $set: { assignedAgent: agentId && agentId !== "" ? agentId : null },
             $push: { timeline: { eventType: 'AGENT_ASSIGNED', description: agentId ? `Assigned to ${agentName} in bulk` : 'Lead unassigned in bulk', timestamp: new Date() } }
          }, { new: true });
          if (updated) updatedLeads.push(updated);
       }
    } else if (action === 'transfer_counsellor' || action === 'assignedCounsellor') {
       const counsellorId = typeof payload === 'string' ? payload : (payload.counsellorId || payload);
       let counsellorName = 'Unassigned';
       if (counsellorId && counsellorId !== "") {
          const counsellor = await User.findById(counsellorId);
          counsellorName = counsellor ? counsellor.name : 'Unknown Counsellor';
       }
       for (const id of finalContactIds) {
          const updated = await ContactModel.findByIdAndUpdate(id, {
             $set: { assignedCounsellor: counsellorId && counsellorId !== "" ? counsellorId : null },
             $push: { timeline: { eventType: 'COUNSELLOR_ASSIGNED', description: counsellorId ? `Enquiry Expert assigned to ${counsellorName} in bulk` : 'Counsellor unassigned in bulk', timestamp: new Date() } }
          }, { new: true });
          if (updated) updatedLeads.push(updated);
       }
    } else if (action === 'update_lead_source' || action === 'leadSourceType' || action === 'leadSource') {
       const sourceType = typeof payload === 'string' ? payload : (payload.sourceType || payload);
       for (const id of finalContactIds) {
          const updated = await ContactModel.findByIdAndUpdate(id, {
             $set: { leadSourceType: sourceType, leadSource: sourceType },
             $push: { timeline: { eventType: 'FIELD_UPDATED', description: `Lead source updated to ${sourceType} in bulk`, timestamp: new Date() } }
          }, { new: true });
          if (updated) updatedLeads.push(updated);
       }
    } else if (action === 'update_status' || action === 'status' || action === 'update_stage' || action === 'pipelineStage' || action === 'stage') {
       let val = typeof payload === 'string' ? payload : (payload.status || payload.stage || payload);
       const isStage = action === 'update_stage' || action === 'pipelineStage' || action === 'stage';
       
       for (const id of finalContactIds) {
          const update = isStage ? { pipelineStage: val } : { status: val, isClosed: ['CLOSED', 'CLOSED_LOST', 'CLOSED_WON', 'ADMISSION'].includes(val) };
          const updated = await ContactModel.findByIdAndUpdate(id, {
             $set: update,
             $push: { timeline: { eventType: isStage ? 'PIPELINE_MOVE' : 'STATUS_UPDATED', description: `${isStage ? 'Stage' : 'Status'} updated to ${val} in bulk`, timestamp: new Date() } }
          }, { new: true });
          if (updated) updatedLeads.push(updated);
       }
    } else if (action === 'hard_delete_leads') {
       await MessageModel.deleteMany({ contactId: { $in: finalContactIds } });
       await ContactModel.deleteMany({ _id: { $in: finalContactIds } });
       return res.json({ success: true, message: `${finalContactIds.length} leads permanently deleted` });
    }

    // Emit Socket Updates for all updated leads
    updatedLeads.forEach(lead => {
       req.app.get("io")?.to(req.tenantId).emit("contact_updated", { contactId: lead._id, contact: lead.toObject() });
    });

    return res.json({ success: true, message: `Successfully updated ${updatedLeads.length} leads` });
  } catch (error) {
    console.error('[Bulk Action Error]:', error);
    res.status(500).json({ error: error.message });
  }
};

const getMessages = async (req, res) => {
  try {
    console.log(`[GET /messages] Request received for contactId: ${req.params.contactId}`);
    const Message = req.tenantDb.model('Message', MessageSchema);
    const Contact = req.tenantDb.model('Contact', ContactSchema);

    // Security Check: Visibility Enforcement
    const settings = await Settings.findOne({ tenantId: req.tenantId });
    const userRole = (req.user?.role || 'AGENT').toUpperCase();
    const normalizedRole = userRole.replace(/\s/g, '_');
    const isHighLevel = ['ADMIN', 'SUPER_ADMIN', 'BUSINESS_HEAD', 'BUSINESS HEAD', 'OWNER'].includes(userRole);
    
    const roleAccess = settings?.roleAccess instanceof Map ? 
                       (settings.roleAccess.get(normalizedRole) || settings.roleAccess.get(userRole)) : 
                       (settings?.roleAccess?.[normalizedRole] || settings?.roleAccess?.[userRole]);

    const mustRestrict = !isHighLevel && (!roleAccess || roleAccess.allAccess !== true);

    if (mustRestrict) {
       const contact = await Contact.findById(req.params.contactId);
       const isAssigned = (contact.assignedAgent?.toString() === req.user._id.toString()) || 
                          (contact.assignedCounsellor?.toString() === req.user._id.toString());
       
       if (contact && !isAssigned) {
          return res.status(403).json({ message: 'Access denied to this contact messages' });
       }
    }

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
    // User already required at top

    const contact = await Contact.findById(contactId);
    if (!contact) return res.status(404).json({ error: 'Contact not found' });

    // Security Check: Visibility Enforcement
    const settings = await Settings.findOne({ tenantId: req.tenantId });
    const userRole = (req.user?.role || 'AGENT').toUpperCase();
    const normalizedRole = userRole.replace(/\s/g, '_');
    const isHighLevel = ['ADMIN', 'SUPER_ADMIN', 'BUSINESS_HEAD', 'BUSINESS HEAD', 'OWNER', 'MANAGER_COUNSELLOUR', 'MANAGER COUNSELLOUR'].includes(userRole);
    
    const roleAccess = settings?.roleAccess instanceof Map ? 
                       (settings.roleAccess.get(normalizedRole) || settings.roleAccess.get(userRole)) : 
                       (settings?.roleAccess?.[normalizedRole] || settings?.roleAccess?.[userRole]);

    const mustRestrict = !isHighLevel && (
      (roleAccess && roleAccess.permissions.includes('chat_show_assigned_only')) ||
      (!roleAccess || roleAccess.allAccess === false)
    );

    if (mustRestrict) {
       const isAssigned = (contact.assignedAgent?.toString() === req.user._id.toString()) || 
                          (contact.assignedCounsellor?.toString() === req.user._id.toString());
       
       if (!isAssigned) {
          return res.status(403).json({ message: 'Access denied: You can only send messages to leads assigned to you.' });
       }
    }

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
    }

    // HARDCODE SHREYARTH OVERRIDE
    const isShreyarth = client.tenantId?.toLowerCase().includes('shreyarth') || client.companyName?.toLowerCase().includes('shreyarth') || client.name?.toLowerCase().includes('shreyarth');
    const waConfig = isShreyarth ? {
        phoneNumberId: '1074613152404424',
        wabaId: '1433761851305451',
        accessToken: 'EAAUZAwz8PZCJABRfcA4XgJmp8UzJ4ixXbpVA7CvnldS3pkDXdUkbtE2hyfYFHYsZAcZBgKaDwGpHCLf5N0iQfCTfJZAu0iwLmhrbcy2TON4DBvkEeZBZCKhLsSnZCF0ZBASOjWQwtv8ZA2mSZC2ZB0UtQiWcvuPwukLlzAJbLqdkkkW7QPNzJZAWVUKZAQEnPYo2wxzQZDZD',
        phoneNumber: '+91 63566 00606',
        wabaName: 'Shreyarth university'
    } : client.whatsappConfig;

    if (!waConfig || !waConfig.accessToken) {
      return res.status(400).json({ message: 'WhatsApp API not configured for this client' });
    }

    const waService = new WhatsAppService({
      accessToken: waConfig.accessToken,
      phoneNumberId: waConfig.phoneNumberId
    });
    
    let result;
    let messageType = 'text';
    let messageContent = content;
    let isFailed = false;

    if (req.file) {
      const mimeType = req.file.mimetype;
      const originalName = req.file.originalname;
      const extension = path.extname(originalName).toLowerCase().replace('.', '');
      
      // Strict Security: Allow-list of safe business and media extensions
      const allowedExtensions = [
        'jpg', 'jpeg', 'png', 'gif', 'webp', 'svg', // Images
        'mp4', 'mpeg', 'avi', 'mov', 'm4v',          // Video
        'mp3', 'ogg', 'wav', 'm4a',                   // Audio
        'pdf', 'doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx', 'txt', 'csv', 'zip', 'rar' // Documents
      ];

      if (!allowedExtensions.includes(extension)) {
        // Delete the temporary file if it fails validation
        if (fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
        return res.status(400).json({ error: `Security: File type (.${extension}) is not allowed for security reasons.` });
      }

      if (mimeType.startsWith('image/')) messageType = 'image';
      else if (mimeType.startsWith('video/')) messageType = 'video';
      else messageType = 'document';

      const targetDir = path.join(__dirname, '../../public/uploads/media', req.tenantId);
      if (!fs.existsSync(targetDir)) fs.mkdirSync(targetDir, { recursive: true });
      
      const fileName = `out_${Date.now()}_${originalName.replace(/[^a-zA-Z0-9.-]/g, '_')}`; // Sanitize filename
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
     console.error('[Bulk Action Error]:', error);
     console.error('[Bulk Action Error]:', error);
     console.error('[Bulk Action Error]:', error);
     res.status(500).json({ error: error.message });
  }
};

const getDashboardStats = async (req, res) => {
  try {
    const Contact = req.tenantDb.model('Contact', ContactSchema);
    const Campaign = req.tenantDb.model('Campaign', CampaignSchema);
    
    // Permission Check for Stats Filtering
    const settings = await Settings.findOne({ tenantId: req.tenantId });
    const userRole = (req.user?.role || 'AGENT').toUpperCase();
    const normalizedRole = userRole.replace(/\s/g, '_');
    const roleAccess = settings?.roleAccess instanceof Map ? 
                       (settings.roleAccess.get(normalizedRole) || settings.roleAccess.get(userRole)) : 
                       (settings?.roleAccess?.[normalizedRole] || settings?.roleAccess?.[userRole]);

    const isHighLevel = ['ADMIN', 'SUPER_ADMIN', 'BUSINESS_HEAD', 'BUSINESS HEAD', 'OWNER'].includes(userRole);

    const baseFilter = { isArchived: { $ne: true } };
    const mustRestrict = !isHighLevel && (!roleAccess || roleAccess.allAccess !== true);

    if (mustRestrict) {
       const uid = new mongoose.Types.ObjectId(req.user._id);
       baseFilter.$or = [
          { assignedAgent: uid },
          { assignedCounsellor: uid }
       ];
    }

    const totalContacts = await Contact.countDocuments(baseFilter);
    
    // Active chats: contacts with activity in the last 24 hours
    const activeThreshold = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const activeChats = await Contact.countDocuments({ ...baseFilter, lastMessageAt: { $gte: activeThreshold } });
    
    const totalCampaigns = await Campaign.countDocuments({});
    
    // Qualified Leads: contacts with a qualification field set
    const qualifiedLeads = await Contact.countDocuments({ ...baseFilter, qualification: { $exists: true, $ne: null } });
    
    // Waiting for Agent: FOLLOW_UP status
    const waitingForAgent = await Contact.countDocuments({ ...baseFilter, status: 'FOLLOW_UP' });
    
    // Priority Leads: Hot and Warm
    const hotLeads = await Contact.countDocuments({ ...baseFilter, heatLevel: 'Hot' });
    const warmLeads = await Contact.countDocuments({ ...baseFilter, heatLevel: 'Warm' });

    // Pending Tasks Count for current user
    let pendingTasks = 0;
    const contactsWithTasks = await Contact.find({
      ...baseFilter,
      'tasks.0': { $exists: true }
    }).select('tasks');
    
    contactsWithTasks.forEach(c => {
      c.tasks.forEach(t => {
        if (t.status === 'PENDING' || t.status === 'IN_PROGRESS') pendingTasks++;
      });
    });

    // Counselling & Admission Stats (for Dashboard)
    const counselStatsArr = await Contact.aggregate([
      { $match: { ...baseFilter } },
      { $group: {
        _id: null,
        newLeads: { $sum: { $cond: [{ $in: ["$status", ["NEW LEAD", "NEW"]] }, 1, 0] } },
        openLeads: { $sum: { $cond: [{ $in: ["$status", ["OPEN", "CONTACTED", "INTERESTED", "FOLLOW_UP"]] }, 1, 0] } },
        closedLeads: { $sum: { $cond: [{ $in: ["$status", ["CLOSE", "CLOSED", "CLOSED_LOST"]] }, 1, 0] } },
        totalVisit: { $sum: { $cond: [{ $eq: ["$status", "VISITED"] }, 1, 0] } },
        pendingVisit: { $sum: { $cond: [{ $eq: ["$status", "PENDING_VISIT"] }, 1, 0] } },
        totalAdmission: { $sum: { $cond: [{ $in: ["$status", ["ADMISSION", "CLOSED_WON"]] }, 1, 0] } },
        totalCollection: { $sum: { $convert: { input: "$collectionAmount", to: "double", onError: 0, onNull: 0 } } },
        pendingCollection: { $sum: { $convert: { input: "$pendingCollectionAmount", to: "double", onError: 0, onNull: 0 } } }
      }}
    ]);
    const counselStats = counselStatsArr[0] || { 
      newLeads: 0, openLeads: 0, totalVisit: 0, pendingVisit: 0, totalAdmission: 0, 
      pendingAdmission: 0, closedLeads: 0, totalCollection: 0, pendingCollection: 0 
    };
    
    res.json({
      leads: totalContacts,
      activeChats,
      campaigns: totalCampaigns,
      qualifiedLeads,
      waitingForAgent,
      hotLeads,
      warmLeads,
      pendingTasks,
      // Counselor specific
      newLeads: counselStats.newLeads,
      openLeads: counselStats.openLeads,
      closedLeads: counselStats.closedLeads,
      totalVisit: counselStats.totalVisit,
      pendingVisit: counselStats.pendingVisit,
      totalAdmission: counselStats.totalAdmission,
      totalCollection: counselStats.totalCollection,
      pendingCollection: counselStats.pendingCollection
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
    // User already required at top
    const agents = await User.find({ tenantId: req.tenantId, status: 'ACTIVE' }).select('name email role');
    res.json(agents);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const updateFcmToken = async (req, res) => {
  try {
    // User already required at top
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

    // Security Check: Visibility Enforcement
    const settings = await Settings.findOne({ tenantId: req.tenantId });
    const userRole = (req.user?.role || 'AGENT').toUpperCase();
    const normalizedRole = userRole.replace(/\s/g, '_');
    const isHighLevel = ['ADMIN', 'SUPER_ADMIN', 'BUSINESS_HEAD', 'BUSINESS HEAD', 'OWNER', 'MANAGER_COUNSELLOUR', 'MANAGER COUNSELLOUR'].includes(userRole);
    
    const roleAccess = settings?.roleAccess instanceof Map ? 
                       (settings.roleAccess.get(normalizedRole) || settings.roleAccess.get(userRole)) : 
                       (settings?.roleAccess?.[normalizedRole] || settings?.roleAccess?.[userRole]);

    const mustRestrict = !isHighLevel && (
      (roleAccess && roleAccess.permissions.includes('chat_show_assigned_only')) ||
      (!roleAccess || roleAccess.allAccess === false)
    );

    if (mustRestrict) {
       const isAssigned = (contact.assignedAgent?.toString() === req.user._id.toString()) || 
                          (contact.assignedCounsellor?.toString() === req.user._id.toString());
       
       if (!isAssigned) {
          return res.status(403).json({ message: 'Access denied: You can only summarize leads assigned to you.' });
       }
    }

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

const getLeadAnalysis = async (req, res) => {
  try {
    if (!req.tenantDb) {
      console.warn(`[GET /analysis] No tenant DB connection found.`);
      return res.json({ statusStats: [], sourceStats: [], tagStats: [] });
    }

    const Contact = req.tenantDb.model('Contact', ContactSchema);
    
    // Aggregate by Status with fallback to empty array
    const statusStats = (await Contact.aggregate([
      { $match: { isArchived: { $ne: true } } },
      { $group: { _id: "$status", count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ])) || [];

    // Aggregate by Source with fallback to empty array
    const sourceStats = (await Contact.aggregate([
      { $match: { isArchived: { $ne: true } } },
      { $group: { _id: "$leadSourceType", count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ])) || [];

    // Aggregate by Tags with fallback to empty array (Dynamic unwinding for automatic support of any custom tag!)
    const tagStats = (await Contact.aggregate([
      { $match: { isArchived: { $ne: true }, tags: { $exists: true, $not: { $size: 0 } } } },
      { $unwind: "$tags" },
      { $group: { _id: "$tags", count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ])) || [];

    res.json({
      statusStats: statusStats.map(s => ({ label: s._id || 'Unknown', value: s.count })),
      sourceStats: sourceStats.map(s => ({ label: s._id || 'Direct', value: s.count })),
      tagStats: tagStats.map(t => ({ label: t._id, value: t.count }))
    });
  } catch (error) {
    console.error(`[GET /analysis] Analysis Failed:`, error.message);
    res.json({ statusStats: [], sourceStats: [], tagStats: [], error: error.message });
  }
};

const getUserBreakdownStats = async (req, res) => {
  try {
    const { category } = req.query;
    const Contact = req.tenantDb.model('Contact', ContactSchema);

    // Visibility Filtering
    const settings = await Settings.findOne({ tenantId: req.tenantId });
    const userRole = (req.user?.role || 'AGENT').toUpperCase();
    const normalizedRole = userRole.replace(/\s/g, '_');
    const isHighLevel = ['ADMIN', 'SUPER_ADMIN', 'BUSINESS_HEAD', 'BUSINESS HEAD', 'OWNER'].includes(userRole);
    
    const roleAccess = settings?.roleAccess instanceof Map ? 
                       (settings.roleAccess.get(normalizedRole) || settings.roleAccess.get(userRole)) : 
                       (settings?.roleAccess?.[normalizedRole] || settings?.roleAccess?.[userRole]);

    const mustRestrict = !isHighLevel && (!roleAccess || roleAccess.allAccess !== true);

    let matchQuery = { isArchived: { $ne: true } };
    
    if (mustRestrict) {
       const uid = new mongoose.Types.ObjectId(req.user._id);
       matchQuery.$or = [
          { assignedAgent: uid },
          { assignedCounsellor: uid }
       ];
    }

    let groupField = '$assignedAgent'; // Default to assigned agent

    switch (category) {
      case 'new_leads':
        matchQuery.status = { $in: ['NEW LEAD', 'NEW'] };
        groupField = { $ifNull: ['$assignedAgent', '$assignedCounsellor'] };
        break;
      case 'open_leads':
        matchQuery.status = { $in: ['OPEN', 'CONTACTED', 'INTERESTED', 'FOLLOW_UP'] };
        groupField = { $ifNull: ['$assignedAgent', '$assignedCounsellor'] };
        break;
      case 'closed_leads':
        matchQuery.status = { $in: ['CLOSE', 'CLOSED', 'CLOSED_LOST'] };
        groupField = { $ifNull: ['$assignedAgent', '$assignedCounsellor'] };
        break;
      case 'admissions':
        matchQuery.status = { $in: ['ADMISSION', 'CLOSED_WON'] };
        groupField = { $ifNull: ['$assignedCounsellor', '$assignedAgent'] };
        break;
      case 'pending_admissions':
        matchQuery.admissionStatus = 'Pending';
        groupField = { $ifNull: ['$assignedCounsellor', '$assignedAgent'] };
        break;
      case 'collections':
        matchQuery.$expr = { $gt: [{ $convert: { input: "$collectionAmount", to: "double", onError: 0, onNull: 0 } }, 0] };
        groupField = { $ifNull: ['$assignedCounsellor', '$assignedAgent'] };
        break;
      case 'pending_collections':
        matchQuery.$expr = { $gt: [{ $convert: { input: "$pendingCollectionAmount", to: "double", onError: 0, onNull: 0 } }, 0] };
        groupField = { $ifNull: ['$assignedCounsellor', '$assignedAgent'] };
        break;
      default:
        return res.status(400).json({ error: 'Invalid category' });
    }

    const stats = await Contact.aggregate([
      { $match: matchQuery },
      { $group: { _id: groupField, count: { $sum: 1 } } }
    ]);

    // Fetch user details for the IDs found
    const userIds = stats.map(s => s._id).filter(Boolean);
    const users = await User.find({ _id: { $in: userIds } }).select('name email role');

    // Merge duplicates that might arise from String vs ObjectId or null/empty string
    const mergedResult = {};
    
    stats.forEach(s => {
      let uidStr = s._id ? s._id.toString().trim() : null;
      if (!uidStr || uidStr === '') uidStr = 'unassigned';
      
      if (!mergedResult[uidStr]) {
         const user = users.find(u => u._id.toString() === uidStr);
         mergedResult[uidStr] = {
           userId: uidStr === 'unassigned' ? null : uidStr,
           name: user ? user.name : 'Unassigned',
           email: user ? user.email : 'N/A',
           role: user ? user.role : 'N/A',
           count: 0
         };
      }
      mergedResult[uidStr].count += s.count;
    });

    const result = Object.values(mergedResult).sort((a, b) => b.count - a.count);

    res.json(result);
  } catch (error) {
    console.error(`[GET /stats/user-breakdown] FAILED:`, error.message);
    res.status(500).json({ message: error.message });
  }
};

const getPendingTasksTeam = async (req, res) => {
  try {
    const Contact = req.tenantDb.model('Contact', ContactSchema);
    
    // Find contacts with at least one pending task
    const contactsWithTasks = await Contact.find({ 
       'tasks.status': { $in: ['PENDING', 'IN_PROGRESS'] },
       isArchived: { $ne: true } 
    }).lean();

    let telecallerTasks = [];
    let counsellorTasks = [];
    
    // Collect user IDs to fetch their names
    const userIds = new Set();
    contactsWithTasks.forEach(c => {
       if (c.assignedAgent) userIds.add(c.assignedAgent.toString());
       if (c.assignedCounsellor) userIds.add(c.assignedCounsellor.toString());
    });
    
    const users = await User.find({ _id: { $in: Array.from(userIds) } }).select('name role');
    const userMap = users.reduce((acc, u) => {
       acc[u._id.toString()] = { name: u.name, role: u.role };
       return acc;
    }, {});

    contactsWithTasks.forEach(contact => {
       const pendingTasks = (contact.tasks || []).filter(t => t.status === 'PENDING' || t.status === 'IN_PROGRESS');
       
       pendingTasks.forEach(task => {
          const agentId = contact.assignedAgent?.toString();
          const counsellorId = contact.assignedCounsellor?.toString();
          
          const taskObj = {
             taskId: task._id,
             title: task.title,
             dueDate: task.dueDate,
             type: task.type,
             status: task.status,
             contactName: contact.name,
             contactPhone: contact.phone,
             contactId: contact._id
          };
          
          // Categorize task ownership
          if (task.type === 'MEETING' && counsellorId) {
             counsellorTasks.push({
                ...taskObj,
                assignedTo: userMap[counsellorId]?.name || 'Unknown Counsellor',
                assignedToId: counsellorId
             });
          } else if (agentId) {
             telecallerTasks.push({
                ...taskObj,
                assignedTo: userMap[agentId]?.name || 'Unknown Agent',
                assignedToId: agentId
             });
          } else if (counsellorId) {
             counsellorTasks.push({
                ...taskObj,
                assignedTo: userMap[counsellorId]?.name || 'Unknown Counsellor',
                assignedToId: counsellorId
             });
          } else {
             telecallerTasks.push({
                ...taskObj,
                assignedTo: 'Unassigned',
                assignedToId: null
             });
          }
       });
    });

    res.json({
       telecallerTasks,
       counsellorTasks
    });

  } catch (error) {
    console.error(`[GET /stats/pending-tasks] FAILED:`, error.message);
    res.status(500).json({ message: error.message });
  }
};

const getLeadDetailsStats = async (req, res) => {
  try {
    const { category, userId } = req.query;
    const Contact = req.tenantDb.model('Contact', ContactSchema);

    // Visibility Filtering
    const settings = await Settings.findOne({ tenantId: req.tenantId });
    const userRole = (req.user?.role || 'AGENT').toUpperCase();
    const normalizedRole = userRole.replace(/\s/g, '_');
    const isHighLevel = ['ADMIN', 'SUPER_ADMIN', 'BUSINESS_HEAD', 'BUSINESS HEAD', 'OWNER'].includes(userRole);
    
    const roleAccess = settings?.roleAccess instanceof Map ? 
                       (settings.roleAccess.get(normalizedRole) || settings.roleAccess.get(userRole)) : 
                       (settings?.roleAccess?.[normalizedRole] || settings?.roleAccess?.[userRole]);

    const mustRestrict = !isHighLevel && (!roleAccess || roleAccess.allAccess !== true);
    
    let matchQuery = { isArchived: { $ne: true } };

    if (userId) {
       const uid = new mongoose.Types.ObjectId(userId);
       matchQuery.$or = [
          { assignedAgent: uid },
          { assignedCounsellor: uid }
       ];
    } else if (mustRestrict) {
       const uid = new mongoose.Types.ObjectId(req.user._id);
       matchQuery.$or = [
          { assignedAgent: uid },
          { assignedCounsellor: uid }
       ];
    }

    switch (category) {
      case 'new_leads':
        matchQuery.status = { $in: ['NEW LEAD', 'NEW'] };
        break;
      case 'open_leads':
        matchQuery.status = { $in: ['OPEN', 'CONTACTED', 'INTERESTED', 'FOLLOW_UP'] };
        break;
      case 'closed_leads':
        matchQuery.status = { $in: ['CLOSE', 'CLOSED', 'CLOSED_LOST'] };
        break;
      case 'visited':
        matchQuery.status = 'VISITED';
        break;
      case 'pending_visit':
        matchQuery.status = 'PENDING_VISIT';
        break;
      case 'admissions':
        matchQuery.status = { $in: ['ADMISSION', 'CLOSED_WON'] };
        break;
      case 'collections':
        matchQuery.$expr = { $gt: [{ $convert: { input: "$collectionAmount", to: "double", onError: 0, onNull: 0 } }, 0] };
        break;
      case 'pending_collections':
        matchQuery.$expr = { $gt: [{ $convert: { input: "$pendingCollectionAmount", to: "double", onError: 0, onNull: 0 } }, 0] };
        break;
      default:
        return res.status(400).json({ error: 'Invalid category' });
    }

    const contacts = await Contact.find(matchQuery)
      .select('name phone email status leadSourceType score heatLevel createdAt lastActivity notes tasks botQuestionsAnswered flowVariables qualification selectedStream selectedProgram preferredCallTime budget purchaseTimeline decisionMakerStatus profession companyName city state')
      .sort({ updatedAt: -1 })
      .limit(1000);

    res.json(contacts);
  } catch (error) {
    console.error(`[GET /stats/lead-details] FAILED:`, error.message);
    res.status(500).json({ message: error.message });
  }
};

const getPersonalActivity = async (req, res) => {
  try {
    const Contact = req.tenantDb.model('Contact', ContactSchema);
    const userId = new mongoose.Types.ObjectId(req.user._id);

    const activities = await Contact.aggregate([
      { 
        $match: { 
          $or: [{ assignedAgent: userId }, { assignedCounsellor: userId }],
          isArchived: { $ne: true }
        } 
      },
      { $unwind: "$timeline" },
      { $sort: { "timeline.timestamp": -1 } },
      { $limit: 10 },
      {
        $project: {
          _id: 0,
          type: "$timeline.eventType",
          action: "$timeline.description",
          time: "$timeline.timestamp",
          contactName: "$name"
        }
      }
    ]);

    res.json(activities);
  } catch (error) {
    console.error(`[GET /personal-activity] FAILED:`, error.message);
    res.status(500).json({ message: error.message });
  }
};

const getLeadReport = async (req, res) => {
  try {
    const { presetDate, startDate, endDate, month, year, status, source, agents, search, sortBy } = req.query;
    const Contact = req.tenantDb.model('Contact', ContactSchema);

    // 1. User Security & Visibility Settings
    const settings = await Settings.findOne({ tenantId: req.tenantId });
    const userRole = (req.user?.role || 'AGENT').toUpperCase();
    const normalizedRole = userRole.replace(/\s/g, '_');
    const roleAccess = settings?.roleAccess instanceof Map ? 
                       (settings.roleAccess.get(normalizedRole) || settings.roleAccess.get(userRole)) : 
                       (settings?.roleAccess?.[normalizedRole] || settings?.roleAccess?.[userRole]);

    const isHighLevel = ['ADMIN', 'SUPER_ADMIN', 'BUSINESS_HEAD', 'BUSINESS HEAD', 'OWNER'].includes(userRole);
    const mustRestrict = !isHighLevel && (!roleAccess || roleAccess.allAccess !== true);

    // 2. Date Filtering Helper
    let dateFilter = {};
    const now = new Date();

    if (presetDate && presetDate !== 'all') {
      switch (presetDate) {
        case 'today': {
          const start = new Date();
          start.setHours(0, 0, 0, 0);
          const end = new Date();
          end.setHours(23, 59, 59, 999);
          dateFilter = { createdAt: { $gte: start, $lte: end } };
          break;
        }
        case 'yesterday': {
          const start = new Date();
          start.setDate(start.getDate() - 1);
          start.setHours(0, 0, 0, 0);
          const end = new Date();
          end.setDate(end.getDate() - 1);
          end.setHours(23, 59, 59, 999);
          dateFilter = { createdAt: { $gte: start, $lte: end } };
          break;
        }
        case 'this_week': {
          const start = new Date();
          const day = start.getDay();
          start.setDate(start.getDate() - day);
          start.setHours(0, 0, 0, 0);
          dateFilter = { createdAt: { $gte: start } };
          break;
        }
        case 'this_month': {
          const start = new Date(now.getFullYear(), now.getMonth(), 1);
          dateFilter = { createdAt: { $gte: start } };
          break;
        }
        case 'current_year': {
          const start = new Date(now.getFullYear(), 0, 1);
          dateFilter = { createdAt: { $gte: start } };
          break;
        }
        case 'previous_year': {
          const start = new Date(now.getFullYear() - 1, 0, 1);
          const end = new Date(now.getFullYear() - 1, 11, 31, 23, 59, 59, 999);
          dateFilter = { createdAt: { $gte: start, $lte: end } };
          break;
        }
        case 'custom': {
          if (startDate || endDate) {
            const range = {};
            if (startDate) range.$gte = new Date(startDate);
            if (endDate) {
              const end = new Date(endDate);
              end.setHours(23, 59, 59, 999);
              range.$lte = end;
            }
            dateFilter = { createdAt: range };
          }
          break;
        }
      }
    }

    // Explicit Month/Year overrides
    if (year && year !== 'all') {
      const yr = parseInt(year);
      let start, end;
      if (month && month !== 'all') {
        const m = parseInt(month) - 1; // 0-indexed
        start = new Date(yr, m, 1);
        end = new Date(yr, m + 1, 0, 23, 59, 59, 999);
      } else {
        start = new Date(yr, 0, 1);
        end = new Date(yr, 11, 31, 23, 59, 59, 999);
      }
      dateFilter = { createdAt: { $gte: start, $lte: end } };
    } else if (month && month !== 'all') {
      const m = parseInt(month) - 1;
      const yr = now.getFullYear();
      const start = new Date(yr, m, 1);
      const end = new Date(yr, m + 1, 0, 23, 59, 59, 999);
      dateFilter = { createdAt: { $gte: start, $lte: end } };
    }

    // 3. Assemble Query Match Stage
    const matchQuery = { isArchived: { $ne: true }, ...dateFilter };

    if (mustRestrict) {
      const uid = new mongoose.Types.ObjectId(req.user._id);
      const uidStr = req.user._id.toString();
      matchQuery.$or = [
        { assignedAgent: uid },
        { assignedCounsellor: uid },
        { assignedAgent: uidStr },
        { assignedCounsellor: uidStr }
      ];
    }

    // Agent filter (Admin/Manager allowed to scope, or agent within their boundary)
    if (agents && agents !== 'all') {
      const agentIds = [];
      const agentIdStrs = [];
      agents.split(',').forEach(id => {
        const trimmed = id.trim();
        if (trimmed) {
          agentIdStrs.push(trimmed);
          try {
            agentIds.push(new mongoose.Types.ObjectId(trimmed));
          } catch(e) {}
        }
      });

      if (agentIdStrs.length > 0) {
        const agentOrConditions = [
          { assignedAgent: { $in: agentIds } },
          { assignedCounsellor: { $in: agentIds } },
          { assignedAgent: { $in: agentIdStrs } },
          { assignedCounsellor: { $in: agentIdStrs } }
        ];

        if (mustRestrict) {
          const myUid = new mongoose.Types.ObjectId(req.user._id);
          const myUidStr = req.user._id.toString();
          matchQuery.$and = [
            { 
              $or: [
                { assignedAgent: myUid }, 
                { assignedCounsellor: myUid },
                { assignedAgent: myUidStr },
                { assignedCounsellor: myUidStr }
              ] 
            },
            { $or: agentOrConditions }
          ];
        } else {
          matchQuery.$or = agentOrConditions;
        }
      }
    }

    // Status Filter
    if (status && status !== 'all') {
      const statusList = status.split(',').map(s => {
        let st = s.trim();
        if (st === 'CLOSE') st = 'CLOSED';
        if (st === 'PENDING VISIT') st = 'PENDING_VISIT';
        return st;
      });
      matchQuery.status = { $in: statusList };
    }

    // Source Filter
    if (source && source !== 'all') {
      const sourceList = source.split(',').map(s => s.trim());
      matchQuery.leadSourceType = { $in: sourceList };
    }

    // Search Querying
    if (search) {
      const searchRegex = new RegExp(search, 'i');
      const orConditions = [
        { name: searchRegex },
        { phone: searchRegex },
        { email: searchRegex },
        { companyName: searchRegex }
      ];
      if (mongoose.Types.ObjectId.isValid(search)) {
        orConditions.push({ _id: new mongoose.Types.ObjectId(search) });
      }

      if (matchQuery.$and) {
        matchQuery.$and.push({ $or: orConditions });
      } else if (matchQuery.$or) {
        const existingOr = matchQuery.$or;
        delete matchQuery.$or;
        matchQuery.$and = [
          { $or: existingOr },
          { $or: orConditions }
        ];
      } else {
        matchQuery.$or = orConditions;
      }
    }

    // 4. Fetch and sort leads
    let sortConfig = { createdAt: -1 };
    if (sortBy === 'oldest') sortConfig = { createdAt: 1 };
    else if (sortBy === 'status') sortConfig = { status: 1 };
    else if (sortBy === 'score_desc') sortConfig = { score: -1 };
    else if (sortBy === 'activity_desc') sortConfig = { lastActivity: -1 };

    console.log(`[LeadReport Debug] User ID: ${req.user?._id}, Role: ${req.user?.role}, mustRestrict: ${mustRestrict}`);
    console.log(`[LeadReport Debug] matchQuery:`, JSON.stringify(matchQuery, null, 2));

    let leads = await Contact.find(matchQuery).sort(sortConfig).lean();
    console.log(`[LeadReport Debug] Leads fetched: ${leads.length}`);

    // In-memory sorting for priority
    if (sortBy === 'priority') {
      const priorityWeight = { 'Hot': 3, 'Warm': 2, 'Cold': 1 };
      leads.sort((a, b) => {
        const wA = priorityWeight[a.heatLevel] || 0;
        const wB = priorityWeight[b.heatLevel] || 0;
        return wB - wA; // Hot first
      });
    }

    // Enrich with names of assigned agents and counsellors
    const userIds = new Set();
    leads.forEach(c => {
      if (c.assignedAgent) userIds.add(c.assignedAgent.toString());
      if (c.assignedCounsellor) userIds.add(c.assignedCounsellor.toString());
    });

    let userMap = {};
    if (userIds.size > 0) {
      const users = await User.find({ _id: { $in: Array.from(userIds) } }).select('name role email');
      userMap = users.reduce((acc, u) => {
        acc[u._id.toString()] = { name: u.name, role: u.role, email: u.email };
        return acc;
      }, {});
    }

    leads = leads.map(c => ({
      ...c,
      assignedAgentName: c.assignedAgent ? (userMap[c.assignedAgent.toString()]?.name || 'Unknown Agent') : 'Unassigned',
      assignedCounsellorName: c.assignedCounsellor ? (userMap[c.assignedCounsellor.toString()]?.name || 'Unknown Counsellor') : 'Unassigned'
    }));

    // 5. Generate Overview Cover Stats & KPI Metrics
    let totalLeads = leads.length;
    let convertedLeads = 0;
    let pendingLeads = 0;
    let lostLeads = 0;
    let newLeads = 0;
    let followupsPending = 0;
    let completedFollowups = 0;
    let totalFollowups = 0;

    leads.forEach(lead => {
      const st = lead.status;
      if (st === 'CLOSED_WON' || st === 'ADMISSION') {
        convertedLeads++;
      } else if (st === 'CLOSED_LOST' || st === 'CLOSED' || st === 'CLOSE') {
        lostLeads++;
      } else {
        pendingLeads++;
      }

      if (st === 'NEW' || st === 'NEW LEAD') {
        newLeads++;
      }

      if (lead.tasks && lead.tasks.length > 0) {
        lead.tasks.forEach(task => {
          if (task.type === 'FOLLOW_UP') {
            totalFollowups++;
            if (task.status === 'PENDING' || task.status === 'IN_PROGRESS') {
              followupsPending++;
            } else if (task.status === 'COMPLETED') {
              completedFollowups++;
            }
          }
        });
      }
    });

    const conversionRatio = totalLeads > 0 ? parseFloat(((convertedLeads / totalLeads) * 100).toFixed(1)) : 0;
    const followupCompletionRate = totalFollowups > 0 ? Math.round((completedFollowups / totalFollowups) * 100) : 0;

    // 6. Leads by Source Distribution (Chart data)
    const sourceMap = {};
    leads.forEach(lead => {
      const src = lead.leadSourceType || 'Manual Entry';
      sourceMap[src] = (sourceMap[src] || 0) + 1;
    });
    const leadsBySource = Object.keys(sourceMap).map(key => ({
      label: key,
      value: sourceMap[key]
    })).sort((a,b) => b.value - a.value);

    // 7. Monthly Lead Trend (Chart data)
    const trendMap = {};
    leads.forEach(lead => {
      const date = new Date(lead.createdAt);
      const key = date.toLocaleString('default', { month: 'short', year: '2-digit' });
      trendMap[key] = (trendMap[key] || 0) + 1;
    });
    const monthlyLeadTrend = Object.keys(trendMap).map(key => ({
      label: key,
      value: trendMap[key]
    }));

    // 8. Team Performance Breakdown (Chart and Cover data)
    const teamMembers = await User.find({
      tenantId: req.tenantId,
      status: 'ACTIVE'
    }).select('name role email');

    const teamPerformance = await Promise.all(teamMembers.map(async (member) => {
      const mId = member._id.toString();
      
      const memberLeads = leads.filter(l => 
        (l.assignedAgent && l.assignedAgent.toString() === mId) || 
        (l.assignedCounsellor && l.assignedCounsellor.toString() === mId)
      );
      const mTotal = memberLeads.length;
      
      let mConverted = 0;
      let mPendingFollowups = 0;
      let mCompletedFollowups = 0;
      let mTotalFollowups = 0;

      memberLeads.forEach(lead => {
        const st = lead.status;
        if (st === 'CLOSED_WON' || st === 'ADMISSION') mConverted++;
        
        if (lead.tasks && lead.tasks.length > 0) {
          lead.tasks.forEach(task => {
            if (task.type === 'FOLLOW_UP') {
              mTotalFollowups++;
              if (task.status === 'PENDING' || task.status === 'IN_PROGRESS') {
                mPendingFollowups++;
              } else if (task.status === 'COMPLETED') {
                mCompletedFollowups++;
              }
            }
          });
        }
      });

      return {
        userId: member._id,
        name: member.name,
        role: member.role,
        email: member.email,
        totalLeads: mTotal,
        convertedLeads: mConverted,
        conversionRate: mTotal > 0 ? parseFloat(((mConverted / mTotal) * 100).toFixed(1)) : 0,
        pendingFollowups: mPendingFollowups,
        followupCompletionRate: mTotalFollowups > 0 ? Math.round((mCompletedFollowups / mTotalFollowups) * 100) : 0
      };
    }));

    const activeTeamPerformance = teamPerformance.filter(t => t.totalLeads > 0).sort((a,b) => b.totalLeads - a.totalLeads);

    res.json({
      summary: {
        totalLeads,
        convertedLeads,
        pendingLeads,
        lostLeads,
        newLeads,
        followupsPending,
        conversionRatio,
        followupCompletionRate,
        generatedAt: new Date(),
        generatedBy: req.user?.name || 'Verified System User'
      },
      analytics: {
        leadsBySource,
        monthlyLeadTrend,
        teamPerformance: activeTeamPerformance
      },
      leads
    });

  } catch (error) {
    console.error(`[getLeadReport Error]:`, error);
    res.status(500).json({ message: error.message });
  }
};

const fixCampaignStatus = async (req, res) => {
  try {
    const Contact = req.tenantDb.model('Contact', ContactSchema);
    const Message = req.tenantDb.model('Message', MessageSchema);
    
    const contacts = await Contact.find({ status: { $in: ['NEW LEAD', 'NEW'] } });
    let count = 0;
    
    for (const c of contacts) {
      const hasTemplate = await Message.exists({ 
          contactId: c._id, 
          $or: [{ type: 'template' }, { content: { $regex: /\[Template:/ } }] 
      });
      const isCsvImport = c.tags && c.tags.includes('csv_import');
      
      if (hasTemplate || isCsvImport) {
          c.status = 'CAMPAIGN';
          await c.save();
          count++;
      }
    }
    
    res.json({ success: true, message: `Fixed ${count} contacts to CAMPAIGN status` });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const fixCampaignStatusTemp = async (req, res) => {
  try {
    const { getTenantConnection } = require('../config/db');
    const tenantId = req.params.tenantId;
    if (!tenantId) return res.status(400).json({ error: "No tenant ID provided" });
    
    const tenantDb = getTenantConnection(tenantId);
    const Contact = tenantDb.model('Contact', ContactSchema);
    const Message = tenantDb.model('Message', MessageSchema);
    
    const contacts = await Contact.find({ status: { $in: ['NEW LEAD', 'NEW'] } });
    let count = 0;
    
    for (const c of contacts) {
        const hasTemplate = await Message.exists({ 
            contactId: c._id, 
            $or: [{ type: 'template' }, { content: { $regex: /\[Template:/ } }] 
        });
        const isCsvImport = c.tags && c.tags.includes('csv_import');
        
        if (hasTemplate || isCsvImport) {
            c.status = 'CAMPAIGN';
            await c.save();
            count++;
        }
    }
    
    res.json({ success: true, message: `Fixed ${count} contacts to CAMPAIGN status` });
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
  summarizeLead,
  getLeadAnalysis,
  getLeadDetailsStats,
  getUserBreakdownStats,
  getPendingTasksTeam,
  getPersonalActivity,
  getLeadReport,
  fixCampaignStatus,
  fixCampaignStatusTemp
};
