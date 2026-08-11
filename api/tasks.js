const Redis = require('ioredis');

const KEY = 'hornsby-leadership-tasks';
let client;

function getClient() {
  if (!client) {
    if (!process.env.REDIS_URL) {
      throw new Error('REDIS_URL environment variable is not set');
    }
    client = new Redis(process.env.REDIS_URL, { maxRetriesPerRequest: 3 });
  }
  return client;
}

module.exports = async function handler(req, res) {
  try {
    const redis = getClient();

    if (req.method === 'GET') {
      const raw = await redis.get(KEY);
      const tasks = raw ? JSON.parse(raw) : [];
      res.status(200).json({ tasks });
      return;
    }

    if (req.method === 'POST') {
      const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
      if (!body || !Array.isArray(body.tasks)) {
        res.status(400).json({ error: 'Request must include a "tasks" array.' });
        return;
      }
      await redis.set(KEY, JSON.stringify(body.tasks));
      res.status(200).json({ ok: true });
      return;
    }

    res.setHeader('Allow', ['GET', 'POST']);
    res.status(405).json({ error: 'Method not allowed' });
  } catch (err) {
    const msg = (err && err.message) || 'Unknown server error';
    const friendly = /REDIS_URL|ECONNREFUSED|ENOTFOUND|getaddrinfo|auth/i.test(msg)
      ? 'Could not connect to the Redis database — check REDIS_URL in Vercel project settings.'
      : msg;
    res.status(500).json({ error: friendly });
  }
};
