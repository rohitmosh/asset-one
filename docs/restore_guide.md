# OHPC EAMS - Disaster Recovery & Restore Guide

This guide details the procedure for recovering the Enterprise Asset Management System (EAMS) database and persistent upload files from an existing backup.

---

## 1. Prerequisites for Recovery

Before initiating a restore operation, ensure:
- The Docker Compose stack is running (`docker compose up -d`).
- You have identified the specific backup files to restore from (e.g., database `.sql` file and uploads `.tar.gz` file).
- The recovery script `scripts/restore.sh` has executable permissions.

---

## 2. Restore Execution

Restoration is fully automated via the `scripts/restore.sh` script.

To execute the restoration:
```bash
bash scripts/restore.sh <path_to_db_backup.sql> [path_to_uploads_backup.tar.gz]
```

### Example Commands:

**Full Recovery (Database + Uploaded files):**
```bash
bash scripts/restore.sh backup/daily/eams_db_daily_20260624_173000.sql backup/daily/eams_uploads_daily_20260624_173000.tar.gz
```

**Database-only Recovery:**
```bash
bash scripts/restore.sh backup/daily/eams_db_daily_20260624_173000.sql
```

### Script Execution Logic:
1. **DB Cleaning**: The script connects to the running `eams_postgres` container, drops the `public` schema (`DROP SCHEMA public CASCADE`), and re-creates it. This ensures no conflicting tables, indexes, or old data survive.
2. **Schema & Record Import**: The script streams the `.sql` backup file into the container's PostgreSQL engine to restore tables, triggers, and records.
3. **Uploads Restructuring**: The uploads tarball is streamed to `tar` inside the backend container to extract files back into the `/app/uploads` volume path.

---

## 3. Post-Restore Verification Checklist

After the restoration script finishes successfully, perform these validation checks:

### 1. Backend Service Integrity Check
Verify the container logs show no startup or runtime connection failures:
```bash
docker compose logs backend
```

### 2. Verify User & Role Tables
Log in to the web interface using credentials that existed at the time of the backup. Confirm validation functions.

### 3. Verify Auditing Cryptographic Chain
Because database record changes are linked using a SHA-256 cryptographic chain, we must verify that the integrity of the historical logs remains unbroken.
1. Log in to EAMS as an **L1 Admin**.
2. Go to the **Audit Logs** workspace page.
3. Click the **Verify Chain Integrity** button.
4. Verify that the UI displays a green success status reading: **"Integrity Verified: Healthy"** (with the total count of checked logs).

### 4. Verify Files Restore (Photos/Manuals)
Open an asset record that previously had attachments or manual files associated. Confirm that the image renders in the UI and manual files can be loaded from the links.

---

## 4. Disaster Recovery Drill (Testing Backups)

> [!WARNING]
> A backup is only as good as its last successful restore test. We recommend running a recovery test once a month on a separate staging environment to verify backup validity.

### Steps for Restore Testing:
1. Spin up a separate staging server or test machine with Docker installed.
2. Clone the repository and run `bash nginx/generate-certs.sh`.
3. Create a test `.env` file.
4. Start the stack: `docker compose up -d`.
5. Copy your production backup files onto the test machine.
6. Run the restore script using the test database.
7. Perform the verification checks listed in Section 3.
