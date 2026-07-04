from fastapi import APIRouter, Depends, HTTPException
from typing import List
from src.schemas import schemas
from src.services.location_service import LocationService
from src.routes.dependencies import get_location_service, get_any_user, get_l2_admin
from src.models import models

router = APIRouter(prefix="/locations", tags=["Locations"])

@router.get("", response_model=List[schemas.LocationResponse])
def get_locations(
    location_service: LocationService = Depends(get_location_service),
    current_user: models.User = Depends(get_any_user)
):
    return location_service.get_all()

@router.post("", response_model=schemas.LocationResponse)
def create_location(
    location_in: schemas.LocationCreate,
    location_service: LocationService = Depends(get_location_service),
    current_user: models.User = Depends(get_l2_admin)
):
    return location_service.create(
        plant_office=location_in.plant_office,
        building=location_in.building,
        floor=location_in.floor,
        room=location_in.room,
        rack=location_in.rack
    )
