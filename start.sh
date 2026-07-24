#!/usr/bin/env bash
set -euo pipefail
root="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
[[ -f "$root/.env" ]] || { echo 'Missing .env (copy .env.example and set real values).' >&2; exit 1; }
[[ -d "$root/backend/node_modules" && -d "$root/frontend/node_modules" ]] || { echo 'Dependencies are missing; run scripts/bootstrap.sh.' >&2; exit 1; }
set -a; . "$root/.env"; set +a
if [ "${MIGRATE_ON_START:-false}" = true ]; then (cd "$root/backend" && node scripts/migrate.js && node scripts/provision-admin.js); fi
cleanup(){ kill "${backend_pid:-}" "${frontend_pid:-}" 2>/dev/null || true; }
trap cleanup EXIT INT TERM
(cd "$root/backend" && npm start) & backend_pid=$!
(cd "$root/frontend" && BROWSER=none PORT="${FRONTEND_PORT:-3000}" npm start) & frontend_pid=$!
wait "$backend_pid" "$frontend_pid"
