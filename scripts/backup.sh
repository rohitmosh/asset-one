#!/bin/bash
set -e

# Resolve paths
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
ROOT_DIR="$( dirname "$SCRIPT_DIR" )"

# Load environment variables
if [ -f "$ROOT_DIR/.env" ]; then
    export $(grep -v '^#' "$ROOT_DIR/.env" | xargs)
fi

POSTGRES_USER=${POSTGRES_USER:-eams_user}
POSTGRES_DB=${POSTGRES_DB:-eams}

# Setup backup directories
BACKUP_ROOT="$ROOT_DIR/backup"
DAILY_DIR="$BACKUP_ROOT/daily"
WEEKLY_DIR="$BACKUP_ROOT/weekly"
MONTHLY_DIR="$BACKUP_ROOT/monthly"

mkdir -p "$DAILY_DIR" "$WEEKLY_DIR" "$MONTHLY_DIR"

TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
DAY_OF_WEEK=$(date +"%u") # 1-7 (Monday-Sunday)
DAY_OF_MONTH=$(date +"%d")

# Determine backup interval
TARGET_DIR="$DAILY_DIR"
BACKUP_TYPE="daily"

if [ "$DAY_OF_MONTH" -eq "01" ]; then
    TARGET_DIR="$MONTHLY_DIR"
    BACKUP_TYPE="monthly"
elif [ "$DAY_OF_WEEK" -eq "7" ]; then
    TARGET_DIR="$WEEKLY_DIR"
    BACKUP_TYPE="weekly"
fi

DB_BACKUP_FILE="$TARGET_DIR/eams_db_${BACKUP_TYPE}_${TIMESTAMP}.sql"
UPLOADS_BACKUP_FILE="$TARGET_DIR/eams_uploads_${BACKUP_TYPE}_${TIMESTAMP}.tar.gz"

echo "Starting $BACKUP_TYPE backup for EAMS..."

# 1. Database backup via docker exec pg_dump
if docker ps | grep -q "eams_postgres"; then
    echo "Dumping database from container eams_postgres..."
    docker exec -i eams_postgres pg_dump -U "$POSTGRES_USER" -d "$POSTGRES_DB" > "$DB_BACKUP_FILE"
    echo "Database backup created at $DB_BACKUP_FILE"
else
    echo "Warning: eams_postgres container is not running. Database backup skipped."
fi

# 2. Uploads folder backup via docker exec tar
if docker ps | grep -q "eams_backend"; then
    echo "Archiving uploads from container eams_backend..."
    docker exec -i eams_backend tar -czf - -C / app/uploads > "$UPLOADS_BACKUP_FILE"
    echo "Uploads backup created at $UPLOADS_BACKUP_FILE"
else
    echo "Warning: eams_backend container is not running. Uploads backup skipped."
fi

# 3. Clean up older daily backups (keep last 7 days)
if [ "$BACKUP_TYPE" = "daily" ]; then
    echo "Cleaning up daily backups older than 7 days..."
    find "$DAILY_DIR" -name "eams_db_daily_*.sql" -mtime +7 -delete || true
    find "$DAILY_DIR" -name "eams_uploads_daily_*.tar.gz" -mtime +7 -delete || true
fi

echo "EAMS Backup completed successfully! ✓"
