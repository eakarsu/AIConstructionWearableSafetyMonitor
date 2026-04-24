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
    const result = await pool.query('SELECT * FROM maintenance ORDER BY created_at DESC');
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/:id', auth, async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM maintenance WHERE id = $1', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Not found' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/', auth, async (req, res) => {
  try {
    const { equipment_name, type, location, health_score, vibration_level, temperature, usage_hours, predicted_failure, status, ai_recommendation } = req.body;
    const result = await pool.query(
      'INSERT INTO maintenance (equipment_name, type, location, health_score, vibration_level, temperature, usage_hours, predicted_failure, status, ai_recommendation) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) RETURNING *',
      [equipment_name, type, location, health_score, vibration_level, temperature, usage_hours, predicted_failure, status, ai_recommendation]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/:id', auth, async (req, res) => {
  try {
    const { equipment_name, type, location, health_score, vibration_level, temperature, usage_hours, predicted_failure, status, ai_recommendation } = req.body;
    const result = await pool.query(
      'UPDATE maintenance SET equipment_name=$1, type=$2, location=$3, health_score=$4, vibration_level=$5, temperature=$6, usage_hours=$7, predicted_failure=$8, status=$9, ai_recommendation=$10, updated_at=NOW() WHERE id=$11 RETURNING *',
      [equipment_name, type, location, health_score, vibration_level, temperature, usage_hours, predicted_failure, status, ai_recommendation, req.params.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Not found' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/:id', auth, async (req, res) => {
  try {
    const result = await pool.query('DELETE FROM maintenance WHERE id = $1 RETURNING *', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Not found' });
    res.json({ message: 'Deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/:id/analyze', auth, async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM maintenance WHERE id = $1', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Not found' });
    const m = result.rows[0];
    const analysis = await callOpenRouter(
      'You are a construction safety AI expert specializing in predictive maintenance and equipment reliability. Analyze equipment health data and provide failure probability assessment, maintenance scheduling recommendations, and cost-benefit analysis.',
      `Analyze this predictive maintenance data:\nEquipment: ${m.equipment_name}\nType: ${m.type}\nLocation: ${m.location}\nHealth Score: ${m.health_score}/100\nVibration Level: ${m.vibration_level} mm/s\nTemperature: ${m.temperature}°F\nUsage Hours: ${m.usage_hours}\nPredicted Failure: ${m.predicted_failure}\nStatus: ${m.status}`
    );
    res.json({ maintenance: m, analysis });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
