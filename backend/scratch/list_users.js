require('dotenv').config();
const { connectCoreDB } = require('../src/config/db');
const mongoose = require('mongoose');

async function listUsers() {
  await connectCoreDB();
  const User = require('../src/models/core/User');
  const users = await User.find({ tenantId: 'fivestep_599984', status: 'ACTIVE' }, 'name role').lean();
  console.log(JSON.stringify(users, null, 2));
  process.exit(0);
}

listUsers().catch(console.error);
