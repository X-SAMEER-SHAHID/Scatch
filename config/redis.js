const { createClient } = require('redis');

const redisClient = createClient({
    url: `redis://${process.env.REDIS_HOST || 'localhost'}:${process.env.REDIS_PORT || 6379}`,
    password: process.env.REDIS_PASSWORD
});

redisClient.on('connect', () => {
    console.log('Redis client connected');
});

redisClient.on('error', (err) => {
    console.error('Redis Client Error:', err);
});

// Graceful shutdown
process.on('SIGINT', () => {
    redisClient.quit();
    process.exit(0);
});

module.exports = redisClient; 