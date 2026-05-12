const axios = require('axios');
const Settings = require('../models/core/Settings');

/**
 * Triggers an external webhook with lead data
 */
const triggerWebhook = async (tenantId, event, data) => {
  try {
    const settings = await Settings.findOne({ tenantId });
    const webhookUrl = settings?.automation?.externalWebhookUrl;

    if (!webhookUrl) {
      console.log(`[Integration] No webhook configured for tenant: ${tenantId}`);
      return;
    }

    console.log(`[Integration] Triggering ${event} webhook for ${tenantId}...`);
    
    await axios.post(webhookUrl, {
      event,
      timestamp: new Date().toISOString(),
      tenantId,
      payload: data
    }, { timeout: 5000 });

  } catch (error) {
    console.error(`[Integration Error] Failed to trigger webhook: ${error.message}`);
  }
};

module.exports = { triggerWebhook };
