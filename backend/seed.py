from datetime import date, datetime, timedelta
from database import engine, SessionLocal, Base
import models
from auth import get_password_hash
from audit_logger import init_audit_triggers, log_action

def seed_db():
    # 1. Reset tables
    Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)

    # 2. Initialize the append-only audit triggers
    init_audit_triggers(engine)

    db = SessionLocal()
    try:
        # 3. Create Roles
        role_l1 = models.Role(name="L1_ADMIN", permissions="full_read,full_write,full_delete,admin_settings")
        role_l2 = models.Role(name="L2_ADMIN", permissions="assigned_read,assigned_write")
        role_user = models.Role(name="USER", permissions="assigned_read")
        
        db.add_all([role_l1, role_l2, role_user])
        db.commit()

        # 4. Create Users
        # Password for all users will be 'password123'
        pwd_hash = get_password_hash("password123")
        
        user_l1 = models.User(
            username="admin.hq",
            password_hash=pwd_hash,
            name="Rajan Patel",
            email="r.patel@ohpc.in",
            role_id=role_l1.id,
            department="Information Technology",
            employee_id="EMP001"
        )
        
        user_l2_it = models.User(
            username="custodian.it",
            password_hash=pwd_hash,
            name="Aravind Sharma",
            email="a.sharma@ohpc.in",
            role_id=role_l2.id,
            department="IT Infrastructure",
            employee_id="EMP042"
        )

        user_l2_ot = models.User(
            username="custodian.ot",
            password_hash=pwd_hash,
            name="Satish Mohanty",
            email="s.mohanty@ohpc.in",
            role_id=role_l2.id,
            department="OT/SCADA Systems",
            employee_id="EMP085"
        )

        user_end = models.User(
            username="rahul.ops",
            password_hash=pwd_hash,
            name="Rahul Sharma",
            email="rahul.sharma@ohpc.in",
            role_id=role_user.id,
            department="Operations",
            employee_id="EMP108"
        )

        db.add_all([user_l1, user_l2_it, user_l2_ot, user_end])
        db.commit()

        # 5. Create Locations
        loc1 = models.Location(plant_office="OHPC Corporate Office", building="Corporate HQ", floor="2", room="IT Server Room", rack="Rack B1")
        loc2 = models.Location(plant_office="OHPC Corporate Office", building="Corporate HQ", floor="2", room="Operations Dept", rack="N/A")
        loc3 = models.Location(plant_office="OHPC Corporate Office", building="Corporate HQ", floor="3", room="Executive Floor", rack="N/A")
        loc4 = models.Location(plant_office="Rengali Hydro Project", building="Power House Unit 1", floor="Ground Floor", room="Control Room", rack="Control Panel 2")
        loc5 = models.Location(plant_office="Rengali Hydro Project", building="Power House Unit 1", floor="Ground Floor", room="Turbine Hall", rack="N/A")

        db.add_all([loc1, loc2, loc3, loc4, loc5])
        db.commit()

        # 6. Create Asset Types (Level 1 Hierarchy)
        type_hw = models.AssetType(name="Hardware")
        type_sw = models.AssetType(name="Software")
        db.add_all([type_hw, type_sw])
        db.commit()

        # 7. Create Asset Groups (Level 2 Hierarchy)
        groups = {
            # Hardware groups
            "control": models.AssetGroup(asset_type_id=type_hw.id, name="Control Systems"),
            "comm": models.AssetGroup(asset_type_id=type_hw.id, name="Communication Infrastructure"),
            "power": models.AssetGroup(asset_type_id=type_hw.id, name="Power Generation Equipment"),
            "security": models.AssetGroup(asset_type_id=type_hw.id, name="Physical Security Systems"),
            "monitoring": models.AssetGroup(asset_type_id=type_hw.id, name="Monitoring and Measurement Devices"),
            "emergency": models.AssetGroup(asset_type_id=type_hw.id, name="Emergency Systems"),
            "environmental": models.AssetGroup(asset_type_id=type_hw.id, name="Environmental Monitoring Assets"),
            "electrical": models.AssetGroup(asset_type_id=type_hw.id, name="Electrical Distribution Assets"),
            "storage": models.AssetGroup(asset_type_id=type_hw.id, name="Data Storage and Backup Systems"),
            "house": models.AssetGroup(asset_type_id=type_hw.id, name="Power House Auxiliaries"),
            "computers": models.AssetGroup(asset_type_id=type_hw.id, name="Computers"),
            "servers": models.AssetGroup(asset_type_id=type_hw.id, name="Server Systems"),
            "network": models.AssetGroup(asset_type_id=type_hw.id, name="Network Appliances"),
            
            # Software groups
            "os": models.AssetGroup(asset_type_id=type_sw.id, name="Operating Systems"),
            "utility": models.AssetGroup(asset_type_id=type_sw.id, name="Utility Software"),
            "apps": models.AssetGroup(asset_type_id=type_sw.id, name="Application Software"),
            "server_apps": models.AssetGroup(asset_type_id=type_sw.id, name="Server Application")
        }
        db.add_all(groups.values())
        db.commit()

        # 8. Create Assets (Level 3 Hierarchy)
        assets = [
            # Control Systems
            models.Asset(asset_group_id=groups["control"].id, name="Programmable Logic Controllers (PLCs)"),
            models.Asset(asset_group_id=groups["control"].id, name="Unit Control Board (UCB)"),
            models.Asset(asset_group_id=groups["control"].id, name="Remote Terminal Units (RTUs)"),
            models.Asset(asset_group_id=groups["control"].id, name="HMI Equipment"),
            
            # Communication Infrastructure / Network
            models.Asset(asset_group_id=groups["comm"].id, name="Routers"),
            models.Asset(asset_group_id=groups["comm"].id, name="Network Switch"),
            models.Asset(asset_group_id=groups["comm"].id, name="Firewalls"),
            models.Asset(asset_group_id=groups["comm"].id, name="Media Converter"),
            
            # Power Generation
            models.Asset(asset_group_id=groups["power"].id, name="Turbines"),
            models.Asset(asset_group_id=groups["power"].id, name="Generators"),
            models.Asset(asset_group_id=groups["power"].id, name="Transformers"),
            
            # Computers
            models.Asset(asset_group_id=groups["computers"].id, name="Laptops"),
            models.Asset(asset_group_id=groups["computers"].id, name="Desktop PC"),
            
            # Servers
            models.Asset(asset_group_id=groups["servers"].id, name="Blade Server"),
            models.Asset(asset_group_id=groups["servers"].id, name="Rack Server"),
            
            # Security Systems
            models.Asset(asset_group_id=groups["security"].id, name="CCTV (Closed-Circuit Television) cameras"),
            models.Asset(asset_group_id=groups["security"].id, name="Access control systems"),
            
            # Monitoring Devices
            models.Asset(asset_group_id=groups["monitoring"].id, name="Sensors (flow, pressure, temperature)"),
            
            # Software categories
            models.Asset(asset_group_id=groups["os"].id, name="Operating System"),
            models.Asset(asset_group_id=groups["os"].id, name="Operating System Image"),
            models.Asset(asset_group_id=groups["utility"].id, name="Antivirus"),
            models.Asset(asset_group_id=groups["apps"].id, name="MS Office"),
            models.Asset(asset_group_id=groups["server_apps"].id, name="Backup Application")
        ]
        db.add_all(assets)
        db.commit()

        # Let's read these back to map by names for easier instance construction
        assets_map = {a.name: a.id for a in db.query(models.Asset).all()}

        # 9. Create Asset Instances (Level 4 Hierarchy / Actual Assets)
        # We will create specific mock assets mapping exactly to EAMS Dashboard requirements:
        # - High Criticality assets
        # - Impending warranty expiries (within 30 days, within 60 days, expired)
        # - Missing Owner / Custodian fields for verification warning alerts
        
        today = date.today()

        # Mock Asset 1: Active Router expiring in 28 days
        ast1 = models.AssetInstance(
            asset_id=assets_map["Routers"],
            identifier="OHPC-IT-ROUTER-0001",
            description="Main corporate backbone router",
            manufacturer="Cisco Systems",
            model_number="Catalyst 8300",
            serial_number="CSCO-99824-A3",
            owner_id=user_l1.id,
            custodian_id=user_l2_it.id,
            assigned_user_id=user_end.id,
            location_id=loc1.id,
            security_classification="Restricted",
            business_criticality="High",
            purchase_date=today - timedelta(days=700),
            installation_date=today - timedelta(days=695),
            warranty_start_date=today - timedelta(days=695),
            warranty_end_date=today + timedelta(days=28),  # Expiring in 28 days (Warning orange)
            end_of_life_date=today + timedelta(days=1000),
            end_of_support_date=today + timedelta(days=1200),
            backup_available=True,
            backup_location="TFTP Server HQ-Backup-01",
            backup_owner_id=user_l2_it.id,
            status="Active"
        )

        # Mock Asset 2: Laptop expiring in 34 days
        ast2 = models.AssetInstance(
            asset_id=assets_map["Laptops"],
            identifier="OHPC-IT-LAPTOP-0042",
            description="Standard Developer Laptop",
            manufacturer="Dell Inc.",
            model_number="Latitude 5430",
            serial_number="DELL-LAT-87352",
            owner_id=user_l1.id,
            custodian_id=user_l2_it.id,
            assigned_user_id=user_end.id,
            location_id=loc2.id,
            security_classification="Internal",
            business_criticality="Medium",
            purchase_date=today - timedelta(days=365),
            installation_date=today - timedelta(days=360),
            warranty_start_date=today - timedelta(days=360),
            warranty_end_date=today + timedelta(days=34),  # Expiring in 34 days (Warning yellow)
            end_of_life_date=today + timedelta(days=1400),
            backup_available=False,
            status="Active"
        )

        # Mock Asset 3: PLC (OT Device) in hydro unit (Healthy warranty)
        ast3 = models.AssetInstance(
            asset_id=assets_map["Programmable Logic Controllers (PLCs)"],
            identifier="OHPC-OT-PLC-0003",
            description="Control Unit 3 Main PLC",
            manufacturer="Siemens",
            model_number="S7-1500",
            serial_number="SIE-PLC-302482",
            owner_id=user_l1.id,
            custodian_id=user_l2_ot.id,
            assigned_user_id=None,
            location_id=loc4.id,
            security_classification="Restricted",
            business_criticality="High",
            purchase_date=today - timedelta(days=180),
            installation_date=today - timedelta(days=175),
            warranty_start_date=today - timedelta(days=175),
            warranty_end_date=today + timedelta(days=545),  # Healthy
            end_of_life_date=today + timedelta(days=2000),
            end_of_support_date=today + timedelta(days=2200),
            backup_available=True,
            backup_location="Master SCADA Storage Room 3",
            backup_owner_id=user_l2_ot.id,
            status="Active"
        )

        # Mock Asset 4: Server with expired Support
        ast4 = models.AssetInstance(
            asset_id=assets_map["Blade Server"],
            identifier="OHPC-IT-SERVER-0085",
            description="Host hypervisor for legacy apps",
            manufacturer="HP Enterprise",
            model_number="ProLiant BL460c Gen10",
            serial_number="HPE-BL-992147",
            owner_id=user_l1.id,
            custodian_id=user_l2_it.id,
            assigned_user_id=None,
            location_id=loc1.id,
            security_classification="Confidential",
            business_criticality="High",
            purchase_date=today - timedelta(days=1500),
            installation_date=today - timedelta(days=1490),
            warranty_start_date=today - timedelta(days=1490),
            warranty_end_date=today - timedelta(days=45),  # Already Expired (Red status)
            end_of_life_date=today - timedelta(days=10),   # EOL passed
            end_of_support_date=today - timedelta(days=10),
            backup_available=True,
            backup_location="Offsite Tape Vault",
            backup_owner_id=user_l1.id,
            status="Active"
        )

        # Mock Asset 5: Software Application (Windows 11 License)
        ast5 = models.AssetInstance(
            asset_id=assets_map["MS Office"],
            identifier="OHPC-SW-OFFICE-0120",
            description="Corporate Office license bundle",
            manufacturer="Microsoft",
            model_number="Office 2021 LTSC",
            serial_number="MS-O365-LIC-5542",
            owner_id=user_l1.id,
            custodian_id=user_l2_it.id,
            assigned_user_id=user_end.id,
            location_id=loc2.id,
            security_classification="Public",
            business_criticality="Low",
            purchase_date=today - timedelta(days=400),
            installation_date=today - timedelta(days=400),
            warranty_start_date=today - timedelta(days=400),
            warranty_end_date=today - timedelta(days=35),  # Expired
            backup_available=False,
            status="Active"
        )

        # Mock Asset 6: Asset with missing custodian/owner details to trigger warnings
        ast6 = models.AssetInstance(
            asset_id=assets_map["Antivirus"],
            identifier="OHPC-SW-AV-9999",
            description="Endpoint Antivirus Agents",
            manufacturer="QuickHeal Enterprise",
            model_number="v18.0",
            serial_number="QH-AV-MOCK-LIC",
            owner_id=user_l1.id,
            custodian_id=user_l1.id,       # L1 Admin acting as custodian (or missing in logical sense)
            assigned_user_id=None,         # Missing assigned user
            location_id=loc1.id,
            security_classification="Internal",
            business_criticality="Medium",
            purchase_date=today - timedelta(days=100),
            warranty_start_date=today - timedelta(days=100),
            warranty_end_date=today + timedelta(days=200),
            backup_available=False,
            status="Active"
        )

        db.add_all([ast1, ast2, ast3, ast4, ast5, ast6])
        db.commit()

        # 10. Generate cryptographic audit records using audit_logger.log_action
        # Log CREATE logs for all seeded assets
        log_action(db, ast1.id, "CREATE", user_l1, {"identifier": [None, ast1.identifier], "status": [None, ast1.status]})
        log_action(db, ast2.id, "CREATE", user_l2_it, {"identifier": [None, ast2.identifier], "status": [None, ast2.status]})
        log_action(db, ast3.id, "CREATE", user_l2_ot, {"identifier": [None, ast3.identifier], "status": [None, ast3.status]})
        log_action(db, ast4.id, "CREATE", user_l1, {"identifier": [None, ast4.identifier], "status": [None, ast4.status]})
        log_action(db, ast5.id, "CREATE", user_l2_it, {"identifier": [None, ast5.identifier], "status": [None, ast5.status]})
        log_action(db, ast6.id, "CREATE", user_l1, {"identifier": [None, ast6.identifier], "status": [None, ast6.status]})
        
        db.commit()
        print("Database seeding completed successfully!")
        
    finally:
        db.close()

if __name__ == "__main__":
    seed_db()
