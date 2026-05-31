const PaymentRequest = require('../models/core/PaymentRequest');
const Client = require('../models/core/Client');
const WhatsAppService = require('../services/whatsapp.service');

// Standard pricing with margin
const PRICING = {
  MARKETING: 0.93,
  UTILITY: 0.16,
  AUTHENTICATION: 0.18,
  SERVICE: 0.34 // Assuming 0.29 + 0.05
};

const submitPaymentRequest = async (req, res) => {
  try {
    const { category, messageQuantity, utrNumber } = req.body;
    const tenantId = req.tenantId;

    if (!category || !messageQuantity || !utrNumber) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    const client = await Client.findOne({ tenantId });
    if (!client) {
      return res.status(404).json({ message: 'Client not found' });
    }

    const rate = PRICING[category] || 0.93;
    const amount = rate * messageQuantity;

    const paymentRequest = new PaymentRequest({
      clientId: client._id,
      tenantId: client.tenantId,
      category,
      messageQuantity,
      amount,
      utrNumber
    });

    await paymentRequest.save();

    // Send WhatsApp Notification to Super Admin
    try {
       const waService = new WhatsAppService(tenantId);
       const adminNumber = '916354070709';
       const msg = `🚨 *New Fund Added!* \n\nClient: *${client.name}*\nCategory: ${category}\nMessages: ${messageQuantity}\nAmount: ₹${amount.toFixed(2)}\nUTR: ${utrNumber}\n\nPlease clarify this fund in the admin panel.`;
       await waService.sendTextMessage(adminNumber, msg);
    } catch (waError) {
       console.error('Failed to send admin notification:', waError.message);
    }

    res.status(201).json({ message: 'Payment request submitted successfully', paymentRequest });
  } catch (error) {
    console.error('Submit Payment Request Error:', error);
    res.status(500).json({ message: error.message });
  }
};

const getAdminPaymentRequests = async (req, res) => {
  try {
    // Populate client details to show Name
    const requests = await PaymentRequest.find()
      .populate('clientId', 'name tenantId companyName')
      .sort({ createdAt: -1 });
    
    res.json(requests);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const updatePaymentRequestStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body; // 'APPROVED' or 'REJECTED'

    if (!['APPROVED', 'REJECTED'].includes(status)) {
      return res.status(400).json({ message: 'Invalid status' });
    }

    const request = await PaymentRequest.findById(id).populate('clientId');
    if (!request) {
      return res.status(404).json({ message: 'Payment request not found' });
    }

    if (request.status !== 'PENDING') {
      return res.status(400).json({ message: 'Request is already processed' });
    }

    request.status = status;
    await request.save();

    // If approved, update client wallet balance
    if (status === 'APPROVED') {
      const client = request.clientId;
      client.walletBalance = (client.walletBalance || 0) + request.amount;
      await client.save();
    }

    res.json({ message: `Payment request ${status.toLowerCase()} successfully`, request });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Polling for rejected notifications on Client side
const getClientRejectedPayments = async (req, res) => {
  try {
    const tenantId = req.tenantId;
    const client = await Client.findOne({ tenantId });
    if (!client) return res.status(404).json({ message: 'Client not found' });

    // Find rejected requests that haven't been notified 5 times yet
    const rejectedRequests = await PaymentRequest.find({
      clientId: client._id,
      status: 'REJECTED',
      rejectedMessageNotifiedCount: { $lt: 5 }
    });

    // Increment notification count for each
    for (let req of rejectedRequests) {
      req.rejectedMessageNotifiedCount += 1;
      await req.save();
    }

    res.json(rejectedRequests);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getAdminDashboardStats = async (req, res) => {
  try {
    const clients = await Client.find({ status: { $ne: 'DELETED' } }).lean();
    const approvedRequests = await PaymentRequest.find({ status: 'APPROVED' }).lean();

    let totalFundAdded = 0;
    let totalMessagesSent = 0;
    let totalUnusedFund = 0;

    const clientMap = {};

    clients.forEach(c => {
       clientMap[c._id.toString()] = {
          _id: c._id,
          name: c.companyName || c.name,
          billingMode: c.billingMode || 'AUTO',
          walletBalance: c.walletBalance || 0,
          totalMessages: 0,
          totalFundAdded: 0
       };
       totalUnusedFund += (c.walletBalance || 0);
    });

    approvedRequests.forEach(req => {
       totalFundAdded += req.amount;
       totalMessagesSent += req.messageQuantity;
       
       if (req.clientId && clientMap[req.clientId.toString()]) {
          clientMap[req.clientId.toString()].totalFundAdded += req.amount;
          clientMap[req.clientId.toString()].totalMessages += req.messageQuantity;
       }
    });

    const totalFundUtilized = totalFundAdded - totalUnusedFund;
    const clientDetails = Object.values(clientMap);

    res.json({
      totalClients: clients.length,
      totalFundAdded,
      totalFundUtilized,
      totalUnusedFund,
      totalMessagesSent,
      clientDetails
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  submitPaymentRequest,
  getAdminPaymentRequests,
  updatePaymentRequestStatus,
  getClientRejectedPayments,
  getAdminDashboardStats
};
