require('dotenv').config();
const express = require('express');
const http = require('http');
const cors = require('cors');
const mongoose = require('mongoose');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);

app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));
const path = require('path');
const fs = require('fs');
// // app.use('/public', express.static(path.join(__dirname, 'public'))); // Replaced by general static middleware below

const io = new Server(server, {
  cors: { origin: '*' }
});
app.set('io', io);

const authRoutes = require('./src/routes/auth.routes');
const clientRoutes = require('./src/routes/client.routes');
const whatsappRoutes = require('./src/routes/whatsapp.routes');
const chatRoutes = require('./src/routes/chat.routes');
const templateRoutes = require('./src/routes/template.routes');
const campaignRoutes = require('./src/routes/campaign.routes');
const flowRoutes = require('./src/routes/flow.routes');
const agentRoutes = require('./src/routes/agent.routes'); // Added agentRoutes import
const widgetRoutes = require('./src/routes/widget.routes');
const settingsRoutes = require('./src/routes/settings.routes');
const planRoutes = require('./src/routes/plan.routes');
const adminSettingsRoutes = require('./src/routes/adminSettings.routes');
const maintenanceMiddleware = require('./src/middleware/maintenance');


// Initialize Queue Workers
require('./src/workers/campaign.worker');

app.use(maintenanceMiddleware);

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'JV CRM Backend is running' });
});

app.get('/privacy-policy', (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html lang="en">
    <html>
      <head>
        <title>Privacy Policy - JV WhatsApp CRM</title>
        <style>
          body { font-family: 'Inter', system-ui, sans-serif; line-height: 1.6; color: #333; max-width: 800px; margin: 40px auto; padding: 0 20px; }
          h1 { color: #10b981; border-bottom: 2px solid #ecfdf5; padding-bottom: 10px; }
          h2 { color: #059669; margin-top: 30px; }
          .last-updated { color: #666; font-style: italic; margin-bottom: 30px; }
          .contact { background: #f0fdf4; padding: 20px; border-radius: 8px; border: 1px solid #dcfce7; margin-top: 40px; }
        </style>
      </head>
      <body>
        <h1>Privacy Policy</h1>
        <p class="last-updated">Last Updated: March 21, 2026</p>
        
        <h2>1. Introduction</h2>
        <p>Welcome to JV WhatsApp CRM. We are committed to protecting your personal information and your right to privacy. This policy explains what information we collect, how we use it, and what rights you have.</p>
        
        <h2>2. Information We Collect</h2>
        <p>We collect information that you provide to us such as name, contact information, and WhatsApp message data required for the operation of the CRM service.</p>
        
        <h2>3. How We Use Your Information</h2>
        <p>We use your information to provide, operate, and maintain our CRM services, improve user experience, and communicate with you regarding updates or support.</p>
        
        <h2>4. Data Security</h2>
        <p>We implement appropriate technical and organizational security measures designed to protect the security of any personal information we process.</p>

        <h2>5. Data Deletion and Retention</h2>
        <p>You have the right to request the deletion of your personal data. You can find specific instructions for data deletion at <a href="/data-deletion">/data-deletion</a>.</p>
        
        <div class="contact">
          <h2>Contact Us</h2>
          <p>If you have questions or comments about this policy, you may email us at <strong>support@wapipulse.com</strong>.</p>
        </div>
      </body>
    </html>
  `);
});

// Data Deletion Instructions Route
app.get('/data-deletion', (req, res) => {
  res.send(`
    <html>
      <head>
        <title>Data Deletion Instructions - JV WhatsApp CRM</title>
        <style>
          body { font-family: 'Inter', system-ui, sans-serif; line-height: 1.6; color: #333; max-width: 800px; margin: 40px auto; padding: 0 20px; }
          h1 { color: #f43f5e; border-bottom: 2px solid #fff1f2; padding-bottom: 10px; }
          h2 { color: #e11d48; margin-top: 30px; }
          .steps { background: #fff1f2; padding: 20px; border-radius: 8px; border: 1px solid #ffe4e6; margin-top: 20px; }
          ol { margin-left: 20px; }
          li { margin-bottom: 10px; }
        </style>
      </head>
      <body>
        <h1>Data Deletion Instructions</h1>
        <p>At JV WhatsApp CRM, we value your privacy and provide a clear process for you to request the deletion of your data from our systems.</p>

        <h2>How to Request Data Deletion</h2>
        <div class="steps">
          <ol>
            <li>Send an email to <strong>support@wapipulse.com</strong> with the subject line "Data Deletion Request".</li>
            <li>In the email, provide your registered email address and/or your WhatsApp Business Phone Number associated with the account.</li>
            <li>Our team will verify your identity within 48-72 hours.</li>
            <li>Once verified, all your personal information, contact lists, and message history will be permanently deleted from our servers.</li>
            <li>You will receive a confirmation email once the process is complete.</li>
          </ol>
        </div>

        <h2>Meta (Facebook) Data Deletion</h2>
        <p>If you have linked your Facebook or Meta account to our app and wish to remove the app's access and delete related data, you can also do so through your Facebook settings:</p>
        <ol>
          <li>Go to your Facebook Profile's Settings & Privacy. Click Settings.</li>
          <li>Look for "Apps and Websites" and you will see all of the apps and websites you linked with your Facebook.</li>
          <li>Search and tap "JV WhatsApp CRM" in the search bar.</li>
          <li>Scroll and tap "Remove".</li>
        </ol>
        
        <p style="margin-top: 40px; color: #666; font-size: 0.9em;">Note: Once data is deleted, it cannot be recovered.</p>
      </body>
    </html>
  `);
});

app.get('/terms-of-service', (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Terms of Service - J.V Marketing Solution</title>
        <style>
            body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; line-height: 1.6; color: #333; max-width: 800px; margin: 0 auto; padding: 40px 20px; background: #f9fafb; }
            .card { background: white; padding: 40px; border-radius: 16px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1); border: 1px solid #e5e7eb; }
            h1 { color: #111827; margin-bottom: 8px; }
            h2 { color: #111827; margin-top: 32px; border-left: 4px solid #3b82f6; padding-left: 12px; }
            p, li { color: #4b5563; font-size: 16px; }
            .footer { margin-top: 40px; border-top: 1px solid #eee; padding-top: 20px; font-size: 12px; color: #9ca3af; text-align: center; }
        </style>
    </head>
    <body>
        <div class="card">
            <h1>Terms of Service</h1>
            <p>Last Updated: March 22, 2026</p>
            
            <h2>1. Acceptance of Terms</h2>
            <p>By accessing or using the J.V Marketing Solution CRM platform, you agree to be bound by these Terms of Service. If you do not agree, please do not use our services.</p>

            <h2>2. Description of Service</h2>
            <p>We provide a WhatsApp Business API-based CRM system for managing customer interactions, automated flows, and marketing campaigns.</p>

            <h2>3. User Responsibilities</h2>
            <p>You are responsible for maintaining the confidentiality of your account credentials and for all activities that occur under your account. You must comply with all WhatsApp Business Solution policies.</p>

            <h2>4. Usage Restrictions</h2>
            <p>Users are strictly prohibited from using the platform for sending unsolicited messages (spam), fraudulent activities, or any content that violates applicable laws.</p>

            <h2>5. Limitation of Liability</h2>
            <p>J.V Marketing Solution shall not be liable for any indirect, incidental, or consequential damages arising out of your use of the service.</p>

            <div class="footer">
                &copy; 2026 J.V Marketing Solution Private Limited. All rights reserved.
            </div>
        </div>
    </body>
    </html>
  `);
});

app.use('/api/auth', authRoutes);
app.use('/api/clients', clientRoutes);
app.use('/api/whatsapp', whatsappRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/templates', templateRoutes);
app.use('/api/campaigns', campaignRoutes);
app.use('/api/flows', flowRoutes);
app.use('/api/agents', agentRoutes);
app.use('/api/widgets', widgetRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/plans', planRoutes);
app.use('/api/admin/settings', adminSettingsRoutes);

// Main Media Route (Matches generated URLs /uploads/...)
// Try multiple paths to find the uploads folder on various server environments
const possibleUploadPaths = [
  path.join(__dirname, 'public/uploads'),
  path.join(__dirname, 'uploads'),
  path.join(__dirname, '../public/uploads'),
  path.join(process.cwd(), 'public/uploads'),
  path.join(process.cwd(), 'uploads')
];

possibleUploadPaths.forEach(uPath => {
  if (fs.existsSync(uPath)) {
    console.log(`[Server] ✅ Serving static files from: ${uPath} via /uploads`);
    app.use('/uploads', express.static(uPath, {
      setHeaders: (res, path) => {
        res.set('Access-Control-Allow-Origin', '*');
        res.set('Cache-Control', 'public, max-age=31536000');
      }
    }));
  }
});

// Last resort: If still not caught, let the general static handler try /public
app.use(express.static(path.join(__dirname, 'public')));


// SPA Routing: Serve index.html for any request that doesn't match an API route
app.get('*', (req, res) => {
  if (req.path.startsWith('/api')) return;
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

io.on('connection', (socket) => {
  console.log('New client connected:', socket.id);
  const tenantId = socket.handshake.query.tenantId;
  if(tenantId) socket.join(tenantId);
  
  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
  });
});

const PORT = process.env.PORT || 5000;

// Connect to Database, then start server
const { connectCoreDB } = require('./src/config/db');

connectCoreDB().then(() => {
  console.log("✅ Connected to Core Database successfully.");
}).catch((err) => {
  console.warn("⚠️ Warning: MongoDB is offline. Running server in UI/Webhook test mode without DB.");
});

// Always start the server so Webhooks and UI can function offline!
server.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
