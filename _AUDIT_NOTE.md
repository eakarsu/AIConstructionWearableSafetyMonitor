# Audit Note — AIConstructionWearableSafetyMonitor

Source: `_AUDIT/reports/batch_02.md`

## Maturity: PARTIAL-BUILD (20 routes, 11 AI endpoints)

## Original audit recommendations

### Gaps — missing AI counterparts
- `proximity.js`, `falls.js` lack dedicated AI endpoints for collision/fall prevention strategy.
- `maintenance.js` lacks predictive maintenance scheduling.

### Gaps — missing non-AI features
- No mobile app for wearable integration.
- No integration with wearable APIs (Apple Watch, Fitbit, Oura, industrial IoT).
- No geofenced boundary management or site mapping.
- No insurance/liability tracking.

### Custom Feature Suggestions
- Multi-modal fatigue detection.
- Predictive injury prevention.
- Autonomous safety audits.
- Behavior-based safety coaching.
- Worker cohort analysis.
- Insurance premium optimization.

## Categorization
- The audit notes the project is "unbuilt (no node_modules)" — adding code today risks breakage without a verified install.
- **NEEDS-CREDS:** all wearable-API integrations.
- **NEEDS-PRODUCT-DECISION:** behavior-based safety, cohort analysis, insurance premium optimization.

## Implementations applied
- None this round. Existing AI coverage is broad (11 endpoints), and remaining gaps are integration-heavy.

## Backlog (prioritized)

### High priority
- **`POST /api/ai/predict-collision`** — proximity/collision prediction model.
- **`POST /api/ai/predict-fall`** — fall-risk prediction model from wearable telemetry.
- **`POST /api/ai/predictive-maintenance-schedule`** — wired to maintenance routes.

### Medium priority
- **Wearable connector layer** — Apple HealthKit / Fitbit / Oura ingestion endpoints (NEEDS-CREDS).
- **Geofence/site map** model + routes.
- **Insurance/liability tracking** module.

### Low priority
- Mobile companion app.
- Multi-modal fatigue detection (biometrics + CV + ambient).
- Insurance premium optimization feed.

## Apply pass 3 (frontend)

- **Action:** LEFT-AS-IS.
- **FE state:** `frontend/src/pages/AICenter.js` already wires all 14 backend AI endpoints (11 from `routes/ai.js` + 3 structured-body endpoints from `routes/aiNew.js`: `incident-prediction`, `ppe-compliance-scan`, `evacuation-plan`, plus `chat`).
- **Auth:** JWT Bearer attached centrally in `frontend/src/services/api.js`; localStorage token consumed by axios interceptor.
- **503/no-key handling:** generic "AI analysis is currently unavailable" fallback in catch blocks.
- **Files modified:** none.
- **Backend pass-2 added no new endpoints**, so there is no new FE wiring to perform.
