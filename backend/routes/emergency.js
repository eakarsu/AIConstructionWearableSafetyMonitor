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
    const result = await pool.query('SELECT * FROM emergency ORDER BY created_at DESC');
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/:id', auth, async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM emergency WHERE id = $1', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Not found' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/', auth, async (req, res) => {
  try {
    const { type, zone, severity, trigger, responders_needed, evacuation_route, assembly_point, status, response_time, ai_protocol } = req.body;
    const result = await pool.query(
      'INSERT INTO emergency (type, zone, severity, trigger, responders_needed, evacuation_route, assembly_point, status, response_time, ai_protocol) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) RETURNING *',
      [type, zone, severity, trigger, responders_needed, evacuation_route, assembly_point, status, response_time, ai_protocol]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/:id', auth, async (req, res) => {
  try {
    const { type, zone, severity, trigger, responders_needed, evacuation_route, assembly_point, status, response_time, ai_protocol } = req.body;
    const result = await pool.query(
      'UPDATE emergency SET type=$1, zone=$2, severity=$3, trigger=$4, responders_needed=$5, evacuation_route=$6, assembly_point=$7, status=$8, response_time=$9, ai_protocol=$10, updated_at=NOW() WHERE id=$11 RETURNING *',
      [type, zone, severity, trigger, responders_needed, evacuation_route, assembly_point, status, response_time, ai_protocol, req.params.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Not found' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/:id', auth, async (req, res) => {
  try {
    const result = await pool.query('DELETE FROM emergency WHERE id = $1 RETURNING *', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Not found' });
    res.json({ message: 'Deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/:id/analyze', auth, async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM emergency WHERE id = $1', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Not found' });
    const e = result.rows[0];
    const analysis = await callOpenRouter(
      'You are a construction safety AI expert specializing in emergency response planning. Analyze the emergency plan and provide readiness assessment, response optimization, resource allocation, and drill recommendations.',
      `Analyze this emergency response plan:\nType: ${e.type}\nZone: ${e.zone}\nSeverity: ${e.severity}\nTrigger: ${e.trigger}\nResponders Needed: ${e.responders_needed}\nEvacuation Route: ${e.evacuation_route}\nAssembly Point: ${e.assembly_point}\nStatus: ${e.status}\nResponse Time: ${e.response_time} min`
    );
    res.json({ emergency: e, analysis });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
