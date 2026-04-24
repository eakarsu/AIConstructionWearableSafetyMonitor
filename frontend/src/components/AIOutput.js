import React from 'react';

const styles = {
  container: {
    background: 'linear-gradient(135deg, #1a1a3e, #16213e)',
    border: '1px solid #2a3a6a',
    borderRadius: '12px',
    overflow: 'hidden',
    animation: 'fadeIn 0.5s ease',
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    padding: '16px 20px',
    background: 'rgba(52, 152, 219, 0.1)',
    borderBottom: '1px solid #2a3a6a',
  },
  headerIcon: {
    fontSize: '24px',
  },
  headerTitle: {
    fontSize: '16px',
    fontWeight: 700,
    color: '#3498db',
  },
  headerBadge: {
    marginLeft: 'auto',
    fontSize: '10px',
    fontWeight: 600,
    padding: '4px 10px',
    borderRadius: '12px',
    background: 'rgba(52, 152, 219, 0.2)',
    color: '#3498db',
  },
  body: {
    padding: '20px',
  },
  section: {
    marginBottom: '20px',
  },
  sectionTitle: {
    fontSize: '13px',
    fontWeight: 700,
    color: '#f39c12',
    marginBottom: '10px',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
  },
  bullet: {
    fontSize: '13px',
    color: '#cccce0',
    lineHeight: 1.7,
    paddingLeft: '16px',
    position: 'relative',
    marginBottom: '6px',
  },
  metric: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '6px',
    background: 'rgba(243, 156, 18, 0.1)',
    border: '1px solid rgba(243, 156, 18, 0.2)',
    borderRadius: '8px',
    padding: '6px 12px',
    margin: '4px',
    fontSize: '12px',
    fontWeight: 600,
  },
  recommendation: {
    background: 'rgba(39, 174, 96, 0.08)',
    border: '1px solid rgba(39, 174, 96, 0.2)',
    borderRadius: '8px',
    padding: '12px 16px',
    marginTop: '8px',
  },
  recTitle: {
    fontSize: '12px',
    fontWeight: 700,
    color: '#27ae60',
    marginBottom: '8px',
  },
  warning: {
    background: 'rgba(231, 76, 60, 0.08)',
    border: '1px solid rgba(231, 76, 60, 0.2)',
    borderRadius: '8px',
    padding: '12px 16px',
    marginTop: '8px',
  },
  warningTitle: {
    fontSize: '12px',
    fontWeight: 700,
    color: '#e74c3c',
    marginBottom: '8px',
  },
  paragraph: {
    fontSize: '13px',
    color: '#bbbbd0',
    lineHeight: 1.8,
    marginBottom: '8px',
  },
  riskBadge: {
    display: 'inline-block',
    padding: '4px 12px',
    borderRadius: '12px',
    fontSize: '11px',
    fontWeight: 700,
    textTransform: 'uppercase',
    marginLeft: '8px',
  },
};

function parseRiskLevel(text) {
  const lower = text.toLowerCase();
  if (lower.includes('critical') || lower.includes('extreme') || lower.includes('very high')) {
    return { label: 'Critical', color: '#e74c3c' };
  }
  if (lower.includes('high risk') || lower.includes('high-risk') || lower.includes('elevated')) {
    return { label: 'High', color: '#e67e22' };
  }
  if (lower.includes('medium') || lower.includes('moderate')) {
    return { label: 'Medium', color: '#f39c12' };
  }
  if (lower.includes('low risk') || lower.includes('low-risk') || lower.includes('minimal')) {
    return { label: 'Low', color: '#27ae60' };
  }
  return null;
}

function extractMetrics(text) {
  const metrics = [];
  const patterns = [
    /(\d+(?:\.\d+)?%)/g,
    /(\d+(?:\.\d+)?\s*(?:bpm|BPM))/g,
    /(\d+(?:\.\d+)?\s*(?:dB|decibels))/g,
    /(score[:\s]+\d+(?:\.\d+)?(?:\/\d+)?)/gi,
    /(\d+(?:\.\d+)?\s*(?:\u00B0[CF]|degrees))/g,
  ];
  patterns.forEach(pattern => {
    let match;
    while ((match = pattern.exec(text)) !== null) {
      if (!metrics.includes(match[1])) {
        metrics.push(match[1]);
      }
    }
  });
  return metrics.slice(0, 6);
}

function parseAIResponse(text) {
  if (!text || typeof text !== 'string') {
    if (typeof text === 'object') {
      text = JSON.stringify(text, null, 2);
    } else {
      return { sections: [{ title: 'Analysis', content: ['No analysis data available.'] }] };
    }
  }

  const sections = [];
  const lines = text.split('\n').filter(l => l.trim());
  let currentSection = { title: 'Analysis Summary', content: [] };

  lines.forEach(line => {
    const trimmed = line.trim();
    if (/^#{1,3}\s+/.test(trimmed)) {
      if (currentSection.content.length > 0) {
        sections.push(currentSection);
      }
      currentSection = { title: trimmed.replace(/^#{1,3}\s+/, ''), content: [] };
    } else if (/^\*\*[^*]+\*\*:?\s*$/.test(trimmed)) {
      if (currentSection.content.length > 0) {
        sections.push(currentSection);
      }
      currentSection = { title: trimmed.replace(/\*\*/g, '').replace(/:$/, ''), content: [] };
    } else if (/^[-*]\s+/.test(trimmed)) {
      currentSection.content.push(trimmed.replace(/^[-*]\s+/, ''));
    } else if (/^\d+[\.\)]\s+/.test(trimmed)) {
      currentSection.content.push(trimmed.replace(/^\d+[\.\)]\s+/, ''));
    } else if (trimmed.length > 0) {
      currentSection.content.push(trimmed);
    }
  });

  if (currentSection.content.length > 0 || sections.length === 0) {
    sections.push(currentSection);
  }

  return { sections };
}

function getSectionIcon(title) {
  const lower = title.toLowerCase();
  if (lower.includes('summary') || lower.includes('overview')) return '\u{1F4CB}';
  if (lower.includes('risk') || lower.includes('danger') || lower.includes('warning')) return '\u26A0';
  if (lower.includes('recommend') || lower.includes('action') || lower.includes('suggestion')) return '\u2705';
  if (lower.includes('finding') || lower.includes('observation')) return '\u{1F50D}';
  if (lower.includes('compliance') || lower.includes('regulation')) return '\u{1F4DC}';
  if (lower.includes('health') || lower.includes('medical') || lower.includes('wellness')) return '\u{1F3E5}';
  if (lower.includes('equipment') || lower.includes('maintenance')) return '\u2699';
  if (lower.includes('training') || lower.includes('education')) return '\u{1F393}';
  if (lower.includes('environment') || lower.includes('weather')) return '\u{1F321}';
  if (lower.includes('emergency') || lower.includes('response')) return '\u{1F6A8}';
  if (lower.includes('prediction') || lower.includes('forecast')) return '\u{1F52E}';
  if (lower.includes('conclusion') || lower.includes('result')) return '\u{1F3AF}';
  return '\u{1F4A1}';
}

function isRecommendation(title) {
  const lower = title.toLowerCase();
  return lower.includes('recommend') || lower.includes('action') || lower.includes('suggestion') || lower.includes('next step');
}

function isWarning(title) {
  const lower = title.toLowerCase();
  return lower.includes('risk') || lower.includes('warning') || lower.includes('danger') || lower.includes('alert') || lower.includes('critical');
}

function AIOutput({ data, title, loading }) {
  if (loading) {
    return (
      <div style={styles.container}>
        <div style={styles.header}>
          <span style={styles.headerIcon}>{'\u{1F916}'}</span>
          <span style={styles.headerTitle}>AI Analyzing...</span>
        </div>
        <div style={{ ...styles.body, textAlign: 'center', padding: '40px' }}>
          <div style={{ fontSize: '32px', marginBottom: '12px', animation: 'pulse 1.5s infinite' }}>
            {'\u{1F9E0}'}
          </div>
          <div style={{ color: '#8888aa', fontSize: '14px' }}>
            Processing data with AI engine...
          </div>
        </div>
      </div>
    );
  }

  if (!data) return null;

  let textContent = '';
  if (typeof data === 'string') {
    textContent = data;
  } else if (data.analysis) {
    textContent = data.analysis;
  } else if (data.result) {
    textContent = data.result;
  } else if (data.response) {
    textContent = data.response;
  } else if (data.message) {
    textContent = data.message;
  } else if (data.data) {
    textContent = typeof data.data === 'string' ? data.data : JSON.stringify(data.data, null, 2);
  } else {
    textContent = JSON.stringify(data, null, 2);
  }

  const risk = parseRiskLevel(textContent);
  const metrics = extractMetrics(textContent);
  const parsed = parseAIResponse(textContent);

  return (
    <div style={styles.container}>
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
      `}</style>
      <div style={styles.header}>
        <span style={styles.headerIcon}>{'\u{1F916}'}</span>
        <span style={styles.headerTitle}>{title || 'AI Analysis Report'}</span>
        {risk && (
          <span
            style={{
              ...styles.riskBadge,
              background: `${risk.color}22`,
              color: risk.color,
              border: `1px solid ${risk.color}44`,
            }}
          >
            {risk.label} Risk
          </span>
        )}
        <span style={styles.headerBadge}>AI Generated</span>
      </div>
      <div style={styles.body}>
        {metrics.length > 0 && (
          <div style={{ marginBottom: '20px', display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
            {metrics.map((m, i) => (
              <span key={i} style={{ ...styles.metric, color: '#f39c12' }}>
                {'\u{1F4CA}'} {m}
              </span>
            ))}
          </div>
        )}
        {parsed.sections.map((section, idx) => {
          const isRec = isRecommendation(section.title);
          const isWarn = isWarning(section.title);
          const wrapperStyle = isRec ? styles.recommendation : isWarn ? styles.warning : {};
          const titleStyle = isRec
            ? styles.recTitle
            : isWarn
            ? styles.warningTitle
            : styles.sectionTitle;

          return (
            <div key={idx} style={{ ...styles.section, ...wrapperStyle }}>
              <div style={titleStyle}>
                {getSectionIcon(section.title)} {section.title}
              </div>
              {section.content.map((item, jdx) => (
                <div key={jdx} style={styles.paragraph}>
                  {section.content.length > 1 && (
                    <span style={{ color: '#f39c12', marginRight: '8px' }}>{'\u25B8'}</span>
                  )}
                  {item.replace(/\*\*/g, '').replace(/\*/g, '')}
                </div>
              ))}
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default AIOutput;
