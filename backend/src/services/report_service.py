from datetime import date, datetime, timedelta
from typing import Optional, List
from sqlalchemy import func, and_, or_
from src.models.models import AssetInstance, Asset, AssetGroup, AssetType, Location
from src.repositories.asset_repository import AssetRepository
from src.utils.excel_exporter import export_assets_to_excel
from src.utils.pdf_exporter import export_assets_to_pdf

class ReportService:
    def __init__(self, asset_repo: AssetRepository):
        self.asset_repo = asset_repo

    def get_dashboard_summary(self, current_user) -> dict:
        db = self.asset_repo.db
        base_query = db.query(AssetInstance)
        if current_user.role.name == "USER":
            base_query = base_query.filter(AssetInstance.assigned_user_id == current_user.id)
        
        total_assets = base_query.count()
        
        hardware_count = base_query.join(Asset).join(AssetType).filter(
            AssetType.name == "Hardware"
        ).count()
        
        software_count = base_query.join(Asset).join(AssetType).filter(
            AssetType.name == "Software"
        ).count()

        # Expiry Analytics
        today = date.today()
        expired_warranties = base_query.filter(AssetInstance.warranty_end_date < today).count()
        exp_30_days = base_query.filter(
            and_(AssetInstance.warranty_end_date >= today, AssetInstance.warranty_end_date <= today + timedelta(days=30))
        ).count()
        exp_60_days = base_query.filter(
            and_(AssetInstance.warranty_end_date > today + timedelta(days=30), AssetInstance.warranty_end_date <= today + timedelta(days=60))
        ).count()
        healthy_warranties = base_query.filter(
            or_(AssetInstance.warranty_end_date > today + timedelta(days=60), AssetInstance.warranty_end_date == None)
        ).count()

        # Governance Warnings
        missing_serial = base_query.filter(or_(AssetInstance.serial_number == None, AssetInstance.serial_number == "")).count()
        missing_backup = base_query.filter(and_(AssetInstance.backup_available == True, or_(AssetInstance.backup_location == None, AssetInstance.backup_location == ""))).count()
        missing_custodian = base_query.filter(AssetInstance.custodian_id == None).count()
        governance_issues = missing_serial + missing_backup + missing_custodian

        # Distribution metrics
        group_stats = db.query(
            AssetGroup.name, func.count(AssetInstance.id)
        ).select_from(AssetInstance).join(Asset).join(AssetGroup)
        if current_user.role.name == "USER":
            group_stats = group_stats.filter(AssetInstance.assigned_user_id == current_user.id)
        group_stats = group_stats.group_by(AssetGroup.name).all()
        group_distribution = [{"group": name, "value": val} for name, val in group_stats]

        loc_stats = db.query(
            Location.plant_office, func.count(AssetInstance.id)
        ).select_from(AssetInstance).join(Location)
        if current_user.role.name == "USER":
            loc_stats = loc_stats.filter(AssetInstance.assigned_user_id == current_user.id)
        loc_stats = loc_stats.group_by(Location.plant_office).all()
        location_distribution = [{"location": name, "value": val} for name, val in loc_stats]

        eos_expired = base_query.filter(AssetInstance.end_of_support_date < today).count()
        eos_warning = base_query.filter(
            and_(AssetInstance.end_of_support_date >= today, AssetInstance.end_of_support_date <= today + timedelta(days=60))
        ).count()

        return {
            "total": total_assets,
            "hardware": hardware_count,
            "software": software_count,
            "warranty_expired": expired_warranties,
            "warranty_30_days": exp_30_days,
            "warranty_60_days": exp_60_days,
            "warranty_healthy": healthy_warranties,
            "governance_issues": governance_issues,
            "group_distribution": group_distribution,
            "location_distribution": location_distribution,
            "eos_expired": eos_expired,
            "eos_warning": eos_warning
        }

    def generate_excel_report(self, instances: List[AssetInstance]) -> bytes:
        return export_assets_to_excel(instances)

    def generate_pdf_report(self, instances: List[AssetInstance]) -> bytes:
        return export_assets_to_pdf(instances)
