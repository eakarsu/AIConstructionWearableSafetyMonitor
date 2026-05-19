import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import FeaturePage from './pages/FeaturePage';
import AICenter from './pages/AICenter';
import AdvancedFeatures from './pages/AdvancedFeatures';
import './App.css';

// // === Batch 02 Gaps & Frontend Mounts ===
import CfMultiModalFatigueDetection from './pages/CfMultiModalFatigueDetection';
import CfPredictiveInjuryPrevention from './pages/CfPredictiveInjuryPrevention';
import CfAutonomousSafetyAudits from './pages/CfAutonomousSafetyAudits';
import CfBehaviorBasedSafetyBbsCoaching from './pages/CfBehaviorBasedSafetyBbsCoaching';
import CfWorkerCohortAnalysis from './pages/CfWorkerCohortAnalysis';
import CfInsurancePremiumOptimization from './pages/CfInsurancePremiumOptimization';
import GapProximityFallsLackDedicatedAiEndpointsForCollisionPr from './pages/GapProximityFallsLackDedicatedAiEndpointsForCollisionPr';
import GapMaintenanceLacksPredictiveMaintenanceSchedulingAi from './pages/GapMaintenanceLacksPredictiveMaintenanceSchedulingAi';
import GapHazardsPpeLackAiRiskScoring from './pages/GapHazardsPpeLackAiRiskScoring';
import GapLimitedIntegrationWithWearableApisAppleWatchFitbitOu from './pages/GapLimitedIntegrationWithWearableApisAppleWatchFitbitOu';
import GapNoGeofencedSiteMapManagement from './pages/GapNoGeofencedSiteMapManagement';
import GapNoInsuranceLiabilityTrackingOrClaimsModule from './pages/GapNoInsuranceLiabilityTrackingOrClaimsModule';
import GapNoWebhooksForSensorPushes from './pages/GapNoWebhooksForSensorPushes';
import GapNoPaymentBillingModule from './pages/GapNoPaymentBillingModule';
import CustomViewsPage from './pages/CustomViewsPage';

function ProtectedRoute({ children }) {
  const token = localStorage.getItem('token');
  if (!token) return <Navigate to="/login" replace />;
  return (
    <div className="app-layout">
      <Sidebar />
      <main className="app-main">{children}</main>
    </div>
  );
}

const featureConfigs = {
  workers: {
    title: 'Worker Safety Monitoring',
    icon: '\u26D1',
    endpoint: 'workers',
    columns: [
      { key: 'name', label: 'Name' },
      { key: 'role', label: 'Role' },
      { key: 'site', label: 'Site' },
      { key: 'heart_rate', label: 'Heart Rate' },
      { key: 'body_temp', label: 'Body Temp' },
      { key: 'oxygen_level', label: 'O2 Level' },
      { key: 'status', label: 'Status' },
      { key: 'risk_level', label: 'Risk Level' },
    ],
    formFields: [
      { key: 'name', label: 'Name', type: 'text', required: true },
      { key: 'role', label: 'Role', type: 'select', options: ['Laborer', 'Electrician', 'Plumber', 'Crane Operator', 'Welder', 'Carpenter', 'Foreman', 'Engineer', 'Safety Officer'] },
      { key: 'site', label: 'Site', type: 'text' },
      { key: 'heart_rate', label: 'Heart Rate (bpm)', type: 'number' },
      { key: 'body_temp', label: 'Body Temperature', type: 'number', step: '0.1' },
      { key: 'oxygen_level', label: 'Oxygen Level (%)', type: 'number' },
      { key: 'location', label: 'Location', type: 'text' },
      { key: 'status', label: 'Status', type: 'select', options: ['Active', 'Inactive', 'Break', 'Emergency'] },
      { key: 'risk_level', label: 'Risk Level', type: 'select', options: ['Low', 'Medium', 'High', 'Critical'] },
    ],
  },
  hazards: {
    title: 'Hazard Detection',
    icon: '\u26A0',
    endpoint: 'hazards',
    columns: [
      { key: 'type', label: 'Type' },
      { key: 'severity', label: 'Severity' },
      { key: 'location', label: 'Location' },
      { key: 'zone', label: 'Zone' },
      { key: 'detected_by', label: 'Detected By' },
      { key: 'status', label: 'Status' },
    ],
    formFields: [
      { key: 'type', label: 'Hazard Type', type: 'select', options: ['Fall Hazard', 'Electrical', 'Chemical', 'Structural', 'Fire', 'Confined Space', 'Trench', 'Scaffolding', 'Other'], required: true },
      { key: 'severity', label: 'Severity', type: 'select', options: ['Low', 'Medium', 'High', 'Critical'], required: true },
      { key: 'location', label: 'Location', type: 'text', required: true },
      { key: 'zone', label: 'Zone', type: 'text' },
      { key: 'description', label: 'Description', type: 'textarea' },
      { key: 'detected_by', label: 'Detected By', type: 'select', options: ['AI Sensor', 'Worker Report', 'Safety Officer', 'Drone', 'Camera'] },
      { key: 'status', label: 'Status', type: 'select', options: ['Active', 'Resolved', 'Monitoring', 'Pending'] },
      { key: 'ai_recommendation', label: 'AI Recommendation', type: 'textarea' },
    ],
  },
  incidents: {
    title: 'Incident Reports',
    icon: '\u26A1',
    endpoint: 'incidents',
    columns: [
      { key: 'title', label: 'Title' },
      { key: 'type', label: 'Type' },
      { key: 'severity', label: 'Severity' },
      { key: 'location', label: 'Location' },
      { key: 'worker_name', label: 'Worker' },
      { key: 'status', label: 'Status' },
    ],
    formFields: [
      { key: 'title', label: 'Title', type: 'text', required: true },
      { key: 'type', label: 'Incident Type', type: 'select', options: ['Near Miss', 'Injury', 'Property Damage', 'Environmental', 'Equipment Failure', 'Fall', 'Electrical', 'Other'] },
      { key: 'severity', label: 'Severity', type: 'select', options: ['Low', 'Medium', 'High', 'Critical'] },
      { key: 'location', label: 'Location', type: 'text', required: true },
      { key: 'worker_name', label: 'Worker Name', type: 'text' },
      { key: 'description', label: 'Description', type: 'textarea', required: true },
      { key: 'injuries', label: 'Injuries', type: 'text' },
      { key: 'status', label: 'Status', type: 'select', options: ['Open', 'Under Investigation', 'Resolved', 'Closed'] },
      { key: 'ai_analysis', label: 'AI Analysis', type: 'textarea' },
    ],
  },
  equipment: {
    title: 'Equipment Inspection',
    icon: '\u2699',
    endpoint: 'equipment',
    columns: [
      { key: 'name', label: 'Name' },
      { key: 'type', label: 'Type' },
      { key: 'serial_number', label: 'Serial #' },
      { key: 'location', label: 'Location' },
      { key: 'condition', label: 'Condition' },
      { key: 'status', label: 'Status' },
    ],
    formFields: [
      { key: 'name', label: 'Equipment Name', type: 'text', required: true },
      { key: 'type', label: 'Type', type: 'select', options: ['Crane', 'Excavator', 'Loader', 'Scaffold', 'Lift', 'Generator', 'Compressor', 'Welder', 'Drill', 'Other'] },
      { key: 'serial_number', label: 'Serial Number', type: 'text' },
      { key: 'location', label: 'Location', type: 'text' },
      { key: 'last_inspection', label: 'Last Inspection', type: 'date' },
      { key: 'next_inspection', label: 'Next Inspection', type: 'date' },
      { key: 'condition', label: 'Condition', type: 'select', options: ['Excellent', 'Good', 'Fair', 'Poor', 'Critical'] },
      { key: 'inspector', label: 'Inspector', type: 'text' },
      { key: 'status', label: 'Status', type: 'select', options: ['Active', 'Maintenance', 'Out of Service', 'Retired'] },
      { key: 'ai_assessment', label: 'AI Assessment', type: 'textarea' },
    ],
  },
  environmental: {
    title: 'Environmental Monitoring',
    icon: '\u{1F321}',
    endpoint: 'environmental',
    columns: [
      { key: 'zone', label: 'Zone' },
      { key: 'temperature', label: 'Temp' },
      { key: 'humidity', label: 'Humidity' },
      { key: 'wind_speed', label: 'Wind Speed' },
      { key: 'visibility', label: 'Visibility' },
      { key: 'weather', label: 'Weather' },
      { key: 'status', label: 'Status' },
    ],
    formFields: [
      { key: 'zone', label: 'Zone', type: 'text', required: true },
      { key: 'temperature', label: 'Temperature', type: 'number', step: '0.1' },
      { key: 'humidity', label: 'Humidity (%)', type: 'number' },
      { key: 'wind_speed', label: 'Wind Speed (mph)', type: 'number', step: '0.1' },
      { key: 'visibility', label: 'Visibility', type: 'text' },
      { key: 'uv_index', label: 'UV Index', type: 'number', step: '0.1' },
      { key: 'weather', label: 'Weather', type: 'select', options: ['Clear', 'Cloudy', 'Rain', 'Storm', 'Snow', 'Fog', 'Windy', 'Hot', 'Cold'] },
      { key: 'status', label: 'Status', type: 'select', options: ['Normal', 'Caution', 'Warning', 'Critical'] },
      { key: 'ai_recommendation', label: 'AI Recommendation', type: 'textarea' },
    ],
  },
  fatigue: {
    title: 'Worker Fatigue Detection',
    icon: '\u23F3',
    endpoint: 'fatigue',
    columns: [
      { key: 'worker_name', label: 'Worker' },
      { key: 'role', label: 'Role' },
      { key: 'hours_worked', label: 'Hours Worked' },
      { key: 'fatigue_score', label: 'Fatigue Score' },
      { key: 'reaction_time', label: 'Reaction Time' },
      { key: 'status', label: 'Status' },
    ],
    formFields: [
      { key: 'worker_name', label: 'Worker Name', type: 'text', required: true },
      { key: 'role', label: 'Role', type: 'text' },
      { key: 'shift_start', label: 'Shift Start', type: 'datetime-local' },
      { key: 'hours_worked', label: 'Hours Worked', type: 'number', step: '0.5' },
      { key: 'fatigue_score', label: 'Fatigue Score (0-100)', type: 'number' },
      { key: 'heart_rate_variability', label: 'Heart Rate Variability', type: 'number', step: '0.1' },
      { key: 'reaction_time', label: 'Reaction Time (ms)', type: 'number' },
      { key: 'status', label: 'Status', type: 'select', options: ['Normal', 'Caution', 'Warning', 'Critical'] },
      { key: 'ai_recommendation', label: 'AI Recommendation', type: 'textarea' },
    ],
  },
  ppe: {
    title: 'PPE Compliance',
    icon: '\u{1F6E1}',
    endpoint: 'ppe',
    columns: [
      { key: 'worker_name', label: 'Worker' },
      { key: 'role', label: 'Role' },
      { key: 'zone', label: 'Zone' },
      { key: 'compliance_score', label: 'Score' },
      { key: 'status', label: 'Status' },
    ],
    formFields: [
      { key: 'worker_name', label: 'Worker Name', type: 'text', required: true },
      { key: 'role', label: 'Role', type: 'text' },
      { key: 'zone', label: 'Zone', type: 'text' },
      { key: 'helmet', label: 'Helmet', type: 'checkbox' },
      { key: 'vest', label: 'Vest', type: 'checkbox' },
      { key: 'gloves', label: 'Gloves', type: 'checkbox' },
      { key: 'boots', label: 'Boots', type: 'checkbox' },
      { key: 'goggles', label: 'Goggles', type: 'checkbox' },
      { key: 'harness', label: 'Harness', type: 'checkbox' },
      { key: 'compliance_score', label: 'Compliance Score (%)', type: 'number' },
      { key: 'status', label: 'Status', type: 'select', options: ['Compliant', 'Non-Compliant', 'Partial'] },
      { key: 'ai_note', label: 'AI Note', type: 'textarea' },
    ],
  },
  falls: {
    title: 'Fall Detection',
    icon: '\u2B07',
    endpoint: 'falls',
    columns: [
      { key: 'worker_name', label: 'Worker' },
      { key: 'location', label: 'Location' },
      { key: 'zone', label: 'Zone' },
      { key: 'fall_height', label: 'Fall Height' },
      { key: 'severity', label: 'Severity' },
      { key: 'status', label: 'Status' },
    ],
    formFields: [
      { key: 'worker_name', label: 'Worker Name', type: 'text', required: true },
      { key: 'location', label: 'Location', type: 'text', required: true },
      { key: 'zone', label: 'Zone', type: 'text' },
      { key: 'fall_height', label: 'Fall Height (ft)', type: 'number', step: '0.1' },
      { key: 'impact_force', label: 'Impact Force', type: 'number', step: '0.1' },
      { key: 'sensor_triggered', label: 'Sensor Triggered', type: 'checkbox' },
      { key: 'response_time', label: 'Response Time (min)', type: 'number', step: '0.1' },
      { key: 'status', label: 'Status', type: 'select', options: ['Active', 'Responded', 'Resolved', 'False Alarm'] },
      { key: 'severity', label: 'Severity', type: 'select', options: ['Low', 'Medium', 'High', 'Critical'] },
      { key: 'ai_assessment', label: 'AI Assessment', type: 'textarea' },
    ],
  },
  heatstress: {
    title: 'Heat Stress Monitoring',
    icon: '\u2600',
    endpoint: 'heatstress',
    columns: [
      { key: 'worker_name', label: 'Worker' },
      { key: 'zone', label: 'Zone' },
      { key: 'body_temp', label: 'Body Temp' },
      { key: 'wbgt_index', label: 'WBGT Index' },
      { key: 'hydration_level', label: 'Hydration' },
      { key: 'status', label: 'Status' },
    ],
    formFields: [
      { key: 'worker_name', label: 'Worker Name', type: 'text', required: true },
      { key: 'zone', label: 'Zone', type: 'text' },
      { key: 'body_temp', label: 'Body Temperature', type: 'number', step: '0.1' },
      { key: 'ambient_temp', label: 'Ambient Temperature', type: 'number', step: '0.1' },
      { key: 'humidity', label: 'Humidity (%)', type: 'number' },
      { key: 'wbgt_index', label: 'WBGT Index', type: 'number', step: '0.1' },
      { key: 'hydration_level', label: 'Hydration Level', type: 'select', options: ['Adequate', 'Low', 'Critical'] },
      { key: 'work_rest_ratio', label: 'Work/Rest Ratio', type: 'text' },
      { key: 'status', label: 'Status', type: 'select', options: ['Normal', 'Caution', 'Warning', 'Critical'] },
      { key: 'ai_recommendation', label: 'AI Recommendation', type: 'textarea' },
    ],
  },
  noise: {
    title: 'Noise Exposure',
    icon: '\u{1F50A}',
    endpoint: 'noise',
    columns: [
      { key: 'zone', label: 'Zone' },
      { key: 'location', label: 'Location' },
      { key: 'decibel_level', label: 'dB Level' },
      { key: 'peak_level', label: 'Peak Level' },
      { key: 'duration_hours', label: 'Duration (h)' },
      { key: 'workers_affected', label: 'Workers' },
      { key: 'status', label: 'Status' },
    ],
    formFields: [
      { key: 'zone', label: 'Zone', type: 'text', required: true },
      { key: 'location', label: 'Location', type: 'text' },
      { key: 'decibel_level', label: 'Decibel Level (dB)', type: 'number', step: '0.1' },
      { key: 'peak_level', label: 'Peak Level (dB)', type: 'number', step: '0.1' },
      { key: 'duration_hours', label: 'Duration (hours)', type: 'number', step: '0.5' },
      { key: 'exposure_limit', label: 'Exposure Limit (dB)', type: 'number' },
      { key: 'hearing_protection', label: 'Hearing Protection', type: 'select', options: ['Earplugs', 'Earmuffs', 'Both', 'None'] },
      { key: 'workers_affected', label: 'Workers Affected', type: 'number' },
      { key: 'status', label: 'Status', type: 'select', options: ['Normal', 'Caution', 'Warning', 'Critical'] },
      { key: 'ai_recommendation', label: 'AI Recommendation', type: 'textarea' },
    ],
  },
  airquality: {
    title: 'Air Quality',
    icon: '\u{1F32C}',
    endpoint: 'airquality',
    columns: [
      { key: 'zone', label: 'Zone' },
      { key: 'location', label: 'Location' },
      { key: 'pm25', label: 'PM2.5' },
      { key: 'pm10', label: 'PM10' },
      { key: 'aqi_index', label: 'AQI' },
      { key: 'status', label: 'Status' },
    ],
    formFields: [
      { key: 'zone', label: 'Zone', type: 'text', required: true },
      { key: 'location', label: 'Location', type: 'text' },
      { key: 'pm25', label: 'PM2.5', type: 'number', step: '0.1' },
      { key: 'pm10', label: 'PM10', type: 'number', step: '0.1' },
      { key: 'co_level', label: 'CO Level', type: 'number', step: '0.1' },
      { key: 'no2_level', label: 'NO2 Level', type: 'number', step: '0.1' },
      { key: 'o3_level', label: 'O3 Level', type: 'number', step: '0.001' },
      { key: 'voc_level', label: 'VOC Level', type: 'number', step: '0.1' },
      { key: 'aqi_index', label: 'AQI Index', type: 'number' },
      { key: 'status', label: 'Status', type: 'select', options: ['Good', 'Moderate', 'Unhealthy for Sensitive', 'Unhealthy', 'Very Unhealthy', 'Hazardous'] },
      { key: 'ai_recommendation', label: 'AI Recommendation', type: 'textarea' },
    ],
  },
  proximity: {
    title: 'Proximity Alerts',
    icon: '\u{1F4E1}',
    endpoint: 'proximity',
    columns: [
      { key: 'worker_name', label: 'Worker' },
      { key: 'zone', label: 'Zone' },
      { key: 'equipment_nearby', label: 'Equipment' },
      { key: 'distance', label: 'Distance' },
      { key: 'alert_type', label: 'Alert Type' },
      { key: 'severity', label: 'Severity' },
      { key: 'status', label: 'Status' },
    ],
    formFields: [
      { key: 'worker_name', label: 'Worker Name', type: 'text', required: true },
      { key: 'zone', label: 'Zone', type: 'text' },
      { key: 'equipment_nearby', label: 'Equipment Nearby', type: 'text' },
      { key: 'distance', label: 'Distance (meters)', type: 'number', step: '0.1' },
      { key: 'alert_type', label: 'Alert Type', type: 'select', options: ['Warning', 'Critical', 'Info'] },
      { key: 'speed', label: 'Speed (km/h)', type: 'number', step: '0.1' },
      { key: 'status', label: 'Status', type: 'select', options: ['Active', 'Acknowledged', 'Resolved'] },
      { key: 'severity', label: 'Severity', type: 'select', options: ['Low', 'Medium', 'High', 'Critical'] },
      { key: 'ai_recommendation', label: 'AI Recommendation', type: 'textarea' },
    ],
  },
  training: {
    title: 'Training Compliance',
    icon: '\u{1F393}',
    endpoint: 'training',
    columns: [
      { key: 'worker_name', label: 'Worker' },
      { key: 'role', label: 'Role' },
      { key: 'certification', label: 'Certification' },
      { key: 'training_type', label: 'Training Type' },
      { key: 'expiry_date', label: 'Expiry Date' },
      { key: 'score', label: 'Score' },
      { key: 'status', label: 'Status' },
    ],
    formFields: [
      { key: 'worker_name', label: 'Worker Name', type: 'text', required: true },
      { key: 'role', label: 'Role', type: 'text' },
      { key: 'certification', label: 'Certification', type: 'text', required: true },
      { key: 'training_type', label: 'Training Type', type: 'select', options: ['Safety Orientation', 'Fall Protection', 'Confined Space', 'Electrical Safety', 'First Aid', 'Fire Safety', 'Equipment Operation', 'Hazmat', 'OSHA 10', 'OSHA 30'] },
      { key: 'completion_date', label: 'Completion Date', type: 'date' },
      { key: 'expiry_date', label: 'Expiry Date', type: 'date' },
      { key: 'score', label: 'Score (%)', type: 'number' },
      { key: 'status', label: 'Status', type: 'select', options: ['Valid', 'Expired', 'Pending', 'In Progress'] },
      { key: 'ai_recommendation', label: 'AI Recommendation', type: 'textarea' },
    ],
  },
  emergency: {
    title: 'Emergency Response',
    icon: '\u{1F6A8}',
    endpoint: 'emergency',
    columns: [
      { key: 'type', label: 'Type' },
      { key: 'zone', label: 'Zone' },
      { key: 'severity', label: 'Severity' },
      { key: 'trigger', label: 'Trigger' },
      { key: 'response_time', label: 'Response Time' },
      { key: 'status', label: 'Status' },
    ],
    formFields: [
      { key: 'type', label: 'Emergency Type', type: 'select', options: ['Fire', 'Structural Collapse', 'Chemical Spill', 'Electrical', 'Medical', 'Weather', 'Evacuation', 'Other'], required: true },
      { key: 'zone', label: 'Zone', type: 'text', required: true },
      { key: 'severity', label: 'Severity', type: 'select', options: ['Low', 'Medium', 'High', 'Critical'] },
      { key: 'trigger', label: 'Trigger', type: 'text' },
      { key: 'responders_needed', label: 'Responders Needed', type: 'number' },
      { key: 'evacuation_route', label: 'Evacuation Route', type: 'text' },
      { key: 'assembly_point', label: 'Assembly Point', type: 'text' },
      { key: 'status', label: 'Status', type: 'select', options: ['Active', 'Responding', 'Contained', 'Resolved'] },
      { key: 'response_time', label: 'Response Time (min)', type: 'number', step: '0.1' },
      { key: 'ai_protocol', label: 'AI Protocol', type: 'textarea' },
    ],
  },
  maintenance: {
    title: 'Predictive Maintenance',
    icon: '\u{1F527}',
    endpoint: 'maintenance',
    columns: [
      { key: 'equipment_name', label: 'Equipment' },
      { key: 'type', label: 'Type' },
      { key: 'location', label: 'Location' },
      { key: 'health_score', label: 'Health Score' },
      { key: 'predicted_failure', label: 'Predicted Failure' },
      { key: 'status', label: 'Status' },
    ],
    formFields: [
      { key: 'equipment_name', label: 'Equipment Name', type: 'text', required: true },
      { key: 'type', label: 'Type', type: 'select', options: ['Crane', 'Excavator', 'Loader', 'Lift', 'Generator', 'Compressor', 'Pump', 'Motor', 'Other'] },
      { key: 'location', label: 'Location', type: 'text' },
      { key: 'health_score', label: 'Health Score (0-100)', type: 'number' },
      { key: 'vibration_level', label: 'Vibration Level', type: 'number', step: '0.1' },
      { key: 'temperature', label: 'Temperature', type: 'number', step: '0.1' },
      { key: 'usage_hours', label: 'Usage Hours', type: 'number' },
      { key: 'predicted_failure', label: 'Predicted Failure Date', type: 'date' },
      { key: 'status', label: 'Status', type: 'select', options: ['Good', 'Fair', 'Warning', 'Critical'] },
      { key: 'ai_recommendation', label: 'AI Recommendation', type: 'textarea' },
    ],
  },
};

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
        {Object.entries(featureConfigs).map(([key, config]) => (
          <Route
            key={key}
            path={`/${key === 'workers' ? 'workers' : key}`}
            element={
              <ProtectedRoute>
                <FeaturePage config={config} />
              </ProtectedRoute>
            }
          />
        ))}
        <Route path="/ai-center" element={<ProtectedRoute><AICenter /></ProtectedRoute>} />
        <Route path="/advanced" element={<ProtectedRoute><AdvancedFeatures /></ProtectedRoute>} />
        <Route path="/custom-views" element={<ProtectedRoute><CustomViewsPage /></ProtectedRoute>} />
        <Route path="*" element={<Navigate to="/" replace />} />
      
        {/* // === Batch 02 Gaps & Frontend Mounts === */}
        <Route path="/cf/multi-modal-fatigue-detection" element={<CfMultiModalFatigueDetection />} />
        <Route path="/cf/predictive-injury-prevention" element={<CfPredictiveInjuryPrevention />} />
        <Route path="/cf/autonomous-safety-audits" element={<CfAutonomousSafetyAudits />} />
        <Route path="/cf/behavior-based-safety-bbs-coaching" element={<CfBehaviorBasedSafetyBbsCoaching />} />
        <Route path="/cf/worker-cohort-analysis" element={<CfWorkerCohortAnalysis />} />
        <Route path="/cf/insurance-premium-optimization" element={<CfInsurancePremiumOptimization />} />
        <Route path="/gap/proximity-falls-lack-dedicated-ai-endpoints-for-collision-pr" element={<GapProximityFallsLackDedicatedAiEndpointsForCollisionPr />} />
        <Route path="/gap/maintenance-lacks-predictive-maintenance-scheduling-ai" element={<GapMaintenanceLacksPredictiveMaintenanceSchedulingAi />} />
        <Route path="/gap/hazards-ppe-lack-ai-risk-scoring" element={<GapHazardsPpeLackAiRiskScoring />} />
        <Route path="/gap/limited-integration-with-wearable-apis-apple-watch-fitbit-ou" element={<GapLimitedIntegrationWithWearableApisAppleWatchFitbitOu />} />
        <Route path="/gap/no-geofenced-site-map-management" element={<GapNoGeofencedSiteMapManagement />} />
        <Route path="/gap/no-insurance-liability-tracking-or-claims-module" element={<GapNoInsuranceLiabilityTrackingOrClaimsModule />} />
        <Route path="/gap/no-webhooks-for-sensor-pushes" element={<GapNoWebhooksForSensorPushes />} />
        <Route path="/gap/no-payment-billing-module" element={<GapNoPaymentBillingModule />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
