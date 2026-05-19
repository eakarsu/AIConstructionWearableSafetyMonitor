// Custom Views: 4 endpoints for Wearable Views feature pack
// Domain: construction wearable safety monitoring
//   VIZ:     /worker-biometrics  (HR/temp/fatigue per worker for charting)
//            /zone-exposure      (worker x zone exposure heatmap)
//   NON-VIZ: /incident-pdf       (PDF export of an incident report)
//            /alert-thresholds   (CRUD biometric alert threshold rules)

const router = require('express').Router();
const pool = require('../db');
const auth = require('../middleware/auth');
const PDFDocument = require('pdfkit');

// In-memory store for alert threshold rules (avoids schema migration churn).
// Each rule:
//   { id, metric, min, max, severity, note, created_at }
let nextThresholdId = 1;
const thresholdRules = [
  { id: nextThresholdId++, metric: 'heart_rate',   min: 50, max: 140, severity: 'warning',  note: 'Adult resting/working HR band', created_at: new Date().toISOString() },
  { id: nextThresholdId++, metric: 'body_temp',    min: 96, max: 100, severity: 'critical', note: 'Heat-stress upper bound 100F',  created_at: new Date().toISOString() },
  { id: nextThresholdId++, metric: 'oxygen_level', min: 92, max: 100, severity: 'critical', note: 'SpO2 < 92% triggers alert',      created_at: new Date().toISOString() },
  { id: nextThresholdId++, metric: 'fatigue_score',min: 0,  max: 70,  severity: 'warning',  note: 'Fatigue score above 70 = caution',created_at: new Date().toISOString() },
];

const ALLOWED_METRICS = ['heart_rate', 'body_temp', 'oxygen_level', 'fatigue_score', 'reaction_time', 'wbgt_index'];
const ALLOWED_SEVERITY = ['info', 'warning', 'critical'];

// ---------- VIZ 1: worker biometrics ----------
// GET /api/custom-views/worker-biometrics
// Returns: { workers: [{ id, name, role, site, heart_rate, body_temp, fatigue_score, status, risk_level }] }
router.get('/worker-biometrics', auth, async (req, res) => {
  try {
    const workers = await pool.query(
      `SELECT id, name, role, site, heart_rate, body_temp, oxygen_level, status, risk_level
       FROM workers
       ORDER BY name ASC
       LIMIT 50`
    );

    // Pull most-recent fatigue score per worker name (best-effort join).
    const fatigueRows = await pool.query(
      `SELECT DISTINCT ON (worker_name) worker_name, fatigue_score, reaction_time
       FROM fatigue
       ORDER BY worker_name, created_at DESC`
    );
    const fatigueByName = {};
    fatigueRows.rows.forEach(r => {
      fatigueByName[r.worker_name] = {
        fatigue_score: Number(r.fatigue_score),
        reaction_time: r.reaction_time != null ? Number(r.reaction_time) : null,
      };
    });

    const enriched = workers.rows.map(w => ({
      id: w.id,
      name: w.name,
      role: w.role,
      site: w.site,
      heart_rate: w.heart_rate != null ? Number(w.heart_rate) : null,
      body_temp: w.body_temp != null ? Number(w.body_temp) : null,
      oxygen_level: w.oxygen_level != null ? Number(w.oxygen_level) : null,
      fatigue_score: fatigueByName[w.name]?.fatigue_score ?? null,
      reaction_time: fatigueByName[w.name]?.reaction_time ?? null,
      status: w.status,
      risk_level: w.risk_level,
    }));

    res.json({ workers: enriched, count: enriched.length });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ---------- VIZ 2: zone exposure heatmap ----------
// GET /api/custom-views/zone-exposure
// Returns: { workers: [...], zones: [...], matrix: { [workerName]: { [zone]: exposureScore } }, max }
router.get('/zone-exposure', auth, async (req, res) => {
  try {
    // Collect distinct zones across the main exposure-bearing tables.
    const zoneRows = await pool.query(`
      SELECT DISTINCT zone FROM (
        SELECT zone FROM ppe         WHERE zone IS NOT NULL AND zone <> ''
        UNION ALL
        SELECT zone FROM proximity   WHERE zone IS NOT NULL AND zone <> ''
        UNION ALL
        SELECT zone FROM heatstress  WHERE zone IS NOT NULL AND zone <> ''
        UNION ALL
        SELECT zone FROM noise       WHERE zone IS NOT NULL AND zone <> ''
      ) z
      ORDER BY zone ASC
    `);
    const zones = zoneRows.rows.map(r => r.zone);

    const workerRows = await pool.query(
      `SELECT id, name FROM workers ORDER BY name ASC LIMIT 24`
    );
    const workers = workerRows.rows;

    // Build exposure score per (worker, zone) using:
    //   +5 per proximity alert (Critical=+10, High=+7)
    //   +3 per heatstress reading at that zone for the same worker
    //   +2 per noise reading at that zone (zone-level, distributed to all workers in zone via ppe)
    //   +1 per ppe record at that zone
    const matrix = {};
    workers.forEach(w => { matrix[w.name] = {}; zones.forEach(z => { matrix[w.name][z] = 0; }); });

    const prox = await pool.query(
      `SELECT worker_name, zone, severity FROM proximity WHERE zone IS NOT NULL AND worker_name IS NOT NULL`
    );
    prox.rows.forEach(r => {
      if (matrix[r.worker_name] && r.zone in matrix[r.worker_name]) {
        const sev = (r.severity || '').toLowerCase();
        matrix[r.worker_name][r.zone] += sev === 'critical' ? 10 : sev === 'high' ? 7 : 5;
      }
    });

    const heat = await pool.query(
      `SELECT worker_name, zone FROM heatstress WHERE zone IS NOT NULL AND worker_name IS NOT NULL`
    );
    heat.rows.forEach(r => {
      if (matrix[r.worker_name] && r.zone in matrix[r.worker_name]) {
        matrix[r.worker_name][r.zone] += 3;
      }
    });

    const ppeRows = await pool.query(
      `SELECT worker_name, zone FROM ppe WHERE zone IS NOT NULL AND worker_name IS NOT NULL`
    );
    ppeRows.rows.forEach(r => {
      if (matrix[r.worker_name] && r.zone in matrix[r.worker_name]) {
        matrix[r.worker_name][r.zone] += 1;
      }
    });

    let max = 0;
    Object.values(matrix).forEach(row => {
      Object.values(row).forEach(v => { if (v > max) max = v; });
    });

    res.json({
      workers: workers.map(w => w.name),
      zones,
      matrix,
      max,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ---------- NON-VIZ 1: incident PDF ----------
// GET /api/custom-views/incident-pdf?id=123  -> PDF stream
// If id omitted, returns a summary PDF of the latest 10 incidents.
router.get('/incident-pdf', auth, async (req, res) => {
  try {
    const id = req.query.id ? parseInt(req.query.id, 10) : null;

    let incidents;
    if (id && !Number.isNaN(id)) {
      const r = await pool.query('SELECT * FROM incidents WHERE id = $1', [id]);
      if (r.rows.length === 0) return res.status(404).json({ error: 'Incident not found' });
      incidents = r.rows;
    } else {
      const r = await pool.query('SELECT * FROM incidents ORDER BY created_at DESC LIMIT 10');
      incidents = r.rows;
    }

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="incident-report-${id || 'latest'}.pdf"`
    );

    const doc = new PDFDocument({ margin: 48 });
    doc.pipe(res);

    doc.fontSize(20).text('Construction Safety Incident Report', { align: 'center' });
    doc.moveDown(0.5);
    doc.fontSize(10).fillColor('#555').text(`Generated: ${new Date().toISOString()}`, { align: 'center' });
    doc.moveDown();
    doc.fillColor('#000');

    incidents.forEach((inc, idx) => {
      doc.fontSize(14).fillColor('#111').text(`${idx + 1}. ${inc.title || 'Untitled Incident'} (ID: ${inc.id})`);
      doc.moveDown(0.2);
      doc.fontSize(10).fillColor('#333');
      doc.text(`Type: ${inc.type || 'n/a'}    Severity: ${inc.severity || 'n/a'}    Status: ${inc.status || 'n/a'}`);
      doc.text(`Location: ${inc.location || 'n/a'}`);
      doc.text(`Worker:   ${inc.worker_name || 'n/a'}`);
      if (inc.injuries) doc.text(`Injuries: ${inc.injuries}`);
      doc.moveDown(0.3);
      if (inc.description) {
        doc.fontSize(10).fillColor('#000').text('Description:', { underline: true });
        doc.text(inc.description, { align: 'left' });
        doc.moveDown(0.3);
      }
      if (inc.ai_analysis) {
        doc.fontSize(10).fillColor('#000').text('AI Analysis:', { underline: true });
        doc.fillColor('#444').text(inc.ai_analysis, { align: 'left' });
      }
      doc.moveDown(0.6);
      doc.moveTo(48, doc.y).lineTo(547, doc.y).strokeColor('#ccc').stroke();
      doc.moveDown(0.6);
    });

    doc.end();
  } catch (err) {
    if (!res.headersSent) res.status(500).json({ error: err.message });
  }
});

// ---------- NON-VIZ 2: alert thresholds CRUD ----------
// GET    /api/custom-views/alert-thresholds
// POST   /api/custom-views/alert-thresholds
// PUT    /api/custom-views/alert-thresholds/:id
// DELETE /api/custom-views/alert-thresholds/:id
router.get('/alert-thresholds', auth, (req, res) => {
  res.json({ rules: thresholdRules, count: thresholdRules.length });
});

router.post('/alert-thresholds', auth, (req, res) => {
  const { metric, min, max, severity, note } = req.body || {};
  if (!metric || !ALLOWED_METRICS.includes(metric)) {
    return res.status(400).json({ error: `metric must be one of: ${ALLOWED_METRICS.join(', ')}` });
  }
  if (typeof min !== 'number' || typeof max !== 'number' || min >= max) {
    return res.status(400).json({ error: 'min and max must be numbers with min < max' });
  }
  if (!severity || !ALLOWED_SEVERITY.includes(severity)) {
    return res.status(400).json({ error: `severity must be one of: ${ALLOWED_SEVERITY.join(', ')}` });
  }
  const rule = {
    id: nextThresholdId++,
    metric,
    min,
    max,
    severity,
    note: typeof note === 'string' ? note : '',
    created_at: new Date().toISOString(),
  };
  thresholdRules.push(rule);
  res.status(201).json(rule);
});

router.put('/alert-thresholds/:id', auth, (req, res) => {
  const id = parseInt(req.params.id, 10);
  const idx = thresholdRules.findIndex(r => r.id === id);
  if (idx === -1) return res.status(404).json({ error: 'Rule not found' });
  const cur = thresholdRules[idx];
  const { metric, min, max, severity, note } = req.body || {};
  if (metric !== undefined && !ALLOWED_METRICS.includes(metric)) {
    return res.status(400).json({ error: `metric must be one of: ${ALLOWED_METRICS.join(', ')}` });
  }
  if (severity !== undefined && !ALLOWED_SEVERITY.includes(severity)) {
    return res.status(400).json({ error: `severity must be one of: ${ALLOWED_SEVERITY.join(', ')}` });
  }
  const nextMin = typeof min === 'number' ? min : cur.min;
  const nextMax = typeof max === 'number' ? max : cur.max;
  if (nextMin >= nextMax) {
    return res.status(400).json({ error: 'min must be less than max' });
  }
  const updated = {
    ...cur,
    metric: metric ?? cur.metric,
    min: nextMin,
    max: nextMax,
    severity: severity ?? cur.severity,
    note: typeof note === 'string' ? note : cur.note,
  };
  thresholdRules[idx] = updated;
  res.json(updated);
});

router.delete('/alert-thresholds/:id', auth, (req, res) => {
  const id = parseInt(req.params.id, 10);
  const idx = thresholdRules.findIndex(r => r.id === id);
  if (idx === -1) return res.status(404).json({ error: 'Rule not found' });
  const [removed] = thresholdRules.splice(idx, 1);
  res.json({ message: 'Deleted', rule: removed });
});

module.exports = router;
