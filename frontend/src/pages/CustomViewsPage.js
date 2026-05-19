import React from 'react';
import WorkerBiometricsChart from '../components/WorkerBiometricsChart';
import ZoneExposureHeatmap from '../components/ZoneExposureHeatmap';
import IncidentPdfExport from '../components/IncidentPdfExport';
import AlertThresholdsEditor from '../components/AlertThresholdsEditor';

// Wearable Views: aggregates 4 features (2 VIZ + 2 NON-VIZ) for
// construction wearable safety monitoring.
export default function CustomViewsPage() {
  return (
    <div style={{ padding: 24, maxWidth: 1280, margin: '0 auto', color: '#e5e7eb' }}>
      <header style={{ marginBottom: 20 }}>
        <h1 style={{ margin: 0, fontSize: 24, color: '#f3f4f6' }} data-testid="custom-views-title">
          Wearable Views
        </h1>
        <p style={{ color: '#9ca3af', marginTop: 6 }}>
          Custom dashboards and tools for wearable-based safety monitoring.
        </p>
      </header>

      <section style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 20 }}>
        <WorkerBiometricsChart />
        <ZoneExposureHeatmap />
        <IncidentPdfExport />
        <AlertThresholdsEditor />
      </section>
    </div>
  );
}
