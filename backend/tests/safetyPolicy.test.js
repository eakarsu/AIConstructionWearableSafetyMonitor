'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const { signReading, verifyReading, canCloseHazard } = require('../domain/safetyPolicy');
const { validateRuntime } = require('../config/runtime');

test('device readings require valid HMAC signatures', () => {
  const reading = { deviceId: 'd1', siteId: 's1', observedAt: new Date().toISOString(), nonce: 'n1', type: 'heat', value: 88 };
  const signature = signReading(reading, 'device-secret');
  assert.equal(verifyReading(reading, 'device-secret', signature), true);
  assert.equal(verifyReading({ ...reading, value: 99 }, 'device-secret', signature), false);
});
test('closure requires supervisor evidence', () => {
  assert.equal(canCloseHazard('supervisor', 1), true);
  assert.equal(canCloseHazard('worker', 1), false);
  assert.equal(canCloseHazard('supervisor', 0), false);
});
test('production requires a device signing pepper', () => assert.throws(() => validateRuntime({ NODE_ENV: 'production', JWT_SECRET: 'a'.repeat(32), DATABASE_URL: 'postgres://db' }), /DEVICE_SIGNING_PEPPER/));
