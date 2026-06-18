from sqlalchemy import Column, Integer, String, ForeignKey, DateTime, Date, Boolean, Text, JSON
from sqlalchemy.orm import relationship
from datetime import datetime
from database import Base

class Role(Base):
    __tablename__ = "roles"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(50), unique=True, nullable=False)  # L1_ADMIN, L2_ADMIN, USER
    permissions = Column(Text, nullable=True)  # JSON or comma-separated permissions string

    users = relationship("User", back_populates="role")

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String(50), unique=True, index=True, nullable=False)
    password_hash = Column(String(255), nullable=False)
    name = Column(String(100), nullable=False)
    email = Column(String(100), unique=True, nullable=False)
    role_id = Column(Integer, ForeignKey("roles.id"), nullable=False)
    department = Column(String(100), nullable=False)
    employee_id = Column(String(50), unique=True, nullable=False)

    role = relationship("Role", back_populates="users")
    
    # Relationships for assets where this user plays a role
    owned_assets = relationship("AssetInstance", foreign_keys="[AssetInstance.owner_id]", back_populates="owner")
    managed_assets = relationship("AssetInstance", foreign_keys="[AssetInstance.custodian_id]", back_populates="custodian")
    assigned_assets = relationship("AssetInstance", foreign_keys="[AssetInstance.assigned_user_id]", back_populates="assigned_user")
    backup_managed_assets = relationship("AssetInstance", foreign_keys="[AssetInstance.backup_owner_id]", back_populates="backup_owner")

class Location(Base):
    __tablename__ = "locations"

    id = Column(Integer, primary_key=True, index=True)
    plant_office = Column(String(100), nullable=False)  # e.g., Corporate Office, Rengali Hydro Project
    building = Column(String(100), nullable=False)      # e.g., Block A, Power House
    floor = Column(String(50), nullable=True)          # e.g., Ground Floor, Floor 2
    room = Column(String(50), nullable=True)           # e.g., Room 302, Control Room
    rack = Column(String(50), nullable=True)           # e.g., Rack B1, N/A

    asset_instances = relationship("AssetInstance", back_populates="location")

class AssetType(Base):
    __tablename__ = "asset_types"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(50), unique=True, nullable=False)  # Hardware, Software

    groups = relationship("AssetGroup", back_populates="asset_type")

class AssetGroup(Base):
    __tablename__ = "asset_groups"

    id = Column(Integer, primary_key=True, index=True)
    asset_type_id = Column(Integer, ForeignKey("asset_types.id"), nullable=False)
    name = Column(String(100), nullable=False)  # e.g., Control Systems, Communication Infrastructure

    asset_type = relationship("AssetType", back_populates="groups")
    assets = relationship("Asset", back_populates="asset_group")

class Asset(Base):
    __tablename__ = "assets"

    id = Column(Integer, primary_key=True, index=True)
    asset_group_id = Column(Integer, ForeignKey("asset_groups.id"), nullable=False)
    name = Column(String(100), nullable=False)  # e.g., Router, Firewall, PLC, Antivirus

    asset_group = relationship("AssetGroup", back_populates="assets")
    instances = relationship("AssetInstance", back_populates="asset")

class AssetInstance(Base):
    __tablename__ = "asset_instances"

    id = Column(Integer, primary_key=True, index=True)
    asset_id = Column(Integer, ForeignKey("assets.id"), nullable=False)
    identifier = Column(String(100), unique=True, index=True, nullable=False)  # OHPC-IT-ROUTER-000234
    description = Column(Text, nullable=True)
    
    # Manufacturer details
    manufacturer = Column(String(100), nullable=True)
    model_number = Column(String(100), nullable=True)
    serial_number = Column(String(100), nullable=True)

    # Ownership details
    owner_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    custodian_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    assigned_user_id = Column(Integer, ForeignKey("users.id"), nullable=True)

    # Location Information
    location_id = Column(Integer, ForeignKey("locations.id"), nullable=False)

    # Security & Business Criticality
    security_classification = Column(String(50), nullable=False)  # Public, Internal, Confidential, Restricted
    business_criticality = Column(String(50), nullable=False)     # Low, Medium, High

    # Lifecycle information
    purchase_date = Column(Date, nullable=True)
    installation_date = Column(Date, nullable=True)
    warranty_start_date = Column(Date, nullable=True)
    warranty_end_date = Column(Date, nullable=True)
    end_of_life_date = Column(Date, nullable=True)
    end_of_support_date = Column(Date, nullable=True)

    # Risk & Compliance
    policy_deviations = Column(Text, nullable=True)
    known_vulnerabilities = Column(Text, nullable=True)
    remarks = Column(Text, nullable=True)

    # Backup details
    backup_available = Column(Boolean, default=False)
    backup_location = Column(String(255), nullable=True)
    backup_owner_id = Column(Integer, ForeignKey("users.id"), nullable=True)

    # Status
    status = Column(String(50), default="Active")  # Active, Transferred, Maintenance, Retired, Archived

    # Relationships
    asset = relationship("Asset", back_populates="instances")
    owner = relationship("User", foreign_keys=[owner_id], back_populates="owned_assets")
    custodian = relationship("User", foreign_keys=[custodian_id], back_populates="managed_assets")
    assigned_user = relationship("User", foreign_keys=[assigned_user_id], back_populates="assigned_assets")
    location = relationship("Location", back_populates="asset_instances")
    backup_owner = relationship("User", foreign_keys=[backup_owner_id], back_populates="backup_managed_assets")
    
    audit_logs = relationship("AuditLog", back_populates="asset_instance", cascade="all, delete-orphan")
    transfers = relationship("AssetTransfer", back_populates="asset_instance", cascade="all, delete-orphan")

class AuditLog(Base):
    __tablename__ = "asset_audit_log"

    id = Column(Integer, primary_key=True, index=True)
    asset_instance_id = Column(Integer, ForeignKey("asset_instances.id", ondelete="CASCADE"), nullable=True)
    action = Column(String(50), nullable=False)  # CREATE, UPDATE, DELETE, TRANSFER
    changed_by_user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    changed_by_name = Column(String(100), nullable=False)
    changed_by_role = Column(String(50), nullable=False)
    changed_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    ip_address = Column(String(50), nullable=True)
    field_diffs = Column(Text, nullable=True)  # JSON-serialized object stores {field: [old_val, new_val]}
    
    # Hash chain integrity fields
    prev_hash = Column(String(64), nullable=True)  # SHA-256 hash of the previous log row
    row_hash = Column(String(64), nullable=False)  # SHA-256 hash of this row's content + prev_hash

    asset_instance = relationship("AssetInstance", back_populates="audit_logs")

class AssetTransfer(Base):
    __tablename__ = "asset_transfers"

    id = Column(Integer, primary_key=True, index=True)
    asset_instance_id = Column(Integer, ForeignKey("asset_instances.id", ondelete="CASCADE"), nullable=False)
    transfer_date = Column(DateTime, default=datetime.utcnow, nullable=False)
    from_user_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    to_user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    from_location_id = Column(Integer, ForeignKey("locations.id"), nullable=True)
    to_location_id = Column(Integer, ForeignKey("locations.id"), nullable=False)
    reason = Column(Text, nullable=True)
    changed_by_user_id = Column(Integer, ForeignKey("users.id"), nullable=False)

    asset_instance = relationship("AssetInstance", back_populates="transfers")
    from_user = relationship("User", foreign_keys=[from_user_id])
    to_user = relationship("User", foreign_keys=[to_user_id])
    from_location = relationship("Location", foreign_keys=[from_location_id])
    to_location = relationship("Location", foreign_keys=[to_location_id])
    changed_by_user = relationship("User", foreign_keys=[changed_by_user_id])
