# OHPC EAMS - Production Deployment Guide

This guide details the procedure for establishing, running, and managing the Enterprise Asset Management System (EAMS) as a containerized stack using Docker Compose.

---

## 1. System Requirements

### Production Server (Recommended)
- **CPU**: 4 vCPUs
- **RAM**: 8 GB RAM
- **Storage**: 100+ GB SSD (based on attachment volume size)
- **OS**: Linux (Ubuntu 22.04 LTS recommended) / macOS (Docker Desktop installed)

### Required Software
- **Docker Engine**: v24.0.0 or higher
- **Docker Compose**: v2.20.0 or higher

---

## 2. Directory Structure

Ensure the following files are present in the project workspace:

```text
├── docker-compose.yml       # Docker Compose specification
├── .env.example             # Template for variables
├── .env                     # Target active configuration file (git-ignored)
├── nginx/
│   ├── nginx.conf           # Reverse Proxy routing config
│   ├── generate-certs.sh    # Self-signed certificate generator script
│   └── certs/               # Holds SSL certificate files (eams.crt & eams.key)
├── backend/
│   ├── Dockerfile           # FastAPI container definition
│   └── ...                  # Backend code
├── frontend/
│   ├── Dockerfile           # Multi-stage React Vite static container definition
│   ├── nginx.conf           # Nginx client routing config
│   └── ...                  # Frontend code
├── scripts/
│   ├── backup.sh            # Daily/Weekly/Monthly backup script
│   └── restore.sh           # Recovery execution script
└── docs/                    # System documentation guides
```

---

## 3. Step-by-Step Deployment Procedure

Follow these steps exactly to roll out the stack.

### Step 3.1: Environment Configuration
Copy the production environment template to create the live environment configuration:
```bash
cp .env.production .env
```
Open `.env` in an editor and update the following configuration items:
- `POSTGRES_PASSWORD`: Change this to a cryptographically strong random password.
- `DATABASE_URL`: Ensure the user, password, and database match `POSTGRES_USER`, `POSTGRES_PASSWORD`, and `POSTGRES_DB` values.
- `JWT_SECRET`: Update to a highly secure key (e.g., generated with `openssl rand -hex 32`).

### Step 3.2: SSL/TLS Certificate Setup
Nginx requires valid SSL certificates located at `nginx/certs/eams.crt` and `nginx/certs/eams.key`.

#### A. For Production (CA-signed Certificates):
Obtain certificates from your authority (e.g., Let's Encrypt, DigiCert) and copy them into `nginx/certs/` renaming them to `eams.crt` and `eams.key`.

#### B. For Staging/Local Testing (Self-signed):
Execute the helper certificate generator script:
```bash
bash nginx/generate-certs.sh
```

### Step 3.3: Building the Container Images
Build the Frontend and Backend custom images:
```bash
docker compose build
```

### Step 3.4: Launching the Stack
Run the container services in detached mode:
```bash
docker compose up -d
```
Verify all four containers are running:
```bash
docker compose ps
```
Example healthy output:
```text
NAME            IMAGE            COMMAND                  SERVICE    CREATED          STATUS                    PORTS
eams_postgres   postgres:17...   "docker-entrypoint.s…"   postgres   10 seconds ago   Up 8 seconds (healthy)    
eams_backend    asset-one-ba...  "uvicorn main:app --…"   backend    10 seconds ago   Up 8 seconds              8000/tcp
eams_frontend   asset-one-fr...  "/docker-entrypoint.…"   frontend   10 seconds ago   Up 8 seconds              80/tcp
eams_nginx      nginx:1.25...    "/docker-entrypoint.…"   nginx      10 seconds ago   Up 7 seconds              0.0.0.0:80->80/tcp, 0.0.0.0:443->443/tcp
```

### Step 3.5: Database Migration (SQLite to PostgreSQL)
EAMS uses a custom migration tool to copy the structural records and cryptographic logs from the SQLite database to the newly deployed PostgreSQL instance.

Run the migration script directly inside the backend container:
```bash
docker exec -it eams_backend python migrate_to_postgres.py
```
Expected output:
```text
Connecting to source SQLite database at: backend/eams.db
Connecting to target PostgreSQL database at: postgresql+psycopg://...
Dropping existing PostgreSQL schema...
Creating tables in PostgreSQL...
Copying data...
Resetting auto-increment sequences...
Initializing database-level triggers...
Database migration completed successfully! ✓
```

---

## 4. Verification Check-list

After launch, test the following checklist:

1. **SSL Handshake**: Open browser to `https://localhost/`. (If using self-signed certs, bypass the certificate warning page). Verify HTTP (`http://localhost/`) redirects automatically to HTTPS.
2. **User Authentication**: Log in with user credentials (e.g., `admin`). Verify successful navigation to the dashboard.
3. **Asset Registry Integrity**: Verify assets migrated from SQLite are fully listed in the table UI.
4. **Audit Logs Cryptographic Health**: Go to the Audit Logs panel in the UI and execute the "Verify Integrity" command. Verify status reads "Healthy".
5. **PDF Export**: Generate a landscape A3 asset register report from the UI to ensure PDF components are responsive and function inside Docker.

---

## 5. Troubleshooting Common Failures

### Issue: "Port 80/443 already in use"
**Solution**: Stop any local web servers (Apache, Nginx, IIS) or Docker containers using ports 80/443. Run `lsof -i :80` or `lsof -i :443` on macOS/Linux to find active processes.

### Issue: Backend fails to connect to database
**Solution**: Ensure the `postgres` healthcheck has completed successfully. Backend waits for postgres status to show `(healthy)`. Inspect backend logs for connection details:
```bash
docker compose logs backend
```

### Issue: Database migration script fails with SQLite DB missing
**Solution**: Verify that `backend/eams.db` is present inside the local repository before running `docker compose build` so it is copied into the backend container, or mount the SQLite database file as a volume for the migration run.
