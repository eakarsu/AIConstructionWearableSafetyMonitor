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
    const result = await pool.query('SELECT * FROM heatstress ORDER BY created_at DESC');
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/:id', auth, async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM heatstress WHERE id = $1', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Not found' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/', auth, async (req, res) => {
  try {
    const { worker_name, zone, body_temp, ambient_temp, humidity, wbgt_index, hydration_level, work_rest_ratio, status, ai_recommendation } = req.body;
    const result = await pool.query(
      'INSERT INTO heatstress (worker_name, zone, body_temp, ambient_temp, humidity, wbgt_index, hydration_level, work_rest_ratio, status, ai_recommendation) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) RETURNING *',
      [worker_name, zone, body_temp, ambient_temp, humidity, wbgt_index, hydration_level, work_rest_ratio, status, ai_recommendation]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/:id', auth, async (req, res) => {
  try {
    const { worker_name, zone, body_temp, ambient_temp, humidity, wbgt_index, hydration_level, work_rest_ratio, status, ai_recommendation } = req.body;
    const result = await pool.query(
      'UPDATE heatstress SET worker_name=$1, zone=$2, body_temp=$3, ambient_temp=$4, humidity=$5, wbgt_index=$6, hydration_level=$7, work_rest_ratio=$8, status=$9, ai_recommendation=$10, updated_at=NOW() WHERE id=$11 RETURNING *',
      [worker_name, zone, body_temp, ambient_temp, humidity, wbgt_index, hydration_level, work_rest_ratio, status, ai_recommendation, req.params.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Not found' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/:id', auth, async (req, res) => {
  try {
    const result = await pool.query('DELETE FROM heatstress WHERE id = $1 RETURNING *', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Not found' });
    res.json({ message: 'Deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/:id/analyze', auth, async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM heatstress WHERE id = $1', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Not found' });
    const h = result.rows[0];
    const analysis = await callOpenRouter(
      'You are a construction safety AI expert specializing in heat stress monitoring and prevention. Analyze the heat stress data and provide risk assessment, hydration recommendations, work-rest cycle adjustments, and emergency interventions if needed.',
      `Analyze this heat stress monitoring data:\nWorker: ${h.worker_name}\nZone: ${h.zone}\nBody Temp: ${h.body_temp}°F\nAmbient Temp: ${h.ambient_temp}°F\nHumidity: ${h.humidity}%\nWBGT Index: ${h.wbgt_index}\nHydration Level: ${h.hydration_level}%\nWork-Rest Ratio: ${h.work_rest_ratio}\nStatus: ${h.status}`
    );
    res.json({ heatstress: h, analysis });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
