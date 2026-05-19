import React, { useState } from 'react';
import Navbar from '../components/Navbar';
import AIOutput from '../components/AIOutput';
import api from '../services/api';
import './AICenter.css';

const aiFeatures = [
  {
    id: 'safety-analysis',
    title: 'Safety Analysis',
    icon: '\u{1F6E1}',
    desc: 'Comprehensive site-wide safety analysis with risk scoring and recommendations.',
    endpoint: '/ai/safety-analysis',
  },
  {
    id: 'risk-prediction',
    title: 'Risk Prediction',
    icon: '\u{1F52E}',
    desc: 'Predict upcoming safety risks based on historical data and current conditions.',
    endpoint: '/ai/risk-prediction',
  },
  {
    id: 'incident-analysis',
    title: 'Incident Analysis',
    icon: '\u{1F50D}',
    desc: 'Deep analysis of incident patterns and root cause identification.',
    endpoint: '/ai/incident-analysis',
  },
  {
    id: 'equipment-health',
    title: 'Equipment Health',
    icon: '\u2699',
    desc: 'AI assessment of equipment health and maintenance scheduling.',
    endpoint: '/ai/equipment-health',
  },
  {
    id: 'worker-wellness',
    title: 'Worker Wellness',
    icon: '\u{1F3E5}',
    desc: 'Worker health and wellness trends with fatigue prediction.',
    endpoint: '/ai/worker-wellness',
  },
  {
    id: 'environmental-risk',
    title: 'Environmental Risk',
    icon: '\u{1F321}',
    desc: 'Environmental condition analysis and weather-related risk assessment.',
    endpoint: '/ai/environmental-risk',
  },
  {
    id: 'compliance-report',
    title: 'Compliance Report',
    icon: '\u{1F4DC}',
    desc: 'Generate OSHA compliance reports and identify gaps.',
    endpoint: '/ai/compliance-report',
  },
  {
    id: 'emergency-plan',
    title: 'Emergency Plan',
    icon: '\u{1F6A8}',
    desc: 'AI-generated emergency response plans based on current site conditions.',
    endpoint: '/ai/emergency-plan',
  },
  {
    id: 'training-recommend',
    title: 'Training Recommendations',
    icon: '\u{1F393}',
    desc: 'Personalized training recommendations based on worker performance.',
    endpoint: '/ai/training-recommend',
  },
  {
    id: 'predictive-alert',
    title: 'Predictive Alerts',
    icon: '\u{1F514}',
    desc: 'Generate predictive safety alerts based on data patterns.',
    endpoint: '/ai/predictive-alert',
  },
  {
    id: 'incident-prediction',
    title: 'Incident Probability (8h)',
    icon: '\u{1F4C9}',
    desc: 'Predict incident probability for next 8 hours from weather, fatigue, hazards.',
    endpoint: '/ai/incident-prediction',
    structured: 'incident-prediction',
  },
  {
    id: 'ppe-compliance-scan',
    title: 'PPE Compliance Scan',
    icon: '\u{1F9BA}',
    desc: 'Scan worker readings against zone PPE requirements with OSHA refs.',
    endpoint: '/ai/ppe-compliance-scan',
    structured: 'ppe-scan',
  },
  {
    id: 'evacuation-plan',
    title: 'Dynamic Evacuation Plan',
    icon: '\u{1F6AA}',
    desc: 'Generate evacuation plan with routes, muster points, headcount procedure.',
    endpoint: '/ai/evacuation-plan',
    structured: 'evacuation-plan',
  },
  {
    id: 'predict-collision',
    title: 'Collision Prediction',
    icon: '\u{1F6A7}',
    desc: 'Predict proximity/collision risks between workers and equipment.',
    endpoint: '/ai/predict-collision',
    structured: 'predict-collision',
  },
  {
    id: 'predict-fall',
    title: 'Fall Risk Prediction',
    icon: '\u{1F53B}',
    desc: 'Predict per-worker fall risk from wearable telemetry and harness status.',
    endpoint: '/ai/predict-fall',
    structured: 'predict-fall',
  },
  {
    id: 'predictive-maintenance-schedule',
    title: 'Predictive Maintenance',
    icon: '\u{1F527}',
    desc: 'AI-generated 30-day predictive maintenance schedule with failure windows.',
    endpoint: '/ai/predictive-maintenance-schedule',
    structured: 'predictive-maintenance-schedule',
  },
];

function AICenter() {
  const [activePanel, setActivePanel] = useState(null);
  const [inputText, setInputText] = useState('');
  const [results, setResults] = useState({});
  const [loadingFeature, setLoadingFeature] = useState(null);
  const [chatMessages, setChatMessages] = useState([]);
  const [chatInput, setChatInput] = useState('');
  const [chatLoading, setChatLoading] = useState(false);

  const handleRunAnalysis = async (feature) => {
    setLoadingFeature(feature.id);
    try {
      let body;
      if (feature.structured === 'incident-prediction') {
        body = {
          site_id: 'SITE-001',
          recent_weather: inputText || 'Hot, 92F, low humidity, light winds',
          worker_fatigue_levels: [55, 70, 85, 40, 60],
          active_hazards: ['Open trench', 'Crane lift overhead', 'Electrical tie-in'],
        };
      } else if (feature.structured === 'ppe-scan') {
        body = {
          worker_readings: [
            { worker_id: 'W1', helmet: true, vest: true, gloves: false, boots: true, harness: false, zone: 'A' },
            { worker_id: 'W2', helmet: true, vest: false, gloves: true, boots: true, harness: true, zone: 'B' },
          ],
          zone_requirements: {
            A: ['helmet', 'vest', 'gloves', 'boots', 'harness'],
            B: ['helmet', 'vest', 'gloves', 'boots'],
          },
        };
      } else if (feature.structured === 'evacuation-plan') {
        body = {
          incident_type: inputText || 'Fire',
          site_layout: { zones: ['Zone A', 'Zone B', 'Zone C'], muster_points: ['North Gate', 'South Gate'] },
          worker_locations: [
            { worker: 'W1', zone: 'Zone A' },
            { worker: 'W2', zone: 'Zone B' },
            { worker: 'W3', zone: 'Zone C' },
          ],
        };
      } else if (feature.structured === 'predict-collision') {
        body = {
          worker_positions: [
            { id: 'W1', x: 10, y: 5, zone: 'A' },
            { id: 'W2', x: 12, y: 6, zone: 'A' },
          ],
          equipment_positions: [
            { id: 'CRANE-1', x: 11, y: 6, type: 'crane' },
            { id: 'EXC-2', x: 30, y: 12, type: 'excavator' },
          ],
          site_zones: inputText || 'Zone A active lift, Zone B excavation',
        };
      } else if (feature.structured === 'predict-fall') {
        body = {
          worker_telemetry: [
            { id: 'W1', heart_rate: 110, sway_index: 0.7, fatigue: 75 },
            { id: 'W2', heart_rate: 95, sway_index: 0.3, fatigue: 40 },
          ],
          work_at_height: inputText || 'Steel erection at 40ft, scaffold platform',
          harness_status: [
            { id: 'W1', harness: true, anchor_check: false },
            { id: 'W2', harness: true, anchor_check: true },
          ],
        };
      } else if (feature.structured === 'predictive-maintenance-schedule') {
        body = {
          equipment_inventory: [
            { id: 'CRANE-1', type: 'tower crane', hours: 1820 },
            { id: 'EXC-2', type: 'excavator', hours: 920 },
          ],
          recent_telemetry: { vibration: 'elevated CRANE-1', oil_temp: 'normal' },
          maintenance_history: inputText || 'Last service 60 days ago, hydraulic seal replaced',
        };
      } else {
        body = { context: inputText || undefined };
      }
      const res = await api.post(feature.endpoint, body);
      const data = res.data?.evacuation_plan
        ? { analysis: res.data.evacuation_plan }
        : res.data?.compliance_scan
        ? { analysis: res.data.compliance_scan }
        : res.data;
      setResults(prev => ({ ...prev, [feature.id]: data }));
    } catch (err) {
      const status = err?.response?.status;
      const msg = status === 503
        ? 'AI service unavailable: API key is not configured on the backend.'
        : 'AI analysis is currently unavailable. Please ensure the backend AI service is running and try again.';
      setResults(prev => ({
        ...prev,
        [feature.id]: { analysis: msg },
      }));
    }
    setLoadingFeature(null);
  };

  const togglePanel = (featureId) => {
    setActivePanel(activePanel === featureId ? null : featureId);
    setInputText('');
  };

  const handleChatSend = async () => {
    if (!chatInput.trim()) return;
    const userMsg = chatInput.trim();
    setChatMessages(prev => [...prev, { role: 'user', content: userMsg }]);
    setChatInput('');
    setChatLoading(true);
    try {
      const res = await api.post('/ai/chat', { message: userMsg });
      const aiResponse = res.data?.response || res.data?.message || res.data?.analysis || JSON.stringify(res.data);
      setChatMessages(prev => [...prev, { role: 'assistant', content: aiResponse }]);
    } catch {
      setChatMessages(prev => [
        ...prev,
        { role: 'assistant', content: 'Sorry, the AI chat service is currently unavailable. Please try again later.' },
      ]);
    }
    setChatLoading(false);
  };

  const handleChatKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleChatSend();
    }
  };

  return (
    <div>
      <Navbar title={'\u{1F916} AI Center'} />
      <div className="ai-center">
        <div className="ai-center-header">
          <h1>{'\u{1F916}'} AI Analysis Center</h1>
          <p>Access all AI-powered safety analysis tools from one place</p>
        </div>

        <div className="ai-center-grid">
          {aiFeatures.map(feature => (
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
                {activePanel === feature.id ? '\u25B2 Close' : '\u25B6 Run Analysis'}
              </button>

              {activePanel === feature.id && (
                <div className="ai-panel">
                  <textarea
                    className="ai-panel-input"
                    placeholder="Optional: Add context or specific parameters for the analysis..."
                    value={inputText}
                    onChange={e => setInputText(e.target.value)}
                  />
                  <button
                    className="ai-panel-submit"
                    onClick={() => handleRunAnalysis(feature)}
                    disabled={loadingFeature === feature.id}
                  >
                    {loadingFeature === feature.id ? 'Analyzing...' : '\u{1F916} Start Analysis'}
                  </button>
                  {(results[feature.id] || loadingFeature === feature.id) && (
                    <AIOutput
                      data={results[feature.id]}
                      title={feature.title}
                      loading={loadingFeature === feature.id}
                    />
                  )}
                </div>
              )}
            </div>
          ))}
        </div>

        <div className="ai-chat-section">
          <div className="ai-chat-header">
            <span style={{ fontSize: '22px' }}>{'\u{1F4AC}'}</span>
            <span className="ai-chat-header-title">AI Safety Assistant Chat</span>
          </div>
          <div className="ai-chat-messages">
            {chatMessages.length === 0 && (
              <div className="ai-chat-empty">
                {'\u{1F916}'} Start a conversation with the AI Safety Assistant. Ask about safety protocols, risk assessments, compliance requirements, and more.
              </div>
            )}
            {chatMessages.map((msg, idx) => (
              <div key={idx} className={`ai-chat-message ${msg.role}`}>
                {msg.role === 'user' ? '\u{1F464} ' : '\u{1F916} '}
                {msg.content}
              </div>
            ))}
            {chatLoading && (
              <div className="ai-chat-message assistant" style={{ opacity: 0.6 }}>
                {'\u{1F916}'} Thinking...
              </div>
            )}
          </div>
          <div className="ai-chat-input-area">
            <input
              className="ai-chat-input"
              type="text"
              placeholder="Ask the AI Safety Assistant anything..."
              value={chatInput}
              onChange={e => setChatInput(e.target.value)}
              onKeyDown={handleChatKeyDown}
            />
            <button
              className="ai-chat-send"
              onClick={handleChatSend}
              disabled={chatLoading || !chatInput.trim()}
            >
              Send
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default AICenter;
