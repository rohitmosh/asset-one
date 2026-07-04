from sqlalchemy.orm import Session
from src.models.models import AuditLog
from src.repositories.base import BaseRepository

class AuditRepository(BaseRepository):
    def get_latest(self) -> AuditLog:
        return self.db.query(AuditLog).order_by(AuditLog.id.desc()).first()

    def get_all(self, asset_id: int = None) -> list[AuditLog]:
        query = self.db.query(AuditLog).order_by(AuditLog.changed_at.desc())
        if asset_id:
            query = query.filter(AuditLog.asset_instance_id == asset_id)
        return query.all()

    def create(self, log: AuditLog) -> AuditLog:
        self.db.add(log)
        self.db.flush()
        return log

    def get_all_ordered_asc(self) -> list[AuditLog]:
        return self.db.query(AuditLog).order_by(AuditLog.id.asc()).all()
