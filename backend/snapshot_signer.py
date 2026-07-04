from src.services.snapshot_service import SnapshotService
from src.repositories.snapshot_repository import SnapshotRepository
from src.repositories.asset_repository import AssetRepository
from src.services.auth_service import AuthService
from src.repositories.user_repository import UserRepository
from src.services.audit_service import AuditService
from src.repositories.audit_repository import AuditRepository

def verify_snapshot_signature(db, snapshot_id):
    user_repo = UserRepository(db)
    auth_service = AuthService(user_repo)
    audit_repo = AuditRepository(db)
    audit_service = AuditService(audit_repo)
    asset_repo = AssetRepository(db)
    snap_repo = SnapshotRepository(db)
    service = SnapshotService(snap_repo, asset_repo, auth_service, audit_service)
    return service.verify(snapshot_id)
