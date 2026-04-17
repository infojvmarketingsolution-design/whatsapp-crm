const mongoose = require('mongoose');
const path = require('path');
const Client = require('../src/models/core/Client');

mongoose.connect('mongodb://127.0.0.1:27017/crm_core')
  .then(async () => {
    try {
      const clients = await Client.find({ $or: [{ tenantId: /campusdekho/i }, { email: /campusdekho/i }] });
      console.log(JSON.stringify(clients, null, 2));
    } catch (e) {
      console.error(e);
    }
    process.exit(0);
  });
