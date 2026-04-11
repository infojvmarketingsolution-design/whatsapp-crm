const mongoose = require('mongoose');
const Client = require('./src/models/core/Client'); // or whatever path

mongoose.connect('mongodb://127.0.0.1:27017/crm_core')
  .then(async () => {
    try {
      // Find the client to make sure we're deleting exactly the one they gave
      const client = await Client.findOne({ tenantId: 'campusdekho_233913' });
      if (!client) {
        console.log('Client not found!');
      } else {
        await Client.deleteOne({ _id: client._id });
        console.log('Deleted client successfully:', client.email);
        
        // Also might need to drop their tenant DB to completely wipe them
        const tenantDbUri = 'mongodb://127.0.0.1:27017/crm_tenant_' + client.tenantId;
        const tenantConn = mongoose.createConnection(tenantDbUri);
        await tenantConn.dropDatabase();
        console.log('Dropped tenant database:', 'crm_tenant_' + client.tenantId);
      }
    } catch (e) {
      console.error(e);
    }
    process.exit(0);
  });
