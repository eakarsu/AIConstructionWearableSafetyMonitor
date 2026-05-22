import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import './Sidebar.css';

const navItems = [
  { section: 'Overview' },
  { path: '/', label: 'Dashboard', icon: '\u2302' },
  { section: 'Safety Monitoring' },
  { path: '/workers', label: 'Worker Safety', icon: '\u26D1' },
  { path: '/hazards', label: 'Hazard Detection', icon: '\u26A0' },
  { path: '/incidents', label: 'Incident Reports', icon: '\u26A1' },
  { path: '/falls', label: 'Fall Detection', icon: '\u2B07' },
  { path: '/fatigue', label: 'Fatigue Detection', icon: '\u23F3' },
  { section: 'Equipment & PPE' },
  { path: '/equipment', label: 'Equipment Inspection', icon: '\u2699' },
  { path: '/ppe', label: 'PPE Compliance', icon: '\u{1F6E1}' },
  { path: '/maintenance', label: 'Predictive Maintenance', icon: '\u{1F527}' },
  { section: 'Environment' },
  { path: '/environmental', label: 'Environmental', icon: '\u{1F321}' },
  { path: '/heatstress', label: 'Heat Stress', icon: '\u2600' },
  { path: '/noise', label: 'Noise Exposure', icon: '\u{1F50A}' },
  { path: '/airquality', label: 'Air Quality', icon: '\u{1F32C}' },
  { section: 'Alerts & Training' },
  { path: '/proximity', label: 'Proximity Alerts', icon: '\u{1F4E1}' },
  { path: '/training', label: 'Training Compliance', icon: '\u{1F393}' },
  { path: '/emergency', label: 'Emergency Response', icon: '\u{1F6A8}' },
  { path: '/evacuation-muster-trace', label: 'Evacuation Muster', icon: '\u{1F6A8}' },
  { section: 'AI Tools' },
  { path: '/ai-center', label: 'AI Center', icon: '\u{1F916}' },
  { path: '/advanced', label: 'Advanced Suite', icon: '\u{1F680}' },
  { section: 'Custom Views' },
  { path: '/custom-views', label: 'Wearable Views', icon: '\u{1F4CA}' },
,
  // // === Batch 02 Gaps & Frontend Mounts ===
  { path: '/cf/multi-modal-fatigue-detection', icon: '+', label: 'CF: MultiModalFatigueDetecti' },
  { path: '/cf/predictive-injury-prevention', icon: '+', label: 'CF: PredictiveInjuryPreventi' },
  { path: '/cf/autonomous-safety-audits', icon: '+', label: 'CF: AutonomousSafetyAudits' },
  { path: '/cf/behavior-based-safety-bbs-coaching', icon: '+', label: 'CF: BehaviorBasedSafetyBbsCo' },
  { path: '/cf/worker-cohort-analysis', icon: '+', label: 'CF: WorkerCohortAnalysis' },
  { path: '/cf/insurance-premium-optimization', icon: '+', label: 'CF: InsurancePremiumOptimiza' },
  { path: '/gap/proximity-falls-lack-dedicated-ai-endpoints-for-collision-pr', icon: '+', label: 'Gap: ProximityFallsLackDedica' },
  { path: '/gap/maintenance-lacks-predictive-maintenance-scheduling-ai', icon: '+', label: 'Gap: MaintenanceLacksPredicti' },
  { path: '/gap/hazards-ppe-lack-ai-risk-scoring', icon: '+', label: 'Gap: HazardsPpeLackAiRiskScor' },
  { path: '/gap/limited-integration-with-wearable-apis-apple-watch-fitbit-ou', icon: '+', label: 'Gap: LimitedIntegrationWithWe' },
  { path: '/gap/no-geofenced-site-map-management', icon: '+', label: 'Gap: NoGeofencedSiteMapManage' },
  { path: '/gap/no-insurance-liability-tracking-or-claims-module', icon: '+', label: 'Gap: NoInsuranceLiabilityTrac' },
  { path: '/gap/no-webhooks-for-sensor-pushes', icon: '+', label: 'Gap: NoWebhooksForSensorPushe' },
  { path: '/gap/no-payment-billing-module', icon: '+', label: 'Gap: NoPaymentBillingModule' }
];

function Sidebar() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem('user') || '{}');

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  const closeMobile = () => setMobileOpen(false);

  return (
    <>
      <button className="sidebar-toggle" onClick={() => setMobileOpen(!mobileOpen)}>
        {mobileOpen ? '\u2715' : '\u2630'}
      </button>
      <div className={`sidebar-overlay ${mobileOpen ? 'open' : ''}`} onClick={closeMobile} />
      <aside className={`sidebar ${mobileOpen ? 'open' : ''}`}>
        <div className="sidebar-header">
          <div className="sidebar-logo">{'\u{1F3D7}'}</div>
          <div className="sidebar-title">AI Safety Monitor</div>
          <div className="sidebar-subtitle">Construction Wearable System</div>
        </div>
        <nav className="sidebar-nav">
          {navItems.map((item, idx) => {
            if (item.section) {
              return (
                <div key={idx} className="sidebar-section-title">
                  {item.section}
                </div>
              );
            }
            return (
              <NavLink
                key={item.path}
                to={item.path}
                end={item.path === '/'}
                className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
                onClick={closeMobile}
              >
                <span className="sidebar-link-icon">{item.icon}</span>
                {item.label}
              </NavLink>
            );
          })}
        </nav>
        <div className="sidebar-footer">
          <div className="sidebar-user">
            <div className="sidebar-avatar">
              {(user.name || 'U').charAt(0).toUpperCase()}
            </div>
            <div className="sidebar-user-info">
              <div className="sidebar-user-name">{user.name || 'User'}</div>
              <div className="sidebar-user-email">{user.email || ''}</div>
            </div>
          </div>
          <button className="sidebar-logout" onClick={handleLogout}>
            {'\u23FB'} Sign Out
          </button>
        </div>
      </aside>
    </>
  );
}

export default Sidebar;
