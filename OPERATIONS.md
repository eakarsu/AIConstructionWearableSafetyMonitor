# Controlled safety operations

The authoritative path is `/api/controlled-safety`: sites and devices are tenant scoped, readings require a registered device key plus signed canonical payload, five-minute freshness, one-use nonce and site binding. Hazards, alerts, corrective actions, evidence and incident audit are durable; only supervisors/safety managers can close hazards with evidence. Incident deletes are blocked. Generated gap routes/navigation are quarantined; predictions never close hazards or replace supervisors.

Use `.env.example`, bootstrap dependencies, apply migrations explicitly, and start non-destructively. Device secrets are provisioned out of band as scrypt hashes using `DEVICE_SIGNING_PEPPER`; raw secrets are not stored. Demo seed execution is confirmation-gated and production-refusing.

Wearable/mobile/BIM/GIS/contractor-identity and incident-system adapters need real vendor credentials, device certification, offline queues, localization, latency/degraded-mode testing, privacy review and site safety validation. This repository does not claim hardware, OSHA/code, alert-precision or professional safety validation.
