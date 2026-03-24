const { createClient } = require('redis');

let redisClient;

const connectRedis = async () => {
  try {
    redisClient = createClient({
      url: process.env.REDIS_URI || 'redis://localhost:6379'
    });

    redisClient.on('error', (err) => {
      console.error('❌ Redis Client Error:', err);
    });

    await redisClient.connect();
    console.log('✅ Connected to Redis successfully');
    
    return redisClient;
  } catch (error) {
    console.error('❌ Redis Connection Failed:', error);
    // Note: Do not exit process if Redis fails so app can try to stay alive if needed
    // process.exit(1); 
  }
};

const getRedisClient = () => {
  if (!redisClient) {
    throw new Error('Redis client not initialized. Call connectRedis() first.');
  }
  return redisClient;
};

module.exports = {
  connectRedis,
  getRedisClient
};
