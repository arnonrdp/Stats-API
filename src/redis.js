const Redis = require('redis')

const RedisClient = Redis.createClient({
  url: process.env.REDIS_URL
})

RedisClient.on('error', (err) => console.log('Redis Client Error', err))
RedisClient.on('connect', () => console.log('Connected to Redis'))

RedisClient.connect()
module.exports = RedisClient
