from typing import Optional
from fastapi import Depends, HTTPException, status, Query
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session
from src.database.connection import get_db

from src.repositories.user_repository import UserRepository
from src.repositories.asset_repository import AssetRepository
from src.repositories.location_repository import LocationRepository
from src.repositories.audit_repository import AuditRepository
from src.repositories.snapshot_repository import SnapshotRepository

from src.services.auth_service import AuthService
from src.services.location_service import LocationService
from src.services.taxonomy_service import TaxonomyService
from src.services.audit_service import AuditService
from src.services.asset_service import AssetService
from src.services.report_service import ReportService
from src.services.snapshot_service import SnapshotService
from src.models.models import User

# OAuth2 and auth schemes
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="api/auth/login", auto_error=False)

# Repositories
def get_user_repo(db: Session = Depends(get_db)) -> UserRepository:
    return UserRepository(db)

def get_asset_repo(db: Session = Depends(get_db)) -> AssetRepository:
    return AssetRepository(db)

def get_location_repo(db: Session = Depends(get_db)) -> LocationRepository:
    return LocationRepository(db)

def get_audit_repo(db: Session = Depends(get_db)) -> AuditRepository:
    return AuditRepository(db)

def get_snapshot_repo(db: Session = Depends(get_db)) -> SnapshotRepository:
    return SnapshotRepository(db)

# Services
def get_auth_service(user_repo: UserRepository = Depends(get_user_repo)) -> AuthService:
    return AuthService(user_repo)

def get_location_service(location_repo: LocationRepository = Depends(get_location_repo)) -> LocationService:
    return LocationService(location_repo)

def get_taxonomy_service(asset_repo: AssetRepository = Depends(get_asset_repo)) -> TaxonomyService:
    return TaxonomyService(asset_repo)

def get_audit_service(audit_repo: AuditRepository = Depends(get_audit_repo)) -> AuditService:
    return AuditService(audit_repo)

def get_asset_service(
    asset_repo: AssetRepository = Depends(get_asset_repo),
    location_service: LocationService = Depends(get_location_service),
    auth_service: AuthService = Depends(get_auth_service),
    audit_service: AuditService = Depends(get_audit_service)
) -> AssetService:
    return AssetService(asset_repo, location_service, auth_service, audit_service)

def get_report_service(asset_repo: AssetRepository = Depends(get_asset_repo)) -> ReportService:
    return ReportService(asset_repo)

def get_snapshot_service(
    snapshot_repo: SnapshotRepository = Depends(get_snapshot_repo),
    asset_repo: AssetRepository = Depends(get_asset_repo),
    auth_service: AuthService = Depends(get_auth_service),
    audit_service: AuditService = Depends(get_audit_service)
) -> SnapshotService:
    return SnapshotService(snapshot_repo, asset_repo, auth_service, audit_service)

# Authentication dependencies
def get_current_user(
    token: Optional[str] = Depends(oauth2_scheme),
    jwt_token: Optional[str] = Query(None, alias="jwt"),
    token_param: Optional[str] = Query(None, alias="token"),
    auth_service: AuthService = Depends(get_auth_service),
    user_repo: UserRepository = Depends(get_user_repo)
) -> User:
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    
    resolved_token = token or jwt_token or token_param
    if not resolved_token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Not authenticated",
            headers={"WWW-Authenticate": "Bearer"},
        )
        
    username = auth_service.decode_token(resolved_token)
    if username is None:
        raise credentials_exception
        
    user = user_repo.get_by_username(username)
    if user is None:
        raise credentials_exception
    return user

def check_role(allowed_roles: list[str]):
    def role_checker(current_user: User = Depends(get_current_user)):
        if current_user.role.name not in allowed_roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You do not have permission to perform this action"
            )
        return current_user
    return role_checker

get_l1_admin = check_role(["L1_ADMIN"])
get_l2_admin = check_role(["L2_ADMIN"])
get_any_user = check_role(["L1_ADMIN", "L2_ADMIN", "USER"])
