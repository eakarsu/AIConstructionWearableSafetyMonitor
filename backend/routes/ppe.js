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
    const result = await pool.query('SELECT * FROM ppe ORDER BY created_at DESC');
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/:id', auth, async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM ppe WHERE id = $1', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Not found' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/', auth, async (req, res) => {
  try {
    const { worker_name, role, zone, helmet, vest, gloves, boots, goggles, harness, compliance_score, status, ai_note } = req.body;
    const result = await pool.query(
      'INSERT INTO ppe (worker_name, role, zone, helmet, vest, gloves, boots, goggles, harness, compliance_score, status, ai_note) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12) RETURNING *',
      [worker_name, role, zone, helmet, vest, gloves, boots, goggles, harness, compliance_score, status, ai_note]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/:id', auth, async (req, res) => {
  try {
    const { worker_name, role, zone, helmet, vest, gloves, boots, goggles, harness, compliance_score, status, ai_note } = req.body;
    const result = await pool.query(
      'UPDATE ppe SET worker_name=$1, role=$2, zone=$3, helmet=$4, vest=$5, gloves=$6, boots=$7, goggles=$8, harness=$9, compliance_score=$10, status=$11, ai_note=$12, updated_at=NOW() WHERE id=$13 RETURNING *',
      [worker_name, role, zone, helmet, vest, gloves, boots, goggles, harness, compliance_score, status, ai_note, req.params.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Not found' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/:id', auth, async (req, res) => {
  try {
    const result = await pool.query('DELETE FROM ppe WHERE id = $1 RETURNING *', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Not found' });
    res.json({ message: 'Deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/:id/analyze', auth, async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM ppe WHERE id = $1', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Not found' });
    const p = result.rows[0];
    const analysis = await callOpenRouter(
      'You are a construction safety AI expert specializing in PPE compliance monitoring. Analyze the PPE compliance data and provide recommendations for improving compliance, identify risks from missing equipment, and suggest corrective actions.',
      `Analyze this PPE compliance record:\nWorker: ${p.worker_name}\nRole: ${p.role}\nZone: ${p.zone}\nHelmet: ${p.helmet}\nVest: ${p.vest}\nGloves: ${p.gloves}\nBoots: ${p.boots}\nGoggles: ${p.goggles}\nHarness: ${p.harness}\nCompliance Score: ${p.compliance_score}%\nStatus: ${p.status}`
    );
    res.json({ ppe: p, analysis });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
