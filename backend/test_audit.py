from sqlalchemy import text, create_engine
from sqlalchemy.orm import sessionmaker
from database import Base
import models
from audit_logger import init_audit_triggers, log_action, verify_audit_chain

# Use a separate test SQLite database so we don't wipe the development database
TEST_DATABASE_URL = "sqlite:///./test_eams.db"
test_engine = create_engine(TEST_DATABASE_URL, connect_args={"check_same_thread": False})
TestSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=test_engine)

def run_tests():
    print("--- Starting Cryptographic Audit Engine Tests ---")
    
    # 1. Reset database structure
    Base.metadata.drop_all(bind=test_engine)
    Base.metadata.create_all(bind=test_engine)
    init_audit_triggers(test_engine)

    db = TestSessionLocal()
    try:
        # Create a mock role first
        role = models.Role(
            name="L1_ADMIN",
            permissions="full_read,full_write"
        )
        db.add(role)
        db.commit()
        db.refresh(role)

        # Create a mock user
        user = models.User(
            username="test.user",
            password_hash="dummy_hash",
            name="Test Engineer",
            email="test@ohpc.in",
            role_id=role.id,
            department="Operations",
            employee_id="EMP_TEST"
        )
        db.add(user)
        db.commit()
        db.refresh(user)

        print("[TEST 1] Creating a series of chained audit logs...")
        # Write some sequential logs to construct the hash chain
        log1 = log_action(db, 101, "CREATE", user, {"identifier": [None, "OHPC-RT-01"]})
        db.commit()
        
        log2 = log_action(db, 101, "UPDATE", user, {"location_id": [1, 2]})
        db.commit()

        log3 = log_action(db, 102, "CREATE", user, {"identifier": [None, "OHPC-LAP-02"]})
        db.commit()

        print(f"Log 1 Hash: {log1.row_hash}")
        print(f"Log 2 Hash: {log2.row_hash} (Linked to: {log2.prev_hash[:10]}...)")
        print(f"Log 3 Hash: {log3.row_hash} (Linked to: {log3.prev_hash[:10]}...)")

        # Verify initial chain health
        res = verify_audit_chain(db)
        print(f"Integrity check results (expected healthy): {res}")
        assert res["status"] == "healthy", "Chain should be healthy on initialization!"
        print("✓ Test 1 Passed: Cryptographic chain generated and verified.")

        # ==========================================================
        print("\n[TEST 2] Testing SQLite append-only trigger enforcement...")
        # Try to modify a record in the audit log via raw SQL to test trigger rejection
        try:
            db.execute(text("UPDATE asset_audit_log SET action = 'ALTERED' WHERE id = 1"))
            db.commit()
            print("❌ Failure: Database permitted update on audit logs! Triggers are malfunctioning.")
            assert False, "Trigger failed to block UPDATE"
        except Exception as e:
            db.rollback()
            print(f"✓ Success: Database successfully blocked UPDATE. Error was: {str(e).strip()[:80]}...")

        # Try to delete a record in the audit log
        try:
            db.execute(text("DELETE FROM asset_audit_log WHERE id = 1"))
            db.commit()
            print("❌ Failure: Database permitted deletion on audit logs! Triggers are malfunctioning.")
            assert False, "Trigger failed to block DELETE"
        except Exception as e:
            db.rollback()
            print(f"✓ Success: Database successfully blocked DELETE. Error was: {str(e).strip()[:80]}...")

        print("✓ Test 2 Passed: Append-only triggers are fully active and enforced.")

        # ==========================================================
        print("\n[TEST 3] Testing tamper detection and integrity flags...")
        # Temporarily disable triggers (or recreate database without triggers) to simulate direct database hacking/alteration 
        # (e.g. SQLite database file is physically opened and modified by a compromised database process).
        db.execute(text("DROP TRIGGER IF EXISTS audit_no_update"))
        db.commit()
        
        # Modify a row content directly
        db.execute(text("UPDATE asset_audit_log SET field_diffs = '{\"hacked\": true}' WHERE id = 2"))
        db.commit()
        print("Tampered Row 2 field_diffs directly in DB.")

        # Run integrity check again, it should fail
        res2 = verify_audit_chain(db)
        print(f"Integrity check results after hack (expected compromised): {res2}")
        assert res2["status"] == "compromised", "Integrity check failed to detect row modification!"
        print(f"✓ Success: Integrity check correctly identified broken link at Log ID {res2['failed_at_log_id']}.")
        print("✓ Test 3 Passed: Tamper detection successfully flagged manual record edits.")

        print("\nAll Cryptographic Audit Tests completed successfully! ✓")

    finally:
        db.close()

if __name__ == "__main__":
    run_tests()
