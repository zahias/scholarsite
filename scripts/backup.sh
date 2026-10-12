#!/bin/bash
# Nightly backup of the production database and user uploads on A2.
#
# Install once as a cPanel cron job (Cron Jobs → Add New Cron Job):
#   17 2 * * *  /bin/bash <A2_PATH checkout>/scripts/backup.sh >> $HOME/backups/backup.log 2>&1
#
# Single-process by design (pg_dump plain format + gzip, run under nice) to stay
# inside the shared-hosting NPROC limit. Keeps the last 14 days. Copy the
# newest archive off the server periodically (e.g. download via cPanel File
# Manager) — a backup that only lives on the same server isn't a backup.
#
# Restore test:
#   gunzip -c db-YYYYMMDD.sql.gz | psql "$DATABASE_URL_OF_A_SCRATCH_DB"
#   tar -xzf uploads-YYYYMMDD.tar.gz -C /tmp/restore-test

set -euo pipefail

APP_DIR="${APP_DIR:-$HOME/scholarsite}"
BACKUP_DIR="${BACKUP_DIR:-$HOME/backups}"
KEEP_DAYS="${KEEP_DAYS:-14}"
STAMP="$(date +%Y%m%d)"

mkdir -p "$BACKUP_DIR"
chmod 700 "$BACKUP_DIR"

# DATABASE_URL lives in the app's .env on A2.
if [ -z "${DATABASE_URL:-}" ] && [ -f "$APP_DIR/.env" ]; then
  DATABASE_URL="$(grep -E '^DATABASE_URL=' "$APP_DIR/.env" | head -1 | cut -d= -f2- | tr -d "\"'")"
fi
if [ -z "${DATABASE_URL:-}" ]; then
  echo "[$(date -Is)] DATABASE_URL not set and not found in $APP_DIR/.env" >&2
  exit 1
fi

echo "[$(date -Is)] Backing up database…"
nice -n 19 pg_dump --no-owner --no-privileges "$DATABASE_URL" | nice -n 19 gzip -6 > "$BACKUP_DIR/db-$STAMP.sql.gz.tmp"
mv "$BACKUP_DIR/db-$STAMP.sql.gz.tmp" "$BACKUP_DIR/db-$STAMP.sql.gz"

echo "[$(date -Is)] Backing up uploads…"
UPLOAD_DIRS=()
[ -d "$APP_DIR/public/uploads" ] && UPLOAD_DIRS+=("public/uploads")
[ -d "$APP_DIR/uploads" ] && UPLOAD_DIRS+=("uploads")
if [ ${#UPLOAD_DIRS[@]} -gt 0 ]; then
  nice -n 19 tar -czf "$BACKUP_DIR/uploads-$STAMP.tar.gz" -C "$APP_DIR" "${UPLOAD_DIRS[@]}"
fi

find "$BACKUP_DIR" -maxdepth 1 \( -name 'db-*.sql.gz' -o -name 'uploads-*.tar.gz' \) -mtime +"$KEEP_DAYS" -delete

echo "[$(date -Is)] Done: $(ls -1 "$BACKUP_DIR" | grep -c "$STAMP") file(s) for $STAMP"
