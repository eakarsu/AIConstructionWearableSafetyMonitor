const router = require('express').Router();
const axios = require('axios');
const auth = require('../middleware/auth');
const { aiRateLimiter } = require('../middleware/rateLimiter');

const SYSTEM_PROMPT = 'You are an expert construction safety analyst specializing in wearable sensor data, OSHA compliance, and worker health monitoring.';
const MODEL = process.env.OPENROUTER_MODEL || 'anthropic/claude-3-5-sonnet-20241022';

async function callOpenRouter(userMessage) {
  if (!process.env.OPENROUTER_API_KEY) {
    const err = new Error('AI service not configured (OPENROUTER_API_KEY missing)');
    err.statusCode = 503;
    throw err;
  }
  const response = await axios.post(
    'https://openrouter.ai/api/v1/chat/completions',
    {
      model: MODEL,
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: userMessage }
      ]
    },
    {
      headers: {
        Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
        'Content-Type': 'application/json'
      },
      timeout: 60000
    }
  );
  return response.data.choices[0].message.content;
}

function handleErr(res, err, label) {
  if (err && err.statusCode === 503) {
    return res.status(503).json({ error: 'AI service unavailable: missing API key' });
  }
  console.error(`${label} error:`, err.response?.data || err.message);
  return res.status(500).json({ error: `Failed to generate ${label}` });
}

// POST /api/ai/predict-collision
router.post('/predict-collision', auth, aiRateLimiter, async (req, res) => {
  try {
    const { worker_positions, equipment_positions, site_zones } = req.body || {};
    const prompt = `Predict potential proximity/collision risks for the next shift.\n\n` +
      `Worker positions: ${JSON.stringify(worker_positions || 'unspecified')}\n` +
      `Equipment positions: ${JSON.stringify(equipment_positions || 'unspecified')}\n` +
      `Site zones: ${JSON.stringify(site_zones || 'unspecified')}\n\n` +
      `Provide:\n1. Top collision risk pairs (worker-equipment / equipment-equipment)\n` +
      `2. Probability score (0-100) and time-to-incident estimate\n` +
      `3. Contributing factors\n4. Recommended exclusion zones / spotter assignments\n` +
      `5. Sensor configuration suggestions for proximity wearables.`;
    const analysis = await callOpenRouter(prompt);
    res.json({ analysis, model: MODEL, generated_at: new Date().toISOString() });
  } catch (err) {
    handleErr(res, err, 'predict-collision');
  }
});

// POST /api/ai/predict-fall
router.post('/predict-fall', auth, aiRateLimiter, async (req, res) => {
  try {
    const { worker_telemetry, work_at_height, harness_status } = req.body || {};
    const prompt = `Predict fall risk from wearable telemetry.\n\n` +
      `Worker telemetry: ${JSON.stringify(worker_telemetry || 'unspecified')}\n` +
      `Work at height context: ${JSON.stringify(work_at_height || 'unspecified')}\n` +
      `Harness/PPE status: ${JSON.stringify(harness_status || 'unspecified')}\n\n` +
      `Provide:\n1. Per-worker fall risk score (0-100)\n2. Top contributing biometric/environmental factors\n` +
      `3. Recommended interventions (rest, harness check, anchor inspection)\n` +
      `4. OSHA fall-protection references\n5. Real-time alert thresholds.`;
    const analysis = await callOpenRouter(prompt);
    res.json({ analysis, model: MODEL, generated_at: new Date().toISOString() });
  } catch (err) {
    handleErr(res, err, 'predict-fall');
  }
});

// POST /api/ai/predictive-maintenance-schedule
router.post('/predictive-maintenance-schedule', auth, aiRateLimiter, async (req, res) => {
  try {
    const { equipment_inventory, recent_telemetry, maintenance_history } = req.body || {};
    const prompt = `Generate a predictive maintenance schedule for site equipment.\n\n` +
      `Equipment inventory: ${JSON.stringify(equipment_inventory || 'unspecified')}\n` +
      `Recent telemetry: ${JSON.stringify(recent_telemetry || 'unspecified')}\n` +
      `Maintenance history: ${JSON.stringify(maintenance_history || 'unspecified')}\n\n` +
      `Provide:\n1. Prioritized maintenance schedule (next 30 days)\n2. Predicted failure windows by asset\n` +
      `3. Required parts/labor per task\n4. Risk if deferred\n5. Cost-optimization recommendations.`;
    const analysis = await callOpenRouter(prompt);
    res.json({ analysis, model: MODEL, generated_at: new Date().toISOString() });
  } catch (err) {
    handleErr(res, err, 'predictive-maintenance-schedule');
  }
});

module.exports = router;
