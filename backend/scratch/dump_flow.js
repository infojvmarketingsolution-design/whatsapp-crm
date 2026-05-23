require('dotenv').config();
const mongoose = require('mongoose');
const { connectCoreDB } = require('../src/config/db');

async function dump() {
  await connectCoreDB();
  const db = mongoose.connection.useDb('wapi_fivestep_599984');
  const coll = db.collection('settings');
  const settings = await coll.findOne({});
  console.log(JSON.stringify(settings.automation.flowSteps, null, 2));
  process.exit(0);
}
dump();
