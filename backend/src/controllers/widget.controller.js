const Widget = require('../models/core/Widget');
const LeadSchema = require('../models/crm/Lead');
const { getTenantConnection } = require('../config/db');

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

    const newLead = await Lead.create({
      name,
      phone,
      email,
      message,
      source: 'web_widget',
      tags: ['Website Lead']
    });

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

module.exports = { getWidgetConfig, updateWidgetConfig, getPublicWidget, submitWidgetLead };
