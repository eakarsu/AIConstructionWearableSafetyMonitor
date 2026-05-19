const router = require('express').Router();
const pool = require('../db');
const auth = require('../middleware/auth');
const axios = require('axios');
const { sendEmergencyAlert } = require('../services/alertService');

const VALID_SEVERITIES = ['low', 'medium', 'high', 'critical'];

const callOpenRouter = async (systemPrompt, userMessage) => {
  const response = await axios.post('https://openrouter.ai/api/v1/chat/completions', {
    model: process.env.OPENROUTER_MODEL,
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userMessage }
    ]
  }, {
    headers: {
      'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
      'Content-Type': 'application/json'
    }
  });
  return response.data.choices[0].message.content;
};

// GET all — with pagination (?page=1&limit=20)
router.get('/', auth, async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 20));
    const offset = (page - 1) * limit;

    const [dataResult, countResult] = await Promise.all([
      pool.query('SELECT * FROM incidents ORDER BY created_at DESC LIMIT $1 OFFSET $2', [limit, offset]),
      pool.query('SELECT COUNT(*) AS total FROM incidents')
    ]);

    const total = parseInt(countResult.rows[0].total);
    res.json({
      data: dataResult.rows,
      pagination: { page, limit, total, total_pages: Math.ceil(total / limit) }
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/:id', auth, async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM incidents WHERE id = $1', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Not found' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST — with input validation + alert on incident creation
router.post('/', auth, async (req, res) => {
  try {
    const { title, type, severity, location, worker_name, description, injuries, status, ai_analysis } = req.body;

    if (!title || typeof title !== 'string' || title.trim() === '') {
      return res.status(400).json({ error: 'title is required' });
    }
    if (!type || typeof type !== 'string' || type.trim() === '') {
      return res.status(400).json({ error: 'type is required' });
    }
    if (!severity || !VALID_SEVERITIES.includes(severity)) {
      return res.status(400).json({ error: `severity must be one of: ${VALID_SEVERITIES.join(', ')}` });
    }
    if (!location || typeof location !== 'string' || location.trim() === '') {
      return res.status(400).json({ error: 'location is required' });
    }

    const result = await pool.query(
      'INSERT INTO incidents (title, type, severity, location, worker_name, description, injuries, status, ai_analysis) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING *',
      [title.trim(), type.trim(), severity, location.trim(), worker_name, description, injuries, status, ai_analysis]
    );

    const incident = result.rows[0];

    // Trigger emergency alert on incident creation (critical/high)
    if (severity === 'critical' || severity === 'high') {
      setImmediate(() => {
        sendEmergencyAlert(location, {
          title: title,
          type: type,
          severity: severity,
          location: location,
          description: description
        }).catch(e => console.error('[alertService] incident alert error:', e.message));
      });
    }

    res.status(201).json(incident);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/:id', auth, async (req, res) => {
  try {
    const { title, type, severity, location, worker_name, description, injuries, status, ai_analysis } = req.body;
    const result = await pool.query(
      'UPDATE incidents SET title=$1, type=$2, severity=$3, location=$4, worker_name=$5, description=$6, injuries=$7, status=$8, ai_analysis=$9, updated_at=NOW() WHERE id=$10 RETURNING *',
      [title, type, severity, location, worker_name, description, injuries, status, ai_analysis, req.params.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Not found' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/:id', auth, async (req, res) => {
  try {
    const result = await pool.query('DELETE FROM incidents WHERE id = $1 RETURNING *', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Not found' });
    res.json({ message: 'Deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/:id/analyze', auth, async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM incidents WHERE id = $1', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Not found' });
    const incident = result.rows[0];
    const analysis = await callOpenRouter(
      'You are a construction safety AI expert specializing in incident investigation and root cause analysis. Analyze the incident and provide root cause analysis, contributing factors, corrective actions, and prevention strategies.',
      `Analyze this safety incident:\nTitle: ${incident.title}\nType: ${incident.type}\nSeverity: ${incident.severity}\nLocation: ${incident.location}\nWorker: ${incident.worker_name}\nDescription: ${incident.description}\nInjuries: ${incident.injuries}\nStatus: ${incident.status}`
    );
    res.json({ incident, analysis });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
