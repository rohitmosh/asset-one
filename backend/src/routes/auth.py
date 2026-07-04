from fastapi import APIRouter, Depends, HTTPException, status
from src.schemas import schemas
from src.services.auth_service import AuthService
from src.routes.dependencies import get_auth_service, get_current_user
from src.models import models

router = APIRouter(prefix="/auth", tags=["Authentication"])

@router.post("/login", response_model=schemas.Token)
def login(login_data: schemas.UserLogin, auth_service: AuthService = Depends(get_auth_service)):
    user = auth_service.authenticate_user(login_data.username, login_data.password)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    access_token = auth_service.create_access_token(data={"sub": user.username})
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "username": user.username,
        "role": user.role.name,
        "name": user.name
    }

@router.get("/verify", response_model=schemas.UserResponse)
def verify_token(current_user: models.User = Depends(get_current_user)):
    return current_user
