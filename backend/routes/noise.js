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
    const result = await pool.query('SELECT * FROM noise ORDER BY created_at DESC');
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/:id', auth, async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM noise WHERE id = $1', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Not found' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/', auth, async (req, res) => {
  try {
    const { zone, location, decibel_level, peak_level, duration_hours, exposure_limit, hearing_protection, workers_affected, status, ai_recommendation } = req.body;
    const result = await pool.query(
      'INSERT INTO noise (zone, location, decibel_level, peak_level, duration_hours, exposure_limit, hearing_protection, workers_affected, status, ai_recommendation) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) RETURNING *',
      [zone, location, decibel_level, peak_level, duration_hours, exposure_limit, hearing_protection, workers_affected, status, ai_recommendation]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/:id', auth, async (req, res) => {
  try {
    const { zone, location, decibel_level, peak_level, duration_hours, exposure_limit, hearing_protection, workers_affected, status, ai_recommendation } = req.body;
    const result = await pool.query(
      'UPDATE noise SET zone=$1, location=$2, decibel_level=$3, peak_level=$4, duration_hours=$5, exposure_limit=$6, hearing_protection=$7, workers_affected=$8, status=$9, ai_recommendation=$10, updated_at=NOW() WHERE id=$11 RETURNING *',
      [zone, location, decibel_level, peak_level, duration_hours, exposure_limit, hearing_protection, workers_affected, status, ai_recommendation, req.params.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Not found' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/:id', auth, async (req, res) => {
  try {
    const result = await pool.query('DELETE FROM noise WHERE id = $1 RETURNING *', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Not found' });
    res.json({ message: 'Deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/:id/analyze', auth, async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM noise WHERE id = $1', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Not found' });
    const n = result.rows[0];
    const analysis = await callOpenRouter(
      'You are a construction safety AI expert specializing in noise exposure monitoring and hearing conservation. Analyze noise levels and provide OSHA compliance assessment, hearing protection recommendations, and exposure reduction strategies.',
      `Analyze this noise exposure data:\nZone: ${n.zone}\nLocation: ${n.location}\nDecibel Level: ${n.decibel_level} dB\nPeak Level: ${n.peak_level} dB\nDuration: ${n.duration_hours} hours\nExposure Limit: ${n.exposure_limit} dB\nHearing Protection: ${n.hearing_protection}\nWorkers Affected: ${n.workers_affected}\nStatus: ${n.status}`
    );
    res.json({ noise: n, analysis });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
