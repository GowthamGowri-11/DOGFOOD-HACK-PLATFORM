#!/bin/sh
set -e

echo "[Docker Entrypoint] Ensuring database schema is synced..."
npx prisma db push --skip-generate || true

echo "[Docker Entrypoint] Checking existing records..."
node -e "
const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();
p.hackathon.count().then(count => {
  if (count === 0) {
    console.log('[Docker Entrypoint] Empty database detected. Performing initial fixture import from fixtures copy.json...');
    require('./scripts/seed.js').seedDatabase().then(() => process.exit(0)).catch(e => { console.error(e); process.exit(1); });
  } else {
    console.log('[Docker Entrypoint] Database already initialized with ' + count + ' hackathons. Skipping auto-seed.');
    process.exit(0);
  }
}).catch(err => {
  console.error('[Docker Entrypoint] Warning: ' + err.message);
  process.exit(0);
});
"

echo "[Docker Entrypoint] Starting Next.js Application on port 3000..."
exec "$@"
