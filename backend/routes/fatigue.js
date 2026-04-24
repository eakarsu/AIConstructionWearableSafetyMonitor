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
    const result = await pool.query('SELECT * FROM fatigue ORDER BY created_at DESC');
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/:id', auth, async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM fatigue WHERE id = $1', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Not found' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/', auth, async (req, res) => {
  try {
    const { worker_name, role, shift_start, hours_worked, fatigue_score, heart_rate_variability, reaction_time, status, ai_recommendation } = req.body;
    const result = await pool.query(
      'INSERT INTO fatigue (worker_name, role, shift_start, hours_worked, fatigue_score, heart_rate_variability, reaction_time, status, ai_recommendation) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING *',
      [worker_name, role, shift_start, hours_worked, fatigue_score, heart_rate_variability, reaction_time, status, ai_recommendation]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/:id', auth, async (req, res) => {
  try {
    const { worker_name, role, shift_start, hours_worked, fatigue_score, heart_rate_variability, reaction_time, status, ai_recommendation } = req.body;
    const result = await pool.query(
      'UPDATE fatigue SET worker_name=$1, role=$2, shift_start=$3, hours_worked=$4, fatigue_score=$5, heart_rate_variability=$6, reaction_time=$7, status=$8, ai_recommendation=$9, updated_at=NOW() WHERE id=$10 RETURNING *',
      [worker_name, role, shift_start, hours_worked, fatigue_score, heart_rate_variability, reaction_time, status, ai_recommendation, req.params.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Not found' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/:id', auth, async (req, res) => {
  try {
    const result = await pool.query('DELETE FROM fatigue WHERE id = $1 RETURNING *', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Not found' });
    res.json({ message: 'Deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/:id/analyze', auth, async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM fatigue WHERE id = $1', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Not found' });
    const f = result.rows[0];
    const analysis = await callOpenRouter(
      'You are a construction safety AI expert specializing in worker fatigue detection and management. Analyze fatigue indicators and provide recommendations for rest schedules, task reassignment, and safety interventions.',
      `Analyze this worker fatigue data:\nWorker: ${f.worker_name}\nRole: ${f.role}\nShift Start: ${f.shift_start}\nHours Worked: ${f.hours_worked}\nFatigue Score: ${f.fatigue_score}/100\nHeart Rate Variability: ${f.heart_rate_variability} ms\nReaction Time: ${f.reaction_time} ms\nStatus: ${f.status}`
    );
    res.json({ fatigue: f, analysis });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
