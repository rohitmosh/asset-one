# OHPC EAMS - System Backup Guide

This guide details the backup strategy, automation procedures, and retention policies for the Enterprise Asset Management System (EAMS) stack.

---

## 1. Backup Strategy Overview

To safeguard EAMS against hardware failure, database corruption, or security breaches, two distinct areas must be backed up concurrently:

1. **PostgreSQL Database**: Contains schemas, asset taxonomies, locations, audit logs, transfer history, and snapshot verification data.
2. **Persistent Upload Files**: Contains physical assets, invoices, manuals, and compliance documentation saved in the `uploads_data` volume.

### Backup Schedule
- **Daily**: Run a quick incremental backup. DB schema + data, plus upload directories. Daily backups are stored locally for **7 days** before automatic rotation.
- **Weekly**: Full backup taken on Sunday. Kept for **4 weeks**.
- **Monthly**: Archive backup taken on the 1st of each month. Kept **indefinitely** in an off-site repository.

---

## 2. Backup Execution Script

Backups are executed using the custom script located at `scripts/backup.sh`.

This script:
- Queries the running `eams_postgres` container and runs `pg_dump` to generate a schema-consistent SQL dump.
- Queries the running `eams_backend` container to create a gzipped archive of the uploads directory.
- Manages the daily rotation cycle to purge backups older than 7 days.

To trigger the backup manually:
```bash
bash scripts/backup.sh
```

### Resulting Output
Backups are placed in the `backup/` folder in the root of the project:
```text
backup/
├── daily/
│   ├── eams_db_daily_20260624_173000.sql
│   └── eams_uploads_daily_20260624_173000.tar.gz
├── weekly/
│   ├── eams_db_weekly_20260628_020000.sql
│   └── eams_uploads_weekly_20260628_020000.tar.gz
└── monthly/
    ├── eams_db_monthly_20260701_020000.sql
    └── eams_uploads_monthly_20260701_020000.tar.gz
```

---

## 3. Automating Backups with Cron

To automate backups, configure a cron job on the host machine.

### Step 3.1: Open Crontab Editor
```bash
crontab -e
```

### Step 3.2: Add Cron Entries
Add the following line to schedule the backup script to run every day at **2:00 AM**:
```text
0 2 * * * /bin/bash /Users/rohitmohanty/Rohit/Projects/asset-one/scripts/backup.sh >> /Users/rohitmohanty/Rohit/Projects/asset-one/backup/cron_backup.log 2>&1
```

> [!NOTE]
> Ensure the paths are absolute so the shell cron environment can locate the script, the docker binary, and output the log files correctly.

---

## 4. Security of Backup Files

Since the database contains sensitive asset data, user hashes, and server structures, backups must be secured.

- **File Permissions**: The backup folders must have restricted access:
  ```bash
  chmod 700 /Users/rohitmohanty/Rohit/Projects/asset-one/backup
  ```
- **Off-Server Replication**: 
  We recommend setting up an secondary cron job or utility (like `rclone` or `aws s3 sync`) to upload the weekly and monthly backups off the primary host to a secure offsite cloud bucket or internal enterprise NAS.
  Example secondary sync script template:
  ```bash
  # Sync local backup folder with a remote private storage
  aws s3 sync /Users/rohitmohanty/Rohit/Projects/asset-one/backup s3://your-company-eams-backups/ --delete
  ```
