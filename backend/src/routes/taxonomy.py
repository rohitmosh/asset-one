from fastapi import APIRouter, Depends, HTTPException, status, Query
from typing import List, Optional
from src.schemas import schemas
from src.services.taxonomy_service import TaxonomyService
from src.routes.dependencies import get_taxonomy_service, get_any_user, get_l2_admin
from src.models import models

router = APIRouter(prefix="/taxonomy", tags=["Taxonomy"])

@router.get("/types", response_model=List[schemas.AssetTypeResponse])
def get_asset_types(
    taxonomy_service: TaxonomyService = Depends(get_taxonomy_service),
    current_user: models.User = Depends(get_any_user)
):
    return taxonomy_service.get_types()

@router.get("/groups", response_model=List[schemas.AssetGroupResponse])
def get_asset_groups(
    type_id: Optional[int] = None,
    domain: Optional[str] = None,
    taxonomy_service: TaxonomyService = Depends(get_taxonomy_service),
    current_user: models.User = Depends(get_any_user)
):
    return taxonomy_service.get_groups(type_id, domain)

@router.post("/groups", response_model=schemas.AssetGroupResponse)
def create_asset_group(
    group_in: schemas.AssetGroupCreate,
    taxonomy_service: TaxonomyService = Depends(get_taxonomy_service),
    current_user: models.User = Depends(get_l2_admin)
):
    return taxonomy_service.create_group(group_in.domain, group_in.name)

@router.get("/assets", response_model=List[schemas.AssetResponse])
def get_asset_categories(
    group_id: Optional[int] = None,
    taxonomy_service: TaxonomyService = Depends(get_taxonomy_service),
    current_user: models.User = Depends(get_any_user)
):
    return taxonomy_service.get_asset_categories(group_id)

@router.post("/assets", response_model=schemas.AssetResponse)
def create_asset_category(
    asset_in: schemas.AssetCreate,
    taxonomy_service: TaxonomyService = Depends(get_taxonomy_service),
    current_user: models.User = Depends(get_l2_admin)
):
    return taxonomy_service.create_asset_category(asset_in.asset_group_id, asset_in.asset_type_id, asset_in.name)

@router.get("/next-identifier")
def get_next_identifier(
    asset_id: int,
    plant_name: Optional[str] = None,
    place_of_installation: Optional[str] = None,
    taxonomy_service: TaxonomyService = Depends(get_taxonomy_service),
    current_user: models.User = Depends(get_l2_admin)
):
    try:
        ident = taxonomy_service.get_next_identifier(asset_id, plant_name, place_of_installation)
        return {"identifier": ident}
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
