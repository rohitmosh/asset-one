import os
from pydantic import BaseModel

class Settings(BaseModel):
    PROJECT_NAME: str = "OHPC Enterprise Asset Management System (EAMS)"
    VERSION: str = "1.0.0"
    
    # Database configuration
    DATABASE_URL: str = os.getenv(
        "DATABASE_URL", 
        "postgresql+psycopg://postgres:root@localhost:5432/postgres"
    )
    
    # Cryptographic keys
    JWT_SECRET: str = os.getenv(
        "JWT_SECRET", 
        "ohpc-eams-super-secret-key-2026-xyz-emerald"
    )
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 720  # 12 hours
    
    SNAPSHOT_SECRET: str = os.getenv(
        "SNAPSHOT_SECRET",
        os.getenv("JWT_SECRET", "ohpc-eams-super-secret-key-2026-xyz-emerald")
    )
    
    # Public URLs for CORS and callback checks
    FRONTEND_URL: str = os.getenv("FRONTEND_URL", "https://localhost")
    BACKEND_URL: str = os.getenv("BACKEND_URL", "https://localhost/api")

settings = Settings()
