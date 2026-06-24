# OHPC EAMS - System Administrator Guide

This guide is intended for system administrators responsible for operating, managing, and securing the Enterprise Asset Management System (EAMS).

---

## 1. Authentication & Role Boundaries

EAMS enforces Role-Based Access Control (RBAC) via database mappings. There are three access roles configured in the system:

| Role Name | Access Privilege | Responsibilities |
| :--- | :--- | :--- |
| **L1 Admin** | **Full Access** | Can create users, assign roles, edit any asset registry records, execute transfers, trigger lifecycle stages, and perform cryptographic audit log integrity checks. |
| **L2 Custodian** | **Managed Access** | Can register assets, update asset lifecycle parameters, view reports, and trigger transfers. Cannot create user accounts or perform system-level operations. |
| **USER (End User)** | **Read-Only (Assigned)**| Can log in and view only the assets that are explicitly assigned to their employee profile. |

---

## 2. User Administration

User accounts can only be created by an **L1 Admin**.

### Creating Users via Web UI:
1. Navigate to the **User Management** tab on the left navigation panel.
2. Click **Create User**.
3. Complete the form: Username, Full Name, Email, Department, Employee ID, Password, and Role (L1 Admin, L2 Custodian, or End User).
4. Save the user. Passwords are automatically hashed inside the container backend before writing to PostgreSQL.

---

## 3. Cryptographic Audit Trail System

Audit Logging is the core governance feature of EAMS. Every asset change (creation, field updates, ownership transfers, retirement) is tracked.

### Immutable Logs
The `asset_audit_log` table is protected at the database engine level by PostgreSQL database triggers (`audit_no_update` and `audit_no_delete`). Any SQL execution attempting to change or delete an audit log will fail automatically, guaranteeing non-repudiation.

### Blockchain-style Hash Chaining
Each audit entry is bound to the preceding entry's hash using SHA-256:
$$\text{Current Hash} = \text{SHA-256}(\text{Asset ID} \parallel \text{Action} \parallel \text{User} \parallel \text{Timestamp} \parallel \text{Diffs JSON} \parallel \text{Previous Hash})$$

This means changing a single byte in a historical record invalidates the entire log chain from that point forward.

### Running Integrity Verification:
1. Navigate to the **Audit Trail** screen.
2. Click **Verify Integrity**.
3. The system scans the database logs sequentially, recalculating the SHA-256 hashes and validating the links.
4. If a discrepancy is found (e.g., direct DB modification by an external query), the system flags the exact ID and timestamp of the compromised record.

---

## 4. Monitoring Application Logs

Production container log streams can be queried directly from the host system using Docker command line utilities.

### FastAPI Application Logs
Check the backend process logs for exceptions, API response codes, or failed auth attempts:
```bash
docker compose logs backend
```
To stream live logs:
```bash
docker compose logs -f backend
```

### Nginx Access & Error Logs
View Nginx logs to check network requests, client IPs, SSL issues, or response status:
```bash
docker compose logs nginx
```

---

## 5. Lifecycle & Warranty Monitoring

EAMS alerts custodians about asset warranties and retirement dates.

- **Active State**: The asset is in normal operational use.
- **Warranty Warning**: Highlighting assets whose warranty expires in less than 90 days.
- **Retired State**: The asset is decommissioned, creating a final audit log snapshot.
- **Transferred State**: The asset is reassigned, logging the full path of ownership from custodian to custodian.
