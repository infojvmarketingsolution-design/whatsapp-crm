const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');
const path = require('path');

class WhatsAppService {
  constructor(config) {
    this.phoneNumberId = config.phoneNumberId;
    this.accessToken = config.accessToken;
    this.baseUrl = `https://graph.facebook.com/v19.0/${this.phoneNumberId}/messages`;
    this.mediaUrl = `https://graph.facebook.com/v19.0/${this.phoneNumberId}/media`;
  }

  get headers() {
    return {
      'Authorization': `Bearer ${this.accessToken}`,
      'Content-Type': 'application/json'
    };
  }

  async sendTextMessage(to, text) {
    return this.sendText(to, text);
  }

  async sendText(to, text) {
    const sanitizedTo = String(to).replace(/\D/g, '');
    const payload = {
      messaging_product: 'whatsapp',
      to: sanitizedTo,
      type: 'text',
      text: { body: text }
    };
    
    try {
      const response = await axios.post(this.baseUrl, payload, { headers: this.headers });
      return response.data;
    } catch (error) {
      console.error('WhatsApp API Error (Text):', error.response?.data || error.message);
      throw new Error(error.response?.data?.error?.message || 'Failed to send WhatsApp message');
    }
  }

  async sendTemplate(to, templateName, languageCode = 'en_US', components = []) {
    const sanitizedTo = String(to).replace(/\D/g, '');
    const payload = {
      messaging_product: 'whatsapp',
      to: sanitizedTo,
      type: 'template',
      template: {
        name: templateName,
        language: { code: languageCode },
        components: components
      }
    };
    
    try {
      const response = await axios.post(this.baseUrl, payload, { headers: this.headers });
      return response.data;
    } catch (error) {
      console.error('WhatsApp API Template Error:', error.response?.data || error.message);
      throw new Error(error.response?.data?.error?.message || 'Failed to send WhatsApp template');
    }
  }

  async uploadMedia(filePath, mimeType) {
    const data = new FormData();
    data.append('messaging_product', 'whatsapp');
    data.append('file', fs.createReadStream(filePath), { contentType: mimeType });

    try {
      const response = await axios.post(this.mediaUrl, data, {
        headers: {
          'Authorization': `Bearer ${this.accessToken}`,
          ...data.getHeaders()
        }
      });
      return response.data;
    } catch (error) {
      console.error('WhatsApp API Media Upload Error:', error.response?.data || error.message);
      throw new Error(error.response?.data?.error?.message || 'Media upload failed');
    }
  }

  async downloadMedia(mediaId, tenantId) {
    try {
      // 1. Get temporary URL from Meta
      const infoRes = await axios.get(`https://graph.facebook.com/v19.0/${mediaId}`, {
        headers: { 'Authorization': `Bearer ${this.accessToken}` }
      });
      const downloadUrl = infoRes.data.url;
      const mimeType = infoRes.data.mime_type;
      const extension = mimeType.split('/')[1]?.split(';')[0] || 'bin';

      // 2. Download the actual file buffer
      const fileRes = await axios.get(downloadUrl, {
        headers: { 'Authorization': `Bearer ${this.accessToken}` },
        responseType: 'arraybuffer'
      });

      // 3. Save to local storage
      const uploadDir = path.join(__dirname, '../../public/uploads/media', tenantId);
      if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

      const fileName = `${mediaId}.${extension}`;
      const filePath = path.join(uploadDir, fileName);
      fs.writeFileSync(filePath, Buffer.from(fileRes.data));

      return `/uploads/media/${tenantId}/${fileName}`;
    } catch (error) {
      console.error('❌ WhatsApp Media Download Error:', error.response?.data || error.message);
      return null;
    }
  }

  async sendMedia(to, type, mediaId, caption = '', mediaUrl = null) {
    const sanitizedTo = String(to).replace(/\D/g, '');
    const payload = {
      messaging_product: 'whatsapp',
      to: sanitizedTo,
      type: type, // 'image', 'video', 'document'
    };
    
    if (mediaId) {
      payload[type] = { id: mediaId };
    } else if (mediaUrl) {
      payload[type] = { link: mediaUrl };
    }

    if (caption && (type === 'image' || type === 'video' || type === 'document')) {
      payload[type].caption = caption;
    }

    try {
      const response = await axios.post(this.baseUrl, payload, { headers: this.headers });
      return response.data;
    } catch (error) {
      console.error('WhatsApp API Media Send Error:', error.response?.data || error.message);
      throw new Error(error.response?.data?.error?.message || 'Failed to send WhatsApp media');
    }
  }

  async sendInteractiveButtonMessage(to, { header, body, footer, buttons }) {
    const sanitizedTo = String(to).replace(/\D/g, '');
    const payload = {
      messaging_product: 'whatsapp',
      to: sanitizedTo,
      type: 'interactive',
      interactive: {
        type: 'button',
        body: { text: body }
      }
    };

    if (header) {
      if (header.type === 'image') {
          payload.interactive.header = { type: 'image', image: header.image ? { id: header.image } : { link: header.link } };
      }
      else if (header.type === 'video') {
           payload.interactive.header = { type: 'video', video: header.video ? { id: header.video } : { link: header.link } };
      }
      else if (header.type === 'document') {
           payload.interactive.header = { type: 'document', document: header.document ? { id: header.document } : { link: header.link } };
      }
      else if (header.type === 'text') payload.interactive.header = { type: 'text', text: header.text };
    }

    if (footer) payload.interactive.footer = { text: footer };

    payload.interactive.action = {
      buttons: buttons.map((btn, idx) => ({
        type: 'reply',
        reply: { id: `btn_${idx}`, title: btn.substring(0, 20) } 
      }))
    };

    try {
      const response = await axios.post(this.baseUrl, payload, { headers: this.headers });
      return response.data;
    } catch (error) {
      console.error('WhatsApp API Interactive Error:', error.response?.data || error.message);
      throw new Error(error.response?.data?.error?.message || 'Failed to send Interactive message');
    }
  }

  async sendListMessage(to, { header, body, footer, buttonText, sections }) {
    const sanitizedTo = String(to).replace(/\D/g, '');
    const payload = {
      messaging_product: 'whatsapp',
      to: sanitizedTo,
      type: 'interactive',
      interactive: {
        type: 'list',
        body: { text: body },
        action: {
          button: buttonText.substring(0, 20),
          sections: sections // [{ title: 'Section', rows: [{ id: 'row1', title: 'Option 1', description: 'desc' }] }]
        }
      }
    };

    if (header) payload.interactive.header = { type: 'text', text: header };
    if (footer) payload.interactive.footer = { text: footer };

    try {
      const response = await axios.post(this.baseUrl, payload, { headers: this.headers });
      return response.data;
    } catch (error) {
      console.error('WhatsApp API List Error:', error.response?.data || error.message);
      throw new Error(error.response?.data?.error?.message || 'Failed to send List message');
    }
  }

  async sendCtaMessage(to, { type, body, title, value }) {
    const sanitizedTo = String(to).replace(/\D/g, '');
    const payload = {
      messaging_product: 'whatsapp',
      to: sanitizedTo,
      type: 'interactive',
      interactive: {
        type: type === 'url' ? 'cta_url' : 'cta_call',
        body: { text: body },
        action: {
           name: type === 'url' ? 'cta_url' : 'cta_call',
           parameters: {
             display_text: title.substring(0, 20),
             ...(type === 'url' ? { url: value } : { phone_number: String(value).replace(/\D/g, '') })
           }
        }
      }
    };

    try {
      const response = await axios.post(this.baseUrl, payload, { headers: this.headers });
      return response.data;
    } catch (error) {
      console.error('WhatsApp API CTA Error:', error.response?.data || error.message);
      throw new Error(error.response?.data?.error?.message || 'Failed to send CTA message');
    }
  }
}

module.exports = WhatsAppService;
