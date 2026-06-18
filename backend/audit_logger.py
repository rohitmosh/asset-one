import hashlib
import json
from datetime import datetime
from sqlalchemy.orm import Session
from sqlalchemy import text
import models

def init_audit_triggers(engine):
    """
    Initializes SQLite database-level triggers to guarantee that the audit logs table
    is strictly append-only. Any attempt to UPDATE or DELETE a row in `asset_audit_log`
    will fail at the database engine level.
    """
    with engine.connect() as conn:
        # Check if triggers already exist
        conn.execute(text("""
            CREATE TRIGGER IF NOT EXISTS audit_no_update BEFORE UPDATE ON asset_audit_log
            BEGIN
                SELECT RAISE(FAIL, 'Non-repudiation alert: UPDATES are strictly forbidden on asset_audit_log.');
            END;
        """))
        conn.execute(text("""
            CREATE TRIGGER IF NOT EXISTS audit_no_delete BEFORE DELETE ON asset_audit_log
            BEGIN
                SELECT RAISE(FAIL, 'Non-repudiation alert: DELETIONS are strictly forbidden on asset_audit_log.');
            END;
        """))
        conn.commit()

def calculate_row_hash(asset_instance_id: int, action: str, user_id: int, changed_at: datetime, field_diffs: str, prev_hash: str) -> str:
    """
    Computes a SHA-256 hash of a log entry's content bound to the hash of the preceding entry.
    """
    # Format changed_at consistently as ISO string
    dt_str = changed_at.isoformat()
    
    payload = f"{asset_instance_id}|{action}|{user_id}|{dt_str}|{field_diffs}|{prev_hash or ''}"
    return hashlib.sha256(payload.encode('utf-8')).hexdigest()

def log_action(
    db: Session, 
    asset_instance_id: int, 
    action: str, 
    user: models.User, 
    field_diffs: dict, 
    ip_address: str = "127.0.0.1"
) -> models.AuditLog:
    """
    Produces and appends a cryptographically chained audit log entry before database commit.
    """
    changed_at = datetime.utcnow()
    diffs_json = json.dumps(field_diffs) if field_diffs else "{}"

    # Retrieve the latest audit log entry to establish the cryptographic chain link
    last_log = db.query(models.AuditLog).order_by(models.AuditLog.id.desc()).first()
    prev_hash = last_log.row_hash if last_log else "0" * 64

    # Calculate current entry hash
    row_hash = calculate_row_hash(
        asset_instance_id=asset_instance_id,
        action=action,
        user_id=user.id,
        changed_at=changed_at,
        field_diffs=diffs_json,
        prev_hash=prev_hash
    )

    new_log = models.AuditLog(
        asset_instance_id=asset_instance_id,
        action=action,
        changed_by_user_id=user.id,
        changed_by_name=user.name,
        changed_by_role=user.role.name,
        changed_at=changed_at,
        ip_address=ip_address,
        field_diffs=diffs_json,
        prev_hash=prev_hash,
        row_hash=row_hash
    )

    db.add(new_log)
    db.flush()  # Write to DB session (trigger will fire if SQL tries to update/delete)
    return new_log

def verify_audit_chain(db: Session) -> dict:
    """
    Traverses the entire audit log table sequentially to verify cryptographic chain integrity.
    Returns status "healthy" or details about any broken links.
    """
    logs = db.query(models.AuditLog).order_by(models.AuditLog.id.asc()).all()
    
    expected_prev_hash = "0" * 64
    
    for i, log in enumerate(logs):
        # 1. Verify links
        if log.prev_hash != expected_prev_hash:
            return {
                "status": "compromised",
                "reason": "Prev hash chain broken",
                "failed_at_log_id": log.id,
                "expected_prev_hash": expected_prev_hash,
                "found_prev_hash": log.prev_hash,
                "timestamp": log.changed_at.isoformat()
            }
        
        # 2. Re-compute hash and verify self integrity
        recalculated_hash = calculate_row_hash(
            asset_instance_id=log.asset_instance_id,
            action=log.action,
            user_id=log.changed_by_user_id,
            changed_at=log.changed_at,
            field_diffs=log.field_diffs,
            prev_hash=log.prev_hash
        )
        
        if log.row_hash != recalculated_hash:
            return {
                "status": "compromised",
                "reason": "Log row content altered (Hash Mismatch)",
                "failed_at_log_id": log.id,
                "stored_hash": log.row_hash,
                "calculated_hash": recalculated_hash,
                "timestamp": log.changed_at.isoformat()
            }
            
        expected_prev_hash = log.row_hash

    return {
        "status": "healthy",
        "total_records": len(logs)
    }
