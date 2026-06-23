import json
import urllib.request
import urllib.error

API_BASE = "http://127.0.0.1:8000"

def make_request(path, method="GET", body=None, token=None):
    url = f"{API_BASE}{path}"
    headers = {"Content-Type": "application/json"}
    if token:
        headers["Authorization"] = f"Bearer {token}"
    
    data = None
    if body:
        data = json.dumps(body).encode("utf-8")
        
    req = urllib.request.Request(url, data=data, headers=headers, method=method)
    try:
        with urllib.request.urlopen(req) as res:
            return res.status, json.loads(res.read().decode("utf-8"))
    except urllib.error.HTTPError as e:
        try:
            err_body = json.loads(e.read().decode("utf-8"))
        except:
            err_body = str(e)
        return e.code, err_body
    except Exception as e:
        return 500, str(e)

def run_tests():
    print("=== STARTING INTEGRATION VERIFICATION TESTS ===")
    
    # 1. Login as custodian.it (L2 Admin)
    print("\n1. Logging in as custodian.it...")
    status, res = make_request("/api/auth/login", "POST", {
        "username": "custodian.it",
        "password": "password123"
    })
    if status != 200:
        print(f"❌ Login failed: {res}")
        return
    admin_token = res["access_token"]
    print("✅ Logged in successfully!")

    # 2. Register a new asset with manual user names
    # First, let's get taxonomy list to find a valid asset_id
    status, assets_tax = make_request("/api/taxonomy/assets", "GET", token=admin_token)
    asset_id = assets_tax[0]["id"]
    
    # Get next identifier
    status, ident_res = make_request(
        f"/api/taxonomy/next-identifier?asset_id={asset_id}&plant_name=Rengali%20Hydro%20Project&place_of_installation=Power%20House", 
        "GET", 
        token=admin_token
    )
    identifier = ident_res["identifier"]
    
    print(f"\n2. Registering new asset {identifier} with manual user names and typed location...")
    new_asset_body = {
        "asset_id": asset_id,
        "identifier": identifier,
        "description": "Integration test created asset",
        "manufacturer": "Dell",
        "model_number": "Optiplex",
        "serial_number": "INTEG-TEST-SN-999",
        "owner_id": None,
        "owner_name": "Jane Owner Auto",
        "custodian_id": None,
        "custodian_name": "John Custodian Auto",
        "assigned_user_id": None,
        "assigned_user_name": "Rahul Sharma", # Existing user, should resolve
        "location_id": None,
        "location_plant_office": "Rengali Hydro Project",
        "location_building": "Power House",
        "security_classification": "Internal",
        "business_criticality": "Medium",
        "backup_available": False,
        "status": "Active"
    }
    
    status, create_res = make_request("/api/assets", "POST", new_asset_body, token=admin_token)
    if status != 201:
        print(f"❌ Asset creation failed: {create_res}")
        return
    print("✅ Asset created successfully!")
    print(f"   Linked Owner: {create_res['owner']['name']} (ID: {create_res['owner_id']})")
    print(f"   Linked Custodian: {create_res['custodian']['name']} (ID: {create_res['custodian_id']})")
    print(f"   Linked End User: {create_res['assigned_user']['name']} (ID: {create_res['assigned_user_id']})")
    created_asset_id = create_res["id"]
    
    # Verify manual user roles
    owner_role = create_res['owner']['role']['name']
    custodian_role = create_res['custodian']['role']['name']
    print(f"   Owner Role: {owner_role} (Expected: USER)")
    print(f"   Custodian Role: {custodian_role} (Expected: L2_ADMIN)")
    
    assert owner_role == "USER", "Owner role should default to USER"
    assert custodian_role == "L2_ADMIN", "Custodian role should default to L2_ADMIN"

    # 3. Login as rahul.ops (USER)
    print("\n3. Logging in as standard user rahul.ops...")
    status, res = make_request("/api/auth/login", "POST", {
        "username": "rahul.ops",
        "password": "password123"
    })
    if status != 200:
        print(f"❌ Login failed: {res}")
        return
    user_token = res["access_token"]
    user_name = res["name"]
    print(f"✅ Logged in successfully as {user_name}!")

    # 4. Fetch assets as standard user
    print("\n4. Fetching assets as standard user...")
    status, user_assets = make_request("/api/assets", "GET", token=user_token)
    if status != 200:
        print(f"❌ Fetch assets failed: {user_assets}")
        return
    print(f"✅ Found {len(user_assets)} assets assigned to this user:")
    for a in user_assets:
        print(f"   - {a['identifier']} : {a['asset']['name']} (Assigned User: {a['assigned_user']['name']})")
        assert a['assigned_user']['name'] == user_name, "User should only see their assigned assets!"

    # 5. Attempt to fetch restricted asset details
    # Let's find an asset not assigned to Rahul. E.g. find all assets as admin first
    status, all_assets = make_request("/api/assets", "GET", token=admin_token)
    unassigned_asset = None
    for a in all_assets:
        if not a.get("assigned_user") or a["assigned_user"]["name"] != user_name:
            unassigned_asset = a
            break
            
    if unassigned_asset:
        print(f"\n5. Attempting to fetch details of unassigned asset {unassigned_asset['identifier']} as rahul.ops...")
        status, detail_res = make_request(f"/api/assets/{unassigned_asset['id']}", "GET", token=user_token)
        print(f"   Response status: {status}")
        print(f"   Response details: {detail_res}")
        assert status == 403, f"Expected 403 Forbidden, got {status}"
        print("✅ Restricting detailed view successfully verified (403 Forbidden received)!")
    else:
        print("\n5. Skipped detailed view test (no unassigned asset found).")

    # 6. Verify summary report details are restricted for USER
    print("\n6. Requesting summary report as standard user...")
    status, summary_res = make_request("/api/reports/summary", "GET", token=user_token)
    if status != 200:
        print(f"❌ Summary report failed: {summary_res}")
        return
    print(f"   Summary total assets counted: {summary_res['total']}")
    assert summary_res['total'] == len(user_assets), "Summary metrics should be restricted to user's assigned assets"
    print("✅ Restricted summary metrics successfully verified!")

    print("\n=== ALL INTEGRATION VERIFICATION TESTS PASSED SUCCESSFULLY! ===")

if __name__ == "__main__":
    run_tests()
