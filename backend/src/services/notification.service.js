const nodemailer = require('nodemailer');
const twilio = require('twilio');
const WhatsAppService = require('./whatsapp.service');
const Client = require('../models/core/Client');
const { getTenantConnection } = require('../config/db');
const TemplateSchema = require('../models/tenant/Template');

/**
 * NotificationService handles sending OTPs and other notifications via multiple channels.
 * Integrates: Gmail (SMTP), Twilio (SMS), and Meta API (WhatsApp).
 */
class NotificationService {
  /**
   * Send Email OTP using Gmail / SMTP
   */
  async sendEmail(to, otp) {
    try {
      if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
        console.warn('⚠️ SMTP_USER or SMTP_PASS not configured. Redirecting OTP to Console.');
        console.log(`[CONSOLE LOG - EMAIL OTP] To: ${to}, Code: ${otp}`);
        return true; 
      }

      const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS, // Needs Gmail App Password
        },
      });

      const mailOptions = {
        from: `"WapiPulse Security" <${process.env.SMTP_USER}>`,
        to: to,
        subject: 'Your WapiPulse Security Code',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
            <h2 style="color: #114a43; text-align: center;">WapiPulse Authentication</h2>
            <p>Hello,</p>
            <p>Your unique security code for logging into WapiPulse CRM is:</p>
            <div style="background: #f4f4f4; padding: 20px; text-align: center; font-size: 32px; font-weight: bold; letter-spacing: 5px; color: #114a43; border-radius: 8px;">
              ${otp}
            </div>
            <p style="margin-top: 20px;">This code is valid for 5 minutes. If you did not request this code, please ignore this email.</p>
            <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;" />
            <p style="font-size: 12px; color: #888; text-align: center;">&copy; 2026 WapiPulse CRM. Secure and Encrypted.</p>
          </div>
        `,
      };

      await transporter.sendMail(mailOptions);
      return true;
    } catch (error) {
      console.error('❌ Email notification error:', error.message);
      return false;
    }
  }

  /**
   * Helper: Format phone number for Meta API (International Format)
   */
  formatPhoneNumber(phone) {
    if (!phone) return '';
    let cleaned = String(phone).replace(/\D/g, '');
    
    // Handle Indian numbers (Primary user base)
    if (cleaned.length === 10) return `91${cleaned}`;
    if (cleaned.length === 11 && cleaned.startsWith('0')) return `91${cleaned.substring(1)}`;
    if (cleaned.length > 10 && cleaned.startsWith('0')) return cleaned.substring(1);
    
    return cleaned;
  }

  /**
   * Send WhatsApp OTP using Meta API (Already Configured)
   */
  async sendWhatsApp(to, otp, tenantId) {
    try {
      const formattedTo = this.formatPhoneNumber(to);
      console.log(`[NotificationService] Attempting WhatsApp OTP to: ${formattedTo} (original: ${to})`);
      const client = await Client.findOne({ tenantId });
      if (!client || !client.whatsappConfig || !client.whatsappConfig.accessToken) {
        throw new Error('WhatsApp configuration missing for this tenant');
      }

      const waService = new WhatsAppService({
        accessToken: client.whatsappConfig.accessToken,
        phoneNumberId: client.whatsappConfig.phoneNumberId
      });

      // 🔍 1. Check if an approved AUTHENTICATION/UTILITY template exists
      const db = await getTenantConnection(tenantId);
      const Template = db.model('Template', TemplateSchema);
      const otpTemplate = await Template.findOne({ 
        category: { $in: ['AUTHENTICATION', 'UTILITY'] }, 
        status: 'APPROVED' 
      });

      let result;
      if (otpTemplate) {
        console.log(`[NotificationService] Using Template "${otpTemplate.name}" for OTP delivery to ${formattedTo}`);
        // For Meta AUTHENTICATION templates, the OTP is usually the first parameter
        result = await waService.sendTemplate(formattedTo, otpTemplate.name, otpTemplate.language || 'en_US', [
          {
            type: 'body',
            parameters: [{ type: 'text', text: otp }]
          },
          {
            type: 'button',
            sub_type: 'url',
            index: '0',
            parameters: [{ type: 'text', text: otp }]
          }
        ]);
      } else {
        console.warn(`[NotificationService] ⚠️ No approved Authentication template found. Falling back to free-form text.`);
        const message = `Your WapiPulse login OTP is: *${otp}*. It expires in 5 minutes.`;
        result = await waService.sendTextMessage(formattedTo, message);
      }

      console.log(`[NotificationService] ✅ WhatsApp OTP sent to ${formattedTo}. Meta ID: ${result?.messages?.[0]?.id || 'N/A'}`);
      return true;
    } catch (error) {
      console.error('❌ WhatsApp notification error:', error.message);
      if (error.response?.data) {
        console.error('❌ Meta API Details:', JSON.stringify(error.response.data, null, 2));
      }
      return false;
    }
  }

  /**
   * Send SMS OTP using Twilio
   */
  async sendSMS(to, otp) {
    try {
      const sid = process.env.TWILIO_ACCOUNT_SID;
      const auth = process.env.TWILIO_AUTH_TOKEN;
      const fromNum = process.env.TWILIO_PHONE_NUMBER;

      if (!sid || !auth || !fromNum) {
        console.warn('⚠️ Twilio credentials missing. Redirecting OTP to Console.');
        console.log(`[CONSOLE LOG - SMS OTP] To: ${to}, Code: ${otp}`);
        return true;
      }

      const client = twilio(sid, auth);
      await client.messages.create({
        body: `Your WapiPulse security code is: ${otp}`,
        to: to, 
        from: fromNum,
      });
      
      return true; 
    } catch (error) {
      console.error('❌ SMS (Twilio) notification error:', error.message);
      return false;
    }
  }

  /**
   * Master dispatch method for OTPs
   */
  async sendOTP(user, otp, method) {
    const target = (method === 'EMAIL') ? user.email : user.phoneNumber;
    
    switch (method) {
      case 'EMAIL':
        return await this.sendEmail(target, otp, 'Your WapiPulse Security Code');
      case 'WHATSAPP':
        return await this.sendWhatsApp(target, otp, user.tenantId);
      case 'SMS':
        return await this.sendSMS(target, otp);
      default:
        return false;
    }
  }

  /**
   * Send a generic administrative alert (Email/WhatsApp) based on tenant settings
   */
  async sendAdminAlert(tenantId, { subject, text }) {
    try {
      const User = require('../models/core/User');
      const Settings = require('../models/core/Settings');

      // 1. Find the Primary Admin for this tenant
      const admin = await User.findOne({ tenantId, role: 'ADMIN', status: 'ACTIVE' });
      if (!admin) {
        console.warn(`[NotificationService] No active admin found for tenant ${tenantId}`);
        return;
      }

      // 2. Fetch Notification Settings
      const settings = await Settings.findOne({ tenantId });
      const prefs = settings?.notifications || { email: true, whatsapp: true, inApp: true };

      const results = [];

      // 3. Send Email Alert
      if (prefs.email && admin.email) {
        console.log(`[NotificationService] Sending Email alert to ${admin.email}`);
        results.push(this.sendEmail(admin.email, text, subject)); // Note: Updated sendEmail signature below
      }

      // 4. Send WhatsApp Alert
      if (prefs.whatsapp && admin.phoneNumber) {
        console.log(`[NotificationService] Sending WhatsApp alert to ${admin.phoneNumber}`);
        results.push(this.sendWhatsApp(admin.phoneNumber, `*Admin Alert: ${subject}*\n\n${text}`, tenantId));
      }

      await Promise.all(results);
    } catch (err) {
      console.error('[NotificationService] Failed to send admin alert:', err);
    }
  }

  /**
   * Updated sendEmail to support arbitrary body/subject
   */
  async sendEmail(to, body, subject = 'WapiPulse Alert') {
    try {
      if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
        console.log(`[CONSOLE LOG - EMAIL] To: ${to}, Subject: ${subject}, Body: ${body}`);
        return true; 
      }

      const transporter = nodemailer.createTransport({
        service: 'gmail', auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS }
      });

      const mailOptions = {
        from: `"WapiPulse Alerts" <${process.env.SMTP_USER}>`,
        to: to,
        subject: subject,
        html: `
          <div style="font-family: sans-serif; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
            <h2 style="color: #114a43;">${subject}</h2>
            <p style="font-size: 16px; line-height: 1.6;">${body}</p>
            <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;" />
            <p style="font-size: 12px; color: #888;">This is an automated notification from your WapiPulse CRM.</p>
          </div>
        `
      };

      await transporter.sendMail(mailOptions);
      return true;
    } catch (error) {
      console.error('❌ Email Alert error:', error.message);
      return false;
    }
  }
}

module.exports = new NotificationService();

