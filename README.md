# AssetOne — OHPC Enterprise Asset Management System

AssetOne is a full-stack enterprise asset management platform built for **OHPC**. It tracks IT and OT (Operational Technology) digital assets across all offices and hydro power plants, with cryptographic audit trails, role-based access control, full lifecycle management, and compliance reporting.

---

## Table of Contents

1. [Core Features](#core-features)
2. [Tech Stack](#tech-stack)
3. [Project Structure](#project-structure)
4. [Database Schema](#database-schema)
5. [Setup and Installation](#setup-and-installation)
6. [Environment Variables](#environment-variables)
7. [API Reference](#api-reference)
8. [Authentication & Roles](#authentication--roles)
9. [Seed Data](#seed-data)
10. [Backup & Restore](#backup--restore)
11. [Docs](#docs)

---

## Core Features

### Asset Registry
- Full CRUD for hardware and software asset instances
- Spreadsheet-style grid with sticky columns, resizable/sortable headers, and inline editing
- Multi-step wizard for new asset creation covering taxonomy, identification, ownership, lifecycle, security, and backup details

### Taxonomy Hierarchy
- Structured as: `IT/OT → Domain → Asset Type → Asset Group → Asset Category`
- Auto-generated unique identifiers in the format `{PLANT}-{DOMAIN}-{PLACE}-{ASSET}-{SEQ:05}` (e.g. `OHPC-IT-CORP-ROUTE-00002`)

### Lifecycle & Warranty Tracking
- Records purchase date, installation date, warranty start/end, end-of-life, and end-of-support dates
- Color-coded warranty alerts: red (expired), orange (≤30 days), gold (≤60 days), green (healthy)

### Ownership & Custodianship
- Tracks owner, custodian (must be L2_ADMIN), assigned user, and backup owner per asset
- Password-authenticated (e-signature) asset transfers and retirements with full audit logging
- Single and bulk transfer support

### Cryptographic Audit Log
- Append-only hash-chain: each log entry stores `prev_hash` (SHA-256 of the previous row) and `row_hash` (SHA-256 of current row content + `prev_hash`)
- Database-level triggers block any `UPDATE` or `DELETE` on the audit table — for both SQLite and PostgreSQL
- Integrity check endpoint re-traverses the entire chain and verifies every hash link

### Registry Snapshots (Non-repudiation)
- L2 Admins can "sign" the current registry state — produces a UUID-identified snapshot with SHA-256 data hash, audit chain anchor, and HMAC-SHA256 signature
- Signed snapshot PDF generated with full cryptographic manifest block (snapshot ID, signer details, hashes, HMAC)
- Verify endpoint re-computes HMAC and compares against stored signature to detect any post-hoc tampering

### Reports & Analytics
- Dashboard with total/hardware/software counts, warranty expiry stats, governance issues, group and location distribution
- Export filtered assets as color-coded `.xlsx` (openpyxl, 22-column sheet) or landscape A3 `.pdf` (ReportLab)

### Role-Based Access Control
- `L1_ADMIN`: full read access, audit log access, snapshot viewing/verification
- `L2_ADMIN`: full read + write, asset creation/update/transfer/retire, snapshot signing
- `USER`: can only view assets assigned to them

### Location Management
- Hierarchical location structure: `Plant/Office → Building → Floor → Room → Rack`

### User & Settings Management
- Create users with role assignment
- Add asset groups, asset categories, and locations through the Settings UI panel

---

## Tech Stack

### Backend
| Component | Technology |
|---|---|
| Language | Python 3.x |
| API Framework | FastAPI 0.110.0 |
| ORM | SQLAlchemy 2.0.28 |
| Migrations | Alembic ≥1.13.1 |
| Database (prod) | PostgreSQL 17 (via `psycopg[binary]≥3.1.18`) |
| Database (dev) | SQLite (fallback, `eams.db`) |
| Auth | JWT (HS256) via `python-jose 3.3.0` |
| Password Hashing | Custom PBKDF2-HMAC-SHA256 (`hashlib`, 100k iterations) |
| Excel Export | openpyxl 3.1.2 |
| PDF Generation | ReportLab |
| ASGI Server | Uvicorn 0.28.0 |
| Form Parsing | python-multipart 0.0.9 |

### Frontend
| Component | Technology |
|---|---|
| Framework | React 19.2.6 + TypeScript ~6.0.2 |
| Build Tool | Vite 8.0.12 |
| Icons | lucide-react ^1.20.0 |
| Routing | Client-side state (no React Router) |
| Styling | Plain CSS (no UI framework) |

### Infrastructure
| Component | Technology |
|---|---|
| Containerization | Docker + Docker Compose |
| Reverse Proxy | Nginx 1.25-alpine (TLS termination, HTTP→HTTPS redirect) |
| TLS | Self-signed certificates (dev/staging) |
| Database | PostgreSQL 17-alpine (Docker container) |
| Backups | Automated daily `.sql` dumps + `.tar.gz` upload archives |

---

## Project Structure

```
asset-one/
├── .env                          # Active environment variables
├── .env.example                  # Environment variable template
├── .env.production               # Production environment variables
├── .gitignore
├── docker-compose.yml            # 4-service Docker stack
├── package.json                  # Root-level scripts
│
├── backend/
│   ├── Dockerfile
│   ├── alembic.ini
│   ├── main.py                   # FastAPI app + all API routes
│   ├── models.py                 # SQLAlchemy ORM models
│   ├── schemas.py                # Pydantic request/response schemas
│   ├── auth.py                   # JWT auth, password hashing, RBAC
│   ├── database.py               # DB engine + session factory
│   ├── audit_logger.py           # Hash-chain audit log utilities
│   ├── excel_exporter.py         # openpyxl Excel export
│   ├── pdf_exporter.py           # ReportLab PDF export
│   ├── snapshot_signer.py        # Cryptographic snapshot signing + PDF
│   ├── seed.py                   # Database seed script
│   ├── migrate_to_postgres.py    # SQLite → PostgreSQL migration utility
│   ├── requirements.txt
│   └── alembic/
│       ├── env.py
│       └── versions/
│           └── 2f4f81fef01a_baseline_migration.py
│
├── frontend/
│   ├── Dockerfile
│   ├── index.html
│   ├── package.json
│   ├── vite.config.ts
│   ├── nginx.conf                # Nginx config for frontend container
│   └── src/
│       ├── main.tsx              # React entry point
│       ├── App.tsx               # Main SPA (all views and state)
│       ├── LandingPage.tsx       # Marketing + inline login page
│       ├── App.css
│       ├── landing.css
│       ├── index.css
│       └── assets/
│
├── nginx/
│   ├── nginx.conf                # Reverse proxy config (routes to frontend/backend)
│   ├── generate-certs.sh         # Self-signed cert generation script
│   └── certs/
│       ├── eams.crt
│       └── eams.key
│
├── backup/
│   ├── daily/                    # .sql DB dumps + .tar.gz upload archives
│   ├── weekly/
│   └── monthly/
│
└── docs/
    ├── admin_guide.md
    ├── architecture.md
    ├── backup_guide.md
    ├── deployment_guide.md
    ├── restore_guide.md
    └── user_guide.md
```

---

## Database Schema

### `roles`
| Column | Type | Notes |
|---|---|---|
| id | Integer PK | |
| name | String(50) unique | `L1_ADMIN`, `L2_ADMIN`, `USER` |
| permissions | Text nullable | |

### `users`
| Column | Type | Notes |
|---|---|---|
| id | Integer PK | |
| username | String(50) unique | |
| password_hash | String(255) | `{salt_hex}:{key_hex}` — PBKDF2-HMAC-SHA256 |
| name | String(100) | |
| email | String(100) unique | |
| role_id | FK → roles.id | |
| department | String(100) | |
| employee_id | String(50) unique | |

### `locations`
| Column | Type | Notes |
|---|---|---|
| id | Integer PK | |
| plant_office | String(100) | e.g. "OHPC Corporate Office" |
| building | String(100) | |
| floor | String(50) nullable | |
| room | String(50) nullable | |
| rack | String(50) nullable | |

### `asset_types`
| Column | Type | Notes |
|---|---|---|
| id | Integer PK | |
| name | String(50) unique | `Hardware` or `Software` |

### `asset_groups`
| Column | Type | Notes |
|---|---|---|
| id | Integer PK | |
| domain | String(10) | `IT` or `OT` |
| name | String(100) | e.g. "Network Appliances", "Control Systems" |

### `assets` _(asset categories — taxonomy leaf)_
| Column | Type | Notes |
|---|---|---|
| id | Integer PK | |
| asset_group_id | FK → asset_groups.id | |
| asset_type_id | FK → asset_types.id | |
| name | String(100) | e.g. "Firewall", "PLC", "Antivirus" |

### `asset_instances` _(deployed physical/logical assets)_
| Column | Type | Notes |
|---|---|---|
| id | Integer PK | |
| asset_id | FK → assets.id | |
| identifier | String(100) unique | Auto-generated (e.g. `OHPC-IT-CORP-ROUTE-00002`) |
| description | Text nullable | |
| manufacturer | String(100) nullable | |
| model_number | String(100) nullable | |
| serial_number | String(100) nullable | |
| owner_id | FK → users.id | |
| custodian_id | FK → users.id | Must be L2_ADMIN |
| assigned_user_id | FK → users.id nullable | |
| location_id | FK → locations.id | |
| security_classification | String(50) | `Public`, `Internal`, `Confidential`, `Restricted` |
| business_criticality | String(50) | `Low`, `Medium`, `High` |
| purchase_date | Date nullable | |
| installation_date | Date nullable | |
| warranty_start_date | Date nullable | |
| warranty_end_date | Date nullable | |
| end_of_life_date | Date nullable | |
| end_of_support_date | Date nullable | |
| policy_deviations | Text nullable | |
| known_vulnerabilities | Text nullable | |
| remarks | Text nullable | |
| backup_available | Boolean default False | |
| backup_location | String(255) nullable | |
| backup_owner_id | FK → users.id nullable | |
| status | String(50) default "Active" | `Active`, `Transferred`, `Maintenance`, `Retired`, `Archived` |
| prev_asset_instance_id | FK → asset_instances.id nullable | Self-referential linked list for transfer history |

### `asset_audit_log`
| Column | Type | Notes |
|---|---|---|
| id | Integer PK | |
| asset_instance_id | FK → asset_instances.id (CASCADE) nullable | |
| action | String(50) | `CREATE`, `UPDATE`, `DELETE`, `TRANSFER` |
| changed_by_user_id | FK → users.id | |
| changed_by_name | String(100) | Denormalized for tamper-evidence |
| changed_by_role | String(50) | Denormalized |
| changed_at | TZDateTime | IST timezone |
| ip_address | String(50) nullable | |
| field_diffs | Text nullable | JSON `{field: [old_val, new_val]}` |
| prev_hash | String(64) nullable | SHA-256 of previous row |
| row_hash | String(64) | SHA-256 of this row's content + `prev_hash` |

> DB triggers prevent any `UPDATE` or `DELETE` on this table (both SQLite and PostgreSQL).

### `asset_transfers`
| Column | Type | Notes |
|---|---|---|
| id | Integer PK | |
| asset_instance_id | FK → asset_instances.id (CASCADE) | |
| transfer_date | TZDateTime | IST |
| from_user_id | FK → users.id nullable | |
| to_user_id | FK → users.id | |
| from_location_id | FK → locations.id nullable | |
| to_location_id | FK → locations.id | |
| reason | Text nullable | |
| changed_by_user_id | FK → users.id | |

### `registry_snapshots`
| Column | Type | Notes |
|---|---|---|
| id | Integer PK | |
| snapshot_id | String(36) unique | UUID-4 |
| signer_user_id | FK → users.id | |
| signer_name | String(100) | Denormalized |
| signer_role | String(50) | Denormalized |
| signer_employee_id | String(50) | Denormalized |
| signer_department | String(100) | Denormalized |
| signer_email | String(100) | Denormalized |
| timestamp_ist | TZDateTime | |
| asset_count | Integer | |
| data_hash | String(64) | SHA-256 of deterministic asset JSON |
| chain_anchor | String(64) | `row_hash` of the most recent audit log entry |
| hmac_signature | String(64) | HMAC-SHA256(canonical_manifest, `SNAPSHOT_SECRET`) |
| remarks | Text nullable | |

---

## Setup and Installation

### Prerequisites

- [Docker](https://www.docker.com/) and Docker Compose
- Git

### 1. Clone the repository

```bash
git clone <repository-url>
cd asset-one
```

### 2. Configure environment variables

```bash
cp .env.example .env
```

Edit `.env` and fill in the required values (see [Environment Variables](#environment-variables) below).

### 3. Generate TLS certificates

For local/development use, generate self-signed certificates:

```bash
cd nginx
chmod +x generate-certs.sh
./generate-certs.sh
cd ..
```

For production, replace `nginx/certs/eams.crt` and `nginx/certs/eams.key` with your CA-issued certificates.

### 4. Start the stack

```bash
docker compose up --build -d
```

This starts four containers:
- `postgres` — PostgreSQL 17 database
- `backend` — FastAPI application on port 8000
- `frontend` — React app served via Nginx
- `nginx` — Reverse proxy on ports 80 (redirects to HTTPS) and 443

### 5. Seed the database

On first run, seed the database with roles, users, taxonomy, locations, and sample assets:

```bash
docker compose exec backend python seed.py
```

### 6. Access the application

Open your browser at `https://localhost` (accept the self-signed certificate warning for dev).

---

### Local Development (without Docker)

#### Backend

```bash
cd backend
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
```

Set `DATABASE_URL` in your environment (or leave it unset to fall back to SQLite), then:

```bash
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

Seed the local database:

```bash
python seed.py
```

#### Frontend

```bash
cd frontend
npm install
npm run dev
```

The dev server starts at `http://localhost:5173`. Requests to `/api` are proxied to the backend via `vite.config.ts`.

#### Database Migrations

```bash
cd backend
alembic upgrade head
```

---

### Migrating from SQLite to PostgreSQL

If you have existing data in `eams.db` and want to move it to PostgreSQL:

```bash
cd backend
python migrate_to_postgres.py
```

---

## Environment Variables

| Variable | Description | Example |
|---|---|---|
| `POSTGRES_DB` | PostgreSQL database name | `eams` |
| `POSTGRES_USER` | PostgreSQL username | `eams_user` |
| `POSTGRES_PASSWORD` | PostgreSQL password | `your_strong_password` |
| `DATABASE_URL` | Full SQLAlchemy connection string | `postgresql+psycopg://eams_user:pass@postgres:5432/eams` |
| `JWT_SECRET` | Secret key for signing JWT tokens | `your_jwt_signing_secret` |
| `SNAPSHOT_SECRET` | Secret key for HMAC-signing registry snapshots | `your_snapshot_secret` |
| `FRONTEND_URL` | Public frontend URL (for CORS) | `https://eams.company.com` |
| `BACKEND_URL` | Public backend URL | `https://eams.company.com/api` |

> **Important:** Always set `JWT_SECRET` and `SNAPSHOT_SECRET` to strong, unique values in production. The application has hardcoded fallback values for development only — never rely on them in a live environment.

---

## API Reference

All API routes are prefixed with `/api`.

### Authentication
| Method | Path | Auth Required | Description |
|---|---|---|---|
| `POST` | `/api/auth/login` | No | Login with username + password, returns JWT |
| `GET` | `/api/auth/verify` | Any | Verify token validity, returns current user |

### Taxonomy
| Method | Path | Auth Required | Description |
|---|---|---|---|
| `GET` | `/api/taxonomy/types` | Any | List asset types (Hardware / Software) |
| `GET` | `/api/taxonomy/groups` | Any | List asset groups (filterable by domain, type) |
| `POST` | `/api/taxonomy/groups` | L2_ADMIN | Create new asset group |
| `GET` | `/api/taxonomy/assets` | Any | List asset categories |
| `POST` | `/api/taxonomy/assets` | L2_ADMIN | Create new asset category |
| `GET` | `/api/taxonomy/next-identifier` | L2_ADMIN | Generate next unique asset identifier |

### Users & Locations
| Method | Path | Auth Required | Description |
|---|---|---|---|
| `GET` | `/api/users` | Any | List all users |
| `POST` | `/api/users` | L2_ADMIN | Create new user |
| `GET` | `/api/locations` | Any | List all locations |
| `POST` | `/api/locations` | L2_ADMIN | Create new location |

### Asset Registry
| Method | Path | Auth Required | Description |
|---|---|---|---|
| `GET` | `/api/assets` | Any | List assets (USERs see only assigned assets) |
| `POST` | `/api/assets` | L2_ADMIN | Create new asset instance |
| `GET` | `/api/assets/{id}` | Any | Get asset detail (USERs restricted to assigned) |
| `PUT` | `/api/assets/{id}` | L2_ADMIN | Update asset (field diffs logged to audit chain) |
| `POST` | `/api/assets/{id}/transfer` | L2_ADMIN | Transfer asset (password-confirmed e-signature) |
| `POST` | `/api/assets/{id}/retire` | L2_ADMIN | Retire asset (password-confirmed e-signature) |
| `POST` | `/api/assets/bulk-classification` | L2_ADMIN | Bulk update security classification |
| `POST` | `/api/assets/bulk-transfer` | L2_ADMIN | Bulk transfer assets (password-confirmed) |

### Reports & Export
| Method | Path | Auth Required | Description |
|---|---|---|---|
| `GET` | `/api/reports/summary` | Any | Dashboard analytics — counts, expiry stats, distribution |
| `GET` | `/api/reports/export` | Any | Export assets as Excel (`?format=excel`) or PDF (`?format=pdf`) |

### Audit
| Method | Path | Auth Required | Description |
|---|---|---|---|
| `GET` | `/api/audit/logs` | L1_ADMIN | Retrieve all audit logs (or filter by `asset_id`) |
| `GET` | `/api/audit/integrity` | L1_ADMIN | Verify complete audit hash chain integrity |

### Registry Snapshots
| Method | Path | Auth Required | Description |
|---|---|---|---|
| `POST` | `/api/snapshots` | L2_ADMIN | Create and cryptographically sign a registry snapshot |
| `GET` | `/api/snapshots` | L1_ADMIN | List all snapshots |
| `GET` | `/api/snapshots/{snapshot_id}` | L1_ADMIN | Download signed snapshot PDF |
| `GET` | `/api/snapshots/{snapshot_id}/verify` | L1_ADMIN | Verify snapshot HMAC — detect any tampering |

> Tokens can be passed via `Authorization: Bearer <token>` header, or as a query parameter (`?jwt=<token>` or `?token=<token>`) to support direct download links.

---

## Authentication & Roles

### Roles

| Role | Access Level |
|---|---|
| `L2_ADMIN` | Full read + write. Create/update/transfer/retire assets. Sign snapshots. Manage taxonomy, users, locations. |
| `L1_ADMIN` | Full read. View audit logs, verify chain integrity, list and verify snapshots. No write access. |
| `USER` | Read-only access to assets explicitly assigned to them. |

### Token Lifecycle

- JWT tokens use HS256, signed with `JWT_SECRET`
- Token lifetime: **12 hours** (720 minutes)
- Payload includes: `sub` (username), `iat`, `exp`

### E-Signature Pattern

Sensitive operations (transfer, retire, sign snapshot) require the acting user to re-submit their password at the time of the action. This is verified server-side before the operation proceeds and logged in the audit chain.

---

## Seed Data

Running `seed.py` populates the database with the following:

### Users (all with password `password123`)
| Username | Role | Description |
|---|---|---|
| `admin.hq` | L1_ADMIN | Read-only HQ admin |
| `custodian.it` | L2_ADMIN | IT asset custodian |
| `custodian.ot` | L2_ADMIN | OT asset custodian |
| `rahul.ops` | USER | Regular operations user |

### Locations
- OHPC Corporate Office — Corporate HQ (2 locations)
- Rengali Hydro Project (3 locations)

### Taxonomy
- 2 asset types: Hardware, Software
- IT and OT asset groups and categories (~40+ groups, ~80+ asset categories) covering Network Appliances, Control Systems, Workstations, Software Licenses, SCADA, and more

### Sample Assets
6 active asset instances demonstrating various scenarios: 28-day warranty, 34-day warranty, healthy warranty, expired warranty, software license, and a governance gap example. Plus 2 retired assets for linked-list/transfer history demonstration.

---

## Backup & Restore

Automated daily backups are stored in `backup/daily/` as:
- `eams_db_daily_<timestamp>.sql` — PostgreSQL dump
- `eams_uploads_daily_<timestamp>.tar.gz` — uploaded files archive

See [`docs/backup_guide.md`](docs/backup_guide.md) and [`docs/restore_guide.md`](docs/restore_guide.md) for detailed procedures.

---

## Docs

Full documentation is available in the `docs/` directory:

| File | Description |
|---|---|
| [`architecture.md`](docs/architecture.md) | System architecture and design decisions |
| [`deployment_guide.md`](docs/deployment_guide.md) | Production deployment steps |
| [`admin_guide.md`](docs/admin_guide.md) | Administrator operations guide |
| [`user_guide.md`](docs/user_guide.md) | End-user guide |
| [`backup_guide.md`](docs/backup_guide.md) | Backup procedures |
| [`restore_guide.md`](docs/restore_guide.md) | Restore procedures |
