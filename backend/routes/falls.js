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
    const result = await pool.query('SELECT * FROM falls ORDER BY created_at DESC');
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/:id', auth, async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM falls WHERE id = $1', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Not found' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/', auth, async (req, res) => {
  try {
    const { worker_name, location, zone, fall_height, impact_force, sensor_triggered, response_time, status, severity, ai_assessment } = req.body;
    const result = await pool.query(
      'INSERT INTO falls (worker_name, location, zone, fall_height, impact_force, sensor_triggered, response_time, status, severity, ai_assessment) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) RETURNING *',
      [worker_name, location, zone, fall_height, impact_force, sensor_triggered, response_time, status, severity, ai_assessment]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/:id', auth, async (req, res) => {
  try {
    const { worker_name, location, zone, fall_height, impact_force, sensor_triggered, response_time, status, severity, ai_assessment } = req.body;
    const result = await pool.query(
      'UPDATE falls SET worker_name=$1, location=$2, zone=$3, fall_height=$4, impact_force=$5, sensor_triggered=$6, response_time=$7, status=$8, severity=$9, ai_assessment=$10, updated_at=NOW() WHERE id=$11 RETURNING *',
      [worker_name, location, zone, fall_height, impact_force, sensor_triggered, response_time, status, severity, ai_assessment, req.params.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Not found' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/:id', auth, async (req, res) => {
  try {
    const result = await pool.query('DELETE FROM falls WHERE id = $1 RETURNING *', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Not found' });
    res.json({ message: 'Deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/:id/analyze', auth, async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM falls WHERE id = $1', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Not found' });
    const f = result.rows[0];
    const analysis = await callOpenRouter(
      'You are a construction safety AI expert specializing in fall detection and prevention. Analyze the fall event data and provide injury risk assessment, immediate response recommendations, and fall prevention strategies.',
      `Analyze this fall detection event:\nWorker: ${f.worker_name}\nLocation: ${f.location}\nZone: ${f.zone}\nFall Height: ${f.fall_height} ft\nImpact Force: ${f.impact_force} G\nSensor Triggered: ${f.sensor_triggered}\nResponse Time: ${f.response_time} sec\nStatus: ${f.status}\nSeverity: ${f.severity}`
    );
    res.json({ fall: f, analysis });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
