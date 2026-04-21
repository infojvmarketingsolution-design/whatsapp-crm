const nodemailer = require('nodemailer');
const WhatsAppService = require('./whatsapp.service');
const Client = require('../models/core/Client');

/**
 * NotificationService handles sending OTPs and other notifications via multiple channels.
 */
class NotificationService {
  /**
   * Send Email OTP using Nodemailer
   */
  async sendEmail(to, otp) {
    try {
      // Create a transporter using environment variables
      const transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST || 'smtp.gmail.com',
        port: process.env.SMTP_PORT || 587,
        secure: process.env.SMTP_SECURE === 'true',
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS,
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

      if (!process.env.SMTP_USER) {
        console.warn('⚠️ SMTP_USER not configured. OTP logging to console instead.');
        console.log(`[EMAIL OTP] To: ${to}, Code: ${otp}`);
        return true;
      }

      await transporter.sendMail(mailOptions);
      return true;
    } catch (error) {
      console.error('❌ Email notification error:', error.message);
      return false;
    }
  }

  /**
   * Send WhatsApp OTP using Meta API
   */
  async sendWhatsApp(to, otp, tenantId) {
    try {
      // Find client config for this tenant to get Meta API credentials
      const client = await Client.findOne({ tenantId });
      if (!client || !client.whatsappConfig || !client.whatsappConfig.accessToken) {
        throw new Error('WhatsApp configuration missing for this tenant');
      }

      const waService = new WhatsAppService({
        accessToken: client.whatsappConfig.accessToken,
        phoneNumberId: client.whatsappConfig.phoneNumberId
      });

      const message = `Your WapiPulse login OTP is: *${otp}*. It expires in 5 minutes.`;
      await waService.sendTextMessage(to, message);
      return true;
    } catch (error) {
      console.error('❌ WhatsApp notification error:', error.message);
      return false;
    }
  }

  /**
   * Send SMS OTP using generic gateway (placeholder)
   */
  async sendSMS(to, otp) {
    try {
      console.log(`[SMS OTP] To: ${to}, Code: ${otp}`);
      // Implement your SMS gateway logic here (e.g., axios call to Twilio or Fast2SMS)
      // Since Credentials: Yes, the user will need to provide endpoint details.
      return true; 
    } catch (error) {
      console.error('❌ SMS notification error:', error.message);
      return false;
    }
  }

  /**
   * Master dispatch method
   */
  async sendOTP(user, otp, method) {
    const target = (method === 'EMAIL') ? user.email : user.phoneNumber;
    
    switch (method) {
      case 'EMAIL':
        return await this.sendEmail(target, otp);
      case 'WHATSAPP':
        return await this.sendWhatsApp(target, otp, user.tenantId);
      case 'SMS':
        return await this.sendSMS(target, otp);
      default:
        return false;
    }
  }
}

module.exports = new NotificationService();
