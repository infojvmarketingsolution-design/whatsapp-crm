const { getTenantConnection } = require('../config/db');
const mongoose = require('mongoose');
const Client = require('../models/core/Client');
const TemplateSchema = require('../models/tenant/Template');
const axios = require('axios');

// Sync templates from WhatsApp Cloud API
const syncTemplates = async (req, res) => {
  try {
    const tenantId = req.tenantId;

    const client = await Client.findOne({ tenantId });
    if (!client || !client.whatsappConfig || !client.whatsappConfig.wabaId || !client.whatsappConfig.accessToken) {
      return res.status(400).json({ message: 'WhatsApp API (WABA ID/Token) not configured for this tenant.' });
    }

    const { wabaId, accessToken } = client.whatsappConfig;
    
    // Fetch from Meta API
    const response = await axios.get(`https://graph.facebook.com/v19.0/${wabaId}/message_templates`, {
      headers: { 'Authorization': `Bearer ${accessToken}` }
    });

    const templatesData = response.data.data;

    const tenantDb = getTenantConnection(tenantId);
    const Template = tenantDb.model('Template', TemplateSchema);

    const syncResults = { added: 0, updated: 0 };

    for (const t of templatesData) {
      // Extract variables (e.g. {{1}}) from body text for variable mapping later
      const variables = [];
      const bodyComponent = t.components.find(c => c.type === 'BODY');
      if (bodyComponent && bodyComponent.text) {
        const matches = bodyComponent.text.match(/\{\{(\d+)\}\}/g);
        if (matches) {
           matches.forEach(m => { if (!variables.includes(m)) variables.push(m); });
        }
      }

      const existing = await Template.findOne({ externalId: t.id });
      if (existing) {
        existing.status = t.status.toUpperCase();
        existing.components = t.components;
        existing.category = t.category;
        existing.variables = variables;
        await existing.save();
        syncResults.updated++;
      } else {
        await Template.create({
          name: t.name,
          externalId: t.id,
          category: t.category,
          language: t.language,
          status: t.status.toUpperCase(),
          components: t.components,
          variables: variables
        });
        syncResults.added++;
      }
    }

    res.json({ message: 'Templates synchronized successfully', results: syncResults });
  } catch (error) {
    console.error('Template Sync Error:', error.response?.data || error.message);
    res.status(500).json({ message: 'Failed to sync templates', error: error.message });
  }
};

const getTemplates = async (req, res) => {
  try {
    const tenantId = req.tenantId;
    const tenantDb = getTenantConnection(tenantId);
    const Template = tenantDb.model('Template', TemplateSchema);

    const templates = await Template.find().sort({ createdAt: -1 });
    res.json(templates);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const createTemplate = async (req, res) => {
  try {
    const { name, category, language, components } = req.body;
    
    let wabaId = process.env.META_WABA_ID;
    let accessToken = process.env.META_ACCESS_TOKEN;

    if (mongoose.connection.readyState === 1) {
      const tenantId = req.tenantId;
      const client = await Client.findOne({ tenantId });
      if (client && client.whatsappConfig && client.whatsappConfig.wabaId) {
         wabaId = client.whatsappConfig.wabaId;
         accessToken = client.whatsappConfig.accessToken;
      }
    }

    if (!wabaId || !accessToken) {
       return res.status(400).json({ message: 'WhatsApp API (WABA ID/Token) not configured.' });
    }

    const payload = {
      name,
      language,
      category,
      components
    };

    const response = await axios.post(`https://graph.facebook.com/v19.0/${wabaId}/message_templates`, payload, {
      headers: { 'Authorization': `Bearer ${accessToken}` }
    });

    const variables = [];
    const bodyComp = components?.find(c => c.type === 'BODY');
    if (bodyComp && bodyComp.text) {
       const matches = bodyComp.text.match(/\{\{(\d+)\}\}/g);
       if (matches) {
          matches.forEach(m => { if (!variables.includes(m)) variables.push(m); });
       }
    }

    const tenantId = req.tenantId;
    const tenantDb = getTenantConnection(tenantId);
    const Template = tenantDb.model('Template', TemplateSchema);
    
    const newTemplate = await Template.create({
      name,
      externalId: response.data.id,
      category,
      language,
      status: 'PENDING',
      components: payload.components,
      variables
    });

    res.status(201).json(newTemplate);
  } catch (error) {
    const metaError = error.response?.data?.error;
    console.error('Create Template Full Error:', JSON.stringify(error.response?.data, null, 2) || error.message);
    
    let errorMessage = metaError?.message || error.message;
    
    // More robust check for "unknown error" and adding better diagnostic hints
    if (errorMessage.toLowerCase().includes('unknown error')) {
      errorMessage = 'Meta API reported an unknown error (Code 1). Diagnostics: 1. Ensure the template name is unique. 2. Verify button URLs are valid. 3. Check if the media URL is publicly accessible. 4. Verify WABA config.';
    }
    
    res.status(500).json({ 
      message: 'Failed to create template', 
      error: errorMessage,
      metaDetails: metaError || { message: error.message }
    });
  }
};

const deleteTemplate = async (req, res) => {
  try {
    const { id } = req.params;

    const tenantId = req.tenantId;
    const tenantDb = getTenantConnection(tenantId);
    const Template = tenantDb.model('Template', TemplateSchema);
    
    const template = await Template.findById(id);
    if (!template) return res.status(404).json({ message: 'Template not found' });

    let wabaId = process.env.META_WABA_ID;
    let accessToken = process.env.META_ACCESS_TOKEN;
    const client = await Client.findOne({ tenantId });
    if (client && client.whatsappConfig && client.whatsappConfig.wabaId) {
       wabaId = client.whatsappConfig.wabaId;
       accessToken = client.whatsappConfig.accessToken;
    }

    if (wabaId && accessToken) {
        try {
            await axios.delete(`https://graph.facebook.com/v19.0/${wabaId}/message_templates?name=${template.name}`, {
                headers: { 'Authorization': `Bearer ${accessToken}` }
            });
        } catch (metaErr) {
            console.warn('Meta Delete Warn:', metaErr.response?.data?.error?.message);
        }
    }

    await Template.findByIdAndDelete(id);
    res.json({ message: 'Template deleted successfully' });
  } catch (err) {
    console.error('Delete Template Error:', err.message);
    res.status(500).json({ message: 'Failed to delete template' });
  }
};

const fs = require('fs');
const path = require('path');

const uploadTemplateMedia = async (req, res) => {
  try {
    if (!req.file) {
      console.error('Upload Template Media: No file in request');
      return res.status(400).json({ message: 'No file uploaded or file rejected by server.' });
    }

    console.log('Template Media Uploaded:', req.file.path);

    const tenantId = req.tenantId;
    const finalDir = path.join(process.cwd(), 'backend', 'public', 'uploads', 'templates', tenantId);
    
    if (!fs.existsSync(finalDir)) {
      fs.mkdirSync(finalDir, { recursive: true });
    }

    const targetPath = path.join(finalDir, req.file.filename);
    fs.renameSync(req.file.path, targetPath);

    const publicUrl = `/uploads/templates/${tenantId}/${req.file.filename}`;
    res.json({ url: publicUrl });
  } catch (error) {
    console.error('Upload Template Media Error:', error);
    res.status(500).json({ message: 'Failed to process media upload', error: error.message });
  }
};

module.exports = {
  syncTemplates,
  getTemplates,
  createTemplate,
  deleteTemplate,
  uploadTemplateMedia
};
