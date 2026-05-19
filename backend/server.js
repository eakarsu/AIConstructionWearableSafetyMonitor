require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });

const express = require('express');
const cors = require('cors');

const app = express();
const PORT = process.env.BACKEND_PORT || 3001;

app.use(cors());
app.use(express.json());

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/workers', require('./routes/workers'));
app.use('/api/hazards', require('./routes/hazards'));
app.use('/api/incidents', require('./routes/incidents'));
app.use('/api/equipment', require('./routes/equipment'));
app.use('/api/environmental', require('./routes/environmental'));
app.use('/api/fatigue', require('./routes/fatigue'));
app.use('/api/ppe', require('./routes/ppe'));
app.use('/api/falls', require('./routes/falls'));
app.use('/api/heatstress', require('./routes/heatstress'));
app.use('/api/noise', require('./routes/noise'));
app.use('/api/airquality', require('./routes/airquality'));
app.use('/api/proximity', require('./routes/proximity'));
app.use('/api/training', require('./routes/training'));
app.use('/api/emergency', require('./routes/emergency'));
app.use('/api/maintenance', require('./routes/maintenance'));
app.use('/api/ai', require('./routes/ai'));

// New AI endpoints (incident-prediction, ppe-compliance-scan, evacuation-plan)
app.use('/api/ai', require('./routes/aiNew'));







app.use('/api/ai', require('./routes/insuranceOptimize'));
app.use('/api/ai', require('./routes/cohortAnalysis'));
app.use('/api/ai', require('./routes/bbsCoaching'));
app.use('/api/ai', require('./routes/autonomousAudit'));
app.use('/api/ai', require('./routes/injuryPrevent'));
app.use('/api/ai', require('./routes/fatigueFusion'));
// Backlog AI endpoints (predict-collision, predict-fall, predictive-maintenance-schedule)
app.use('/api/ai', require('./routes/aiBacklog'));

// Reports and PDF export
const reportsRouter = require('./routes/reports');
app.use('/api/reports', reportsRouter);
app.use('/api/export', reportsRouter); // safety-report PDF lives here too

// SSE real-time streams
const sseRouter = require('./routes/sse');
app.use('/api/safety', sseRouter);
app.use('/api/alerts', sseRouter);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Custom Views (Wearable Views) - mounted before any 404/fallback handlers
app.use('/api/custom-views', require('./routes/customViews'));

// Global error handler
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

// // === Batch 02 Gaps & Frontend Mounts ===
app.use('/api/gap-proximity-falls-lack-dedicated-ai-endpoints-for-collision-pr', require('./routes/gap_proximity_falls_lack_dedicated_ai_endpoints_for_collision_pr'));

// // === Batch 02 Gaps & Frontend Mounts ===
app.use('/api/gap-maintenance-lacks-predictive-maintenance-scheduling-ai', require('./routes/gap_maintenance_lacks_predictive_maintenance_scheduling_ai'));

// // === Batch 02 Gaps & Frontend Mounts ===
app.use('/api/gap-hazards-ppe-lack-ai-risk-scoring', require('./routes/gap_hazards_ppe_lack_ai_risk_scoring'));

// // === Batch 02 Gaps & Frontend Mounts ===
app.use('/api/gap-limited-integration-with-wearable-apis-apple-watch-fitbit-ou', require('./routes/gap_limited_integration_with_wearable_apis_apple_watch_fitbit_ou'));

// // === Batch 02 Gaps & Frontend Mounts ===
app.use('/api/gap-no-geofenced-site-map-management', require('./routes/gap_no_geofenced_site_map_management'));

// // === Batch 02 Gaps & Frontend Mounts ===
app.use('/api/gap-no-insurance-liability-tracking-or-claims-module', require('./routes/gap_no_insurance_liability_tracking_or_claims_module'));

// // === Batch 02 Gaps & Frontend Mounts ===
app.use('/api/gap-no-webhooks-for-sensor-pushes', require('./routes/gap_no_webhooks_for_sensor_pushes'));

// // === Batch 02 Gaps & Frontend Mounts ===
app.use('/api/gap-no-payment-billing-module', require('./routes/gap_no_payment_billing_module'));

app.listen(PORT, () => {
  console.log(`Construction Safety Backend running on port ${PORT}`);
});
