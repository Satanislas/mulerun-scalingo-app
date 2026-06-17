const express = require('express');
const { createClient } = require('redis');
const path = require('path');

const app = express();
const port = process.env.PORT || 3000;

// In-memory fallback for when Redis is unavailable
class MemoryStore {
  constructor() { this.store = new Map(); this.timers = new Map(); }
  async connect() { console.log('Using in-memory store (Redis unavailable)'); }
  async get(key) { return this.store.get(key) || null; }
  async setEx(key, ttl, value) {
    this.store.set(key, value);
    if (this.timers.has(key)) clearTimeout(this.timers.get(key));
    this.timers.set(key, setTimeout(() => { this.store.delete(key); this.timers.delete(key); }, ttl * 1000));
  }
}

// Redis client setup
const redisUrl = process.env.SCALINGO_REDIS_URL;
let redisClient;

if (redisUrl) {
  redisClient = createClient({ url: redisUrl });
  redisClient.on('error', (err) => console.error('Redis client error:', err.message));
  redisClient.on('connect', () => console.log('Connected to Redis'));
} else {
  redisClient = new MemoryStore();
}

// Make redisClient available to routes
app.locals.redisClient = redisClient;

// Middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.static(path.join(__dirname, 'public')));

// Routes
app.use('/api/plan', require('./routes/plan'));
app.use('/api/exercise', require('./routes/exercise'));
app.use('/api/evaluate', require('./routes/evaluate'));
app.use('/api/coach', require('./routes/coach'));
app.use('/api/session', require('./routes/session'));

// SPA fallback
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Start server
(async () => {
  try {
    await redisClient.connect();
    console.log('Data store connected successfully');
  } catch (err) {
    console.error('Failed to connect to data store:', err.message);
    console.log('Falling back to in-memory store');
    app.locals.redisClient = new MemoryStore();
  }
  
  app.listen(port, () => {
    console.log(`Epistudy server running on port ${port}`);
  });
})();
