from typing import Optional
from src.models.models import Location
from src.repositories.location_repository import LocationRepository

class LocationService:
    def __init__(self, location_repo: LocationRepository):
        self.location_repo = location_repo

    def get_by_id(self, location_id: int) -> Optional[Location]:
        return self.location_repo.get_by_id(location_id)

    def get_all(self) -> list[Location]:
        return self.location_repo.get_all()

    def create(self, plant_office: str, building: str, floor: Optional[str] = None, room: Optional[str] = None, rack: Optional[str] = None) -> Location:
        loc = self.location_repo.get_by_plant_and_building(plant_office, building)
        if loc:
            return loc
        
        new_loc = Location(
            plant_office=plant_office.strip(),
            building=building.strip(),
            floor=floor or "N/A",
            room=room or "N/A",
            rack=rack or "N/A"
        )
        return self.location_repo.create(new_loc)

    def resolve_or_create_location(self, location_id: Optional[int], plant_office: Optional[str], building: Optional[str]) -> Location:
        if location_id:
            loc = self.location_repo.get_by_id(location_id)
            if loc:
                return loc
                
        if not plant_office or not plant_office.strip() or not building or not building.strip():
            fallback = self.location_repo.get_by_plant_and_building("Corporate Office", "HQ")
            if not fallback:
                fallback = Location(
                    plant_office="Corporate Office",
                    building="HQ",
                    floor="N/A",
                    room="N/A",
                    rack="N/A"
                )
                self.location_repo.create(fallback)
            return fallback
            
        p_name = plant_office.strip()
        b_name = building.strip()
        
        loc = self.location_repo.get_by_plant_and_building(p_name, b_name)
        if loc:
            return loc
            
        new_loc = Location(
            plant_office=p_name,
            building=b_name,
            floor="N/A",
            room="N/A",
            rack="N/A"
        )
        return self.location_repo.create(new_loc)
