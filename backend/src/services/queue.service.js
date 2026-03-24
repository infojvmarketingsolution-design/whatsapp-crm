const { Queue } = require('bullmq');

const IORedis = require('ioredis');

const connection = new IORedis({
  host: process.env.REDIS_HOST || '127.0.0.1',
  port: parseInt(process.env.REDIS_PORT || '6379'),
  maxRetriesPerRequest: null,
  retryStrategy(times) {
    if (times > 3) {
      console.log('[Queue Service] Redis is currently offline. Background queues bypass active.');
      return null;
    }
    return Math.min(times * 50, 2000);
  }
});

connection.on('error', (err) => {
  if (err.code === 'ECONNREFUSED') return;
});

const campaignQueue = new Queue('campaign-dispatch', { connection });

const addCampaignJob = async (jobName, jobData) => {
  try {
    if (connection.status === 'ready') {
      return await campaignQueue.add(jobName, jobData, { removeOnComplete: true });
    } else {
      console.log('[Queue Service] Redis offline: Bypassed background job', jobName);
      return null;
    }
  } catch(e) {
    console.log('[Queue Service] Failed to push background job:', e.message);
    return null;
  }
};

module.exports = {
  connection,
  campaignQueue,
  addCampaignJob
};
