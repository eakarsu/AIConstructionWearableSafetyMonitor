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
    const result = await pool.query('SELECT * FROM airquality ORDER BY created_at DESC');
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/:id', auth, async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM airquality WHERE id = $1', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Not found' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/', auth, async (req, res) => {
  try {
    const { zone, location, pm25, pm10, co_level, no2_level, o3_level, voc_level, aqi_index, status, ai_recommendation } = req.body;
    const result = await pool.query(
      'INSERT INTO airquality (zone, location, pm25, pm10, co_level, no2_level, o3_level, voc_level, aqi_index, status, ai_recommendation) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11) RETURNING *',
      [zone, location, pm25, pm10, co_level, no2_level, o3_level, voc_level, aqi_index, status, ai_recommendation]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/:id', auth, async (req, res) => {
  try {
    const { zone, location, pm25, pm10, co_level, no2_level, o3_level, voc_level, aqi_index, status, ai_recommendation } = req.body;
    const result = await pool.query(
      'UPDATE airquality SET zone=$1, location=$2, pm25=$3, pm10=$4, co_level=$5, no2_level=$6, o3_level=$7, voc_level=$8, aqi_index=$9, status=$10, ai_recommendation=$11, updated_at=NOW() WHERE id=$12 RETURNING *',
      [zone, location, pm25, pm10, co_level, no2_level, o3_level, voc_level, aqi_index, status, ai_recommendation, req.params.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Not found' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/:id', auth, async (req, res) => {
  try {
    const result = await pool.query('DELETE FROM airquality WHERE id = $1 RETURNING *', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Not found' });
    res.json({ message: 'Deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/:id/analyze', auth, async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM airquality WHERE id = $1', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Not found' });
    const a = result.rows[0];
    const analysis = await callOpenRouter(
      'You are a construction safety AI expert specializing in air quality monitoring and respiratory protection. Analyze air quality data and provide health risk assessment, respiratory protection recommendations, and ventilation strategies.',
      `Analyze this air quality data:\nZone: ${a.zone}\nLocation: ${a.location}\nPM2.5: ${a.pm25} µg/m³\nPM10: ${a.pm10} µg/m³\nCO Level: ${a.co_level} ppm\nNO2 Level: ${a.no2_level} ppb\nO3 Level: ${a.o3_level} ppb\nVOC Level: ${a.voc_level} ppb\nAQI Index: ${a.aqi_index}\nStatus: ${a.status}`
    );
    res.json({ airquality: a, analysis });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
