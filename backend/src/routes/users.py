from fastapi import APIRouter, Depends, HTTPException, status
from typing import List
from sqlalchemy.orm import Session
from src.schemas import schemas
from src.repositories.user_repository import UserRepository
from src.services.auth_service import AuthService
from src.routes.dependencies import get_user_repo, get_auth_service, get_any_user, check_role
from src.models import models
from src.database.connection import get_db

router = APIRouter(prefix="/users", tags=["Users"])

@router.get("", response_model=List[schemas.UserResponse])
def get_users(
    user_repo: UserRepository = Depends(get_user_repo),
    current_user: models.User = Depends(get_any_user)
):
    return user_repo.get_all()

@router.post("", response_model=schemas.UserResponse)
def create_user(
    user_data: schemas.UserCreate,
    user_repo: UserRepository = Depends(get_user_repo),
    auth_service: AuthService = Depends(get_auth_service),
    admin: models.User = Depends(check_role(["L1_ADMIN", "L2_ADMIN"]))
):
    if user_repo.get_by_username(user_data.username):
        raise HTTPException(status_code=400, detail="Username already exists")
    if user_repo.get_by_email(user_data.email):
        raise HTTPException(status_code=400, detail="Email already registered")
    if user_repo.get_by_employee_id(user_data.employee_id):
        raise HTTPException(status_code=400, detail="Employee ID already exists")

    new_user = models.User(
        username=user_data.username,
        password_hash=auth_service.get_password_hash(user_data.password),
        name=user_data.name,
        email=user_data.email,
        role_id=user_data.role_id,
        department=user_data.department,
        employee_id=user_data.employee_id
    )
    return user_repo.create(new_user)

@router.delete("/{user_id}")
def delete_user(
    user_id: int,
    db: Session = Depends(get_db),
    user_repo: UserRepository = Depends(get_user_repo),
    admin: models.User = Depends(check_role(["L1_ADMIN", "L2_ADMIN"]))
):
    user = user_repo.get_by_id(user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    if user.id == admin.id:
        raise HTTPException(status_code=400, detail="Admins cannot delete their own accounts")
        
    linked_owned = db.query(models.AssetInstance).filter(models.AssetInstance.owner_id == user_id).count()
    linked_custodian = db.query(models.AssetInstance).filter(models.AssetInstance.custodian_id == user_id).count()
    if linked_owned > 0 or linked_custodian > 0:
        raise HTTPException(
            status_code=400,
            detail="Cannot delete user. This user is currently the owner or custodian of active assets. Please reassign the assets first."
        )
        
    db.query(models.AssetInstance).filter(models.AssetInstance.assigned_user_id == user_id).update({models.AssetInstance.assigned_user_id: None})
    db.query(models.AssetInstance).filter(models.AssetInstance.backup_owner_id == user_id).update({models.AssetInstance.backup_owner_id: None})
    
    user_repo.delete(user)
    db.commit()
    return {"detail": "User deleted successfully"}
