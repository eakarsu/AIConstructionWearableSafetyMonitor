import React, { useEffect, useState } from 'react';
import api from '../services/api';

// VIZ 1: bar chart visualising HR / body temp / fatigue per worker.
export default function WorkerBiometricsChart() {
  const [workers, setWorkers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [metric, setMetric] = useState('heart_rate');

  useEffect(() => {
    let mounted = true;
    api.get('/custom-views/worker-biometrics')
      .then(res => { if (mounted) setWorkers(res.data.workers || []); })
      .catch(err => { if (mounted) setError(err.message); })
      .finally(() => { if (mounted) setLoading(false); });
    return () => { mounted = false; };
  }, []);

  if (loading) return <div style={{ padding: 12, color: '#9ca3af' }}>Loading biometrics...</div>;
  if (error) return <div style={{ padding: 12, color: '#f87171' }}>Error: {error}</div>;
  if (workers.length === 0) return <div style={{ padding: 12, color: '#9ca3af' }}>No worker data.</div>;

  const metricMeta = {
    heart_rate:   { label: 'Heart Rate (bpm)', color: '#ef4444', safeMin: 60,  safeMax: 110 },
    body_temp:    { label: 'Body Temp (F)',    color: '#f59e0b', safeMin: 97,  safeMax: 99.5 },
    fatigue_score:{ label: 'Fatigue Score',    color: '#8b5cf6', safeMin: 0,   safeMax: 60 },
  };
  const meta = metricMeta[metric];

  const values = workers.map(w => Number(w[metric]) || 0);
  const max = Math.max(...values, meta.safeMax) * 1.15 || 1;
  const chartW = 720, chartH = 320, padL = 40, padB = 60, padT = 20, padR = 12;
  const innerW = chartW - padL - padR;
  const innerH = chartH - padT - padB;
  const barW = innerW / Math.max(workers.length, 1);

  return (
    <div style={{ background: '#111827', borderRadius: 8, padding: 16, border: '1px solid #374151' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
        <h3 style={{ color: '#f3f4f6', margin: 0, fontSize: 16 }}>Worker Biometrics ({workers.length} workers)</h3>
        <select
          value={metric}
          onChange={e => setMetric(e.target.value)}
          style={{ background: '#1f2937', color: '#e5e7eb', border: '1px solid #374151', padding: '4px 8px', borderRadius: 4 }}
          data-testid="biometrics-metric-select"
        >
          <option value="heart_rate">Heart Rate</option>
          <option value="body_temp">Body Temp</option>
          <option value="fatigue_score">Fatigue Score</option>
        </select>
      </div>
      <svg width="100%" viewBox={`0 0 ${chartW} ${chartH}`} role="img" aria-label="Worker biometrics chart">
        {/* y-axis ticks */}
        {[0, 0.25, 0.5, 0.75, 1].map(t => {
          const y = padT + innerH - t * innerH;
          return (
            <g key={t}>
              <line x1={padL} y1={y} x2={chartW - padR} y2={y} stroke="#374151" strokeDasharray="2 4" />
              <text x={padL - 6} y={y + 4} fontSize="10" fill="#9ca3af" textAnchor="end">
                {(t * max).toFixed(0)}
              </text>
            </g>
          );
        })}
        {/* safe band */}
        <rect
          x={padL}
          y={padT + innerH - (meta.safeMax / max) * innerH}
          width={innerW}
          height={Math.max(0, ((meta.safeMax - meta.safeMin) / max) * innerH)}
          fill="#10b981"
          opacity="0.08"
        />
        {/* bars */}
        {workers.map((w, i) => {
          const v = Number(w[metric]) || 0;
          const h = (v / max) * innerH;
          const x = padL + i * barW + barW * 0.15;
          const y = padT + innerH - h;
          const out = v < meta.safeMin || v > meta.safeMax;
          return (
            <g key={w.id}>
              <rect x={x} y={y} width={barW * 0.7} height={h} fill={out ? '#ef4444' : meta.color} opacity="0.85">
                <title>{`${w.name}: ${v}`}</title>
              </rect>
              <text
                x={x + (barW * 0.7) / 2}
                y={chartH - padB + 12}
                fontSize="9"
                fill="#9ca3af"
                textAnchor="end"
                transform={`rotate(-45, ${x + (barW * 0.7) / 2}, ${chartH - padB + 12})`}
              >
                {w.name?.split(' ')[0] || `#${w.id}`}
              </text>
            </g>
          );
        })}
        <text x={padL} y={padT - 6} fontSize="11" fill="#d1d5db">{meta.label}</text>
      </svg>
      <div style={{ color: '#9ca3af', fontSize: 12, marginTop: 6 }}>
        Green band = safe range ({meta.safeMin} - {meta.safeMax}). Red bars = out of range.
      </div>
    </div>
  );
}
