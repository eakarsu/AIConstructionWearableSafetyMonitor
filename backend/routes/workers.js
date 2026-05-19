const router = require('express').Router();
const pool = require('../db');
const auth = require('../middleware/auth');
const axios = require('axios');

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
      pool.query('SELECT * FROM workers ORDER BY created_at DESC LIMIT $1 OFFSET $2', [limit, offset]),
      pool.query('SELECT COUNT(*) AS total FROM workers')
    ]);

    const total = parseInt(countResult.rows[0].total);
    res.json({
      data: dataResult.rows,
      pagination: {
        page,
        limit,
        total,
        total_pages: Math.ceil(total / limit)
      }
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET by id
router.get('/:id', auth, async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM workers WHERE id = $1', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Not found' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST — with input validation
router.post('/', auth, async (req, res) => {
  try {
    const { name, role, site, heart_rate, body_temp, oxygen_level, location, status, risk_level } = req.body;

    if (!name || typeof name !== 'string' || name.trim() === '') {
      return res.status(400).json({ error: 'name is required and must be a non-empty string' });
    }
    if (!role || typeof role !== 'string') {
      return res.status(400).json({ error: 'role is required' });
    }
    if (!site || typeof site !== 'string') {
      return res.status(400).json({ error: 'site is required' });
    }
    if (heart_rate !== undefined && (isNaN(heart_rate) || heart_rate < 0 || heart_rate > 300)) {
      return res.status(400).json({ error: 'heart_rate must be a number between 0 and 300' });
    }
    if (body_temp !== undefined && (isNaN(body_temp) || body_temp < 90 || body_temp > 115)) {
      return res.status(400).json({ error: 'body_temp must be a number between 90 and 115 (°F)' });
    }
    if (oxygen_level !== undefined && (isNaN(oxygen_level) || oxygen_level < 0 || oxygen_level > 100)) {
      return res.status(400).json({ error: 'oxygen_level must be a number between 0 and 100' });
    }

    const result = await pool.query(
      'INSERT INTO workers (name, role, site, heart_rate, body_temp, oxygen_level, location, status, risk_level) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING *',
      [name.trim(), role, site, heart_rate, body_temp, oxygen_level, location, status, risk_level]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT
router.put('/:id', auth, async (req, res) => {
  try {
    const { name, role, site, heart_rate, body_temp, oxygen_level, location, status, risk_level } = req.body;

    if (name !== undefined && (typeof name !== 'string' || name.trim() === '')) {
      return res.status(400).json({ error: 'name must be a non-empty string' });
    }
    if (heart_rate !== undefined && (isNaN(heart_rate) || heart_rate < 0 || heart_rate > 300)) {
      return res.status(400).json({ error: 'heart_rate must be a number between 0 and 300' });
    }
    if (body_temp !== undefined && (isNaN(body_temp) || body_temp < 90 || body_temp > 115)) {
      return res.status(400).json({ error: 'body_temp must be a number between 90 and 115 (°F)' });
    }
    if (oxygen_level !== undefined && (isNaN(oxygen_level) || oxygen_level < 0 || oxygen_level > 100)) {
      return res.status(400).json({ error: 'oxygen_level must be a number between 0 and 100' });
    }

    const result = await pool.query(
      'UPDATE workers SET name=$1, role=$2, site=$3, heart_rate=$4, body_temp=$5, oxygen_level=$6, location=$7, status=$8, risk_level=$9, updated_at=NOW() WHERE id=$10 RETURNING *',
      [name, role, site, heart_rate, body_temp, oxygen_level, location, status, risk_level, req.params.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Not found' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE
router.delete('/:id', auth, async (req, res) => {
  try {
    const result = await pool.query('DELETE FROM workers WHERE id = $1 RETURNING *', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Not found' });
    res.json({ message: 'Deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST analyze
router.post('/:id/analyze', auth, async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM workers WHERE id = $1', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Not found' });
    const worker = result.rows[0];
    const analysis = await callOpenRouter(
      'You are a construction safety AI expert specializing in worker health monitoring via wearable sensors. Analyze the worker data and provide safety recommendations, risk assessment, and actionable insights. Be specific and concise.',
      `Analyze this worker's wearable sensor data:\nName: ${worker.name}\nRole: ${worker.role}\nSite: ${worker.site}\nHeart Rate: ${worker.heart_rate} bpm\nBody Temperature: ${worker.body_temp}°F\nOxygen Level: ${worker.oxygen_level}%\nLocation: ${worker.location}\nStatus: ${worker.status}\nRisk Level: ${worker.risk_level}`
    );
    res.json({ worker, analysis });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
