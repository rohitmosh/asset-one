import json
import hashlib
from datetime import datetime
from zoneinfo import ZoneInfo
from src.models.models import AuditLog, User
from src.repositories.audit_repository import AuditRepository

class AuditService:
    def __init__(self, audit_repo: AuditRepository):
        self.audit_repo = audit_repo

    def calculate_row_hash(
        self, 
        asset_instance_id: int, 
        action: str, 
        user_id: int, 
        changed_at: datetime, 
        field_diffs: str, 
        prev_hash: str
    ) -> str:
        dt_str = changed_at.isoformat()
        payload = f"{asset_instance_id}|{action}|{user_id}|{dt_str}|{field_diffs}|{prev_hash or ''}"
        return hashlib.sha256(payload.encode('utf-8')).hexdigest()

    def log_action(
        self, 
        asset_instance_id: int, 
        action: str, 
        user: User, 
        field_diffs: dict, 
        ip_address: str = "127.0.0.1"
    ) -> AuditLog:
        changed_at = datetime.now(ZoneInfo("Asia/Kolkata"))
        diffs_json = json.dumps(field_diffs) if field_diffs else "{}"

        # Retrieve the latest audit log entry to establish the cryptographic chain link
        last_log = self.audit_repo.get_latest()
        prev_hash = last_log.row_hash if last_log else "0" * 64

        # Calculate current entry hash
        row_hash = self.calculate_row_hash(
            asset_instance_id=asset_instance_id,
            action=action,
            user_id=user.id,
            changed_at=changed_at,
            field_diffs=diffs_json,
            prev_hash=prev_hash
        )

        new_log = AuditLog(
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

        return self.audit_repo.create(new_log)

    def verify_audit_chain(self) -> dict:
        logs = self.audit_repo.get_all_ordered_asc()
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
            recalculated_hash = self.calculate_row_hash(
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
