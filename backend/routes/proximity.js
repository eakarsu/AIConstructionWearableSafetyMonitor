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

router.get('/', auth, async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM proximity ORDER BY created_at DESC');
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/:id', auth, async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM proximity WHERE id = $1', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Not found' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/', auth, async (req, res) => {
  try {
    const { worker_name, zone, equipment_nearby, distance, alert_type, speed, status, severity, ai_recommendation } = req.body;
    const result = await pool.query(
      'INSERT INTO proximity (worker_name, zone, equipment_nearby, distance, alert_type, speed, status, severity, ai_recommendation) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING *',
      [worker_name, zone, equipment_nearby, distance, alert_type, speed, status, severity, ai_recommendation]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/:id', auth, async (req, res) => {
  try {
    const { worker_name, zone, equipment_nearby, distance, alert_type, speed, status, severity, ai_recommendation } = req.body;
    const result = await pool.query(
      'UPDATE proximity SET worker_name=$1, zone=$2, equipment_nearby=$3, distance=$4, alert_type=$5, speed=$6, status=$7, severity=$8, ai_recommendation=$9, updated_at=NOW() WHERE id=$10 RETURNING *',
      [worker_name, zone, equipment_nearby, distance, alert_type, speed, status, severity, ai_recommendation, req.params.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Not found' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/:id', auth, async (req, res) => {
  try {
    const result = await pool.query('DELETE FROM proximity WHERE id = $1 RETURNING *', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Not found' });
    res.json({ message: 'Deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/:id/analyze', auth, async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM proximity WHERE id = $1', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Not found' });
    const p = result.rows[0];
    const analysis = await callOpenRouter(
      'You are a construction safety AI expert specializing in proximity detection and collision avoidance. Analyze the proximity alert and provide collision risk assessment, immediate safety actions, and zone management recommendations.',
      `Analyze this proximity alert:\nWorker: ${p.worker_name}\nZone: ${p.zone}\nEquipment Nearby: ${p.equipment_nearby}\nDistance: ${p.distance} ft\nAlert Type: ${p.alert_type}\nSpeed: ${p.speed} mph\nStatus: ${p.status}\nSeverity: ${p.severity}`
    );
    res.json({ proximity: p, analysis });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
