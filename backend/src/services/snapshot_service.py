import uuid
from datetime import datetime
from zoneinfo import ZoneInfo
from typing import Optional, List, Tuple
from src.models.models import RegistrySnapshot, User
from src.repositories.snapshot_repository import SnapshotRepository
from src.repositories.asset_repository import AssetRepository
from src.services.auth_service import AuthService
from src.services.audit_service import AuditService
from src.utils.snapshot_signer import (
    build_asset_data_hash,
    build_hmac_signature,
    verify_hmac_signature,
    generate_snapshot_pdf,
)

class SnapshotService:
    def __init__(
        self,
        snapshot_repo: SnapshotRepository,
        asset_repo: AssetRepository,
        auth_service: AuthService,
        audit_service: AuditService
    ):
        self.snapshot_repo = snapshot_repo
        self.asset_repo = asset_repo
        self.auth_service = auth_service
        self.audit_service = audit_service

    def create_snapshot(self, remarks: Optional[str], password_confirm: str, current_user: User) -> RegistrySnapshot:
        # 1. Verify password confirmation
        if not self.auth_service.verify_password(password_confirm, current_user.password_hash):
            raise ValueError("Invalid password confirmation. Snapshot creation rejected.")

        # 2. Retrieve active asset instances
        assets = self.asset_repo.get_active_instances()
        asset_count = len(assets)

        # 3. Calculate data hash and audit chain anchor
        data_hash = build_asset_data_hash(assets)
        latest_audit = self.audit_service.audit_repo.get_latest()
        chain_anchor = latest_audit.row_hash if latest_audit else "0" * 64

        # 4. Generate snapshot details
        snapshot_id = str(uuid.uuid4())
        timestamp_ist = datetime.now(ZoneInfo("Asia/Kolkata"))

        # 5. Build canonical manifest
        manifest = {
            "snapshot_id": snapshot_id,
            "signer_name": current_user.name,
            "signer_role": current_user.role.name,
            "signer_employee_id": current_user.employee_id,
            "signer_department": current_user.department,
            "signer_email": current_user.email,
            "timestamp_ist": timestamp_ist.isoformat(),
            "asset_count": asset_count,
            "data_hash": data_hash,
            "chain_anchor": chain_anchor,
            "remarks": remarks
        }

        # 6. Compute HMAC signature
        hmac_sig = build_hmac_signature(manifest)

        # 7. Persist registry snapshot record
        snapshot = RegistrySnapshot(
            snapshot_id=snapshot_id,
            signer_user_id=current_user.id,
            signer_name=current_user.name,
            signer_role=current_user.role.name,
            signer_employee_id=current_user.employee_id,
            signer_department=current_user.department,
            signer_email=current_user.email,
            timestamp_ist=timestamp_ist,
            asset_count=asset_count,
            data_hash=data_hash,
            chain_anchor=chain_anchor,
            hmac_signature=hmac_sig,
            remarks=remarks
        )

        created_snapshot = self.snapshot_repo.create(snapshot)
        self.snapshot_repo.db.commit()

        # Log snapshot creation in audit trail
        diffs = {"snapshot_id": [None, snapshot_id], "remarks": [None, remarks]}
        self.audit_service.log_action(None, "SNAPSHOT", current_user, diffs)
        self.snapshot_repo.db.commit()

        return created_snapshot

    def get_all_snapshots(self) -> List[RegistrySnapshot]:
        return self.snapshot_repo.get_all()

    def get_snapshot_by_id(self, snapshot_id: str) -> Optional[RegistrySnapshot]:
        return self.snapshot_repo.get_by_snapshot_id(snapshot_id)

    def generate_pdf_artifact(self, snapshot_id: str) -> bytes:
        snapshot = self.snapshot_repo.get_by_snapshot_id(snapshot_id)
        if not snapshot:
            raise ValueError("Snapshot not found")
        
        # We need all active assets. But since it's historical, let's fetch active assets.
        # Ideally, we verify data hash matches current state or historical state.
        # But ReportLab generator expects active instances
        assets = self.asset_repo.get_active_instances()
        return generate_snapshot_pdf(snapshot, assets)

    def verify_snapshot_integrity(self, snapshot_id: str) -> Tuple[str, Optional[str]]:
        snapshot = self.snapshot_repo.get_by_snapshot_id(snapshot_id)
        if not snapshot:
            raise ValueError("Snapshot not found")

        # Reconstruct canonical manifest from database row
        manifest = {
            "snapshot_id": snapshot.snapshot_id,
            "signer_name": snapshot.signer_name,
            "signer_role": snapshot.signer_role,
            "signer_employee_id": snapshot.signer_employee_id,
            "signer_department": snapshot.signer_department,
            "signer_email": snapshot.signer_email,
            "timestamp_ist": snapshot.timestamp_ist.isoformat(),
            "asset_count": snapshot.asset_count,
            "data_hash": snapshot.data_hash,
            "chain_anchor": snapshot.chain_anchor,
            "remarks": snapshot.remarks
        }

        is_valid = verify_hmac_signature(manifest, snapshot.hmac_signature)
        if is_valid:
            return "valid", None
        else:
            return "tampered", "HMAC signature mismatch. The database record or secret has been altered post-signature."
