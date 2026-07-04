from typing import Optional
from src.models.models import AssetType, AssetGroup, Asset
from src.repositories.asset_repository import AssetRepository

class TaxonomyService:
    def __init__(self, asset_repo: AssetRepository):
        self.asset_repo = asset_repo

    def get_types(self) -> list[AssetType]:
        return self.asset_repo.get_all_types()

    def get_groups(self, type_id: Optional[int] = None, domain: Optional[str] = None) -> list[AssetGroup]:
        return self.asset_repo.get_all_groups(type_id, domain)

    def create_group(self, domain: str, name: str) -> AssetGroup:
        new_group = AssetGroup(domain=domain, name=name)
        return self.asset_repo.create_group(new_group)

    def get_asset_categories(self, group_id: Optional[int] = None) -> list[Asset]:
        return self.asset_repo.get_all_asset_categories(group_id)

    def create_asset_category(self, asset_group_id: int, asset_type_id: int, name: str) -> Asset:
        new_cat = Asset(asset_group_id=asset_group_id, asset_type_id=asset_type_id, name=name)
        return self.asset_repo.create_asset_category(new_cat)

    def get_next_identifier(self, asset_id: int, plant_name: Optional[str] = None, place_of_installation: Optional[str] = None) -> str:
        asset = self.asset_repo.get_asset_category_by_id(asset_id)
        if not asset:
            raise ValueError("Selected asset category not found")

        domain = asset.asset_group.domain.upper()

        def get_prefix(val: Optional[str], length: int, default: str) -> str:
            if not val or not val.strip():
                return default
            clean = "".join([c for c in val if c.isalnum()]).upper()
            if not clean:
                return default
            return clean[:length].ljust(length, "X")

        plant_prefix = get_prefix(plant_name, 4, "PLNT")
        place_prefix = get_prefix(place_of_installation, 4, "PLAC")
        asset_prefix = get_prefix(asset.name, 5, "ASSET")

        db = self.asset_repo.db
        from src.models.models import AssetInstance
        instances_count = db.query(AssetInstance).join(Asset).filter(
            Asset.asset_group_id == asset.asset_group_id
        ).count()

        next_num = instances_count + 1
        identifier = f"{plant_prefix}-{domain}-{place_prefix}-{asset_prefix}-{next_num:05d}"

        # Verify uniqueness
        while db.query(AssetInstance).filter(AssetInstance.identifier == identifier).first():
            next_num += 1
            identifier = f"{plant_prefix}-{domain}-{place_prefix}-{asset_prefix}-{next_num:05d}"

        return identifier
