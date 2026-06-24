import os
from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker

# Use a local SQLite file for EAMS demonstration phase
DATABASE_URL = os.getenv("DATABASE_URL", "postgresql+psycopg://postgres:root@localhost:5432/postgres")

# In SQLite, we need connect_args={"check_same_thread": False} to allow multi-threaded access.
# If we transition to PostgreSQL later, we will drop this argument.
if DATABASE_URL.startswith("sqlite"):
    engine = create_engine(
        DATABASE_URL, connect_args={"check_same_thread": False}
    )
else:
    engine = create_engine(DATABASE_URL)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
