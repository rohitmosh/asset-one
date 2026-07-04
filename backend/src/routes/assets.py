from fastapi import APIRouter, Depends, HTTPException, status
from typing import List, Optional
from src.schemas import schemas
from src.services.asset_service import AssetService
from src.routes.dependencies import get_asset_service, get_any_user, get_l2_admin
from src.models import models

router = APIRouter(prefix="/assets", tags=["Assets"])

@router.get("", response_model=List[schemas.AssetInstanceResponse])
def list_assets(
    type_id: Optional[int] = None,
    group_id: Optional[int] = None,
    asset_id: Optional[int] = None,
    criticality: Optional[str] = None,
    classification: Optional[str] = None,
    status: Optional[str] = None,
    search: Optional[str] = None,
    custodian_id: Optional[int] = None,
    domain: Optional[str] = None,
    asset_service: AssetService = Depends(get_asset_service),
    current_user: models.User = Depends(get_any_user)
):
    return asset_service.list_assets(
        current_user=current_user,
        type_id=type_id,
        group_id=group_id,
        asset_id=asset_id,
        criticality=criticality,
        classification=classification,
        status=status,
        search=search,
        custodian_id=custodian_id,
        domain=domain
    )

@router.post("", response_model=schemas.AssetInstanceDetailResponse, status_code=201)
def create_asset(
    asset_in: schemas.AssetInstanceCreate,
    asset_service: AssetService = Depends(get_asset_service),
    current_user: models.User = Depends(get_l2_admin)
):
    try:
        return asset_service.create_asset_instance(asset_in, current_user)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.get("/{id}", response_model=schemas.AssetInstanceDetailResponse)
def get_asset(
    id: int,
    asset_service: AssetService = Depends(get_asset_service),
    current_user: models.User = Depends(get_any_user)
):
    asset = asset_service.get_by_id(id)
    if not asset:
        raise HTTPException(status_code=404, detail="Asset not found")
    
    if current_user.role.name == "USER" and asset.assigned_user_id != current_user.id:
        raise HTTPException(status_code=403, detail="You do not have permission to view this asset")
        
    return asset

@router.put("/{id}", response_model=schemas.AssetInstanceDetailResponse)
def update_asset(
    id: int,
    asset_update: schemas.AssetInstanceUpdate,
    asset_service: AssetService = Depends(get_asset_service),
    current_user: models.User = Depends(get_l2_admin)
):
    try:
        return asset_service.update_asset_instance(id, asset_update, current_user)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.post("/{id}/transfer", response_model=schemas.AssetInstanceDetailResponse)
def transfer_asset(
    id: int,
    req: schemas.AssetTransferRequest,
    asset_service: AssetService = Depends(get_asset_service),
    current_user: models.User = Depends(get_l2_admin)
):
    try:
        return asset_service.transfer_asset(id, req, current_user)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.post("/{id}/retire", response_model=schemas.AssetInstanceDetailResponse)
def retire_asset(
    id: int,
    req: schemas.AssetTransferRequest,
    asset_service: AssetService = Depends(get_asset_service),
    current_user: models.User = Depends(get_l2_admin)
):
    try:
        return asset_service.retire_asset(id, req, current_user)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.post("/bulk-classification")
def bulk_update_classification(
    req: schemas.BulkClassificationUpdate,
    asset_service: AssetService = Depends(get_asset_service),
    current_user: models.User = Depends(get_l2_admin)
):
    try:
        asset_service.bulk_update_classification(req.asset_ids, req.security_classification, current_user)
        return {"message": f"Successfully updated classification for {len(req.asset_ids)} assets"}
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.post("/bulk-transfer")
def bulk_transfer(
    req: schemas.BulkTransferRequest,
    asset_service: AssetService = Depends(get_asset_service),
    current_user: models.User = Depends(get_l2_admin)
):
    try:
        asset_service.bulk_transfer(
            req.asset_ids, 
            req.new_user_id, 
            req.new_location_id, 
            req.reason, 
            req.password_confirm, 
            current_user
        )
        return {"message": f"Successfully transferred {len(req.asset_ids)} assets"}
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
