const mongoose = require('mongoose');
const CORE_DB_URI = 'mongodb://127.0.0.1:27017/crm_core';

const UserSchema = new mongoose.Schema({
  email: String,
  status: String,
  tenantId: String
});

const ClientSchema = new mongoose.Schema({
  tenantId: String,
  status: String
});

// Avoid model re-compilation error
const User = mongoose.models.User || mongoose.model('User', UserSchema);
const Client = mongoose.models.Client || mongoose.model('Client', ClientSchema);

async function reactivate() {
  try {
    await mongoose.connect(CORE_DB_URI);
    console.log('Connected to MongoDB');

    const userEmail = 'akashchavda201@gmail.com';
    const user = await User.findOneAndUpdate(
      { email: userEmail },
      { $set: { status: 'ACTIVE' } },
      { new: true }
    );

    if (user) {
      console.log(`User ${userEmail} found and status set to ACTIVE`);
      
      if (user.tenantId) {
        const client = await Client.findOneAndUpdate(
          { tenantId: user.tenantId },
          { $set: { status: 'ACTIVE' } },
          { new: true }
        );
        if (client) {
          console.log(`Client for tenant ${user.tenantId} also set to ACTIVE`);
        }
      }
    } else {
      console.log(`User ${userEmail} not found`);
    }

  } catch (err) {
    console.error('Error:', err);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected');
  }
}

reactivate();
