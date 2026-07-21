'use strict';

function validateRuntime(env = process.env) {
  const errors = [];
  if (!env.JWT_SECRET || env.JWT_SECRET.length < 32) errors.push('JWT_SECRET must be at least 32 characters');
  if (!env.DATABASE_URL) errors.push('DATABASE_URL is required');
  if (env.NODE_ENV === 'production' && (!env.DEVICE_SIGNING_PEPPER || env.DEVICE_SIGNING_PEPPER.length < 32)) {
    errors.push('Production DEVICE_SIGNING_PEPPER must be at least 32 characters');
  }
  if (errors.length) throw new Error(`Invalid runtime configuration: ${errors.join('; ')}`);
  return Object.freeze({ nodeEnv: env.NODE_ENV || 'development' });
}

module.exports = { validateRuntime };
