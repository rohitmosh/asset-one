from fastapi import APIRouter, Depends, HTTPException
from typing import List, Optional
from src.schemas import schemas
from src.services.audit_service import AuditService
from src.routes.dependencies import get_audit_service, get_any_user, get_l1_admin
from src.models import models

router = APIRouter(prefix="/audit", tags=["Cryptographic Auditing"])

@router.get("/logs", response_model=List[schemas.AuditLogResponse])
def get_audit_logs(
    asset_id: Optional[int] = None,
    audit_service: AuditService = Depends(get_audit_service),
    current_user: models.User = Depends(get_any_user)
):
    if current_user.role.name == "USER":
        raise HTTPException(status_code=403, detail="End users do not have access to system audit logs.")
    return audit_service.audit_repo.get_all(asset_id)

@router.get("/integrity", response_model=schemas.IntegrityCheckResponse)
def check_audit_integrity(
    audit_service: AuditService = Depends(get_audit_service),
    current_user: models.User = Depends(get_l1_admin)
):
    return audit_service.verify_audit_chain()
