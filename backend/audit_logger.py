from src.database.triggers import init_audit_triggers
from src.services.audit_service import AuditService
from src.repositories.audit_repository import AuditRepository

def log_action(db, asset_instance_id, action, changed_by, field_diffs):
    repo = AuditRepository(db)
    service = AuditService(repo)
    return service.log_action(asset_instance_id, action, changed_by, field_diffs)

def verify_audit_chain(db):
    repo = AuditRepository(db)
    service = AuditService(repo)
    return service.verify_audit_chain()
