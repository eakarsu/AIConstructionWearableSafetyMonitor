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

// GET all
router.get('/', auth, async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM workers ORDER BY created_at DESC');
    res.json(result.rows);
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

// POST
router.post('/', auth, async (req, res) => {
  try {
    const { name, role, site, heart_rate, body_temp, oxygen_level, location, status, risk_level } = req.body;
    const result = await pool.query(
      'INSERT INTO workers (name, role, site, heart_rate, body_temp, oxygen_level, location, status, risk_level) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING *',
      [name, role, site, heart_rate, body_temp, oxygen_level, location, status, risk_level]
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
