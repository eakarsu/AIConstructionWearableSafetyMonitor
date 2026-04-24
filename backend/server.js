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

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.listen(PORT, () => {
  console.log(`Construction Safety Backend running on port ${PORT}`);
});
