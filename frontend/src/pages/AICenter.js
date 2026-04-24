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
      const res = await api.post(feature.endpoint, {
        context: inputText || undefined,
      });
      setResults(prev => ({ ...prev, [feature.id]: res.data }));
    } catch (err) {
      setResults(prev => ({
        ...prev,
        [feature.id]: {
          analysis: 'AI analysis is currently unavailable. Please ensure the backend AI service is running and try again.',
        },
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
