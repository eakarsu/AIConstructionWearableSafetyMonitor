'use strict';
const router = require('express').Router();
const crypto = require('crypto');
const pool = require('../db');
const auth = require('../middleware/auth');
const { verifyReading, canCloseHazard } = require('../domain/safetyPolicy');

function matchesSecret(secret, expectedHex) {
  const actual = crypto.scryptSync(secret, process.env.DEVICE_SIGNING_PEPPER, 32);
  const expected = Buffer.from(expectedHex, 'hex');
  return actual.length === expected.length && crypto.timingSafeEqual(actual, expected);
}
async function member(organizationId, userId) {
  const result = await pool.query('SELECT role FROM sm_memberships WHERE organization_id=$1 AND user_id=$2', [organizationId, userId]);
  if (!result.rows.length) throw Object.assign(new Error('Organization membership is required'), { statusCode: 403 });
  return result.rows[0];
}
function fail(res, error) { res.status(error.statusCode || 500).json({ error: error.statusCode ? error.message : 'Safety workflow failed' }); }

router.post('/device-readings', async (req, res) => {
  const client = await pool.connect();
  try {
    if (!process.env.DEVICE_SIGNING_PEPPER) return res.status(503).json({ error: 'Device authentication is not configured' });
    const key = req.get('x-device-key'); const signature = req.get('x-device-signature');
    if (!key || !signature) return res.status(401).json({ error: 'Device key and signature are required' });
    const device = await client.query("SELECT * FROM sm_devices WHERE id=$1 AND status='active'", [req.body.deviceId]);
    if (!device.rows.length || !matchesSecret(key, device.rows[0].secret_hash) || !verifyReading(req.body, key, signature)) return res.status(401).json({ error: 'Device authentication failed' });
    if (Number(req.body.siteId) !== Number(device.rows[0].site_id)) return res.status(403).json({ error: 'Device is not assigned to this site' });
    await client.query('BEGIN');
    await client.query('INSERT INTO sm_device_nonces(device_id,nonce,observed_at) VALUES($1,$2,$3)', [req.body.deviceId, req.body.nonce, req.body.observedAt]);
    const result = await client.query(`INSERT INTO sm_readings(device_id,site_id,observed_at,reading_type,reading_value,unit,quality,raw_payload)
      VALUES($1,$2,$3,$4,$5,$6,$7,$8) RETURNING id,received_at`, [req.body.deviceId, req.body.siteId, req.body.observedAt, req.body.type, req.body.value, req.body.unit || null, req.body.quality || 'valid', req.body]);
    await client.query('UPDATE sm_devices SET last_seen_at=now(),firmware_version=COALESCE($2,firmware_version) WHERE id=$1', [req.body.deviceId, req.body.firmwareVersion || null]);
    await client.query("INSERT INTO sm_incident_audit(organization_id,site_id,actor_type,actor_id,action,entity_type,entity_id,details) VALUES($1,$2,'device',$3,'reading.accepted','reading',$4,$5)", [device.rows[0].organization_id, req.body.siteId, req.body.deviceId, String(result.rows[0].id), { type: req.body.type, quality: req.body.quality || 'valid' }]);
    await client.query('COMMIT'); res.status(202).json(result.rows[0]);
  } catch (error) {
    await client.query('ROLLBACK').catch(() => {});
    if (error.code === '23505') return res.status(409).json({ error: 'Reading nonce has already been used' });
    fail(res, error);
  } finally { client.release(); }
});

router.post('/organizations/:organizationId/sites/:siteId/hazards', auth, async (req, res) => {
  try {
    const organizationId = Number(req.params.organizationId); await member(organizationId, req.user.id);
    const result = await pool.query(`INSERT INTO sm_hazards(organization_id,site_id,source,severity,description,assigned_to)
      VALUES($1,$2,'worker',$3,$4,$5) RETURNING *`, [organizationId, req.params.siteId, req.body.severity, req.body.description, req.body.assignedTo || null]);
    await pool.query("INSERT INTO sm_incident_audit(organization_id,site_id,actor_type,actor_id,action,entity_type,entity_id,details) VALUES($1,$2,'user',$3,'hazard.created','hazard',$4,$5)", [organizationId, req.params.siteId, String(req.user.id), String(result.rows[0].id), { severity: req.body.severity }]);
    res.status(201).json(result.rows[0]);
  } catch (error) { fail(res, error); }
});

router.post('/hazards/:id/close', auth, async (req, res) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const found = await client.query('SELECT * FROM sm_hazards WHERE id=$1 FOR UPDATE', [req.params.id]);
    if (!found.rows.length) throw Object.assign(new Error('Hazard not found'), { statusCode: 404 });
    const hazard = found.rows[0]; const membership = await member(hazard.organization_id, req.user.id);
    const evidence = await client.query('SELECT count(*)::int AS count FROM sm_closure_evidence WHERE hazard_id=$1', [hazard.id]);
    if (!canCloseHazard(membership.role, evidence.rows[0].count)) throw Object.assign(new Error('Supervisor role and closure evidence are required'), { statusCode: 409 });
    const result = await client.query("UPDATE sm_hazards SET status='closed',closed_at=now() WHERE id=$1 AND status IN ('open','acknowledged','controlled') RETURNING *", [hazard.id]);
    if (!result.rows.length) throw Object.assign(new Error('Hazard is already closed'), { statusCode: 409 });
    await client.query("INSERT INTO sm_incident_audit(organization_id,site_id,actor_type,actor_id,action,entity_type,entity_id,details) VALUES($1,$2,'user',$3,'hazard.closed','hazard',$4,$5)", [hazard.organization_id, hazard.site_id, String(req.user.id), String(hazard.id), { evidenceCount: evidence.rows[0].count }]);
    await client.query('COMMIT'); res.json(result.rows[0]);
  } catch (error) { await client.query('ROLLBACK').catch(() => {}); fail(res, error); } finally { client.release(); }
});

module.exports = router;
