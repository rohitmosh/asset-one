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

# Parse parameters
DB_BACKUP=$1
UPLOADS_BACKUP=$2

if [ -z "$DB_BACKUP" ]; then
    echo "Usage: $0 <path_to_db_backup.sql> [path_to_uploads_backup.tar.gz]"
    exit 1
fi

if [ ! -f "$DB_BACKUP" ]; then
    echo "Error: Database backup file not found at: $DB_BACKUP"
    exit 1
fi

echo "Starting restoration process..."

# 1. Restore database
if docker ps | grep -q "eams_postgres"; then
    echo "Restoring database into container eams_postgres..."
    # Drop and recreate schema to ensure clean slate
    docker exec -i eams_postgres psql -U "$POSTGRES_USER" -d "$POSTGRES_DB" -c "DROP SCHEMA public CASCADE; CREATE SCHEMA public;"
    # Restore from dump
    docker exec -i eams_postgres psql -U "$POSTGRES_USER" -d "$POSTGRES_DB" < "$DB_BACKUP"
    echo "Database restored successfully."
else
    echo "Error: eams_postgres container is not running. Cannot restore database."
    exit 1
fi

# 2. Restore uploads if file is provided
if [ -n "$UPLOADS_BACKUP" ]; then
    if [ ! -f "$UPLOADS_BACKUP" ]; then
        echo "Error: Uploads backup file not found at: $UPLOADS_BACKUP"
        exit 1
    fi
    
    if docker ps | grep -q "eams_backend"; then
        echo "Restoring uploads into container eams_backend..."
        # Extract files inside the container
        docker exec -i eams_backend tar -xzf - -C / < "$UPLOADS_BACKUP"
        echo "Uploads restored successfully."
    else
        echo "Warning: eams_backend container is not running. Uploads restoration skipped."
    fi
fi

echo "EAMS Restoration completed successfully! ✓"
