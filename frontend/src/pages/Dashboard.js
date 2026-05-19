import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import StatCard from '../components/StatCard';
import api from '../services/api';
import './Dashboard.css';

const features = [
  { path: '/workers', label: 'Worker Safety', icon: '\u26D1', desc: 'Monitor worker vitals and safety status in real-time', endpoint: 'workers', color: '#3498db' },
  { path: '/hazards', label: 'Hazard Detection', icon: '\u26A0', desc: 'AI-powered hazard identification and alerts', endpoint: 'hazards', color: '#e74c3c' },
  { path: '/incidents', label: 'Incident Reports', icon: '\u26A1', desc: 'Track and analyze safety incidents', endpoint: 'incidents', color: '#e67e22' },
  { path: '/equipment', label: 'Equipment Inspection', icon: '\u2699', desc: 'Equipment status and inspection tracking', endpoint: 'equipment', color: '#9b59b6' },
  { path: '/environmental', label: 'Environmental', icon: '\u{1F321}', desc: 'Weather and environmental conditions', endpoint: 'environmental', color: '#1abc9c' },
  { path: '/fatigue', label: 'Fatigue Detection', icon: '\u23F3', desc: 'Worker fatigue and alertness monitoring', endpoint: 'fatigue', color: '#f39c12' },
  { path: '/ppe', label: 'PPE Compliance', icon: '\u{1F6E1}', desc: 'Personal protective equipment tracking', endpoint: 'ppe', color: '#2ecc71' },
  { path: '/falls', label: 'Fall Detection', icon: '\u2B07', desc: 'Fall detection and impact monitoring', endpoint: 'falls', color: '#e74c3c' },
  { path: '/heatstress', label: 'Heat Stress', icon: '\u2600', desc: 'Heat stress and hydration monitoring', endpoint: 'heatstress', color: '#e67e22' },
  { path: '/noise', label: 'Noise Exposure', icon: '\u{1F50A}', desc: 'Noise level monitoring and protection', endpoint: 'noise', color: '#3498db' },
  { path: '/airquality', label: 'Air Quality', icon: '\u{1F32C}', desc: 'Air quality index and pollutant tracking', endpoint: 'airquality', color: '#1abc9c' },
  { path: '/proximity', label: 'Proximity Alerts', icon: '\u{1F4E1}', desc: 'Equipment proximity and collision prevention', endpoint: 'proximity', color: '#9b59b6' },
  { path: '/training', label: 'Training Compliance', icon: '\u{1F393}', desc: 'Training records and certification tracking', endpoint: 'training', color: '#2ecc71' },
  { path: '/emergency', label: 'Emergency Response', icon: '\u{1F6A8}', desc: 'Emergency protocols and response coordination', endpoint: 'emergency', color: '#e74c3c' },
  { path: '/maintenance', label: 'Predictive Maintenance', icon: '\u{1F527}', desc: 'AI-predicted equipment maintenance needs', endpoint: 'maintenance', color: '#f39c12' },
];

function Dashboard() {
  const [counts, setCounts] = useState({});
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem('user') || '{}');

  useEffect(() => {
    const fetchCounts = async () => {
      const results = {};
      for (const f of features) {
        try {
          const res = await api.get(`/${f.endpoint}`);
          results[f.endpoint] = Array.isArray(res.data) ? res.data.length : (res.data?.data?.length || 0);
        } catch {
          results[f.endpoint] = 0;
        }
      }
      setCounts(results);
    };
    fetchCounts();
  }, []);

  const totalWorkers = counts.workers || 0;
  const activeHazards = counts.hazards || 0;
  const openIncidents = counts.incidents || 0;
  const equipmentCount = counts.equipment || 0;

  return (
    <div>
      <Navbar title="Dashboard" />
      <div className="dashboard">
        <div className="dashboard-welcome">
          <h1>Welcome back, {user.name || 'Safety Manager'}</h1>
          <p>AI Construction Wearable Safety Monitor - Real-time Overview</p>
        </div>

        <div className="dashboard-stats">
          <StatCard
            icon={'\u26D1'}
            label="Total Workers"
            value={totalWorkers}
            sub="Being monitored"
            color="blue"
            onClick={() => navigate('/workers')}
          />
          <StatCard
            icon={'\u26A0'}
            label="Active Hazards"
            value={activeHazards}
            sub="Requiring attention"
            color="red"
            onClick={() => navigate('/hazards')}
          />
          <StatCard
            icon={'\u26A1'}
            label="Open Incidents"
            value={openIncidents}
            sub="Under investigation"
            color="orange"
            onClick={() => navigate('/incidents')}
          />
          <StatCard
            icon={'\u2699'}
            label="Equipment Tracked"
            value={equipmentCount}
            sub="Units monitored"
            color="purple"
            onClick={() => navigate('/equipment')}
          />
          <StatCard
            icon={'\u{1F916}'}
            label="AI Center"
            value="Active"
            sub="All systems online"
            color="green"
            onClick={() => navigate('/ai-center')}
          />
          <StatCard
            icon={'\u{1F680}'}
            label="Advanced Suite"
            value="8 New"
            sub="Predictive analytics + OSHA scan"
            color="blue"
            onClick={() => navigate('/advanced')}
          />
        </div>

        <div className="dashboard-section-title">
          {'\u{1F4CA}'} All Monitoring Features
        </div>
        <div className="dashboard-features">
          {features.map(f => (
            <div
              key={f.path}
              className="feature-card"
              onClick={() => navigate(f.path)}
            >
              <div className="feature-card-header">
                <div
                  className="feature-card-icon"
                  style={{ background: `${f.color}22` }}
                >
                  {f.icon}
                </div>
                <div className="feature-card-title">{f.label}</div>
              </div>
              <div className="feature-card-desc">{f.desc}</div>
              <div className="feature-card-count">
                {counts[f.endpoint] !== undefined ? counts[f.endpoint] : '...'} records
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default Dashboard;
