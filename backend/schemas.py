from pydantic import BaseModel, EmailStr
from datetime import date, datetime
from typing import Optional, List, Any

# Authentication
class Token(BaseModel):
    access_token: str
    token_type: str
    username: str
    role: str
    name: str

class TokenData(BaseModel):
    username: Optional[str] = None

class UserLogin(BaseModel):
    username: str
    password: str

# Users & Roles
class RoleResponse(BaseModel):
    id: int
    name: str
    permissions: Optional[str] = None

    class Config:
        from_attributes = True

class UserResponse(BaseModel):
    id: int
    username: str
    name: str
    email: str
    department: str
    employee_id: str
    role: RoleResponse

    class Config:
        from_attributes = True

class UserCreate(BaseModel):
    username: str
    password: str
    name: str
    email: EmailStr
    role_id: int
    department: str
    employee_id: str

# Locations
class LocationResponse(BaseModel):
    id: int
    plant_office: str
    building: str
    floor: Optional[str] = None
    room: Optional[str] = None
    rack: Optional[str] = None

    class Config:
        from_attributes = True

class LocationCreate(BaseModel):
    plant_office: str
    building: str
    floor: Optional[str] = None
    room: Optional[str] = None
    rack: Optional[str] = None

# Taxonomy
class AssetTypeResponse(BaseModel):
    id: int
    name: str

    class Config:
        from_attributes = True

class AssetGroupResponse(BaseModel):
    id: int
    domain: str
    name: str

    class Config:
        from_attributes = True

class AssetGroupCreate(BaseModel):
    domain: str
    name: str

class AssetResponse(BaseModel):
    id: int
    asset_group_id: int
    asset_type_id: int
    name: str
    asset_group: Optional[AssetGroupResponse] = None
    asset_type: Optional[AssetTypeResponse] = None

    class Config:
        from_attributes = True

class AssetCreate(BaseModel):
    asset_group_id: int
    asset_type_id: int
    name: str

# Asset Instance (Deployable Assets)
class AssetInstanceBase(BaseModel):
    asset_id: int
    identifier: str
    description: Optional[str] = None
    manufacturer: Optional[str] = None
    model_number: Optional[str] = None
    serial_number: Optional[str] = None
    owner_id: Optional[int] = None
    owner_name: Optional[str] = None
    custodian_id: Optional[int] = None
    custodian_name: Optional[str] = None
    assigned_user_id: Optional[int] = None
    assigned_user_name: Optional[str] = None
    location_id: int
    security_classification: str  # Public, Internal, Confidential, Restricted
    business_criticality: str     # Low, Medium, High
    purchase_date: Optional[date] = None
    installation_date: Optional[date] = None
    warranty_start_date: Optional[date] = None
    warranty_end_date: Optional[date] = None
    end_of_life_date: Optional[date] = None
    end_of_support_date: Optional[date] = None
    policy_deviations: Optional[str] = None
    known_vulnerabilities: Optional[str] = None
    remarks: Optional[str] = None
    backup_available: bool = False
    backup_location: Optional[str] = None
    backup_owner_id: Optional[int] = None
    status: str = "Active"

class AssetInstanceCreate(AssetInstanceBase):
    pass

class AssetInstanceUpdate(BaseModel):
    description: Optional[str] = None
    manufacturer: Optional[str] = None
    model_number: Optional[str] = None
    serial_number: Optional[str] = None
    owner_id: Optional[int] = None
    custodian_id: Optional[int] = None
    assigned_user_id: Optional[int] = None
    location_id: Optional[int] = None
    security_classification: Optional[str] = None
    business_criticality: Optional[str] = None
    purchase_date: Optional[date] = None
    installation_date: Optional[date] = None
    warranty_start_date: Optional[date] = None
    warranty_end_date: Optional[date] = None
    end_of_life_date: Optional[date] = None
    end_of_support_date: Optional[date] = None
    policy_deviations: Optional[str] = None
    known_vulnerabilities: Optional[str] = None
    remarks: Optional[str] = None
    backup_available: Optional[bool] = None
    backup_location: Optional[str] = None
    backup_owner_id: Optional[int] = None
    status: Optional[str] = None

class AssetInstanceResponse(BaseModel):
    id: int
    identifier: str
    description: Optional[str] = None
    manufacturer: Optional[str] = None
    model_number: Optional[str] = None
    serial_number: Optional[str] = None
    security_classification: str
    business_criticality: str
    warranty_end_date: Optional[date] = None
    status: str
    
    owner_id: int
    custodian_id: int
    assigned_user_id: Optional[int] = None
    location_id: int
    
    asset: AssetResponse
    owner: UserResponse
    custodian: UserResponse
    assigned_user: Optional[UserResponse] = None
    location: LocationResponse
    policy_deviations: Optional[str] = None
    known_vulnerabilities: Optional[str] = None
    backup_available: Optional[bool] = None
    backup_location: Optional[str] = None

    prev_asset_instance_id: Optional[int] = None
    prev_asset_identifier: Optional[str] = None
    next_asset_instance_id: Optional[int] = None
    next_asset_identifier: Optional[str] = None

    class Config:
        from_attributes = True

class AssetInstanceDetailResponse(AssetInstanceResponse):
    purchase_date: Optional[date] = None
    installation_date: Optional[date] = None
    warranty_start_date: Optional[date] = None
    end_of_life_date: Optional[date] = None
    end_of_support_date: Optional[date] = None
    policy_deviations: Optional[str] = None
    known_vulnerabilities: Optional[str] = None
    remarks: Optional[str] = None
    backup_available: bool
    backup_location: Optional[str] = None
    backup_owner: Optional[UserResponse] = None

    class Config:
        from_attributes = True

# Transfer Asset Request
class AssetTransferRequest(BaseModel):
    new_user_id: int
    new_location_id: int
    reason: str
    password_confirm: str  # E-Signature confirmation requirement

# Audit Log Response
class AuditLogResponse(BaseModel):
    id: int
    asset_instance_id: Optional[int] = None
    action: str
    changed_by_user_id: int
    changed_by_name: str
    changed_by_role: str
    changed_at: datetime
    ip_address: Optional[str] = None
    field_diffs: Optional[str] = None
    prev_hash: Optional[str] = None
    row_hash: str

    class Config:
        from_attributes = True

class IntegrityCheckResponse(BaseModel):
    status: str
    total_records: Optional[int] = None
    reason: Optional[str] = None
    failed_at_log_id: Optional[int] = None
    expected_prev_hash: Optional[str] = None
    found_prev_hash: Optional[str] = None
    stored_hash: Optional[str] = None
    calculated_hash: Optional[str] = None
    timestamp: Optional[str] = None

class BulkClassificationUpdate(BaseModel):
    asset_ids: List[int]
    security_classification: str

class BulkTransferRequest(BaseModel):
    asset_ids: List[int]
    new_user_id: int
    new_location_id: int
    reason: str
    password_confirm: str


# ── Registry Snapshot (Non-Repudiation) ─────────────────────────────────────

class SnapshotSignRequest(BaseModel):
    password_confirm: str         # L2 Admin must re-enter their password at signing time
    remarks: Optional[str] = None # Free-text note attached to the snapshot


class SnapshotManifestResponse(BaseModel):
    """Summary record returned by GET /api/snapshots (list)."""
    id: int
    snapshot_id: str
    signer_user_id: int
    signer_name: str
    signer_role: str
    signer_employee_id: str
    signer_department: str
    signer_email: str
    timestamp_ist: datetime
    asset_count: int
    data_hash: str
    chain_anchor: str
    hmac_signature: str
    remarks: Optional[str] = None

    class Config:
        from_attributes = True


class SnapshotVerifyResponse(BaseModel):
    """Result returned by GET /api/snapshots/{snapshot_id}/verify."""
    snapshot_id: str
    status: str                   # "valid" | "tampered"
    signer_name: str
    signer_role: str
    signer_employee_id: str
    signer_department: str
    timestamp_ist: datetime
    asset_count: int
    data_hash: str
    chain_anchor: str
    remarks: Optional[str] = None
    reason: Optional[str] = None  # Populated only when status == "tampered"


