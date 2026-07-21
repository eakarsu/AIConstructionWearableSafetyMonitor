require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
require('./config/runtime').validateRuntime();

const express = require('express');
const cors = require('cors');

const app = express();
const PORT = process.env.BACKEND_PORT || 3001;

app.use(cors({ origin: process.env.FRONTEND_ORIGIN || 'http://localhost:3000', credentials: true }));
app.use(express.json());

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/controlled-safety', require('./routes/controlledSafety'));
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
app.use('/api/evacuation-muster-trace', require('./routes/evacuationMusterTrace'));
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

app.listen(PORT, () => {
  console.log(`Construction Safety Backend running on port ${PORT}`);
});
