import os
import hashlib
import random
from datetime import datetime, timedelta
from typing import Optional
from jose import jwt, JWTError
from src.config.config import settings
from src.models.models import User, Role
from src.repositories.user_repository import UserRepository

class AuthService:
    def __init__(self, user_repo: UserRepository):
        self.user_repo = user_repo

    def get_password_hash(self, password: str) -> str:
        salt = os.urandom(16)
        key = hashlib.pbkdf2_hmac('sha256', password.encode('utf-8'), salt, 100000)
        return f"{salt.hex()}:{key.hex()}"

    def verify_password(self, plain_password: str, hashed_password: str) -> bool:
        try:
            salt_hex, key_hex = hashed_password.split(":")
            salt = bytes.fromhex(salt_hex)
            key = bytes.fromhex(key_hex)
            new_key = hashlib.pbkdf2_hmac('sha256', plain_password.encode('utf-8'), salt, 100000)
            return new_key == key
        except Exception:
            return False

    def create_access_token(self, data: dict, expires_delta: Optional[timedelta] = None) -> str:
        to_encode = data.copy()
        if expires_delta:
            expire = datetime.utcnow() + expires_delta
        else:
            expire = datetime.utcnow() + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
        
        to_encode.update({
            "exp": expire,
            "iat": datetime.utcnow()
        })
        return jwt.encode(to_encode, settings.JWT_SECRET, algorithm=settings.JWT_ALGORITHM)

    def decode_token(self, token: str) -> Optional[str]:
        try:
            payload = jwt.decode(token, settings.JWT_SECRET, algorithms=[settings.JWT_ALGORITHM])
            return payload.get("sub")
        except JWTError:
            return None

    def authenticate_user(self, username: str, password: str) -> Optional[User]:
        user = self.user_repo.get_by_username(username)
        if not user:
            return None
        if not self.verify_password(password, user.password_hash):
            return None
        return user

    def resolve_or_create_user(
        self, 
        user_id: Optional[int], 
        name_str: Optional[str], 
        default_role_name: str, 
        department: str = "Operations"
    ) -> User:
        if user_id:
            user = self.user_repo.get_by_id(user_id)
            if user:
                return user
            raise ValueError(f"User with ID {user_id} not found.")
        
        if not name_str or not name_str.strip():
            raise ValueError("User ID or User Name must be provided.")
            
        name = name_str.strip()
        
        # Check if a user with this name already exists
        user = self.user_repo.get_by_name(name)
        if user:
            return user
            
        # Create a new user since it does not exist
        role = self.user_repo.get_role_by_name(default_role_name)
        if not role:
            raise ValueError(f"Role {default_role_name} not found in database.")
            
        # Generate unique username
        base_username = "".join([c.lower() for c in name if c.isalnum() or c == " "]).replace(" ", ".")
        if not base_username:
            base_username = "user"
        username = base_username
        counter = 1
        while self.user_repo.get_by_username(username):
            username = f"{base_username}.{counter}"
            counter += 1
            
        # Generate unique email
        email = f"{username}@ohpc.in"
        counter = 1
        while self.user_repo.get_by_email(email):
            email = f"{base_username}.{counter}@ohpc.in"
            counter += 1
            
        # Generate unique employee_id
        emp_num = random.randint(1000, 9999)
        employee_id = f"EMP{emp_num}"
        while self.user_repo.get_by_employee_id(employee_id):
            emp_num = random.randint(1000, 9999)
            employee_id = f"EMP{emp_num}"
            
        new_user = User(
            username=username,
            password_hash=self.get_password_hash("password123"),
            name=name,
            email=email,
            role_id=role.id,
            department=department,
            employee_id=employee_id
        )
        return self.user_repo.create(new_user)
