import React, { useState } from 'react';
import AIOutput from './AIOutput';
import api from '../services/api';

const styles = {
  overlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    width: '100vw',
    height: '100vh',
    background: 'rgba(0, 0, 0, 0.7)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 2000,
    animation: 'fadeIn 0.2s ease',
  },
  modal: {
    background: '#1a1a2e',
    border: '1px solid #2a2a4a',
    borderRadius: '12px',
    width: '90%',
    maxWidth: '700px',
    maxHeight: '90vh',
    display: 'flex',
    flexDirection: 'column',
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '16px 20px',
    borderBottom: '1px solid #2a2a4a',
  },
  title: {
    fontSize: '18px',
    fontWeight: 700,
    color: '#e0e0e0',
  },
  closeBtn: {
    background: 'none',
    border: 'none',
    color: '#8888aa',
    fontSize: '20px',
    cursor: 'pointer',
    padding: '4px',
  },
  body: {
    padding: '20px',
    overflowY: 'auto',
    flex: 1,
  },
  detailGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
    gap: '16px',
    marginBottom: '20px',
  },
  detailItem: {
    background: '#0f0f23',
    borderRadius: '8px',
    padding: '12px',
    border: '1px solid #2a2a4a',
  },
  detailLabel: {
    fontSize: '10px',
    fontWeight: 700,
    color: '#6666aa',
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
    marginBottom: '4px',
  },
  detailValue: {
    fontSize: '14px',
    color: '#e0e0e0',
    fontWeight: 500,
    wordBreak: 'break-word',
  },
  actions: {
    display: 'flex',
    gap: '10px',
    padding: '16px 20px',
    borderTop: '1px solid #2a2a4a',
    flexWrap: 'wrap',
  },
  editBtn: {
    padding: '10px 20px',
    background: 'rgba(52, 152, 219, 0.2)',
    border: '1px solid rgba(52, 152, 219, 0.4)',
    borderRadius: '8px',
    color: '#3498db',
    cursor: 'pointer',
    fontSize: '13px',
    fontWeight: 600,
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
  },
  deleteBtn: {
    padding: '10px 20px',
    background: 'rgba(231, 76, 60, 0.2)',
    border: '1px solid rgba(231, 76, 60, 0.4)',
    borderRadius: '8px',
    color: '#e74c3c',
    cursor: 'pointer',
    fontSize: '13px',
    fontWeight: 600,
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
  },
  aiBtn: {
    padding: '10px 20px',
    background: 'linear-gradient(135deg, rgba(155, 89, 182, 0.2), rgba(52, 152, 219, 0.2))',
    border: '1px solid rgba(155, 89, 182, 0.4)',
    borderRadius: '8px',
    color: '#9b59b6',
    cursor: 'pointer',
    fontSize: '13px',
    fontWeight: 600,
    marginLeft: 'auto',
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
  },
};

const statusColors = {
  critical: '#e74c3c', high: '#e74c3c', danger: '#e74c3c',
  warning: '#f39c12', medium: '#f39c12', caution: '#f39c12',
  normal: '#27ae60', low: '#27ae60', safe: '#27ae60', good: '#27ae60',
  active: '#3498db', open: '#3498db', pending: '#9b59b6',
  resolved: '#27ae60', closed: '#666688', compliant: '#27ae60',
  'non-compliant': '#e74c3c', expired: '#e74c3c', valid: '#27ae60',
  poor: '#e74c3c', fair: '#f39c12', excellent: '#27ae60',
  triggered: '#e74c3c', alert: '#e74c3c',
};

function formatLabel(key) {
  return key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
}

function renderValue(key, value) {
  if (value === null || value === undefined) return '-';
  if (typeof value === 'boolean') return value ? 'Yes' : 'No';
  const strVal = String(value);
  if (key === 'status' || key === 'severity' || key === 'risk_level' || key === 'condition') {
    const color = statusColors[strVal.toLowerCase()] || '#8888aa';
    return (
      <span style={{
        background: `${color}22`,
        color: color,
        padding: '3px 10px',
        borderRadius: '12px',
        fontSize: '12px',
        fontWeight: 600,
        display: 'inline-block',
      }}>
        {strVal}
      </span>
    );
  }
  return strVal;
}

const hiddenFields = ['_id', 'id', '__v', 'createdAt', 'updatedAt'];

function DetailModal({ item, endpoint, onEdit, onDelete, onClose }) {
  const [aiResult, setAiResult] = useState(null);
  const [aiLoading, setAiLoading] = useState(false);

  if (!item) return null;

  const itemId = item._id || item.id;
  const displayFields = Object.entries(item).filter(
    ([key]) => !hiddenFields.includes(key)
  );

  const handleAnalyze = async () => {
    setAiLoading(true);
    setAiResult(null);
    try {
      const res = await api.post(`/${endpoint}/${itemId}/analyze`);
      setAiResult(res.data);
    } catch (err) {
      setAiResult({ analysis: 'AI analysis is currently unavailable. Please ensure the backend AI service is running and try again.' });
    }
    setAiLoading(false);
  };

  return (
    <div style={styles.overlay} onClick={onClose}>
      <div style={styles.modal} onClick={e => e.stopPropagation()}>
        <div style={styles.header}>
          <span style={styles.title}>
            {item.name || item.title || item.worker_name || item.equipment_name || item.type || item.zone || 'Detail View'}
          </span>
          <button style={styles.closeBtn} onClick={onClose}>{'\u2715'}</button>
        </div>
        <div style={styles.body}>
          <div style={styles.detailGrid}>
            {displayFields.map(([key, value]) => (
              <div key={key} style={styles.detailItem}>
                <div style={styles.detailLabel}>{formatLabel(key)}</div>
                <div style={styles.detailValue}>{renderValue(key, value)}</div>
              </div>
            ))}
          </div>
          {(aiResult || aiLoading) && (
            <div style={{ marginTop: '20px' }}>
              <AIOutput data={aiResult} loading={aiLoading} />
            </div>
          )}
        </div>
        <div style={styles.actions}>
          <button style={styles.editBtn} onClick={onEdit}>
            {'\u270E'} Edit
          </button>
          <button style={styles.deleteBtn} onClick={onDelete}>
            {'\u{1F5D1}'} Delete
          </button>
          <button style={styles.aiBtn} onClick={handleAnalyze} disabled={aiLoading}>
            {'\u{1F916}'} AI Analyze
          </button>
        </div>
      </div>
    </div>
  );
}

export default DetailModal;
