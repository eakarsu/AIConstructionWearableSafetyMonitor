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
    const result = await pool.query('SELECT * FROM incidents ORDER BY created_at DESC');
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/:id', auth, async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM incidents WHERE id = $1', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Not found' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/', auth, async (req, res) => {
  try {
    const { title, type, severity, location, worker_name, description, injuries, status, ai_analysis } = req.body;
    const result = await pool.query(
      'INSERT INTO incidents (title, type, severity, location, worker_name, description, injuries, status, ai_analysis) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING *',
      [title, type, severity, location, worker_name, description, injuries, status, ai_analysis]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/:id', auth, async (req, res) => {
  try {
    const { title, type, severity, location, worker_name, description, injuries, status, ai_analysis } = req.body;
    const result = await pool.query(
      'UPDATE incidents SET title=$1, type=$2, severity=$3, location=$4, worker_name=$5, description=$6, injuries=$7, status=$8, ai_analysis=$9, updated_at=NOW() WHERE id=$10 RETURNING *',
      [title, type, severity, location, worker_name, description, injuries, status, ai_analysis, req.params.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Not found' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/:id', auth, async (req, res) => {
  try {
    const result = await pool.query('DELETE FROM incidents WHERE id = $1 RETURNING *', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Not found' });
    res.json({ message: 'Deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/:id/analyze', auth, async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM incidents WHERE id = $1', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Not found' });
    const incident = result.rows[0];
    const analysis = await callOpenRouter(
      'You are a construction safety AI expert specializing in incident investigation and root cause analysis. Analyze the incident and provide root cause analysis, contributing factors, corrective actions, and prevention strategies.',
      `Analyze this safety incident:\nTitle: ${incident.title}\nType: ${incident.type}\nSeverity: ${incident.severity}\nLocation: ${incident.location}\nWorker: ${incident.worker_name}\nDescription: ${incident.description}\nInjuries: ${incident.injuries}\nStatus: ${incident.status}`
    );
    res.json({ incident, analysis });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
