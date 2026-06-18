import json
from typing import List, Optional
from fastapi import FastAPI, Depends, HTTPException, status, Query, Response
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from sqlalchemy import or_, and_, func
from datetime import date, datetime, timedelta

import models
import schemas
from database import engine, Base, get_db
from auth import (
    get_password_hash,
    verify_password,
    create_access_token,
    get_current_user,
    get_l1_admin,
    get_l2_admin,
    get_any_user,
)
from audit_logger import log_action, verify_audit_chain, init_audit_triggers
from excel_exporter import export_assets_to_excel

# Initialize FastAPI application
app = FastAPI(
    title="OHPC Enterprise Asset Management System (EAMS) API",
    description="Backend API for managing OHPC Digital Assets, Ownership, Lifecycles, and Auditing",
    version="1.0.0"
)

# Enable CORS for frontend development
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # For demo phase; configure strictly in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("startup")
def startup_event():
    # Make sure tables and SQLite rules/triggers exist
    Base.metadata.create_all(bind=engine)
    init_audit_triggers(engine)

# ==================== AUTHENTICATION ENDPOINTS ====================

@app.post("/api/auth/login", response_model=schemas.Token)
def login(login_data: schemas.UserLogin, db: Session = Depends(get_db)):
    user = db.query(models.User).filter(models.User.username == login_data.username).first()
    if not user or not verify_password(login_data.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    # Generate session access token
    access_token = create_access_token(data={"sub": user.username})
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "username": user.username,
        "role": user.role.name,
        "name": user.name
    }

@app.get("/api/auth/verify", response_model=schemas.UserResponse)
def verify_token(current_user: models.User = Depends(get_current_user)):
    return current_user


# ==================== TAXONOMY HIERARCHY ENDPOINTS ====================

@app.get("/api/taxonomy/types", response_model=List[schemas.AssetTypeResponse])
def get_asset_types(db: Session = Depends(get_db), current_user: models.User = Depends(get_any_user)):
    return db.query(models.AssetType).all()

@app.get("/api/taxonomy/groups", response_model=List[schemas.AssetGroupResponse])
def get_asset_groups(
    type_id: Optional[int] = None,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_any_user)
):
    query = db.query(models.AssetGroup)
    if type_id:
        query = query.filter(models.AssetGroup.asset_type_id == type_id)
    return query.all()

@app.post("/api/taxonomy/groups", response_model=schemas.AssetGroupResponse)
def create_asset_group(
    group: schemas.AssetGroupCreate,
    db: Session = Depends(get_db),
    admin: models.User = Depends(get_l1_admin)
):
    # Check if duplicate exists
    existing = db.query(models.AssetGroup).filter(
        and_(models.AssetGroup.asset_type_id == group.asset_type_id, models.AssetGroup.name == group.name)
    ).first()
    if existing:
        raise HTTPException(status_code=400, detail="Asset Group already exists under this type")
    
    new_group = models.AssetGroup(asset_type_id=group.asset_type_id, name=group.name)
    db.add(new_group)
    db.commit()
    db.refresh(new_group)
    return new_group

@app.get("/api/taxonomy/assets", response_model=List[schemas.AssetResponse])
def get_assets(
    group_id: Optional[int] = None,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_any_user)
):
    query = db.query(models.Asset)
    if group_id:
        query = query.filter(models.Asset.asset_group_id == group_id)
    return query.all()

@app.post("/api/taxonomy/assets", response_model=schemas.AssetResponse)
def create_asset_category(
    asset: schemas.AssetCreate,
    db: Session = Depends(get_db),
    admin: models.User = Depends(get_l1_admin)
):
    existing = db.query(models.Asset).filter(
        and_(models.Asset.asset_group_id == asset.asset_group_id, models.Asset.name == asset.name)
    ).first()
    if existing:
        raise HTTPException(status_code=400, detail="Asset Name/Category already exists in this group")
        
    new_asset = models.Asset(asset_group_id=asset.asset_group_id, name=asset.name)
    db.add(new_asset)
    db.commit()
    db.refresh(new_asset)
    return new_asset

@app.get("/api/taxonomy/next-identifier")
def get_next_identifier(asset_id: int, db: Session = Depends(get_db), current_user: models.User = Depends(get_l2_admin)):
    """
    Generates a unique organizational asset identifier based on selected type, group, and category.
    Formula: OHPC-{TYPE_PREFIX}-{ABBREVIATION}-{COUNT}
    """
    asset = db.query(models.Asset).filter(models.Asset.id == asset_id).first()
    if not asset:
        raise HTTPException(status_code=404, detail="Selected asset category not found")

    type_name = asset.asset_group.asset_type.name
    type_abbr = "HW" if type_name.lower() == "hardware" else "SW"
    
    # Get group abbreviation (first 4 letters, uppercase, removing spaces)
    group_clean = "".join([c for c in asset.asset_group.name if c.isalnum()]).upper()
    group_prefix = group_clean[:6] if len(group_clean) >= 4 else group_clean.ljust(4, "X")
    
    # Count existing instances of assets in this group to calculate sequence
    instances_count = db.query(models.AssetInstance).join(models.Asset).filter(
        models.Asset.asset_group_id == asset.asset_group_id
    ).count()
    
    next_num = instances_count + 1
    identifier = f"OHPC-{type_abbr}-{group_prefix}-{next_num:05d}"
    
    # Verify uniqueness
    while db.query(models.AssetInstance).filter(models.AssetInstance.identifier == identifier).first():
        next_num += 1
        identifier = f"OHPC-{type_abbr}-{group_prefix}-{next_num:05d}"

    return {"identifier": identifier}


# ==================== USERS & LOCATIONS ENDPOINTS ====================

@app.get("/api/users", response_model=List[schemas.UserResponse])
def get_users(db: Session = Depends(get_db), current_user: models.User = Depends(get_any_user)):
    return db.query(models.User).all()

@app.post("/api/users", response_model=schemas.UserResponse)
def create_user(
    user_data: schemas.UserCreate,
    db: Session = Depends(get_db),
    admin: models.User = Depends(get_l1_admin)
):
    # Verify unique username
    if db.query(models.User).filter(models.User.username == user_data.username).first():
        raise HTTPException(status_code=400, detail="Username already exists")
    # Verify unique email
    if db.query(models.User).filter(models.User.email == user_data.email).first():
        raise HTTPException(status_code=400, detail="Email already registered")
    # Verify unique employee_id
    if db.query(models.User).filter(models.User.employee_id == user_data.employee_id).first():
        raise HTTPException(status_code=400, detail="Employee ID already exists")

    new_user = models.User(
        username=user_data.username,
        password_hash=get_password_hash(user_data.password),
        name=user_data.name,
        email=user_data.email,
        role_id=user_data.role_id,
        department=user_data.department,
        employee_id=user_data.employee_id
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    return new_user

@app.get("/api/locations", response_model=List[schemas.LocationResponse])
def get_locations(db: Session = Depends(get_db), current_user: models.User = Depends(get_any_user)):
    return db.query(models.Location).all()

@app.post("/api/locations", response_model=schemas.LocationResponse)
def create_location(
    loc: schemas.LocationCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_l2_admin)
):
    new_loc = models.Location(
        plant_office=loc.plant_office,
        building=loc.building,
        floor=loc.floor,
        room=loc.room,
        rack=loc.rack
    )
    db.add(new_loc)
    db.commit()
    db.refresh(new_loc)
    return new_loc


# ==================== ASSET REGISTRY MANAGEMENT ====================

@app.get("/api/assets", response_model=List[schemas.AssetInstanceResponse])
def list_assets(
    type_id: Optional[int] = None,
    group_id: Optional[int] = None,
    asset_id: Optional[int] = None,
    criticality: Optional[str] = None,
    classification: Optional[str] = None,
    status: Optional[str] = None,
    search: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_any_user)
):
    query = db.query(models.AssetInstance).join(models.Asset).join(models.AssetGroup)
    
    # Filter by user role context
    # Level 2 Custodians see only assets they safeguard/manage (unless Level 1 Admin)
    if current_user.role.name == "L2_ADMIN":
        query = query.filter(models.AssetInstance.custodian_id == current_user.id)
    # End Users see only their assigned assets
    elif current_user.role.name == "USER":
        query = query.filter(models.AssetInstance.assigned_user_id == current_user.id)

    # Cascading selectors filters
    if type_id:
        query = query.filter(models.AssetGroup.asset_type_id == type_id)
    if group_id:
        query = query.filter(models.Asset.asset_group_id == group_id)
    if asset_id:
        query = query.filter(models.AssetInstance.asset_id == asset_id)
    if criticality:
        query = query.filter(models.AssetInstance.business_criticality == criticality)
    if classification:
        query = query.filter(models.AssetInstance.security_classification == classification)
    if status:
        query = query.filter(models.AssetInstance.status == status)

    # Search bar filter
    if search:
        search_filter = f"%{search}%"
        query = query.filter(
            or_(
                models.AssetInstance.identifier.like(search_filter),
                models.AssetInstance.description.like(search_filter),
                models.AssetInstance.serial_number.like(search_filter),
                models.AssetInstance.manufacturer.like(search_filter),
                models.AssetInstance.model_number.like(search_filter)
            )
        )

    return query.all()

@app.post("/api/assets", response_model=schemas.AssetInstanceDetailResponse, status_code=201)
def create_asset_instance(
    asset_in: schemas.AssetInstanceCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_l2_admin)
):
    # Verify identifier uniqueness
    if db.query(models.AssetInstance).filter(models.AssetInstance.identifier == asset_in.identifier).first():
        raise HTTPException(status_code=400, detail="Asset Identifier already exists")

    # Create asset record
    new_asset = models.AssetInstance(
        asset_id=asset_in.asset_id,
        identifier=asset_in.identifier,
        description=asset_in.description,
        manufacturer=asset_in.manufacturer,
        model_number=asset_in.model_number,
        serial_number=asset_in.serial_number,
        owner_id=asset_in.owner_id,
        custodian_id=asset_in.custodian_id,
        assigned_user_id=asset_in.assigned_user_id,
        location_id=asset_in.location_id,
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
        status=asset_in.status
    )
    db.add(new_asset)
    db.commit()
    db.refresh(new_asset)

    # Append to blockchain audit trail
    diffs = {"identifier": [None, new_asset.identifier], "status": [None, new_asset.status]}
    log_action(db, new_asset.id, "CREATE", current_user, diffs)
    db.commit()

    return new_asset

@app.get("/api/assets/{id}", response_model=schemas.AssetInstanceDetailResponse)
def get_asset_detail(id: int, db: Session = Depends(get_db), current_user: models.User = Depends(get_any_user)):
    asset = db.query(models.AssetInstance).filter(models.AssetInstance.id == id).first()
    if not asset:
        raise HTTPException(status_code=404, detail="Asset not found")
    
    # Assert security boundaries
    if current_user.role.name == "L2_ADMIN" and asset.custodian_id != current_user.id:
        raise HTTPException(status_code=403, detail="Access denied. You do not manage this asset.")
    elif current_user.role.name == "USER" and asset.assigned_user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Access denied. This asset is not assigned to you.")

    return asset

@app.put("/api/assets/{id}", response_model=schemas.AssetInstanceDetailResponse)
def update_asset_instance(
    id: int,
    asset_update: schemas.AssetInstanceUpdate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_any_user)
):
    asset = db.query(models.AssetInstance).filter(models.AssetInstance.id == id).first()
    if not asset:
        raise HTTPException(status_code=404, detail="Asset not found")

    if current_user.role.name == "USER":
        if asset.assigned_user_id != current_user.id:
            raise HTTPException(status_code=403, detail="You can only edit assets assigned to you")
        # Regular users can only update security classification
        update_data = asset_update.dict(exclude_unset=True)
        if any(k != "security_classification" for k in update_data.keys()):
            raise HTTPException(
                status_code=400, 
                detail="Regular users can only modify the security classification of their assigned asset"
            )
    elif current_user.role.name == "L2_ADMIN" and asset.custodian_id != current_user.id:
        raise HTTPException(status_code=403, detail="You can only edit assets assigned to you as custodian")

    # Record old values to calculate audit diffs
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
        log_action(db, asset.id, "UPDATE", current_user, diffs)
        db.commit()
        db.refresh(asset)

    return asset

@app.post("/api/assets/{id}/transfer", response_model=schemas.AssetInstanceDetailResponse)
def transfer_asset(
    id: int,
    req: schemas.AssetTransferRequest,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_l2_admin)
):
    # Verify password to fulfill e-signature confirmation requirement
    if not verify_password(req.password_confirm, current_user.password_hash):
        raise HTTPException(status_code=400, detail="Invalid confirmation password. Transfer rejected.")

    asset = db.query(models.AssetInstance).filter(models.AssetInstance.id == id).first()
    if not asset:
        raise HTTPException(status_code=404, detail="Asset not found")

    if current_user.role.name == "L2_ADMIN" and asset.custodian_id != current_user.id:
        raise HTTPException(status_code=403, detail="You can only transfer assets you safeguard as custodian")

    # Record historical change values
    old_user_id = asset.assigned_user_id
    old_loc_id = asset.location_id

    # Create AssetTransfer record
    transfer_record = models.AssetTransfer(
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
    log_action(db, asset.id, "TRANSFER", current_user, diffs)
    db.commit()
    db.refresh(asset)

    return asset

@app.post("/api/assets/{id}/retire", response_model=schemas.AssetInstanceDetailResponse)
def retire_asset(
    id: int,
    req: schemas.AssetTransferRequest, # Re-uses schema to verify password and capture reason
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_l2_admin)
):
    if not verify_password(req.password_confirm, current_user.password_hash):
        raise HTTPException(status_code=400, detail="Invalid confirmation password. Retirement rejected.")

    asset = db.query(models.AssetInstance).filter(models.AssetInstance.id == id).first()
    if not asset:
        raise HTTPException(status_code=404, detail="Asset not found")

    if current_user.role.name == "L2_ADMIN" and asset.custodian_id != current_user.id:
        raise HTTPException(status_code=403, detail="You can only retire assets you safeguard as custodian")

    old_status = asset.status
    asset.status = "Retired"
    
    diffs = {
        "status": [old_status, "Retired"],
        "retirement_reason": [None, req.reason]
    }
    
    log_action(db, asset.id, "DELETE", current_user, diffs)
    db.commit()
    db.refresh(asset)

    return asset


# ==================== REPORTING & ANALYTICS ENDPOINTS ====================

@app.get("/api/reports/summary")
def get_reports_summary(db: Session = Depends(get_db), current_user: models.User = Depends(get_any_user)):
    """
    Retrieves aggregated asset summaries. Restricts calculations depending on
    the caller's hierarchy access scope.
    """
    base_query = db.query(models.AssetInstance)
    
    # Apply user-aware dashboard limits
    if current_user.role.name == "L2_ADMIN":
        base_query = base_query.filter(models.AssetInstance.custodian_id == current_user.id)
    elif current_user.role.name == "USER":
        base_query = base_query.filter(models.AssetInstance.assigned_user_id == current_user.id)

    # Core Stats
    total_assets = base_query.count()
    
    hardware_count = base_query.join(models.Asset).join(models.AssetGroup).join(models.AssetType).filter(
        models.AssetType.name == "Hardware"
    ).count()
    
    software_count = base_query.join(models.Asset).join(models.AssetGroup).join(models.AssetType).filter(
        models.AssetType.name == "Software"
    ).count()

    # Expiry Analytics
    today = date.today()
    expired_warranties = base_query.filter(models.AssetInstance.warranty_end_date < today).count()
    exp_30_days = base_query.filter(
        and_(models.AssetInstance.warranty_end_date >= today, models.AssetInstance.warranty_end_date <= today + timedelta(days=30))
    ).count()
    exp_60_days = base_query.filter(
        and_(models.AssetInstance.warranty_end_date > today + timedelta(days=30), models.AssetInstance.warranty_end_date <= today + timedelta(days=60))
    ).count()
    healthy_warranties = base_query.filter(
        or_(models.AssetInstance.warranty_end_date > today + timedelta(days=60), models.AssetInstance.warranty_end_date == None)
    ).count()

    # Governance Warnings (Assets missing crucial data structures)
    missing_serial = base_query.filter(or_(models.AssetInstance.serial_number == None, models.AssetInstance.serial_number == "")).count()
    missing_backup = base_query.filter(and_(models.AssetInstance.backup_available == True, or_(models.AssetInstance.backup_location == None, models.AssetInstance.backup_location == ""))).count()
    missing_custodian = base_query.filter(models.AssetInstance.custodian_id == None).count()
    
    governance_issues = missing_serial + missing_backup + missing_custodian

    # Assets by Group (Chart Data)
    group_stats = db.query(
        models.AssetGroup.name, func.count(models.AssetInstance.id)
    ).select_from(models.AssetInstance).join(models.Asset).join(models.AssetGroup)
    if current_user.role.name == "L2_ADMIN":
        group_stats = group_stats.filter(models.AssetInstance.custodian_id == current_user.id)
    elif current_user.role.name == "USER":
        group_stats = group_stats.filter(models.AssetInstance.assigned_user_id == current_user.id)
    group_stats = group_stats.group_by(models.AssetGroup.name).all()
    
    group_distribution = [{"group": name, "value": val} for name, val in group_stats]

    # Assets by Location (Chart Data)
    loc_stats = db.query(
        models.Location.plant_office, func.count(models.AssetInstance.id)
    ).select_from(models.AssetInstance).join(models.Location)
    if current_user.role.name == "L2_ADMIN":
        loc_stats = loc_stats.filter(models.AssetInstance.custodian_id == current_user.id)
    elif current_user.role.name == "USER":
        loc_stats = loc_stats.filter(models.AssetInstance.assigned_user_id == current_user.id)
    loc_stats = loc_stats.group_by(models.Location.plant_office).all()
    
    location_distribution = [{"location": name, "value": val} for name, val in loc_stats]

    # End of Support Review
    eos_expired = base_query.filter(models.AssetInstance.end_of_support_date < today).count()
    eos_warning = base_query.filter(
        and_(models.AssetInstance.end_of_support_date >= today, models.AssetInstance.end_of_support_date <= today + timedelta(days=60))
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
        "eos_expired": eos_expired,
        "eos_warning": eos_warning,
        "group_distribution": group_distribution,
        "location_distribution": location_distribution
    }

@app.get("/api/reports/export")
def export_assets_report(
    type_id: Optional[int] = None,
    group_id: Optional[int] = None,
    criticality: Optional[str] = None,
    classification: Optional[str] = None,
    warranty_status: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_any_user)
):
    """
    Generates a color-coded Excel spreadsheet matching legacy template rules.
    """
    query = db.query(models.AssetInstance).join(models.Asset).join(models.AssetGroup)
    
    # Governance scope mapping
    if current_user.role.name == "L2_ADMIN":
        query = query.filter(models.AssetInstance.custodian_id == current_user.id)
    elif current_user.role.name == "USER":
        query = query.filter(models.AssetInstance.assigned_user_id == current_user.id)

    if type_id:
        query = query.filter(models.AssetGroup.asset_type_id == type_id)
    if group_id:
        query = query.filter(models.Asset.asset_group_id == group_id)
    if criticality:
        query = query.filter(models.AssetInstance.business_criticality == criticality)
    if classification:
        query = query.filter(models.AssetInstance.security_classification == classification)

    today = date.today()
    if warranty_status == "expired":
        query = query.filter(models.AssetInstance.warranty_end_date < today)
    elif warranty_status == "expiring":
        query = query.filter(
            and_(models.AssetInstance.warranty_end_date >= today, models.AssetInstance.warranty_end_date <= today + timedelta(days=60))
        )
    elif warranty_status == "active":
        query = query.filter(
            or_(models.AssetInstance.warranty_end_date > today + timedelta(days=60), models.AssetInstance.warranty_end_date == None)
        )

    instances = query.all()
    excel_bytes = export_assets_to_excel(instances)

    # Format headers to prompt download of legacy-style spreadsheet
    filename = f"OHPC_Asset_Register_{datetime.now().strftime('%Y%m%d_%H%M%S')}.xlsx"
    return Response(
        content=excel_bytes,
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        headers={
            "Content-Disposition": f"attachment; filename={filename}"
        }
    )


# ==================== CRYPTOGRAPHIC AUDITING ENDPOINTS ====================

@app.get("/api/audit/logs", response_model=List[schemas.AuditLogResponse])
def get_audit_logs(
    asset_id: Optional[int] = None,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_any_user)
):
    query = db.query(models.AuditLog).order_by(models.AuditLog.changed_at.desc())
    
    # Enforce access boundaries
    if current_user.role.name == "L2_ADMIN":
        query = query.filter(models.AuditLog.changed_by_user_id == current_user.id)
    elif current_user.role.name == "USER":
        raise HTTPException(status_code=403, detail="End users do not have access to system audit logs.")

    if asset_id:
        query = query.filter(models.AuditLog.asset_instance_id == asset_id)

    return query.all()

@app.get("/api/audit/integrity", response_model=schemas.IntegrityCheckResponse)
def check_audit_integrity(db: Session = Depends(get_db), current_user: models.User = Depends(get_l2_admin)):
    """
    Traverses the blockchain-style SHA-256 hash chains of the audit log to prove identity binding
    and row immutability. Accessible by Level 1 & Level 2 Admins.
    """
    return verify_audit_chain(db)
