import os
import sys
from sqlalchemy import create_engine, text, func
from sqlalchemy.orm import sessionmaker

# Ensure backend directory is in search path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from database import Base, DATABASE_URL
import models
from audit_logger import init_audit_triggers

def migrate():
    # Detect sqlite path
    sqlite_path = "eams.db" if os.path.exists("main.py") else "backend/eams.db"
    if not os.path.exists(sqlite_path):
        print(f"Error: SQLite database file not found at: {sqlite_path}")
        sys.exit(1)

    print(f"Connecting to source SQLite database at: {sqlite_path}")
    sqlite_engine = create_engine(f"sqlite:///{sqlite_path}")
    SqliteSession = sessionmaker(bind=sqlite_engine)
    sqlite_session = SqliteSession()

    print(f"Connecting to target PostgreSQL database at: {DATABASE_URL}")
    postgres_engine = create_engine(DATABASE_URL)
    PostgresSession = sessionmaker(bind=postgres_engine)
    postgres_session = PostgresSession()

    print("Dropping existing PostgreSQL schema (clean start)...")
    # Dropping in reverse order or using CASCADE since tables have FKs
    with postgres_engine.connect() as conn:
        conn.execute(text("DROP SCHEMA public CASCADE;"))
        conn.execute(text("CREATE SCHEMA public;"))
        conn.commit()

    print("Creating tables in PostgreSQL...")
    Base.metadata.create_all(bind=postgres_engine)

    # Tables in correct dependency order
    tables = [
        (models.Role, "roles"),
        (models.Location, "locations"),
        (models.User, "users"),
        (models.AssetType, "asset_types"),
        (models.AssetGroup, "asset_groups"),
        (models.Asset, "assets"),
        (models.AssetInstance, "asset_instances"),
        (models.AuditLog, "asset_audit_log"),
        (models.AssetTransfer, "asset_transfers"),
        (models.RegistrySnapshot, "registry_snapshots"),
    ]

    print("Copying data...")
    for model_cls, table_name in tables:
        sqlite_items = sqlite_session.query(model_cls).all()
        print(f"Migrating {len(sqlite_items)} records for table '{table_name}'...")
        
        if not sqlite_items:
            continue

        if table_name == "asset_instances":
            # Pass 1: Set prev_asset_instance_id to None
            instance_links = {}
            for item in sqlite_items:
                instance_links[item.id] = item.prev_asset_instance_id
                attrs = {c.key: getattr(item, c.key) for c in model_cls.__table__.columns}
                attrs["prev_asset_instance_id"] = None
                postgres_item = model_cls(**attrs)
                postgres_session.add(postgres_item)
            postgres_session.commit()
            
            # Pass 2: Update prev_asset_instance_id
            print(f"Updating self-referential links for 'asset_instances'...")
            for inst_id, prev_id in instance_links.items():
                if prev_id is not None:
                    postgres_session.execute(
                        text("UPDATE asset_instances SET prev_asset_instance_id = :prev_id WHERE id = :inst_id"),
                        {"prev_id": prev_id, "inst_id": inst_id}
                    )
            postgres_session.commit()
        else:
            for item in sqlite_items:
                attrs = {c.key: getattr(item, c.key) for c in model_cls.__table__.columns}
                postgres_item = model_cls(**attrs)
                postgres_session.add(postgres_item)
            postgres_session.commit()

    print("Resetting auto-increment sequences in PostgreSQL...")
    for model_cls, table_name in tables:
        max_id = postgres_session.query(func.max(model_cls.id)).scalar()
        if max_id is not None:
            # Reset sequence to max_id
            postgres_session.execute(
                text(f"SELECT setval(pg_get_serial_sequence('{table_name}', 'id'), :max_id)"),
                {"max_id": max_id}
            )
    postgres_session.commit()
    print("Sequences reset successfully.")

    print("Initializing database-level triggers...")
    init_audit_triggers(postgres_engine)
    print("Triggers initialized successfully.")

    sqlite_session.close()
    postgres_session.close()
    print("\nDatabase migration completed successfully! ✓")

if __name__ == "__main__":
    migrate()
