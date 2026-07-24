'use strict';
require('dotenv').config({ path: require('path').join(__dirname, '..', '..', '.env') });
const fs = require('fs');
const path = require('path');
const pool = require('../db');

async function main() {
  await pool.query(`CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY, name VARCHAR(255) NOT NULL, email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL, role VARCHAR(50) DEFAULT 'user', created_at TIMESTAMP DEFAULT NOW()
  )`);
  const directory = path.join(__dirname, '..', 'migrations');
  for (const filename of fs.readdirSync(directory).filter((name) => name.endsWith('.sql')).sort()) {
    await pool.query(fs.readFileSync(path.join(directory, filename), 'utf8'));
  }
  console.log('Runtime schema migrated');
}

main().catch((error) => { console.error(error.message); process.exitCode = 1; }).finally(() => pool.end());
