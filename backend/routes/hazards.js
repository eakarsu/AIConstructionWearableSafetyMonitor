const router = require('express').Router();
const pool = require('../db');
const auth = require('../middleware/auth');
const axios = require('axios');
const { sendSafetyAlert } = require('../services/alertService');

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
      pool.query('SELECT * FROM hazards ORDER BY created_at DESC LIMIT $1 OFFSET $2', [limit, offset]),
      pool.query('SELECT COUNT(*) AS total FROM hazards')
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
    const result = await pool.query('SELECT * FROM hazards WHERE id = $1', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Not found' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST — with input validation + alert on critical/high hazard
router.post('/', auth, async (req, res) => {
  try {
    const { type, severity, location, zone, description, detected_by, status, ai_recommendation } = req.body;

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
      'INSERT INTO hazards (type, severity, location, zone, description, detected_by, status, ai_recommendation) VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING *',
      [type.trim(), severity, location.trim(), zone, description, detected_by, status, ai_recommendation]
    );

    const hazard = result.rows[0];

    // Trigger alert on critical/high hazard detection
    if (severity === 'critical' || severity === 'high') {
      setImmediate(() => {
        sendSafetyAlert(
          detected_by || 'system',
          'critical_hazard_detection',
          `${severity.toUpperCase()} hazard detected: ${type} at ${location}${zone ? ` (Zone: ${zone})` : ''}. ${description || ''}`
        ).catch(e => console.error('[alertService] hazard alert error:', e.message));
      });
    }

    res.status(201).json(hazard);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/:id', auth, async (req, res) => {
  try {
    const { type, severity, location, zone, description, detected_by, status, ai_recommendation } = req.body;

    if (severity !== undefined && !VALID_SEVERITIES.includes(severity)) {
      return res.status(400).json({ error: `severity must be one of: ${VALID_SEVERITIES.join(', ')}` });
    }

    const result = await pool.query(
      'UPDATE hazards SET type=$1, severity=$2, location=$3, zone=$4, description=$5, detected_by=$6, status=$7, ai_recommendation=$8, updated_at=NOW() WHERE id=$9 RETURNING *',
      [type, severity, location, zone, description, detected_by, status, ai_recommendation, req.params.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Not found' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/:id', auth, async (req, res) => {
  try {
    const result = await pool.query('DELETE FROM hazards WHERE id = $1 RETURNING *', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Not found' });
    res.json({ message: 'Deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/:id/analyze', auth, async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM hazards WHERE id = $1', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Not found' });
    const hazard = result.rows[0];
    const analysis = await callOpenRouter(
      'You are a construction safety AI expert specializing in hazard detection and mitigation. Analyze the hazard data and provide detailed risk assessment, mitigation strategies, and immediate action items.',
      `Analyze this detected hazard:\nType: ${hazard.type}\nSeverity: ${hazard.severity}\nLocation: ${hazard.location}\nZone: ${hazard.zone}\nDescription: ${hazard.description}\nDetected By: ${hazard.detected_by}\nStatus: ${hazard.status}`
    );
    res.json({ hazard, analysis });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
