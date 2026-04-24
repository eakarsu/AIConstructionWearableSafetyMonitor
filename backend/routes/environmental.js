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
    const result = await pool.query('SELECT * FROM environmental ORDER BY created_at DESC');
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/:id', auth, async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM environmental WHERE id = $1', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Not found' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/', auth, async (req, res) => {
  try {
    const { zone, temperature, humidity, wind_speed, visibility, uv_index, weather, status, ai_recommendation } = req.body;
    const result = await pool.query(
      'INSERT INTO environmental (zone, temperature, humidity, wind_speed, visibility, uv_index, weather, status, ai_recommendation) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING *',
      [zone, temperature, humidity, wind_speed, visibility, uv_index, weather, status, ai_recommendation]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/:id', auth, async (req, res) => {
  try {
    const { zone, temperature, humidity, wind_speed, visibility, uv_index, weather, status, ai_recommendation } = req.body;
    const result = await pool.query(
      'UPDATE environmental SET zone=$1, temperature=$2, humidity=$3, wind_speed=$4, visibility=$5, uv_index=$6, weather=$7, status=$8, ai_recommendation=$9, updated_at=NOW() WHERE id=$10 RETURNING *',
      [zone, temperature, humidity, wind_speed, visibility, uv_index, weather, status, ai_recommendation, req.params.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Not found' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/:id', auth, async (req, res) => {
  try {
    const result = await pool.query('DELETE FROM environmental WHERE id = $1 RETURNING *', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Not found' });
    res.json({ message: 'Deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/:id/analyze', auth, async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM environmental WHERE id = $1', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Not found' });
    const env = result.rows[0];
    const analysis = await callOpenRouter(
      'You are a construction safety AI expert specializing in environmental monitoring. Analyze conditions and provide weather-related safety recommendations, work modification suggestions, and risk levels.',
      `Analyze these environmental conditions:\nZone: ${env.zone}\nTemperature: ${env.temperature}°F\nHumidity: ${env.humidity}%\nWind Speed: ${env.wind_speed} mph\nVisibility: ${env.visibility} miles\nUV Index: ${env.uv_index}\nWeather: ${env.weather}\nStatus: ${env.status}`
    );
    res.json({ environmental: env, analysis });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
