from datetime import date, datetime
from typing import Optional, List
from sqlalchemy.orm import Session
from sqlalchemy import or_, and_, func

from src.models.models import AssetInstance, AssetTransfer, Asset, User, Location
from src.repositories.asset_repository import AssetRepository
from src.services.location_service import LocationService
from src.services.auth_service import AuthService
from src.services.audit_service import AuditService
from src.schemas.schemas import AssetInstanceCreate, AssetInstanceUpdate, AssetTransferRequest

class AssetService:
    def __init__(
        self, 
        asset_repo: AssetRepository, 
        location_service: LocationService, 
        auth_service: AuthService, 
        audit_service: AuditService
    ):
        self.asset_repo = asset_repo
        self.location_service = location_service
        self.auth_service = auth_service
        self.audit_service = audit_service

    def get_by_id(self, instance_id: int) -> Optional[AssetInstance]:
        return self.asset_repo.get_instance_by_id(instance_id)

    def list_assets(
        self,
        current_user: User,
        type_id: Optional[int] = None,
        group_id: Optional[int] = None,
        asset_id: Optional[int] = None,
        criticality: Optional[str] = None,
        classification: Optional[str] = None,
        status: Optional[str] = None,
        search: Optional[str] = None,
        custodian_id: Optional[int] = None,
        domain: Optional[str] = None
    ) -> List[AssetInstance]:
        db = self.asset_repo.db
        from src.models.models import Asset, AssetGroup
        query = db.query(AssetInstance).join(Asset).join(AssetGroup)
        
        if current_user.role.name == "USER":
            query = query.filter(AssetInstance.assigned_user_id == current_user.id)
        
        # Cascading selector filters
        if type_id:
            query = query.filter(Asset.asset_type_id == type_id)
        if group_id:
            query = query.filter(Asset.asset_group_id == group_id)
        if asset_id:
            query = query.filter(AssetInstance.asset_id == asset_id)
        if criticality:
            query = query.filter(AssetInstance.business_criticality == criticality)
        if classification:
            query = query.filter(AssetInstance.security_classification == classification)
        if status:
            query = query.filter(AssetInstance.status == status)
        if custodian_id:
            query = query.filter(AssetInstance.custodian_id == custodian_id)
        if domain:
            query = query.filter(AssetGroup.domain == domain)

        # Search bar filter
        if search:
            search_filter = f"%{search}%"
            query = query.filter(
                or_(
                    AssetInstance.identifier.like(search_filter),
                    AssetInstance.description.like(search_filter),
                    AssetInstance.serial_number.like(search_filter),
                    AssetInstance.manufacturer.like(search_filter),
                    AssetInstance.model_number.like(search_filter)
                )
            )

        return query.all()

    def create_asset_instance(self, asset_in: AssetInstanceCreate, current_user: User) -> AssetInstance:
        db = self.asset_repo.db
        
        # Verify identifier uniqueness
        if self.asset_repo.get_instance_by_identifier(asset_in.identifier):
            raise ValueError("Asset Identifier already exists")

        # Resolve owners, custodians, assigned users
        owner_user = self.auth_service.resolve_or_create_user(
            asset_in.owner_id, asset_in.owner_name, "USER", "Management"
        )
        custodian_user = self.auth_service.resolve_or_create_user(
            asset_in.custodian_id, asset_in.custodian_name, "L2_ADMIN", "IT Infrastructure"
        )
        assigned_user = None
        if asset_in.assigned_user_id or asset_in.assigned_user_name:
            assigned_user = self.auth_service.resolve_or_create_user(
                asset_in.assigned_user_id, asset_in.assigned_user_name, "USER", "Operations"
            )

        # Resolve or create location
        loc = self.location_service.resolve_or_create_location(
            asset_in.location_id, asset_in.location_plant_office, asset_in.location_building
        )

        # Validate custodian role (must be L2_ADMIN)
        if custodian_user.role.name != "L2_ADMIN":
            raise ValueError("The assigned custodian must be a user with the L2_ADMIN role.")

        # Lookup asset category for self-referential linkage of same type
        target_asset = self.asset_repo.get_asset_category_by_id(asset_in.asset_id)
        if not target_asset:
            raise ValueError("Selected asset category not found")

        prev_asset = self.asset_repo.get_latest_instance_in_group(target_asset.asset_group_id)

        # Create asset record
        new_asset = AssetInstance(
            asset_id=asset_in.asset_id,
            identifier=asset_in.identifier,
            description=asset_in.description,
            manufacturer=asset_in.manufacturer,
            model_number=asset_in.model_number,
            serial_number=asset_in.serial_number,
            owner_id=owner_user.id,
            custodian_id=custodian_user.id,
            assigned_user_id=assigned_user.id if assigned_user else None,
            location_id=loc.id,
            security_classification=asset_in.security_classification,
            business_criticality=asset_in.business_criticality,
            purchase_date=asset_in.purchase_date,
            installation_date=asset_in.installation_date,
            warranty_start_date=asset_in.warranty_start_date,
            warranty_end_date=asset_in.warranty_end_date,
            end_of_life_date=asset_in.end_of_life_date,
            end_of_support_date=asset_in.end_of_support_date,
            policy_deviations=asset_in.policy_deviations,
            known_vulnerabilities=asset_in.known_vulnerabilities,
            remarks=asset_in.remarks,
            backup_available=asset_in.backup_available,
            backup_location=asset_in.backup_location,
            backup_owner_id=asset_in.backup_owner_id,
            status=asset_in.status,
            prev_asset_instance_id=prev_asset.id if prev_asset else None
        )
        
        created_asset = self.asset_repo.create(new_asset)
        db.commit()
        db.refresh(created_asset)

        # Append to blockchain audit trail
        diffs = {"identifier": [None, created_asset.identifier], "status": [None, created_asset.status]}
        self.audit_service.log_action(created_asset.id, "CREATE", current_user, diffs)
        db.commit()
        db.refresh(created_asset)

        return created_asset

    def update_asset_instance(self, instance_id: int, asset_update: AssetInstanceUpdate, current_user: User) -> AssetInstance:
        db = self.asset_repo.db
        asset = self.asset_repo.get_instance_by_id(instance_id)
        if not asset:
            raise ValueError("Asset not found")

        diffs = {}
        update_data = asset_update.dict(exclude_unset=True)

        for field, new_val in update_data.items():
            old_val = getattr(asset, field)
            
            # Serialize objects or dates for JSON compatibility
            if isinstance(old_val, (date, datetime)):
                old_val_serial = old_val.isoformat()
            else:
                old_val_serial = old_val
                
            if isinstance(new_val, (date, datetime)):
                new_val_serial = new_val.isoformat()
            else:
                new_val_serial = new_val

            if old_val_serial != new_val_serial:
                diffs[field] = [old_val_serial, new_val_serial]
                setattr(asset, field, new_val)

        if diffs:
            self.audit_service.log_action(asset.id, "UPDATE", current_user, diffs)
            db.commit()
            db.refresh(asset)

        return asset

    def transfer_asset(self, instance_id: int, req: AssetTransferRequest, current_user: User) -> AssetInstance:
        db = self.asset_repo.db
        
        # Verify password for e-signature confirmation
        if not self.auth_service.verify_password(req.password_confirm, current_user.password_hash):
            raise ValueError("Invalid confirmation password. Transfer rejected.")

        asset = self.asset_repo.get_instance_by_id(instance_id)
        if not asset:
            raise ValueError("Asset not found")

        # Record historical change values
        old_user_id = asset.assigned_user_id
        old_loc_id = asset.location_id

        # Create AssetTransfer record
        transfer_record = AssetTransfer(
            asset_instance_id=asset.id,
            from_user_id=old_user_id,
            to_user_id=req.new_user_id,
            from_location_id=old_loc_id,
            to_location_id=req.new_location_id,
            reason=req.reason,
            changed_by_user_id=current_user.id
        )
        db.add(transfer_record)

        # Perform updates on the asset instance
        asset.assigned_user_id = req.new_user_id
        asset.location_id = req.new_location_id
        
        # Calculate audit log differences
        diffs = {
            "assigned_user_id": [old_user_id, req.new_user_id],
            "location_id": [old_loc_id, req.new_location_id],
            "transfer_reason": [None, req.reason]
        }
        
        # Save transfer audit record in immutable chain
        self.audit_service.log_action(asset.id, "TRANSFER", current_user, diffs)
        db.commit()
        db.refresh(asset)

        return asset

    def retire_asset(self, instance_id: int, req: AssetTransferRequest, current_user: User) -> AssetInstance:
        db = self.asset_repo.db
        
        if not self.auth_service.verify_password(req.password_confirm, current_user.password_hash):
            raise ValueError("Invalid confirmation password. Retirement rejected.")

        asset = self.asset_repo.get_instance_by_id(instance_id)
        if not asset:
            raise ValueError("Asset not found")

        old_status = asset.status
        asset.status = "Retired"
        
        diffs = {
            "status": [old_status, "Retired"],
            "retirement_reason": [None, req.reason]
        }
        
        self.audit_service.log_action(asset.id, "DELETE", current_user, diffs)
        db.commit()
        db.refresh(asset)

        return asset

    def bulk_update_classification(self, asset_ids: List[int], security_classification: str, current_user: User) -> None:
        db = self.asset_repo.db
        assets = db.query(AssetInstance).filter(AssetInstance.id.in_(asset_ids)).all()
        if not assets:
            raise ValueError("No assets found to update")
        
        for asset in assets:
            old_val = asset.security_classification
            if old_val != security_classification:
                asset.security_classification = security_classification
                diffs = {"security_classification": [old_val, security_classification]}
                self.audit_service.log_action(asset.id, "UPDATE", current_user, diffs)
        
        db.commit()

    def bulk_transfer(
        self, 
        asset_ids: List[int], 
        new_user_id: int, 
        new_location_id: int, 
        reason: str, 
        password_confirm: str, 
        current_user: User
    ) -> None:
        db = self.asset_repo.db
        
        if not self.auth_service.verify_password(password_confirm, current_user.password_hash):
            raise ValueError("Invalid confirmation password. Transfer rejected.")

        assets = db.query(AssetInstance).filter(AssetInstance.id.in_(asset_ids)).all()
        if not assets:
            raise ValueError("No assets found to transfer")

        for asset in assets:
            old_user_id = asset.assigned_user_id
            old_loc_id = asset.location_id

            transfer_record = AssetTransfer(
                asset_instance_id=asset.id,
                from_user_id=old_user_id,
                to_user_id=new_user_id,
                from_location_id=old_loc_id,
                to_location_id=new_location_id,
                reason=reason,
                changed_by_user_id=current_user.id
            )
            db.add(transfer_record)

            asset.assigned_user_id = new_user_id
            asset.location_id = new_location_id

            diffs = {
                "assigned_user_id": [old_user_id, new_user_id],
                "location_id": [old_loc_id, new_location_id],
                "transfer_reason": [None, reason]
            }
            self.audit_service.log_action(asset.id, "TRANSFER", current_user, diffs)

        db.commit()
