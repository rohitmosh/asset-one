# OHPC EAMS - System Architecture Document

This document outlines the container deployment architecture, networking rules, storage layout, and security controls of the Enterprise Asset Management System (EAMS).

---

## 1. System Architecture Diagram

```mermaid
graph TD
    %% Clients
    User([User / Browser])
    
    %% Nginx Ingress Proxy
    subgraph Host Network (Exposed Ports)
        Nginx[Nginx Container <br/>Port 80/443 SSL]
    end

    %% Internal Services
    subgraph Private Container Network (eams_network)
        Frontend[Frontend Container <br/>Vite + Nginx <br/>Port 80]
        Backend[Backend Container <br/>FastAPI <br/>Port 8000]
        Postgres[(PostgreSQL 17 Database <br/>Port 5432)]
    end

    %% Volumes
    subgraph Persistent Storage Volumes
        PV_Postgres[(postgres_data volume)]
        PV_Uploads[(uploads_data volume)]
    end

    %% Flow lines
    User -->|HTTPS Request| Nginx
    Nginx -->|Proxy / | Frontend
    Nginx -->|Proxy /api| Backend
    Backend -->|SQL Queries| Postgres
    
    %% Storage links
    Postgres -.->|Persists| PV_Postgres
    Backend -.->|Reads/Writes Attachments| PV_Uploads
    Nginx -.->|Optionally Serves Static Assets| PV_Uploads
```

---

## 2. Container Specifications

### 1. Nginx Container (Gateway)
- **Image**: `nginx:1.25-alpine`
- **Purpose**: Reverse proxy and ingress point.
- **Port Mapping**: Binds ports `80` and `443` on the host.
- **Routing Rules**:
  - Redirects `http://*` to `https://*`.
  - Routes `/` to internal `frontend:80`.
  - Routes `/api` to internal `backend:8000`.
- **Certificates**: Reads SSL certs mounted dynamically from `./nginx/certs`.

### 2. Frontend Container
- **Base Build**: Multi-stage docker image (`node:20-alpine` -> `nginx:1.25-alpine`).
- **Purpose**: Serves the compiled production React/Vite Single Page Application (SPA).
- **Execution Flow**:
  1. Compiles Vite TypeScript code to flat HTML/CSS/JS.
  2. Copies static files to `/usr/share/nginx/html`.
  3. Internal Nginx listens on port `80` to serve index files, with `try_files` redirecting all routes to `/index.html` to allow React client routing.

### 3. Backend Container
- **Base Build**: `python:3.11-slim`
- **Purpose**: Runs the FastAPI application backend logic.
- **Dependencies**: Psycopg, SQLAlchemy, FastAPI, Alembic, ReportLab (for exports).
- **Exposed Port**: `8000` (internal network only).

### 4. Database Container
- **Image**: `postgres:17-alpine`
- **Purpose**: Primary database engine for EAMS relational schema.
- **Storage**: Maps local docker volume `postgres_data` to `/var/lib/postgresql/data`.
- **Port**: `5432` (internal network only - not exposed to the host machine).

---

## 3. Storage & Volumes Persistence

To prevent data loss when containers are restarted, upgraded, or terminated, persistent volumes are defined:

1. **`postgres_data`**: Maintains database table space files, schemas, and indexing files. Survives database container deletion.
2. **`uploads_data`**: Mounted at `/app/uploads` in the backend container and `/app/uploads` (read-only) in Nginx. Stores manual documents, PDF reports, compliance receipts, and photographic records.

---

## 4. Security Framework

EAMS implements security controls at multiple layers of the stack:

- **Network Isolation**: The private docker bridge network `eams_network` separates the frontend, backend, and postgres database containers. Only Nginx is exposed to the outside network.
- **Database Triggers**: Cryptographic log records are protected against tampering using append-only PostgreSQL rules/triggers.
- **Secure Credentials**: All database logins and JWT secret credentials are read from a local configuration environment file (`.env`) rather than being hardcoded in code images.
- **SSL Encryption**: All user interaction, session tokens, and data payload transmissions are encrypted transit-wide using TLS (HTTPS).
