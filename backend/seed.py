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

        # 7. Create Asset Groups (Categories) under IT and OT
        # IT Groups
        it_groups = {
            "Network Equipment": models.AssetGroup(domain="IT", name="Network Equipment"),
            "Server System": models.AssetGroup(domain="IT", name="Server System"),
            "Peripheral Devices": models.AssetGroup(domain="IT", name="Peripheral Devices"),
            "Printers": models.AssetGroup(domain="IT", name="Printers"),
            "Computers": models.AssetGroup(domain="IT", name="Computers"),
            "EPABX System": models.AssetGroup(domain="IT", name="EPABX System"),
            "CCTV": models.AssetGroup(domain="IT", name="CCTV"),
            "Power Backup System": models.AssetGroup(domain="IT", name="Power Backup System"),
            "VC System": models.AssetGroup(domain="IT", name="VC System"),
            "Internet Connection": models.AssetGroup(domain="IT", name="Internet Connection"),
            "Others": models.AssetGroup(domain="IT", name="Others"),
            "Operating System": models.AssetGroup(domain="IT", name="Operating System"),
            "MS Office": models.AssetGroup(domain="IT", name="MS Office"),
            "Application Software": models.AssetGroup(domain="IT", name="Application Software"),
            "Antivirus Software": models.AssetGroup(domain="IT", name="Antivirus Software"),
            "Web Application": models.AssetGroup(domain="IT", name="Web Application"),
        }
        
        # OT Groups
        ot_groups = {
            "Control Systems": models.AssetGroup(domain="OT", name="Control Systems"),
            "Communication Infrastructure": models.AssetGroup(domain="OT", name="Communication Infrastructure"),
            "Power Generation Equipment": models.AssetGroup(domain="OT", name="Power Generation Equipment"),
            "Physical Security Systems": models.AssetGroup(domain="OT", name="Physical Security Systems"),
            "Monitoring and Measurement Devices": models.AssetGroup(domain="OT", name="Monitoring and Measurement Devices"),
            "Emergency Systems": models.AssetGroup(domain="OT", name="Emergency Systems"),
            "Environmental Monitoring Assets": models.AssetGroup(domain="OT", name="Environmental Monitoring Assets"),
            "Electrical Distribution Assets": models.AssetGroup(domain="OT", name="Electrical Distribution Assets"),
            "Data Storage and Backup Systems": models.AssetGroup(domain="OT", name="Data Storage and Backup Systems"),
            "Power House Auxiliaries": models.AssetGroup(domain="OT", name="Power House Auxiliaries"),
            "Others": models.AssetGroup(domain="OT", name="Others"),
        }

        db.add_all(list(it_groups.values()) + list(ot_groups.values()))
        db.commit()

        # 8. Create Assets linked to Groups and Types
        assets_list = []
        
        # IT - Network Equipment (Hardware)
        for name in ["Firewall/UTM", "Router", "L3 Switch", "L2 Managed Switch", "L2 Unmanaged Switch", "Access Point", "Media Converter", "Modem"]:
            assets_list.append(models.Asset(asset_group_id=it_groups["Network Equipment"].id, asset_type_id=type_hw.id, name=name))
            
        # IT - Server System (Hardware)
        for name in ["Rack", "Workstation"]:
            assets_list.append(models.Asset(asset_group_id=it_groups["Server System"].id, asset_type_id=type_hw.id, name=name))
            
        # IT - Peripheral Devices (Hardware)
        for name in ["Keyboard", "Mouse", "Pendrive", "Hard disk", "CD Drive"]:
            assets_list.append(models.Asset(asset_group_id=it_groups["Peripheral Devices"].id, asset_type_id=type_hw.id, name=name))
            
        # IT - Printers (Hardware)
        for name in ["Network Printer", "Laser Printer", "Dot Matrix Printer", "Multi Functional printer"]:
            assets_list.append(models.Asset(asset_group_id=it_groups["Printers"].id, asset_type_id=type_hw.id, name=name))
            
        # IT - Computers (Hardware)
        for name in ["All-in-one Desktop", "Laptop", "Ipad", "CPU", "Monitor"]:
            assets_list.append(models.Asset(asset_group_id=it_groups["Computers"].id, asset_type_id=type_hw.id, name=name))
            
        # IT - EPABX System (Hardware)
        for name in ["Digital telephone", "Plan telephone", "Analog telephone", "Line card", "Trunck card", "Digital Line card", "CLI telephone", "MDF Box"]:
            assets_list.append(models.Asset(asset_group_id=it_groups["EPABX System"].id, asset_type_id=type_hw.id, name=name))
            
        # IT - CCTV (Hardware)
        for name in ["Bullet Camera", "Dome Camera", "NVR", "DVR"]:
            assets_list.append(models.Asset(asset_group_id=it_groups["CCTV"].id, asset_type_id=type_hw.id, name=name))
            
        # IT - Power Backup System (Hardware)
        for name in ["Online UPS", "Offline UPS", "Battery Bank"]:
            assets_list.append(models.Asset(asset_group_id=it_groups["Power Backup System"].id, asset_type_id=type_hw.id, name=name))
            
        # IT - VC System (Hardware)
        for name in ["VC device", "Camera", "Microphone", "Speaker", "Pointer"]:
            assets_list.append(models.Asset(asset_group_id=it_groups["VC System"].id, asset_type_id=type_hw.id, name=name))
            
        # IT - Internet Connection (Hardware)
        for name in ["ILL", "FTTH", "Broadband", "Data card"]:
            assets_list.append(models.Asset(asset_group_id=it_groups["Internet Connection"].id, asset_type_id=type_hw.id, name=name))
            
        # IT - Others (Hardware)
        for name in ["Smartphone", "Biometric system"]:
            assets_list.append(models.Asset(asset_group_id=it_groups["Others"].id, asset_type_id=type_hw.id, name=name))
            
        # IT - Operating System (Software)
        for name in ["Windows 11", "Windows 10", "Windows 8", "Windows 7"]:
            assets_list.append(models.Asset(asset_group_id=it_groups["Operating System"].id, asset_type_id=type_sw.id, name=name))
            
        # IT - MS Office (Software)
        for name in ["Office 19", "Office 16", "Office 13", "Office 10"]:
            assets_list.append(models.Asset(asset_group_id=it_groups["MS Office"].id, asset_type_id=type_sw.id, name=name))
            
        # IT - Application Software, Antivirus Software, Web Application (Software)
        assets_list.append(models.Asset(asset_group_id=it_groups["Application Software"].id, asset_type_id=type_sw.id, name="Application Software"))
        assets_list.append(models.Asset(asset_group_id=it_groups["Antivirus Software"].id, asset_type_id=type_sw.id, name="Antivirus Software"))
        assets_list.append(models.Asset(asset_group_id=it_groups["Web Application"].id, asset_type_id=type_sw.id, name="Web Application"))

        # OT - Control Systems
        # Hardware
        for name in ["Unit Control Board (UCB)", "Local Control Board (LCB)", "Programmable Logic Controllers (PLCs)", "HMI Equipment", "Operator Workstations", "Engineering Workstations", "Link Station", "Storian Station", "Display Monitor/LVS", "Desktop/PC", "Laptop", "GPS Clock System", "UPS for SCADA", "RTU", "Controller", "Others"]:
            assets_list.append(models.Asset(asset_group_id=ot_groups["Control Systems"].id, asset_type_id=type_hw.id, name=name))
        # Software
        assets_list.append(models.Asset(asset_group_id=ot_groups["Control Systems"].id, asset_type_id=type_sw.id, name="Control System Software"))

        # OT - Communication Infrastructure
        # Hardware
        for name in ["Communication networks (Ethernet, serial Communication,Fibre,Radio,Satellite)", "Routers", "Network Switch", "Firewalls", "Media Converter", "PLCC"]:
            assets_list.append(models.Asset(asset_group_id=ot_groups["Communication Infrastructure"].id, asset_type_id=type_hw.id, name=name))
        # Software
        for name in ["Operating System", "Application Software", "Antivirus Software", "Others"]:
            assets_list.append(models.Asset(asset_group_id=ot_groups["Communication Infrastructure"].id, asset_type_id=type_sw.id, name=name))

        # OT - Power Generation Equipment
        # Hardware
        for name in ["Turbines", "Generators", "Pumps", "Transformers", "Others"]:
            assets_list.append(models.Asset(asset_group_id=ot_groups["Power Generation Equipment"].id, asset_type_id=type_hw.id, name=name))
        # Software
        assets_list.append(models.Asset(asset_group_id=ot_groups["Power Generation Equipment"].id, asset_type_id=type_sw.id, name="Others"))

        # OT - Physical Security Systems
        # Hardware
        for name in ["Perimeter security systems", "Access control systems", "CCTV (Closed-Circuit Television) cameras", "Intrusion detection systems", "Others"]:
            assets_list.append(models.Asset(asset_group_id=ot_groups["Physical Security Systems"].id, asset_type_id=type_hw.id, name=name))
        # Software
        assets_list.append(models.Asset(asset_group_id=ot_groups["Physical Security Systems"].id, asset_type_id=type_sw.id, name="Others"))

        # OT - Monitoring and Measurement Devices
        # Hardware
        for name in ["Sensors (flow, pressure, temperature, level)", "Vibration monitoring devices", "Meters (power meters, energy meters)", "Transmitters", "PD (Partial Discharge) Monitoring"]:
            assets_list.append(models.Asset(asset_group_id=ot_groups["Monitoring and Measurement Devices"].id, asset_type_id=type_hw.id, name=name))
        # Software
        assets_list.append(models.Asset(asset_group_id=ot_groups["Monitoring and Measurement Devices"].id, asset_type_id=type_sw.id, name="Others"))

        # OT - Emergency Systems
        # Hardware
        for name in ["Emergency AC power backup (DG set)", "Emergency DC power backup (Baterry & Charger set)", "Alarms and notifications systems", "FDA (Fire Detection and Alarm System)", "FPS (Fire Protection System)"]:
            assets_list.append(models.Asset(asset_group_id=ot_groups["Emergency Systems"].id, asset_type_id=type_hw.id, name=name))
        # Software
        assets_list.append(models.Asset(asset_group_id=ot_groups["Emergency Systems"].id, asset_type_id=type_sw.id, name="Others"))

        # OT - Environmental Monitoring Assets
        # Hardware
        for name in ["Weather stations", "Water quality sensors", "Switchgear", "Others"]:
            assets_list.append(models.Asset(asset_group_id=ot_groups["Environmental Monitoring Assets"].id, asset_type_id=type_hw.id, name=name))
        # Software
        assets_list.append(models.Asset(asset_group_id=ot_groups["Environmental Monitoring Assets"].id, asset_type_id=type_sw.id, name="Others"))

        # OT - Electrical Distribution Assets
        # Hardware
        for name in ["Substation equipment", "Switchgear", "Electrical panels", "Others"]:
            assets_list.append(models.Asset(asset_group_id=ot_groups["Electrical Distribution Assets"].id, asset_type_id=type_hw.id, name=name))
        # Software
        assets_list.append(models.Asset(asset_group_id=ot_groups["Electrical Distribution Assets"].id, asset_type_id=type_sw.id, name="Others"))

        # OT - Data Storage and Backup Systems
        # Hardware
        for name in ["Data storage devices (servers, storage arrays)", "Backup systems", "Others"]:
            assets_list.append(models.Asset(asset_group_id=ot_groups["Data Storage and Backup Systems"].id, asset_type_id=type_hw.id, name=name))
        # Software
        assets_list.append(models.Asset(asset_group_id=ot_groups["Data Storage and Backup Systems"].id, asset_type_id=type_sw.id, name="Others"))

        # OT - Power House Auxiliaries
        # Hardware
        for name in ["Cooling Water System", "Auxillary Supply System", "Illumination System", "OPU System", "Drainage and Dewatering System", "Compressed Air System", "Protection System (Generator, Turbine, Transformer)"]:
            assets_list.append(models.Asset(asset_group_id=ot_groups["Power House Auxiliaries"].id, asset_type_id=type_hw.id, name=name))
        # Software
        assets_list.append(models.Asset(asset_group_id=ot_groups["Power House Auxiliaries"].id, asset_type_id=type_sw.id, name="Others"))

        # OT - Others
        assets_list.append(models.Asset(asset_group_id=ot_groups["Others"].id, asset_type_id=type_hw.id, name="Others"))
        assets_list.append(models.Asset(asset_group_id=ot_groups["Others"].id, asset_type_id=type_sw.id, name="Others"))

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
            asset_id=assets_map["Network Equipment:Router"],
            identifier="OHPC-IT-NETWOR-00001",
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
            asset_id=assets_map["Control Systems:Programmable Logic Controllers (PLCs)"],
            identifier="OHPC-OT-CONTRO-00001",
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
            asset_id=assets_map["Network Equipment:Router"],
            identifier="OHPC-IT-NETWOR-00002",
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
            asset_id=assets_map["Computers:Laptop"],
            identifier="OHPC-IT-COMPUT-00001",
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
            asset_id=assets_map["Control Systems:Programmable Logic Controllers (PLCs)"],
            identifier="OHPC-OT-CONTRO-00002",
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
            asset_id=assets_map["Data Storage and Backup Systems:Data storage devices (servers, storage arrays)"],
            identifier="OHPC-OT-DATAST-00001",
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
            asset_id=assets_map["MS Office:Office 19"],
            identifier="OHPC-SW-MSOFFI-00001",
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
            asset_id=assets_map["Antivirus Software:Antivirus Software"],
            identifier="OHPC-SW-ANTIVI-00001",
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
