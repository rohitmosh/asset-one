from src.database.connection import engine, SessionLocal, Base, get_db
from src.config.config import settings

DATABASE_URL = settings.DATABASE_URL
