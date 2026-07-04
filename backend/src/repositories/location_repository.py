from sqlalchemy.orm import Session
from sqlalchemy import func
from src.models.models import Location
from src.repositories.base import BaseRepository

class LocationRepository(BaseRepository):
    def get_by_id(self, location_id: int) -> Location:
        return self.db.query(Location).filter(Location.id == location_id).first()

    def get_all(self) -> list[Location]:
        return self.db.query(Location).all()

    def create(self, location: Location) -> Location:
        self.db.add(location)
        self.db.flush()
        return location

    def get_by_plant_and_building(self, plant_office: str, building: str) -> Location:
        return self.db.query(Location).filter(
            func.lower(Location.plant_office) == func.lower(plant_office.strip()),
            func.lower(Location.building) == func.lower(building.strip())
        ).first()
