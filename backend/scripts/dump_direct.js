const { MongoClient } = require('mongodb');
const fs = require('fs');
require('dotenv').config({ path: __dirname + '/../.env' });

async function run() {
  const uri = process.env.CORE_DB_URI || 'mongodb://127.0.0.1:27017/crm_core';
  const client = new MongoClient(uri);
  try {
    await client.connect();
    const db = client.db('crm_core');
    const settings = await db.collection('settings').findOne({});
    fs.writeFileSync('C:/Users/ASUS/.gemini/antigravity/brain/b998401f-2e6c-4003-8f00-584bde32c2ab/scratch/db_dump_direct.txt', JSON.stringify({
      programMap: settings?.automation?.aiPrompts?.programMap,
      steps: settings?.automation?.aiPrompts?.prdFlowSteps,
      opts: settings?.automation?.aiPrompts?.qualificationOptions
    }, null, 2));
    console.log("DUMP SUCCESS");
  } catch(e) {
    console.error(e);
  } finally {
    await client.close();
  }
}
run();
