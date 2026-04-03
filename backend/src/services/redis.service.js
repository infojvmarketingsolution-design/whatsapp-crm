const IORedis = require('ioredis');

const redis = new IORedis({
  host: process.env.REDIS_HOST || '127.0.0.1',
  port: parseInt(process.env.REDIS_PORT || '6379'),
  maxRetriesPerRequest: null,
  retryStrategy(times) {
    return Math.min(times * 50, 2000);
  }
});

redis.on('error', (err) => {
  if (err.code === 'ECONNREFUSED') {
    // console.warn('[Redis] Connection refused. Locking will be bypassed.');
    return;
  };
});

/**
 * 🔒 Concurrency Lock
 * Prevents multiple webhook hits for the same user within a short window.
 * @param {string} phone 
 * @param {number} ttl Seconds
 * @returns {Promise<boolean>} True if lock acquired
 */
const lockUser = async (phone, ttl = 5) => {
  try {
    if (redis.status !== 'ready') return true; // Bypass if redis is down
    const key = `lock:user_${phone}`;
    const result = await redis.set(key, '1', 'EX', ttl, 'NX');
    return result === 'OK';
  } catch (e) {
    console.error('[Redis Lock Error]', e.message);
    return true; // Fail safe (allow execution)
  }
};

const unlockUser = async (phone) => {
  try {
    if (redis.status !== 'ready') return;
    await redis.del(`lock:user_${phone}`);
  } catch (e) {}
};

module.exports = {
  redis,
  lockUser,
  unlockUser
};
