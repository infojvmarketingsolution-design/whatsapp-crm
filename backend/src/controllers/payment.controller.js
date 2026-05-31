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

    // Emit real-time socket event for Super Admin Dashboard
    if (req.app) {
       const io = req.app.get('io');
       if (io) {
          io.emit('new_payment_request', {
             clientName: client.companyName || client.name,
             amount,
             category,
             messageQuantity,
             utrNumber
          });
       }
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

    // If approved, update client wallet balance and historical data
    if (status === 'APPROVED') {
      const client = request.clientId;
      client.walletBalance = (client.walletBalance || 0) + request.amount;
      client.totalFundAdded = (client.totalFundAdded || 0) + request.amount;
      client.totalMessagesSent = (client.totalMessagesSent || 0) + request.messageQuantity;
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

    let totalFundAdded = 0;
    let totalMessagesSent = 0;
    let totalUnusedFund = 0;

    const clientDetails = clients.map(c => {
       const fundAdded = c.totalFundAdded || 0;
       const msgsSent = c.totalMessagesSent || 0;
       const wallet = c.walletBalance || 0;

       totalFundAdded += fundAdded;
       totalMessagesSent += msgsSent;
       totalUnusedFund += wallet;

       return {
          _id: c._id,
          name: c.companyName || c.name,
          billingMode: c.billingMode || 'AUTO',
          walletBalance: wallet,
          totalMessages: msgsSent,
          totalFundAdded: fundAdded
       };
    });

    const totalFundUtilized = totalFundAdded - totalUnusedFund;

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

const editPaymentRequest = async (req, res) => {
  try {
    const { id } = req.params;
    const { messageQuantity, amount, utrNumber, status } = req.body;

    const request = await PaymentRequest.findById(id).populate('clientId');
    if (!request) {
      return res.status(404).json({ message: 'Payment request not found' });
    }

    const changes = [];
    const addChange = (field, oldVal, newVal) => {
      if (oldVal !== newVal) {
        changes.push({ field, oldValue: oldVal, newValue: newVal });
      }
    };

    if (messageQuantity !== undefined) addChange('messageQuantity', request.messageQuantity, Number(messageQuantity));
    if (amount !== undefined) addChange('amount', request.amount, Number(amount));
    if (utrNumber !== undefined) addChange('utrNumber', request.utrNumber, utrNumber);
    if (status !== undefined) addChange('status', request.status, status);

    if (changes.length > 0) {
      const oldStatus = request.status;
      const client = request.clientId;

      // Handle wallet/stats adjustment if status or amount changes
      if (oldStatus === 'APPROVED' && status !== 'APPROVED') {
        // Reverting an approved request
        client.walletBalance = (client.walletBalance || 0) - request.amount;
        client.totalFundAdded = (client.totalFundAdded || 0) - request.amount;
        client.totalMessagesSent = (client.totalMessagesSent || 0) - request.messageQuantity;
      } else if (oldStatus !== 'APPROVED' && status === 'APPROVED') {
        // Approving a request
        client.walletBalance = (client.walletBalance || 0) + (amount !== undefined ? Number(amount) : request.amount);
        client.totalFundAdded = (client.totalFundAdded || 0) + (amount !== undefined ? Number(amount) : request.amount);
        client.totalMessagesSent = (client.totalMessagesSent || 0) + (messageQuantity !== undefined ? Number(messageQuantity) : request.messageQuantity);
      } else if (oldStatus === 'APPROVED' && status === 'APPROVED') {
        // Modifying an already approved request
        if (amount !== undefined && amount !== request.amount) {
          const diffAmount = Number(amount) - request.amount;
          client.walletBalance = (client.walletBalance || 0) + diffAmount;
          client.totalFundAdded = (client.totalFundAdded || 0) + diffAmount;
        }
        if (messageQuantity !== undefined && messageQuantity !== request.messageQuantity) {
          const diffQty = Number(messageQuantity) - request.messageQuantity;
          client.totalMessagesSent = (client.totalMessagesSent || 0) + diffQty;
        }
      }

      if (messageQuantity !== undefined) request.messageQuantity = Number(messageQuantity);
      if (amount !== undefined) request.amount = Number(amount);
      if (utrNumber !== undefined) request.utrNumber = utrNumber;
      if (status !== undefined) request.status = status;

      request.editHistory = request.editHistory || [];
      request.editHistory.push({ changedAt: new Date(), changes });

      await client.save();
      await request.save();
    }

    res.json({ message: 'Payment request updated successfully', request });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  submitPaymentRequest,
  getAdminPaymentRequests,
  updatePaymentRequestStatus,
  getClientRejectedPayments,
  getAdminDashboardStats,
  editPaymentRequest
};
