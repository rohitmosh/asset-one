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
        # L1_ADMIN: Full read, no write.
        # L2_ADMIN: Full read, write (custodian).
        # USER: Assigned read.
        role_l1 = models.Role(name="L1_ADMIN", permissions="full_read,admin_settings")
        role_l2 = models.Role(name="L2_ADMIN", permissions="full_read,full_write,full_delete,admin_settings")
        role_user = models.Role(name="USER", permissions="assigned_read")
        
        db.add_all([role_l1, role_l2, role_user])
        db.commit()

        # 4. Create Users
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

        # 6. Create Asset Types (Hardware, Software)
        type_hw = models.AssetType(name="Hardware")
        type_sw = models.AssetType(name="Software")
        db.add_all([type_hw, type_sw])
        db.commit()

        # 7. Create Asset Groups and Assets from hierarchy
        hierarchy = {
            "IT Systems": {
                "Hardware": {
                    "Server Systems": [
                        "Blade Server",
                        "Rack Server"
                    ],
                    "Network Appliances": [
                        "Gateway",
                        "Router/L3 Switch",
                        "L2 Switch",
                        "Firewall",
                        "MPLS",
                        "OPGW",
                        "ILL",
                        "Modem",
                        "Media Converter"
                    ],
                    "Security Appliances": [
                        "Firewall",
                        "Smart Cards"
                    ],
                    "Storage Appliances": [
                        "Network Access Storage"
                    ],
                    "Workstations": [
                        "Engineering Station",
                        "Operating Station",
                        "Desktop PC"
                    ],
                    "Computers": [
                        "Desktop PC",
                        "Laptops"
                    ],
                    "Smart Phones": [
                        "Mobile Device"
                    ],
                    "Tablets": [
                        "Mobile Device"
                    ],
                    "Others": [
                        "Device Server",
                        "Serial Device Server",
                        "Printer",
                        "Display Unit"
                    ]
                },
                "Software": {
                    "Operating System": [
                        "Operating System Image"
                    ],
                    "Utility Software": [
                        "Antivirus",
                        "Backup Application",
                        "Configuration Details"
                    ],
                    "Server Application": [
                        "Application Software"
                    ],
                    "System/Software Developed": [
                        "Custom Applications"
                    ]
                }
            },
            "OT Systems": {
                "Hardware": {
                    "Control Systems": [
                        "SCADA Servers",
                        "HMI",
                        "RTU",
                        "PLC",
                        "Servers",
                        "Operator Workstations",
                        "Engineering Workstations"
                    ],
                    "Communication Infrastructure": [
                        "Communication Networks",
                        "Routers",
                        "Network Switches",
                        "Communication Protocols",
                        "Firewalls",
                        "Media Converter",
                        "PLCC"
                    ],
                    "Power Generation Equipment": [
                        "Turbines",
                        "Generators",
                        "Pumps",
                        "Transformers"
                    ],
                    "Physical Security Systems": [
                        "Perimeter Security Systems",
                        "Access Control Systems",
                        "CCTV",
                        "Intrusion Detection Systems"
                    ],
                    "Monitoring and Measurement Devices": [
                        "Sensors",
                        "Cameras",
                        "Vibration Monitoring Devices",
                        "Meters",
                        "Transmitters"
                    ],
                    "Emergency Systems": [
                        "Emergency Power Systems",
                        "Emergency Shutdown Systems",
                        "Alarm and Notification Systems",
                        "FDA",
                        "FPS",
                        "Protection System"
                    ],
                    "Environmental Monitoring Assets": [
                        "Weather Stations",
                        "Water Quality Sensors"
                    ],
                    "Electrical Distribution Assets": [
                        "Substation Equipment",
                        "Switchgear",
                        "Electrical Panels"
                    ],
                    "Data Storage and Backup Systems": [
                        "Data Storage Devices",
                        "Backup Systems"
                    ],
                    "Power House Auxiliaries": [
                        "Cooling Water System",
                        "Auxiliary Supply System",
                        "Illumination System",
                        "OPU System",
                        "Drainage and Dewatering System",
                        "Compressed Air System"
                    ],
                    "Others": [
                        "Others"
                    ]
                },
                "Software": {
                    "Applications": [
                        "Control System Software",
                        "Operating System",
                        "Application Software",
                        "Antivirus Software",
                        "Others"
                    ]
                }
            }
        }

        created_groups = {}
        assets_list = []
        domain_mapping = {
            "IT Systems": "IT",
            "OT Systems": "OT"
        }

        for domain_key, types in hierarchy.items():
            domain = domain_mapping[domain_key]
            for type_key, groups in types.items():
                type_obj = type_hw if type_key == "Hardware" else type_sw
                for group_key, asset_names in groups.items():
                    group_lookup_key = (domain, group_key)
                    if group_lookup_key not in created_groups:
                        group_obj = models.AssetGroup(domain=domain, name=group_key)
                        db.add(group_obj)
                        db.commit()
                        created_groups[group_lookup_key] = group_obj
                    else:
                        group_obj = created_groups[group_lookup_key]

                    for name in asset_names:
                        assets_list.append(models.Asset(
                            asset_group_id=group_obj.id,
                            asset_type_id=type_obj.id,
                            name=name
                        ))

        db.add_all(assets_list)
        db.commit()

        # Let's read these back to map by names for easier instance construction
        assets_map = {}
        for a in db.query(models.Asset).all():
            key = f"{a.asset_group.name}:{a.name}"
            assets_map[key] = a.id

        today = date.today()

        # Let's seed a couple of older asset instances to demonstrate linkages
        old_router = models.AssetInstance(
            asset_id=assets_map["Network Appliances:Router/L3 Switch"],
            identifier="OHPC-IT-CORP-ROUTE-00001",
            description="Retired edge router corporate office",
            manufacturer="Cisco Systems",
            model_number="Catalyst 2900",
            serial_number="CSCO-11223-Z1",
            owner_id=user_l1.id,
            custodian_id=user_l2_it.id,
            location_id=loc1.id,
            security_classification="Internal",
            business_criticality="Low",
            purchase_date=today - timedelta(days=1500),
            installation_date=today - timedelta(days=1490),
            warranty_end_date=today - timedelta(days=500),
            status="Retired"
        )
        db.add(old_router)
        db.commit()

        old_plc = models.AssetInstance(
            asset_id=assets_map["Control Systems:PLC"],
            identifier="RENG-OT-POWE-PLCXX-00001",
            description="Decommissioned Unit 1 PLC",
            manufacturer="Siemens",
            model_number="S7-300",
            serial_number="SIE-PLC-10023",
            owner_id=user_l1.id,
            custodian_id=user_l2_ot.id,
            location_id=loc4.id,
            security_classification="Restricted",
            business_criticality="Medium",
            purchase_date=today - timedelta(days=2000),
            installation_date=today - timedelta(days=1990),
            warranty_end_date=today - timedelta(days=1000),
            status="Retired"
        )
        db.add(old_plc)
        db.commit()

        # 9. Create Main Asset Instances
        # Mock Asset 1: Active Router expiring in 28 days
        ast1 = models.AssetInstance(
            asset_id=assets_map["Network Appliances:Router/L3 Switch"],
            identifier="OHPC-IT-CORP-ROUTE-00002",
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
            warranty_end_date=today + timedelta(days=28),  # Expiring in 28 days
            end_of_life_date=today + timedelta(days=1000),
            end_of_support_date=today + timedelta(days=1200),
            backup_available=True,
            backup_location="TFTP Server HQ-Backup-01",
            backup_owner_id=user_l2_it.id,
            status="Active",
            prev_asset_instance_id=old_router.id
        )

        # Mock Asset 2: Laptop expiring in 34 days
        ast2 = models.AssetInstance(
            asset_id=assets_map["Computers:Laptops"],
            identifier="OHPC-IT-CORP-LAPTO-00001",
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
            warranty_end_date=today + timedelta(days=34),  # Expiring in 34 days
            end_of_life_date=today + timedelta(days=1400),
            backup_available=False,
            status="Active"
        )

        # Mock Asset 3: PLC (OT Device) in hydro unit (Healthy warranty)
        ast3 = models.AssetInstance(
            asset_id=assets_map["Control Systems:PLC"],
            identifier="RENG-OT-POWE-PLCXX-00002",
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
            status="Active",
            prev_asset_instance_id=old_plc.id
        )

        # Mock Asset 4: Server with expired Support
        ast4 = models.AssetInstance(
            asset_id=assets_map["Data Storage and Backup Systems:Data Storage Devices"],
            identifier="OHPC-OT-CORP-DATAS-00001",
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
            warranty_end_date=today - timedelta(days=45),  # Expired
            end_of_life_date=today - timedelta(days=10),
            end_of_support_date=today - timedelta(days=10),
            backup_available=True,
            backup_location="Offsite Tape Vault",
            backup_owner_id=user_l1.id,
            status="Active"
        )

        # Mock Asset 5: Software Application (MS Office License)
        ast5 = models.AssetInstance(
            asset_id=assets_map["Server Application:Application Software"],
            identifier="OHPC-IT-CORP-APPLI-00001",
            description="Corporate Office license bundle",
            manufacturer="Microsoft",
            model_number="Office 2019 LTSC",
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
            asset_id=assets_map["Utility Software:Antivirus"],
            identifier="OHPC-IT-CORP-ANTIV-00001",
            description="Endpoint Antivirus Agents",
            manufacturer="QuickHeal Enterprise",
            model_number="v18.0",
            serial_number="QH-AV-MOCK-LIC",
            owner_id=user_l1.id,
            custodian_id=user_l2_it.id,
            assigned_user_id=None,
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
        log_action(db, old_router.id, "CREATE", user_l1, {"identifier": [None, old_router.identifier], "status": [None, old_router.status]})
        log_action(db, old_plc.id, "CREATE", user_l1, {"identifier": [None, old_plc.identifier], "status": [None, old_plc.status]})
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
