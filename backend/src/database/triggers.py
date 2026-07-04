from sqlalchemy import text

def init_audit_triggers(engine):
    """
    Initializes database-level triggers to guarantee that the audit logs table
    is strictly append-only. Any attempt to UPDATE or DELETE a row in `asset_audit_log`
    will fail at the database engine level. Supports SQLite and PostgreSQL.
    """
    if engine.dialect.name == "sqlite":
        with engine.connect() as conn:
            # Check if triggers already exist
            conn.execute(text("""
                CREATE TRIGGER IF NOT EXISTS audit_no_update BEFORE UPDATE ON asset_audit_log
                BEGIN
                    SELECT RAISE(FAIL, 'Non-repudiation alert: UPDATES are strictly forbidden on asset_audit_log.');
                END;
            """))
            conn.execute(text("""
                CREATE TRIGGER IF NOT EXISTS audit_no_delete BEFORE DELETE ON asset_audit_log
                BEGIN
                    SELECT RAISE(FAIL, 'Non-repudiation alert: DELETIONS are strictly forbidden on asset_audit_log.');
                END;
            """))
            conn.commit()
    elif engine.dialect.name == "postgresql":
        with engine.connect() as conn:
            conn.execute(text("""
                CREATE OR REPLACE FUNCTION prevent_audit_log_modification()
                RETURNS TRIGGER AS $$
                BEGIN
                    RAISE EXCEPTION 'Non-repudiation alert: UPDATES and DELETIONS are strictly forbidden on asset_audit_log.';
                END;
                $$ LANGUAGE plpgsql;
            """))
            conn.execute(text("""
                DROP TRIGGER IF EXISTS audit_no_update ON asset_audit_log;
                CREATE TRIGGER audit_no_update
                BEFORE UPDATE ON asset_audit_log
                FOR EACH ROW
                EXECUTE FUNCTION prevent_audit_log_modification();
            """))
            conn.execute(text("""
                DROP TRIGGER IF EXISTS audit_no_delete ON asset_audit_log;
                CREATE TRIGGER audit_no_delete
                BEFORE DELETE ON asset_audit_log
                FOR EACH ROW
                EXECUTE FUNCTION prevent_audit_log_modification();
            """))
            conn.commit()
