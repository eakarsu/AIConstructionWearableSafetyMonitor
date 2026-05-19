import React, { useEffect, useState } from 'react';
import api from '../services/api';

// NON-VIZ 1: trigger PDF download of an incident report.
export default function IncidentPdfExport() {
  const [incidents, setIncidents] = useState([]);
  const [selected, setSelected] = useState('');
  const [loading, setLoading] = useState(true);
  const [working, setWorking] = useState(false);
  const [message, setMessage] = useState(null);

  useEffect(() => {
    let mounted = true;
    api.get('/incidents?limit=50&page=1')
      .then(res => {
        if (!mounted) return;
        const arr = Array.isArray(res.data?.data) ? res.data.data : res.data;
        setIncidents(arr || []);
      })
      .catch(() => { if (mounted) setIncidents([]); })
      .finally(() => { if (mounted) setLoading(false); });
    return () => { mounted = false; };
  }, []);

  async function downloadPdf() {
    setWorking(true);
    setMessage(null);
    try {
      const params = selected ? { id: selected } : {};
      const res = await api.get('/custom-views/incident-pdf', { params, responseType: 'blob' });
      const blob = new Blob([res.data], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `incident-report-${selected || 'latest'}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      setMessage('PDF downloaded.');
    } catch (err) {
      setMessage(`Failed: ${err.message}`);
    } finally {
      setWorking(false);
    }
  }

  return (
    <div style={{ background: '#111827', borderRadius: 8, padding: 16, border: '1px solid #374151' }}>
      <h3 style={{ color: '#f3f4f6', margin: 0, marginBottom: 10, fontSize: 16 }}>Incident Report PDF Export</h3>
      <p style={{ color: '#9ca3af', fontSize: 13, marginTop: 0 }}>
        Pick a specific incident, or leave blank to export a summary of the 10 most-recent incidents.
      </p>
      <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
        <select
          value={selected}
          onChange={e => setSelected(e.target.value)}
          disabled={loading}
          style={{ background: '#1f2937', color: '#e5e7eb', border: '1px solid #374151', padding: '6px 10px', borderRadius: 4, minWidth: 280 }}
          data-testid="incident-pdf-select"
        >
          <option value="">(All recent incidents — summary)</option>
          {incidents.map(inc => (
            <option key={inc.id} value={inc.id}>
              #{inc.id} — {inc.title || 'Untitled'} ({inc.severity || 'n/a'})
            </option>
          ))}
        </select>
        <button
          onClick={downloadPdf}
          disabled={working}
          style={{
            background: '#2563eb', color: 'white', border: 'none',
            padding: '8px 16px', borderRadius: 4, cursor: 'pointer', fontWeight: 600,
          }}
          data-testid="incident-pdf-download"
        >
          {working ? 'Generating...' : 'Download PDF'}
        </button>
      </div>
      {message && (
        <div style={{ marginTop: 10, color: message.startsWith('Failed') ? '#f87171' : '#10b981', fontSize: 13 }}>
          {message}
        </div>
      )}
    </div>
  );
}
