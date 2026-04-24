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
    const result = await pool.query('SELECT * FROM training ORDER BY created_at DESC');
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/:id', auth, async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM training WHERE id = $1', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Not found' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/', auth, async (req, res) => {
  try {
    const { worker_name, role, certification, training_type, completion_date, expiry_date, score, status, ai_recommendation } = req.body;
    const result = await pool.query(
      'INSERT INTO training (worker_name, role, certification, training_type, completion_date, expiry_date, score, status, ai_recommendation) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING *',
      [worker_name, role, certification, training_type, completion_date, expiry_date, score, status, ai_recommendation]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/:id', auth, async (req, res) => {
  try {
    const { worker_name, role, certification, training_type, completion_date, expiry_date, score, status, ai_recommendation } = req.body;
    const result = await pool.query(
      'UPDATE training SET worker_name=$1, role=$2, certification=$3, training_type=$4, completion_date=$5, expiry_date=$6, score=$7, status=$8, ai_recommendation=$9, updated_at=NOW() WHERE id=$10 RETURNING *',
      [worker_name, role, certification, training_type, completion_date, expiry_date, score, status, ai_recommendation, req.params.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Not found' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/:id', auth, async (req, res) => {
  try {
    const result = await pool.query('DELETE FROM training WHERE id = $1 RETURNING *', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Not found' });
    res.json({ message: 'Deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/:id/analyze', auth, async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM training WHERE id = $1', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Not found' });
    const t = result.rows[0];
    const analysis = await callOpenRouter(
      'You are a construction safety AI expert specializing in training compliance and workforce development. Analyze the training record and provide compliance status, skill gap analysis, and recommended additional training.',
      `Analyze this training compliance record:\nWorker: ${t.worker_name}\nRole: ${t.role}\nCertification: ${t.certification}\nTraining Type: ${t.training_type}\nCompletion Date: ${t.completion_date}\nExpiry Date: ${t.expiry_date}\nScore: ${t.score}%\nStatus: ${t.status}`
    );
    res.json({ training: t, analysis });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
