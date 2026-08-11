const { kv } = require('@vercel/kv');

const KEY = 'hornsby-leadership-tasks';

module.exports = async function handler(req, res) {
  try {
    if (req.method === 'GET') {
      const tasks = (await kv.get(KEY)) || [];
      res.status(200).json({ tasks });
      return;
    }

    if (req.method === 'POST') {
      const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
      if (!body || !Array.isArray(body.tasks)) {
        res.status(400).json({ error: 'Request must include a "tasks" array.' });
        return;
      }
      await kv.set(KEY, body.tasks);
      res.status(200).json({ ok: true });
      return;
    }

    res.setHeader('Allow', ['GET', 'POST']);
    res.status(405).json({ error: 'Method not allowed' });
  } catch (err) {
    const msg = (err && err.message) || 'Unknown server error';
    // This is the error users will see if a KV database hasn't been
    // connected to the Vercel project yet.
    const friendly = /KV_REST_API|environment variable|credentials/i.test(msg)
      ? 'Shared storage (Vercel KV) is not connected to this project yet.'
      : msg;
    res.status(500).json({ error: friendly });
  }
};
