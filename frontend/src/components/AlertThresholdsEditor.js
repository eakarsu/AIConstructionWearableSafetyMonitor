import React, { useEffect, useState } from 'react';
import api from '../services/api';

// NON-VIZ 2: CRUD editor for biometric alert threshold rules.
const METRICS = ['heart_rate', 'body_temp', 'oxygen_level', 'fatigue_score', 'reaction_time', 'wbgt_index'];
const SEVERITY = ['info', 'warning', 'critical'];

const EMPTY = { metric: 'heart_rate', min: 50, max: 140, severity: 'warning', note: '' };

export default function AlertThresholdsEditor() {
  const [rules, setRules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState(EMPTY);
  const [editingId, setEditingId] = useState(null);
  const [error, setError] = useState(null);
  const [info, setInfo] = useState(null);

  function load() {
    setLoading(true);
    api.get('/custom-views/alert-thresholds')
      .then(res => setRules(res.data.rules || []))
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  }

  useEffect(() => { load(); }, []);

  function update(k, v) {
    setForm(f => ({ ...f, [k]: v }));
  }

  async function submit(e) {
    e.preventDefault();
    setError(null);
    setInfo(null);
    const body = {
      metric: form.metric,
      min: Number(form.min),
      max: Number(form.max),
      severity: form.severity,
      note: form.note || '',
    };
    try {
      if (editingId) {
        await api.put(`/custom-views/alert-thresholds/${editingId}`, body);
        setInfo(`Rule #${editingId} updated.`);
      } else {
        const res = await api.post('/custom-views/alert-thresholds', body);
        setInfo(`Rule #${res.data.id} created.`);
      }
      setEditingId(null);
      setForm(EMPTY);
      load();
    } catch (err) {
      setError(err.response?.data?.error || err.message);
    }
  }

  function startEdit(rule) {
    setEditingId(rule.id);
    setForm({
      metric: rule.metric,
      min: rule.min,
      max: rule.max,
      severity: rule.severity,
      note: rule.note || '',
    });
  }

  async function del(id) {
    setError(null);
    setInfo(null);
    try {
      await api.delete(`/custom-views/alert-thresholds/${id}`);
      setInfo(`Rule #${id} deleted.`);
      load();
    } catch (err) {
      setError(err.response?.data?.error || err.message);
    }
  }

  return (
    <div style={{ background: '#111827', borderRadius: 8, padding: 16, border: '1px solid #374151' }}>
      <h3 style={{ color: '#f3f4f6', margin: 0, marginBottom: 10, fontSize: 16 }}>
        Biometric Alert Thresholds
      </h3>
      <p style={{ color: '#9ca3af', fontSize: 13, marginTop: 0 }}>
        Define safe ranges for each biometric. Values outside the range trigger alerts at the configured severity.
      </p>

      <form onSubmit={submit} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr 2fr auto', gap: 8, alignItems: 'end', marginBottom: 14 }}>
        <label style={{ fontSize: 11, color: '#9ca3af' }}>Metric
          <select value={form.metric} onChange={e => update('metric', e.target.value)} style={inputStyle} data-testid="threshold-metric">
            {METRICS.map(m => <option key={m} value={m}>{m}</option>)}
          </select>
        </label>
        <label style={{ fontSize: 11, color: '#9ca3af' }}>Min
          <input type="number" step="0.1" value={form.min} onChange={e => update('min', e.target.value)} style={inputStyle} data-testid="threshold-min" />
        </label>
        <label style={{ fontSize: 11, color: '#9ca3af' }}>Max
          <input type="number" step="0.1" value={form.max} onChange={e => update('max', e.target.value)} style={inputStyle} data-testid="threshold-max" />
        </label>
        <label style={{ fontSize: 11, color: '#9ca3af' }}>Severity
          <select value={form.severity} onChange={e => update('severity', e.target.value)} style={inputStyle} data-testid="threshold-severity">
            {SEVERITY.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </label>
        <label style={{ fontSize: 11, color: '#9ca3af' }}>Note
          <input value={form.note} onChange={e => update('note', e.target.value)} style={inputStyle} placeholder="Description" />
        </label>
        <div style={{ display: 'flex', gap: 6 }}>
          <button type="submit" style={btnPrimary} data-testid="threshold-submit">
            {editingId ? 'Update' : 'Create'}
          </button>
          {editingId && (
            <button type="button" onClick={() => { setEditingId(null); setForm(EMPTY); }} style={btnGhost}>
              Cancel
            </button>
          )}
        </div>
      </form>

      {error && <div style={{ color: '#f87171', marginBottom: 10, fontSize: 13 }}>{error}</div>}
      {info && <div style={{ color: '#10b981', marginBottom: 10, fontSize: 13 }}>{info}</div>}

      {loading ? (
        <div style={{ color: '#9ca3af' }}>Loading rules...</div>
      ) : (
        <table style={{ width: '100%', borderCollapse: 'collapse', color: '#e5e7eb', fontSize: 13 }}>
          <thead>
            <tr style={{ background: '#1f2937', textAlign: 'left' }}>
              <th style={th}>ID</th>
              <th style={th}>Metric</th>
              <th style={th}>Min</th>
              <th style={th}>Max</th>
              <th style={th}>Severity</th>
              <th style={th}>Note</th>
              <th style={th}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {rules.map(r => (
              <tr key={r.id} style={{ borderBottom: '1px solid #1f2937' }}>
                <td style={td}>#{r.id}</td>
                <td style={td}>{r.metric}</td>
                <td style={td}>{r.min}</td>
                <td style={td}>{r.max}</td>
                <td style={td}>
                  <span style={{
                    padding: '2px 8px', borderRadius: 4, fontSize: 11, fontWeight: 600,
                    background: r.severity === 'critical' ? '#7f1d1d' : r.severity === 'warning' ? '#78350f' : '#1e3a8a',
                  }}>{r.severity}</span>
                </td>
                <td style={td}>{r.note}</td>
                <td style={td}>
                  <button onClick={() => startEdit(r)} style={btnGhost}>Edit</button>
                  <button onClick={() => del(r.id)} style={{ ...btnGhost, color: '#f87171', marginLeft: 6 }} data-testid={`threshold-del-${r.id}`}>Delete</button>
                </td>
              </tr>
            ))}
            {rules.length === 0 && (
              <tr><td colSpan={7} style={{ ...td, color: '#9ca3af', textAlign: 'center' }}>No rules yet.</td></tr>
            )}
          </tbody>
        </table>
      )}
    </div>
  );
}

const inputStyle = {
  width: '100%', padding: '6px 8px', borderRadius: 4,
  background: '#1f2937', color: '#e5e7eb', border: '1px solid #374151',
  marginTop: 2,
};
const btnPrimary = {
  background: '#2563eb', color: 'white', border: 'none',
  padding: '8px 14px', borderRadius: 4, cursor: 'pointer', fontWeight: 600,
};
const btnGhost = {
  background: 'transparent', color: '#e5e7eb', border: '1px solid #374151',
  padding: '4px 10px', borderRadius: 4, cursor: 'pointer', fontSize: 12,
};
const th = { padding: '8px 10px', fontSize: 12, color: '#9ca3af', fontWeight: 600 };
const td = { padding: '8px 10px' };
