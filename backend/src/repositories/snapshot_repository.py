from sqlalchemy.orm import Session
from src.models.models import RegistrySnapshot
from src.repositories.base import BaseRepository

class SnapshotRepository(BaseRepository):
    def get_by_id(self, id: int) -> RegistrySnapshot:
        return self.db.query(RegistrySnapshot).filter(RegistrySnapshot.id == id).first()

    def get_by_snapshot_id(self, snapshot_id: str) -> RegistrySnapshot:
        return self.db.query(RegistrySnapshot).filter(RegistrySnapshot.snapshot_id == snapshot_id).first()

    def get_all(self) -> list[RegistrySnapshot]:
        return self.db.query(RegistrySnapshot).order_by(RegistrySnapshot.timestamp_ist.desc()).all()

    def create(self, snapshot: RegistrySnapshot) -> RegistrySnapshot:
        self.db.add(snapshot)
        self.db.flush()
        return snapshot
