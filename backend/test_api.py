import unittest
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from src.database.connection import Base
from src.models import models
from src.repositories.user_repository import UserRepository
from src.repositories.asset_repository import AssetRepository
from src.repositories.location_repository import LocationRepository
from src.repositories.audit_repository import AuditRepository
from src.repositories.snapshot_repository import SnapshotRepository

from src.services.auth_service import AuthService
from src.services.asset_service import AssetService
from src.services.location_service import LocationService
from src.services.taxonomy_service import TaxonomyService
from src.services.snapshot_service import SnapshotService
from src.services.audit_service import AuditService

TEST_DATABASE_URL = "sqlite:///./test_api_eams.db"
test_engine = create_engine(TEST_DATABASE_URL, connect_args={"check_same_thread": False})
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=test_engine)

class TestEamsServices(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        Base.metadata.drop_all(bind=test_engine)
        Base.metadata.create_all(bind=test_engine)
        
        cls.db = TestingSessionLocal()
        
        # Seed Roles
        cls.role_l1 = models.Role(name="L1_ADMIN", permissions="full")
        cls.role_l2 = models.Role(name="L2_ADMIN", permissions="custodian")
        cls.role_user = models.Role(name="USER", permissions="read")
        cls.db.add_all([cls.role_l1, cls.role_l2, cls.role_user])
        cls.db.commit()

        # Instantiate repositories
        cls.user_repo = UserRepository(cls.db)
        cls.asset_repo = AssetRepository(cls.db)
        cls.location_repo = LocationRepository(cls.db)
        cls.audit_repo = AuditRepository(cls.db)
        cls.snapshot_repo = SnapshotRepository(cls.db)

        # Instantiate services
        cls.auth_service = AuthService(cls.user_repo)
        cls.location_service = LocationService(cls.location_repo)
        cls.taxonomy_service = TaxonomyService(cls.asset_repo)
        cls.audit_service = AuditService(cls.audit_repo)
        cls.asset_service = AssetService(cls.asset_repo, cls.location_service, cls.auth_service, cls.audit_service)
        cls.snapshot_service = SnapshotService(cls.snapshot_repo, cls.asset_repo, cls.auth_service, cls.audit_service)

    def test_01_user_registration_and_auth(self):
        user = models.User(
            username="admin.user",
            password_hash=self.auth_service.get_password_hash("securepassword123"),
            name="Admin Tester",
            email="tester@ohpc.in",
            role_id=self.role_l1.id,
            department="IT Infrastructure",
            employee_id="EMP_ADMIN_TEST"
        )
        created_user = self.user_repo.create(user)
        self.assertEqual(created_user.username, "admin.user")
        
        verified_user = self.auth_service.authenticate_user("admin.user", "securepassword123")
        self.assertIsNotNone(verified_user)
        self.assertEqual(verified_user.id, created_user.id)
        
        invalid_user = self.auth_service.authenticate_user("admin.user", "wrongpassword")
        self.assertIsNone(invalid_user)

    def test_02_create_location(self):
        loc = self.location_service.create(
            plant_office="OHPC Head Office",
            building="Block B",
            floor="2nd Floor",
            room="Server Room 204",
            rack="Rack 5"
        )
        self.assertEqual(loc.plant_office, "OHPC Head Office")
        self.assertEqual(loc.building, "Block B")
        self.assertEqual(loc.rack, "Rack 5")

    @classmethod
    def tearDownClass(cls):
        cls.db.close()
        Base.metadata.drop_all(bind=test_engine)
