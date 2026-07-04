from sqlalchemy.orm import Session
from sqlalchemy import or_, and_, func
from src.models.models import AssetInstance, Asset, AssetGroup, AssetType
from src.repositories.base import BaseRepository

class AssetRepository(BaseRepository):
    def get_instance_by_id(self, instance_id: int) -> AssetInstance:
        return self.db.query(AssetInstance).filter(AssetInstance.id == instance_id).first()

    def get_instance_by_identifier(self, identifier: str) -> AssetInstance:
        return self.db.query(AssetInstance).filter(AssetInstance.identifier == identifier).first()

    def get_type_by_id(self, type_id: int) -> AssetType:
        return self.db.query(AssetType).filter(AssetType.id == type_id).first()

    def get_all_types(self) -> list[AssetType]:
        return self.db.query(AssetType).all()

    def get_group_by_id(self, group_id: int) -> AssetGroup:
        return self.db.query(AssetGroup).filter(AssetGroup.id == group_id).first()

    def get_all_groups(self, type_id: int = None, domain: str = None) -> list[AssetGroup]:
        query = self.db.query(AssetGroup)
        if domain:
            query = query.filter(AssetGroup.domain == domain)
        if type_id:
            query = query.join(Asset).filter(Asset.asset_type_id == type_id).distinct()
        return query.all()

    def create_group(self, group: AssetGroup) -> AssetGroup:
        self.db.add(group)
        self.db.flush()
        return group

    def get_asset_category_by_id(self, category_id: int) -> Asset:
        return self.db.query(Asset).filter(Asset.id == category_id).first()

    def get_all_asset_categories(self, group_id: int = None) -> list[Asset]:
        query = self.db.query(Asset)
        if group_id:
            query = query.filter(Asset.asset_group_id == group_id)
        return query.all()

    def create_asset_category(self, category: Asset) -> Asset:
        self.db.add(category)
        self.db.flush()
        return category

    def create_instance(self, instance: AssetInstance) -> AssetInstance:
        self.db.add(instance)
        self.db.flush()
        return instance

    def get_next_sequence_for_identifier(self, prefix: str) -> int:
        # Find all instances starting with prefix (e.g. "OHPC-IT-CORP-ROUTE-")
        results = self.db.query(AssetInstance.identifier).filter(
            AssetInstance.identifier.like(f"{prefix}%")
        ).all()
        
        max_seq = 0
        for (ident,) in results:
            try:
                # Expecting format prefix + seq: e.g. prefix = "OHPC-IT-CORP-ROUTE-", ident = "OHPC-IT-CORP-ROUTE-00002"
                suffix = ident[len(prefix):]
                seq = int(suffix)
                if seq > max_seq:
                    max_seq = seq
            except ValueError:
                pass
        return max_seq + 1

    def get_latest_instance_in_group(self, group_id: int) -> AssetInstance:
        return self.db.query(AssetInstance).join(Asset).filter(
            Asset.asset_group_id == group_id
        ).order_by(AssetInstance.id.desc()).first()

    def get_active_instances(self) -> list[AssetInstance]:
        return self.db.query(AssetInstance).filter(AssetInstance.status != "Retired").all()
