import React, { useEffect, useState } from 'react';
import api from '../services/api';

// VIZ 2: heatmap (workers x zones) using SVG rects coloured by exposure score.
export default function ZoneExposureHeatmap() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let mounted = true;
    api.get('/custom-views/zone-exposure')
      .then(res => { if (mounted) setData(res.data); })
      .catch(err => { if (mounted) setError(err.message); })
      .finally(() => { if (mounted) setLoading(false); });
    return () => { mounted = false; };
  }, []);

  if (loading) return <div style={{ padding: 12, color: '#9ca3af' }}>Loading exposure data...</div>;
  if (error) return <div style={{ padding: 12, color: '#f87171' }}>Error: {error}</div>;
  if (!data || !data.workers?.length || !data.zones?.length) {
    return <div style={{ padding: 12, color: '#9ca3af' }}>No exposure data available.</div>;
  }

  const { workers, zones, matrix, max } = data;
  const cellW = 56, cellH = 28, labelW = 160, labelH = 80;

  function colorFor(v) {
    if (max <= 0) return '#1f2937';
    const t = v / max;
    if (t === 0) return '#1f2937';
    // Interpolate green -> yellow -> red.
    const r = Math.round(255 * Math.min(1, t * 2));
    const g = Math.round(255 * Math.min(1, (1 - t) * 2));
    return `rgb(${r},${g},80)`;
  }

  const svgW = labelW + zones.length * cellW + 24;
  const svgH = labelH + workers.length * cellH + 24;

  return (
    <div style={{ background: '#111827', borderRadius: 8, padding: 16, border: '1px solid #374151' }}>
      <h3 style={{ color: '#f3f4f6', margin: 0, marginBottom: 10, fontSize: 16 }}>
        Worker x Zone Exposure Heatmap
      </h3>
      <div style={{ overflowX: 'auto' }}>
        <svg width={svgW} height={svgH} role="img" aria-label="Zone exposure heatmap">
          {/* zone column labels */}
          {zones.map((z, ci) => {
            const x = labelW + ci * cellW + cellW / 2;
            return (
              <text
                key={z}
                x={x}
                y={labelH - 6}
                fontSize="10"
                fill="#d1d5db"
                textAnchor="end"
                transform={`rotate(-45, ${x}, ${labelH - 6})`}
              >
                {z}
              </text>
            );
          })}
          {/* worker rows */}
          {workers.map((w, ri) => {
            const y = labelH + ri * cellH;
            return (
              <g key={w}>
                <text x={labelW - 6} y={y + cellH / 2 + 4} fontSize="11" fill="#e5e7eb" textAnchor="end">
                  {w}
                </text>
                {zones.map((z, ci) => {
                  const v = matrix[w]?.[z] || 0;
                  const x = labelW + ci * cellW;
                  return (
                    <g key={`${w}-${z}`}>
                      <rect
                        x={x + 1}
                        y={y + 1}
                        width={cellW - 2}
                        height={cellH - 2}
                        fill={colorFor(v)}
                        stroke="#0f172a"
                      >
                        <title>{`${w} / ${z}: ${v}`}</title>
                      </rect>
                      {v > 0 && (
                        <text x={x + cellW / 2} y={y + cellH / 2 + 4} fontSize="10" fill="#0f172a" textAnchor="middle">
                          {v}
                        </text>
                      )}
                    </g>
                  );
                })}
              </g>
            );
          })}
        </svg>
      </div>
      <div style={{ color: '#9ca3af', fontSize: 12, marginTop: 6 }}>
        Cell color = combined exposure score (proximity alerts + heat stress + PPE presence). Max: {max}
      </div>
    </div>
  );
}
