/**
 * SSE (Server-Sent Events) routes for real-time updates.
 * No auth middleware on SSE routes since EventSource doesn't support headers easily —
 * token accepted as query param for compatibility.
 */
const router = require('express').Router();
const pool = require('../db');
const jwt = require('jsonwebtoken');

// Active SSE connections
const liveStreamClients = new Map(); // site_id -> Set of res objects
const alertStreamClients = new Set();

/**
 * Authenticate via query param token (SSE clients can't set Authorization header).
 */
function sseAuth(req, res, next) {
  const token = req.query.token;
  if (!token) return res.status(401).json({ error: 'Token required as query param' });
  try {
    req.user = jwt.verify(token, process.env.JWT_SECRET);
    next();
  } catch {
    return res.status(401).json({ error: 'Invalid token' });
  }
}

function sendSSE(res, event, data) {
  res.write(`event: ${event}\n`);
  res.write(`data: ${JSON.stringify(data)}\n\n`);
}

/**
 * GET /api/safety/live-stream?site_id=X&token=JWT
 * Streams worker vital updates for a site every 30 seconds.
 */
router.get('/live-stream', sseAuth, async (req, res) => {
  const { site_id } = req.query;
  if (!site_id) return res.status(400).json({ error: 'site_id query param required' });

  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no');
  res.flushHeaders();

  // Register client
  if (!liveStreamClients.has(site_id)) liveStreamClients.set(site_id, new Set());
  liveStreamClients.get(site_id).add(res);

  // Send initial data immediately
  try {
    const result = await pool.query(
      "SELECT * FROM workers WHERE site = $1 ORDER BY updated_at DESC",
      [site_id]
    );
    sendSSE(res, 'worker-vitals', {
      site_id,
      workers: result.rows,
      timestamp: new Date().toISOString()
    });
  } catch (err) {
    sendSSE(res, 'error', { message: err.message });
  }

  // Poll every 30 seconds
  const interval = setInterval(async () => {
    try {
      const result = await pool.query(
        "SELECT * FROM workers WHERE site = $1 ORDER BY updated_at DESC",
        [site_id]
      );
      sendSSE(res, 'worker-vitals', {
        site_id,
        workers: result.rows,
        timestamp: new Date().toISOString()
      });
    } catch (err) {
      sendSSE(res, 'error', { message: err.message });
    }
  }, 30000);

  // Heartbeat every 15 seconds to keep connection alive
  const heartbeat = setInterval(() => {
    res.write(': heartbeat\n\n');
  }, 15000);

  req.on('close', () => {
    clearInterval(interval);
    clearInterval(heartbeat);
    liveStreamClients.get(site_id)?.delete(res);
    if (liveStreamClients.get(site_id)?.size === 0) liveStreamClients.delete(site_id);
  });
});

/**
 * GET /api/alerts/stream?token=JWT
 * Streams new alerts as they occur (polled every 10 seconds, sends new ones).
 */
router.get('/alerts/stream', sseAuth, (req, res) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no');
  res.flushHeaders();

  alertStreamClients.add(res);

  let lastChecked = new Date();

  sendSSE(res, 'connected', {
    message: 'Alert stream connected',
    timestamp: lastChecked.toISOString()
  });

  const interval = setInterval(async () => {
    try {
      const checkTime = lastChecked.toISOString();
      lastChecked = new Date();

      // Poll for new incidents (critical/high severity) since last check
      const result = await pool.query(
        `SELECT * FROM incidents
         WHERE created_at > $1 AND (severity = 'critical' OR severity = 'high')
         ORDER BY created_at DESC`,
        [checkTime]
      );

      if (result.rows.length > 0) {
        sendSSE(res, 'new-alerts', {
          alerts: result.rows.map(inc => ({
            id: inc.id,
            title: inc.title,
            type: inc.type,
            severity: inc.severity,
            location: inc.location,
            created_at: inc.created_at
          })),
          count: result.rows.length,
          timestamp: new Date().toISOString()
        });
      }
    } catch (err) {
      sendSSE(res, 'error', { message: err.message });
    }
  }, 10000);

  const heartbeat = setInterval(() => {
    res.write(': heartbeat\n\n');
  }, 15000);

  req.on('close', () => {
    clearInterval(interval);
    clearInterval(heartbeat);
    alertStreamClients.delete(res);
  });
});

/**
 * Utility: Push an alert to all connected alert stream clients immediately.
 * Called from incident creation route.
 */
function pushAlertToClients(alertData) {
  for (const client of alertStreamClients) {
    try {
      sendSSE(client, 'new-alerts', { alerts: [alertData], count: 1, timestamp: new Date().toISOString() });
    } catch (e) {
      alertStreamClients.delete(client);
    }
  }
}

module.exports = router;
module.exports.pushAlertToClients = pushAlertToClients;
