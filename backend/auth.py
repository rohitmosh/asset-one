from src.config.config import settings
from src.services.auth_service import AuthService
from src.routes.dependencies import get_current_user, get_l1_admin, get_l2_admin

SECRET_KEY = settings.JWT_SECRET
ALGORITHM = settings.JWT_ALGORITHM
ACCESS_TOKEN_EXPIRE_MINUTES = settings.ACCESS_TOKEN_EXPIRE_MINUTES

# Proxy helper instance
_service = AuthService(None)

def verify_password(plain_password: str, hashed_password: str) -> bool:
    return _service.verify_password(plain_password, hashed_password)

def get_password_hash(password: str) -> str:
    return _service.get_password_hash(password)

def create_access_token(data: dict, expires_delta = None) -> str:
    return _service.create_access_token(data, expires_delta)

def decode_access_token(token: str) -> dict:
    from jose import jwt
    return jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
