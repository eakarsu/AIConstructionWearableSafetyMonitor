const router = require('express').Router();
const axios = require('axios');
const auth = require('../middleware/auth');
const { aiRateLimiter } = require('../middleware/rateLimiter');

const SYSTEM_PROMPT = 'You are an expert construction safety analyst specializing in wearable sensor data, OSHA compliance, and worker health monitoring.';
const MODEL = 'anthropic/claude-3-5-sonnet-20241022';

async function callOpenRouter(userMessage) {
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

// Input validation helper
function validateRequired(body, fields) {
  const missing = fields.filter(f => body[f] === undefined || body[f] === null || body[f] === '');
  return missing;
}

/**
 * POST /api/ai/incident-prediction
 * Predicts incident probability for the next 8 hours based on site conditions.
 * Body: { site_id, recent_weather, worker_fatigue_levels[], active_hazards[] }
 */
router.post('/incident-prediction', auth, aiRateLimiter, async (req, res) => {
  try {
    const { site_id, recent_weather, worker_fatigue_levels, active_hazards } = req.body;

    const missing = validateRequired(req.body, ['site_id', 'recent_weather', 'worker_fatigue_levels', 'active_hazards']);
    if (missing.length > 0) {
      return res.status(400).json({ error: `Missing required fields: ${missing.join(', ')}` });
    }
    if (!Array.isArray(worker_fatigue_levels)) {
      return res.status(400).json({ error: 'worker_fatigue_levels must be an array' });
    }
    if (!Array.isArray(active_hazards)) {
      return res.status(400).json({ error: 'active_hazards must be an array' });
    }

    const prompt = `Analyze the following construction site conditions and predict the probability of an incident occurring in the next 8 hours.

Site ID: ${site_id}
Recent Weather: ${JSON.stringify(recent_weather)}
Worker Fatigue Levels: ${JSON.stringify(worker_fatigue_levels)}
Active Hazards: ${JSON.stringify(active_hazards)}

Provide:
1. Overall incident probability (0-100%) for the next 8 hours
2. Breakdown by incident type (fall, heat stroke, equipment, chemical, etc.)
3. Top 3 contributing risk factors
4. Recommended immediate preventive actions
5. Workers at highest risk (based on fatigue data)
6. Optimal work schedule adjustments

Return as structured analysis with clear sections.`;

    const analysis = await callOpenRouter(prompt);
    res.json({ site_id, analysis, model: MODEL, generated_at: new Date().toISOString() });
  } catch (err) {
    console.error('incident-prediction error:', err.response?.data || err.message);
    res.status(500).json({ error: 'Failed to generate incident prediction' });
  }
});

/**
 * POST /api/ai/ppe-compliance-scan
 * Scans worker readings against zone requirements and returns compliance score.
 * Body: { worker_readings[], zone_requirements }
 */
router.post('/ppe-compliance-scan', auth, aiRateLimiter, async (req, res) => {
  try {
    const { worker_readings, zone_requirements } = req.body;

    const missing = validateRequired(req.body, ['worker_readings', 'zone_requirements']);
    if (missing.length > 0) {
      return res.status(400).json({ error: `Missing required fields: ${missing.join(', ')}` });
    }
    if (!Array.isArray(worker_readings)) {
      return res.status(400).json({ error: 'worker_readings must be an array' });
    }
    if (worker_readings.length === 0) {
      return res.status(400).json({ error: 'worker_readings cannot be empty' });
    }

    const prompt = `Perform a PPE compliance scan for the following workers and zone requirements.

Worker Readings:
${JSON.stringify(worker_readings, null, 2)}

Zone PPE Requirements:
${JSON.stringify(zone_requirements, null, 2)}

Provide:
1. Overall compliance score (0-100%)
2. Per-worker compliance status (compliant/non-compliant/at-risk)
3. Specific PPE violations per worker with item missing/incorrect
4. Zone-level compliance breakdown
5. OSHA regulation references for each violation type
6. Corrective actions required per worker
7. Priority violations requiring immediate attention

Return as structured JSON-friendly analysis.`;

    const analysis = await callOpenRouter(prompt);
    res.json({ compliance_scan: analysis, workers_scanned: worker_readings.length, model: MODEL, generated_at: new Date().toISOString() });
  } catch (err) {
    console.error('ppe-compliance-scan error:', err.response?.data || err.message);
    res.status(500).json({ error: 'Failed to generate PPE compliance scan' });
  }
});

/**
 * POST /api/ai/evacuation-plan
 * Generates a dynamic evacuation plan given incident type and site layout.
 * Body: { incident_type, site_layout, worker_locations[] }
 */
router.post('/evacuation-plan', auth, aiRateLimiter, async (req, res) => {
  try {
    const { incident_type, site_layout, worker_locations } = req.body;

    const missing = validateRequired(req.body, ['incident_type', 'site_layout', 'worker_locations']);
    if (missing.length > 0) {
      return res.status(400).json({ error: `Missing required fields: ${missing.join(', ')}` });
    }
    if (!Array.isArray(worker_locations)) {
      return res.status(400).json({ error: 'worker_locations must be an array' });
    }

    const prompt = `Generate a dynamic emergency evacuation plan for the following construction site incident.

Incident Type: ${incident_type}
Site Layout: ${JSON.stringify(site_layout, null, 2)}
Worker Locations: ${JSON.stringify(worker_locations, null, 2)}

Generate:
1. Primary evacuation routes for each zone (avoid incident area)
2. Alternative routes if primary path is blocked
3. Designated muster points with capacity and GPS/grid coordinates
4. Worker-to-muster-point assignment based on current locations
5. Special considerations for injured or mobility-impaired workers
6. Evacuation order priority (who leaves first)
7. Communication protocol (who calls 911, site supervisor actions)
8. Headcount procedure at muster points
9. Estimated evacuation time by zone
10. Post-evacuation emergency response contacts

This plan must prioritize speed and safety. Be specific about routes and muster points.`;

    const plan = await callOpenRouter(prompt);
    res.json({
      incident_type,
      evacuation_plan: plan,
      workers_affected: worker_locations.length,
      model: MODEL,
      generated_at: new Date().toISOString()
    });
  } catch (err) {
    console.error('evacuation-plan error:', err.response?.data || err.message);
    res.status(500).json({ error: 'Failed to generate evacuation plan' });
  }
});

module.exports = router;
