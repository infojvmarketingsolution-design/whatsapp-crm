const Widget = require('../models/core/Widget');
const LeadSchema = require('../models/crm/Lead');
const Settings = require('../models/core/Settings');
const { getTenantConnection } = require('../config/db');
const ContactSchema = require('../models/tenant/Contact');
const MessageSchema = require('../models/tenant/Message');
const prdFlowService = require('../services/prdFlow.service');
const assignmentService = require('../services/assignment.service');
const notificationService = require('../services/notification.service');

const getWidgetConfig = async (req, res) => {
  try {
    const tenantId = req.tenantId;
    let widget = await Widget.findOne({ tenantId });
    if (!widget) {
      widget = await Widget.create({ tenantId });
    }
    res.json(widget);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const updateWidgetConfig = async (req, res) => {
  try {
    const tenantId = req.tenantId;
    const { status, theme_color, welcome_text, button_text, position, whatsapp_number_id } = req.body;
    let widget = await Widget.findOne({ tenantId });
    if (!widget) {
      widget = new Widget({ tenantId });
    }
    if (status) widget.status = status;
    if (theme_color) widget.theme_color = theme_color;
    if (welcome_text) widget.welcome_text = welcome_text;
    if (button_text) widget.button_text = button_text;
    if (position) widget.position = position;
    if (whatsapp_number_id) widget.whatsapp_number_id = whatsapp_number_id;
    
    await widget.save();
    res.json(widget);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getPublicWidget = async (req, res) => {
  try {
    const { clientId } = req.params;
    const widget = await Widget.findOne({ tenantId: clientId, status: 'ACTIVE' });
    if (!widget) {
      return res.status(404).json({ message: 'Widget not found or inactive' });
    }
    res.json(widget);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const submitWidgetLead = async (req, res) => {
  try {
    const { clientId } = req.params;
    const { name, phone, email, message } = req.body;
    
    const widget = await Widget.findOne({ tenantId: clientId, status: 'ACTIVE' });
    if (!widget) {
      return res.status(404).json({ message: 'Widget not found or inactive' });
    }

    const tenantDb = getTenantConnection(clientId);
    const Lead = tenantDb.model('Lead', LeadSchema);

    // Fetch CRM Settings
    let tenantSettings = await Settings.findOne({ tenantId: clientId });
    if (!tenantSettings) {
       tenantSettings = { crm: { duplicateDetection: true, autoAssignment: false } };
    }

    let existingLead = null;
    if (tenantSettings.crm?.duplicateDetection) {
        // Check for existing lead by phone or email
        existingLead = await Lead.findOne({
            $or: [
                { phone: phone },
                { email: email && email !== "" ? email : "NONE_PROVIDED" }
            ]
        });
    }

    let lead;
    if (existingLead) {
        // Update existing lead
        existingLead.name = name || existingLead.name;
        existingLead.message = message || existingLead.message;
        if (email) existingLead.email = email;
        await existingLead.save();
        lead = existingLead;
        console.log(`[Widget] Updated existing lead: ${phone} / ${email}`);
    } else {
        // Create new lead
        
        // AUTO ASSIGNMENT LOGIC
        let assignedAgentId = null;
        if (tenantSettings.crm?.autoAssignment) {
           assignedAgentId = await assignmentService.getNextAgentForTenant(clientId);
        }

        lead = await Lead.create({
          name,
          phone,
          email,
          message,
          source: 'web_widget',
          tags: ['Website Lead'],
          assignedAgent: assignedAgentId
        });
        
        if (assignedAgentId) {
           console.log(`[Widget] Auto-assigned new lead ${phone} to agent ${assignedAgentId}`);
        }

        // 🔔 NOTIFICATION ALERT
        notificationService.sendAdminAlert(clientId, {
           subject: 'New Website Widget Lead',
           text: `A new inquiry from *${name}* (${phone}) has been received via the Web Widget. Source: *${lead.source}*. Assigned: ${assignedAgentId || 'Unassigned'}`
        });
    }

    let whatsappRedirect = null;
    if (widget.whatsapp_number_id) {
        const encodedParams = new URLSearchParams();
        if (message) encodedParams.append('text', message);
        whatsappRedirect = `https://wa.me/${widget.whatsapp_number_id.replace(/[^0-9]/g, '')}?${encodedParams.toString()}`;
    }

    res.status(201).json({ lead: newLead, redirectUrl: whatsappRedirect });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const handleSocketMessage = async (io, socket, { tenantId, text }) => {
  try {
    const tenantDb = getTenantConnection(tenantId);
    const Contact = tenantDb.model('Contact', ContactSchema);
    const Message = tenantDb.model('Message', MessageSchema);

    // 1. Find or Create a "Guest" Contact for this socket session
    let contact = await Contact.findOne({ phone: `web_${socket.id}` });
    if (!contact) {
      contact = await Contact.create({
        tenantId,
        name: 'Website Visitor',
        phone: `web_${socket.id}`,
        source: 'web_widget',
        status: 'NEW'
      });
    }

    // 2. Save Inbound Message
    await Message.create({
      contactId: contact._id,
      direction: 'INBOUND',
      type: 'text',
      content: text,
      status: 'RECEIVED'
    });

    // 3. Mock WA Service for the Flow Engine
    const mockWaService = {
      sendTextMessage: async (to, msg) => {
        socket.emit('widget_response', { text: msg });
        return { messages: [{ id: `web_out_${Date.now()}` }] };
      },
      sendMedia: async (to, type, id, caption, link) => {
        socket.emit('widget_response', { text: caption, mediaUrl: link || id, type });
        return { messages: [{ id: `web_out_${Date.now()}` }] };
      },
      sendInteractiveButtonMessage: async (to, { body, buttons }) => {
        socket.emit('widget_response', { text: body, buttons });
        return { messages: [{ id: `web_out_${Date.now()}` }] };
      },
      sendListMessage: async (to, { body, sections }) => {
        const options = sections[0].rows.map(r => r.title);
        socket.emit('widget_response', { text: body, buttons: options });
        return { messages: [{ id: `web_out_${Date.now()}` }] };
      },
      sendCtaMessage: async (to, { body, title, value }) => {
        socket.emit('widget_response', { text: body, cta: { title, value } });
        return { messages: [{ id: `web_out_${Date.now()}` }] };
      }
    };

    // 4. Process Flow
    await prdFlowService.processStep(tenantId, contact, text, mockWaService, io);

  } catch (error) {
    console.error('[Widget Socket Error]:', error);
    socket.emit('widget_response', { text: "Sorry, I'm having trouble connecting to the brain." });
  }
};

module.exports = { getWidgetConfig, updateWidgetConfig, getPublicWidget, submitWidgetLead, handleSocketMessage };
