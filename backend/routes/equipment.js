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

// GET all — with pagination (?page=1&limit=20)
router.get('/', auth, async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 20));
    const offset = (page - 1) * limit;

    const [dataResult, countResult] = await Promise.all([
      pool.query('SELECT * FROM equipment ORDER BY created_at DESC LIMIT $1 OFFSET $2', [limit, offset]),
      pool.query('SELECT COUNT(*) AS total FROM equipment')
    ]);

    const total = parseInt(countResult.rows[0].total);
    res.json({
      data: dataResult.rows,
      pagination: { page, limit, total, total_pages: Math.ceil(total / limit) }
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/:id', auth, async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM equipment WHERE id = $1', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Not found' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST — with input validation
router.post('/', auth, async (req, res) => {
  try {
    const { name, type, serial_number, location, last_inspection, next_inspection, condition, inspector, status, ai_assessment } = req.body;

    if (!name || typeof name !== 'string' || name.trim() === '') {
      return res.status(400).json({ error: 'name is required' });
    }
    if (!type || typeof type !== 'string' || type.trim() === '') {
      return res.status(400).json({ error: 'type is required' });
    }

    const result = await pool.query(
      'INSERT INTO equipment (name, type, serial_number, location, last_inspection, next_inspection, condition, inspector, status, ai_assessment) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) RETURNING *',
      [name.trim(), type.trim(), serial_number, location, last_inspection, next_inspection, condition, inspector, status, ai_assessment]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/:id', auth, async (req, res) => {
  try {
    const { name, type, serial_number, location, last_inspection, next_inspection, condition, inspector, status, ai_assessment } = req.body;
    const result = await pool.query(
      'UPDATE equipment SET name=$1, type=$2, serial_number=$3, location=$4, last_inspection=$5, next_inspection=$6, condition=$7, inspector=$8, status=$9, ai_assessment=$10, updated_at=NOW() WHERE id=$11 RETURNING *',
      [name, type, serial_number, location, last_inspection, next_inspection, condition, inspector, status, ai_assessment, req.params.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Not found' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/:id', auth, async (req, res) => {
  try {
    const result = await pool.query('DELETE FROM equipment WHERE id = $1 RETURNING *', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Not found' });
    res.json({ message: 'Deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/:id/analyze', auth, async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM equipment WHERE id = $1', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Not found' });
    const equip = result.rows[0];
    const analysis = await callOpenRouter(
      'You are a construction safety AI expert specializing in equipment inspection and maintenance. Analyze the equipment data and provide condition assessment, maintenance recommendations, and safety compliance status.',
      `Analyze this equipment inspection record:\nName: ${equip.name}\nType: ${equip.type}\nSerial: ${equip.serial_number}\nLocation: ${equip.location}\nLast Inspection: ${equip.last_inspection}\nNext Inspection: ${equip.next_inspection}\nCondition: ${equip.condition}\nInspector: ${equip.inspector}\nStatus: ${equip.status}`
    );
    res.json({ equipment: equip, analysis });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
