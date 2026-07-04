from fastapi import APIRouter, Depends, HTTPException, Response
from typing import List
from src.schemas import schemas
from src.services.snapshot_service import SnapshotService
from src.routes.dependencies import get_snapshot_service, get_current_user, get_l2_admin, check_role
from src.models import models

router = APIRouter(prefix="/snapshots", tags=["Registry Snapshots"])

@router.post("", response_model=schemas.SnapshotManifestResponse)
def sign_snapshot(
    req: schemas.SnapshotSignRequest,
    snapshot_service: SnapshotService = Depends(get_snapshot_service),
    current_user: models.User = Depends(get_l2_admin)
):
    try:
        return snapshot_service.create_snapshot(req.remarks, req.password_confirm, current_user)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.get("", response_model=List[schemas.SnapshotManifestResponse])
def get_snapshots(
    snapshot_service: SnapshotService = Depends(get_snapshot_service),
    current_user: models.User = Depends(check_role(["L1_ADMIN", "L2_ADMIN"]))
):
    return snapshot_service.get_all_snapshots()

@router.get("/{snapshot_id}")
def download_snapshot_pdf(
    snapshot_id: str,
    snapshot_service: SnapshotService = Depends(get_snapshot_service),
    current_user: models.User = Depends(get_current_user)
):
    if current_user.role.name not in ["L1_ADMIN", "L2_ADMIN"]:
        raise HTTPException(status_code=403, detail="You do not have permission to download snapshots")
        
    try:
        pdf_bytes = snapshot_service.generate_pdf_artifact(snapshot_id)
        filename = f"Snapshot_{snapshot_id}.pdf"
        return Response(
            content=pdf_bytes,
            media_type="application/pdf",
            headers={
                "Content-Disposition": f"attachment; filename={filename}"
            }
        )
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))

@router.get("/{snapshot_id}/verify", response_model=schemas.SnapshotVerifyResponse)
def verify_snapshot(
    snapshot_id: str,
    snapshot_service: SnapshotService = Depends(get_snapshot_service),
    current_user: models.User = Depends(check_role(["L1_ADMIN", "L2_ADMIN"]))
):
    try:
        status_val, reason = snapshot_service.verify_snapshot_integrity(snapshot_id)
        snapshot = snapshot_service.get_snapshot_by_id(snapshot_id)
        return {
            "snapshot_id": snapshot_id,
            "status": status_val,
            "signer_name": snapshot.signer_name,
            "signer_role": snapshot.signer_role,
            "signer_employee_id": snapshot.signer_employee_id,
            "signer_department": snapshot.signer_department,
            "timestamp_ist": snapshot.timestamp_ist,
            "asset_count": snapshot.asset_count,
            "data_hash": snapshot.data_hash,
            "chain_anchor": snapshot.chain_anchor,
            "remarks": snapshot.remarks,
            "reason": reason
        }
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
