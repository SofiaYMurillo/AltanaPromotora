#!/bin/sh
set -e

mkdir -p /data /app/public/uploads/media

if [ ! -f /data/altana.db ]; then
  echo "[altana] Initializing SQLite database..."
  npx prisma migrate deploy
  npx tsx prisma/seed.ts
else
  echo "[altana] Applying pending migrations..."
  npx prisma migrate deploy
fi

exec node server.js
