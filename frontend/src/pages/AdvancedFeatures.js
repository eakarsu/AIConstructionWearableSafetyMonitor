import React, { useState, useEffect } from 'react';
import Navbar from '../components/Navbar';
import AIOutput from '../components/AIOutput';
import api from '../services/api';
import './AICenter.css';

const advancedFeatures = [
  {
    id: 'shift-safety-trends',
    title: 'Shift Safety Score Trends',
    icon: '\u{1F4C8}',
    desc: '30-day moving average of worker/site safety metrics broken down by shift.',
    type: 'report',
    endpoint: '/reports/safety-scorecard',
    params: { weeks_back: 4 },
  },
  {
    id: 'predictive-maintenance-alerts',
    title: 'Predictive Maintenance Alerts',
    icon: '\u{1F527}',
    desc: 'ML model triggers maintenance 7 days before predicted equipment failure.',
    type: 'ai',
    endpoint: '/ai/equipment-health',
  },
  {
    id: 'near-miss-clustering',
    title: 'Near-Miss Incident Clustering',
    icon: '\u{1F50D}',
    desc: 'Auto-group similar hazards to identify patterns and recommend systematic fixes.',
    type: 'ai',
    endpoint: '/ai/incident-analysis',
    promptHint: 'Group similar near-miss incidents into clusters and propose systematic fixes.',
  },
  {
    id: 'worker-leaderboard',
    title: 'Worker Performance Leaderboard',
    icon: '\u{1F3C6}',
    desc: 'Anonymized ranking of safety compliance by role/team for gamification.',
    type: 'leaderboard',
    endpoint: '/ppe',
  },
  {
    id: 'osha-violation-scanner',
    title: 'OSHA Violation Risk Scanner',
    icon: '\u{1F4DC}',
    desc: 'Proactive scan of data against OSHA standards with remediation steps.',
    type: 'ai',
    endpoint: '/ai/compliance-report',
    promptHint: 'Scan recent site data against OSHA 1926 construction standards. List violations and remediation.',
  },
  {
    id: 'evacuation-optimizer',
    title: 'Emergency Evacuation Optimizer',
    icon: '\u{1F4A8}',
    desc: 'AI-calculated optimal routes for site evacuation based on hazard zones.',
    type: 'evacuation',
    endpoint: '/ai/evacuation-plan',
  },
  {
    id: 'incident-simulator',
    title: 'Site-wide Incident Simulator',
    icon: '\u{1F3AE}',
    desc: 'Scenario modeling for emergencies to stress-test response plans.',
    type: 'incident-prediction',
    endpoint: '/ai/incident-prediction',
  },
  {
    id: 'equipment-swap-recommender',
    title: 'AI Equipment Swap Recommender',
    icon: '\u{1F501}',
    desc: 'Suggests equipment maintenance schedule changes to minimize downtime.',
    type: 'ai',
    endpoint: '/ai/equipment-health',
    promptHint: 'Recommend equipment swap and maintenance timing to minimize downtime across the fleet.',
  },
];

function AdvancedFeatures() {
  const [activePanel, setActivePanel] = useState(null);
  const [results, setResults] = useState({});
  const [loadingFeature, setLoadingFeature] = useState(null);
  const [inputs, setInputs] = useState({});
  const [scorecard, setScorecard] = useState(null);
  const [leaderboard, setLeaderboard] = useState(null);

  useEffect(() => {
    // Load scorecard preview
    api.get('/reports/safety-scorecard?weeks_back=4').then(res => setScorecard(res.data)).catch(() => {});
    // Build leaderboard from PPE compliance scores
    api.get('/ppe').then(res => {
      const list = Array.isArray(res.data) ? res.data : (res.data?.data || []);
      const byRole = {};
      list.forEach(item => {
        const role = item.role || 'Unassigned';
        if (!byRole[role]) byRole[role] = { role, total: 0, sumScore: 0, compliant: 0 };
        byRole[role].total += 1;
        byRole[role].sumScore += Number(item.compliance_score) || 0;
        if ((item.status || '').toLowerCase() === 'compliant') byRole[role].compliant += 1;
      });
      const ranked = Object.values(byRole).map(r => ({
        ...r,
        avgScore: r.total > 0 ? Math.round(r.sumScore / r.total) : 0,
        complianceRate: r.total > 0 ? Math.round((r.compliant / r.total) * 100) : 0,
      })).sort((a, b) => b.avgScore - a.avgScore);
      setLeaderboard(ranked);
    }).catch(() => setLeaderboard([]));
  }, []);

  const togglePanel = (id) => {
    setActivePanel(activePanel === id ? null : id);
  };

  const updateInput = (id, key, value) => {
    setInputs(prev => ({ ...prev, [id]: { ...(prev[id] || {}), [key]: value } }));
  };

  const handleRun = async (feature) => {
    setLoadingFeature(feature.id);
    try {
      let res;
      if (feature.type === 'report') {
        res = await api.get(feature.endpoint, { params: feature.params });
        setResults(prev => ({ ...prev, [feature.id]: res.data }));
      } else if (feature.type === 'evacuation') {
        const body = inputs[feature.id] || {};
        res = await api.post(feature.endpoint, {
          incident_type: body.incident_type || 'Structural Collapse',
          site_layout: body.site_layout || { zones: ['Zone A', 'Zone B', 'Zone C'], muster_points: ['North Gate', 'South Gate'] },
          worker_locations: body.worker_locations
            ? String(body.worker_locations).split(',').map(s => s.trim()).filter(Boolean).map((zone, i) => ({ worker: `W${i + 1}`, zone }))
            : [{ worker: 'W1', zone: 'Zone A' }, { worker: 'W2', zone: 'Zone B' }],
        });
        setResults(prev => ({ ...prev, [feature.id]: { analysis: res.data.evacuation_plan } }));
      } else if (feature.type === 'incident-prediction') {
        const body = inputs[feature.id] || {};
        res = await api.post(feature.endpoint, {
          site_id: body.site_id || 'SITE-001',
          recent_weather: body.recent_weather || 'Hot, 95F, low humidity, light winds',
          worker_fatigue_levels: body.worker_fatigue_levels
            ? String(body.worker_fatigue_levels).split(',').map(s => Number(s.trim())).filter(n => !isNaN(n))
            : [65, 72, 88, 45, 52],
          active_hazards: body.active_hazards
            ? String(body.active_hazards).split(',').map(s => s.trim()).filter(Boolean)
            : ['Open trench', 'Crane overhead lift', 'Electrical tie-in'],
        });
        setResults(prev => ({ ...prev, [feature.id]: { analysis: res.data.analysis } }));
      } else if (feature.type === 'ai') {
        res = await api.post(feature.endpoint, {
          context: (inputs[feature.id]?.context) || feature.promptHint || '',
        });
        setResults(prev => ({ ...prev, [feature.id]: res.data }));
      }
    } catch (err) {
      setResults(prev => ({
        ...prev,
        [feature.id]: { analysis: 'Unable to compute right now. Verify backend service availability.' },
      }));
    }
    setLoadingFeature(null);
  };

  const downloadPDFReport = async () => {
    try {
      const res = await api.get('/export/safety-report?days=30', { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `safety-report-${new Date().toISOString().split('T')[0]}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch {
      alert('Failed to download PDF report');
    }
  };

  return (
    <div>
      <Navbar title={'\u{1F680} Advanced Safety Features'} />
      <div className="ai-center">
        <div className="ai-center-header">
          <h1>{'\u{1F680}'} Advanced Safety Suite</h1>
          <p>Predictive analytics, OSHA scanning, evacuation planning and gamified compliance.</p>
          <div style={{ marginTop: 12 }}>
            <button className="ai-run-btn" onClick={downloadPDFReport}>
              {'\u{1F4C4}'} Download 30-Day Safety Report (PDF)
            </button>
          </div>
        </div>

        {/* Scorecard preview */}
        {scorecard && (
          <div style={{ marginBottom: 24, padding: 20, background: 'linear-gradient(135deg, #1a1a3e, #16213e)', borderRadius: 12, border: '1px solid #2a3a6a' }}>
            <h2 style={{ color: '#3498db', marginTop: 0 }}>Site Safety Scorecard (Last {scorecard.period_weeks} weeks)</h2>
            <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
              <div style={{ padding: 12, background: 'rgba(52,152,219,0.1)', borderRadius: 8, minWidth: 140 }}>
                <div style={{ fontSize: 12, color: '#8888aa' }}>Overall Avg</div>
                <div style={{ fontSize: 28, fontWeight: 700, color: '#3498db' }}>{scorecard.overall_average_score}</div>
              </div>
              {(scorecard.scorecards || []).slice(0, 4).map((s, i) => (
                <div key={i} style={{ padding: 12, background: 'rgba(243,156,18,0.08)', borderRadius: 8, minWidth: 140 }}>
                  <div style={{ fontSize: 12, color: '#8888aa' }}>{s.site}</div>
                  <div style={{ fontSize: 22, fontWeight: 700, color: s.safety_score >= 80 ? '#27ae60' : s.safety_score >= 60 ? '#f39c12' : '#e74c3c' }}>
                    {s.safety_score} <span style={{ fontSize: 12, marginLeft: 4 }}>Grade {s.grade}</span>
                  </div>
                  <div style={{ fontSize: 11, color: '#bbbbd0' }}>
                    {s.incidents.total} incidents | {s.hazards.resolution_rate}% hazards resolved
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="ai-center-grid">
          {advancedFeatures.map(feature => (
            <div key={feature.id} className="ai-feature-card">
              <div className="ai-feature-card-header">
                <div className="ai-feature-card-icon">{feature.icon}</div>
                <div className="ai-feature-card-title">{feature.title}</div>
              </div>
              <div className="ai-feature-card-desc">{feature.desc}</div>
              <button
                className="ai-run-btn"
                onClick={() => togglePanel(feature.id)}
              >
                {activePanel === feature.id ? '\u25B2 Close' : '\u25B6 Open'}
              </button>

              {activePanel === feature.id && (
                <div className="ai-panel">
                  {feature.type === 'leaderboard' ? (
                    <div>
                      {!leaderboard ? <div style={{ color: '#8888aa' }}>Loading...</div> : (
                        leaderboard.length === 0 ? <div style={{ color: '#8888aa' }}>No PPE data yet.</div> : (
                          <table style={{ width: '100%', color: '#cccce0', fontSize: 13 }}>
                            <thead>
                              <tr>
                                <th align="left">Rank</th>
                                <th align="left">Role</th>
                                <th align="right">Avg Score</th>
                                <th align="right">Compliance %</th>
                                <th align="right">Workers</th>
                              </tr>
                            </thead>
                            <tbody>
                              {leaderboard.map((r, i) => (
                                <tr key={r.role}>
                                  <td>{i + 1 <= 3 ? ['\u{1F947}', '\u{1F948}', '\u{1F949}'][i] : `#${i + 1}`}</td>
                                  <td>{r.role}</td>
                                  <td align="right">{r.avgScore}</td>
                                  <td align="right">{r.complianceRate}%</td>
                                  <td align="right">{r.total}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        )
                      )}
                    </div>
                  ) : feature.type === 'evacuation' ? (
                    <>
                      <input
                        className="ai-panel-input"
                        style={{ minHeight: 0 }}
                        placeholder="Incident type (e.g. Fire, Structural Collapse)"
                        value={inputs[feature.id]?.incident_type || ''}
                        onChange={e => updateInput(feature.id, 'incident_type', e.target.value)}
                      />
                      <input
                        className="ai-panel-input"
                        style={{ minHeight: 0 }}
                        placeholder="Worker zones, comma separated (e.g. Zone A, Zone B, Zone C)"
                        value={inputs[feature.id]?.worker_locations || ''}
                        onChange={e => updateInput(feature.id, 'worker_locations', e.target.value)}
                      />
                      <button
                        className="ai-panel-submit"
                        onClick={() => handleRun(feature)}
                        disabled={loadingFeature === feature.id}
                      >
                        {loadingFeature === feature.id ? 'Generating...' : '\u{1F6A8} Generate Evacuation Plan'}
                      </button>
                    </>
                  ) : feature.type === 'incident-prediction' ? (
                    <>
                      <input
                        className="ai-panel-input"
                        style={{ minHeight: 0 }}
                        placeholder="Site ID (e.g. SITE-001)"
                        value={inputs[feature.id]?.site_id || ''}
                        onChange={e => updateInput(feature.id, 'site_id', e.target.value)}
                      />
                      <input
                        className="ai-panel-input"
                        style={{ minHeight: 0 }}
                        placeholder="Recent weather (e.g. Hot, 95F, low humidity)"
                        value={inputs[feature.id]?.recent_weather || ''}
                        onChange={e => updateInput(feature.id, 'recent_weather', e.target.value)}
                      />
                      <input
                        className="ai-panel-input"
                        style={{ minHeight: 0 }}
                        placeholder="Fatigue scores comma-sep (e.g. 65,72,88,45)"
                        value={inputs[feature.id]?.worker_fatigue_levels || ''}
                        onChange={e => updateInput(feature.id, 'worker_fatigue_levels', e.target.value)}
                      />
                      <textarea
                        className="ai-panel-input"
                        placeholder="Active hazards (comma separated)"
                        value={inputs[feature.id]?.active_hazards || ''}
                        onChange={e => updateInput(feature.id, 'active_hazards', e.target.value)}
                      />
                      <button
                        className="ai-panel-submit"
                        onClick={() => handleRun(feature)}
                        disabled={loadingFeature === feature.id}
                      >
                        {loadingFeature === feature.id ? 'Simulating...' : '\u{1F3AE} Run Simulation'}
                      </button>
                    </>
                  ) : feature.type === 'report' ? (
                    <button
                      className="ai-panel-submit"
                      onClick={() => handleRun(feature)}
                      disabled={loadingFeature === feature.id}
                    >
                      {loadingFeature === feature.id ? 'Loading...' : '\u{1F4CA} Refresh Trends'}
                    </button>
                  ) : (
                    <>
                      <textarea
                        className="ai-panel-input"
                        placeholder={feature.promptHint || 'Optional: provide context for the AI...'}
                        value={inputs[feature.id]?.context || ''}
                        onChange={e => updateInput(feature.id, 'context', e.target.value)}
                      />
                      <button
                        className="ai-panel-submit"
                        onClick={() => handleRun(feature)}
                        disabled={loadingFeature === feature.id}
                      >
                        {loadingFeature === feature.id ? 'Analyzing...' : '\u{1F916} Run Analysis'}
                      </button>
                    </>
                  )}

                  {(results[feature.id] || loadingFeature === feature.id) && feature.type !== 'leaderboard' && (
                    feature.type === 'report' && results[feature.id]?.scorecards ? (
                      <div style={{ marginTop: 12 }}>
                        {(results[feature.id].scorecards || []).map((s, i) => (
                          <div key={i} style={{ padding: 10, background: 'rgba(52,152,219,0.08)', borderRadius: 8, marginBottom: 8, color: '#cccce0' }}>
                            <strong>{s.site}</strong> — Score {s.safety_score} (Grade {s.grade}) · {s.incidents.total} incidents · {s.hazards.resolution_rate}% hazards resolved
                          </div>
                        ))}
                      </div>
                    ) : (
                      <AIOutput
                        data={results[feature.id]}
                        title={feature.title}
                        loading={loadingFeature === feature.id}
                      />
                    )
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default AdvancedFeatures;
