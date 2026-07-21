'use strict';

const crypto = require('crypto');

function canonicalReading(reading) {
  const required = ['deviceId', 'siteId', 'observedAt', 'nonce', 'type', 'value'];
  for (const key of required) if (reading[key] === undefined || reading[key] === '') throw Object.assign(new Error(`${key} is required`), { statusCode: 400 });
  const observed = Date.parse(reading.observedAt);
  if (!Number.isFinite(observed)) throw Object.assign(new Error('observedAt must be ISO-8601'), { statusCode: 400 });
  if (Math.abs(Date.now() - observed) > 5 * 60 * 1000) throw Object.assign(new Error('Reading timestamp is outside the five-minute acceptance window'), { statusCode: 401 });
  return [reading.deviceId, reading.siteId, new Date(observed).toISOString(), reading.nonce, reading.type, String(reading.value)].join('|');
}

function signReading(reading, secret) {
  return crypto.createHmac('sha256', secret).update(canonicalReading(reading)).digest('hex');
}

function verifyReading(reading, secret, signature) {
  if (!signature || !secret) return false;
  const expected = Buffer.from(signReading(reading, secret), 'hex');
  let actual;
  try { actual = Buffer.from(signature, 'hex'); } catch { return false; }
  return actual.length === expected.length && crypto.timingSafeEqual(actual, expected);
}

function canCloseHazard(role, evidenceCount) {
  return ['supervisor', 'safety_manager', 'admin'].includes(role) && Number(evidenceCount) > 0;
}

module.exports = { canonicalReading, signReading, verifyReading, canCloseHazard };
