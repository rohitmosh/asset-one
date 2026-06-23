import urllib.request
import urllib.parse
import json
import time

BASE_URL = "http://localhost:8000"

def make_request(url, method="GET", headers=None, data=None, form_data=None):
    if headers is None:
        headers = {}
    
    req_data = None
    if data is not None:
        req_data = json.dumps(data).encode("utf-8")
        headers["Content-Type"] = "application/json"
    elif form_data is not None:
        req_data = urllib.parse.urlencode(form_data).encode("utf-8")
        headers["Content-Type"] = "application/x-www-form-urlencoded"

    req = urllib.request.Request(url, data=req_data, headers=headers, method=method)
    
    try:
        with urllib.request.urlopen(req) as response:
            resp_body = response.read().decode("utf-8")
            return response.status, json.loads(resp_body) if resp_body else None
    except urllib.error.HTTPError as e:
        resp_body = e.read().decode("utf-8")
        try:
            err_json = json.loads(resp_body)
        except:
            err_json = resp_body
        return e.code, err_json

def test_workflow():
    print("--- Starting API Flow and Security Tests ---")
    
    # 1. Login as L2 Admin (custodian.it)
    print("\n[STEP 1] Logging in as L2 Admin (custodian.it)...")
    status, resp = make_request(
        f"{BASE_URL}/api/auth/login", 
        method="POST", 
        data={"username": "custodian.it", "password": "password123"}
    )
    assert status == 200, f"Login failed ({status}): {resp}"
    token_l2 = resp["access_token"]
    headers_l2 = {"Authorization": f"Bearer {token_l2}"}
    print("✓ Success: Logged in as L2 Admin.")

    # 2. Login as L1 Admin (admin.hq)
    print("\n[STEP 2] Logging in as L1 Admin (admin.hq)...")
    status, resp = make_request(
        f"{BASE_URL}/api/auth/login", 
        method="POST", 
        data={"username": "admin.hq", "password": "password123"}
    )
    assert status == 200, f"Login failed ({status}): {resp}"
    token_l1 = resp["access_token"]
    headers_l1 = {"Authorization": f"Bearer {token_l1}"}
    print("✓ Success: Logged in as L1 Admin.")

    # 3. Get taxonomies
    print("\n[STEP 3] Fetching taxonomy components...")
    status, groups = make_request(f"{BASE_URL}/api/taxonomy/groups", headers=headers_l2)
    print("GET groups status:", status)
    assert status == 200, f"Failed to get groups: {status} - {groups}"
    print(f"Found {len(groups)} Asset Groups.")
    
    # Let's find Server Systems group
    server_group = next((g for g in groups if g["name"] == "Server Systems"), None)
    assert server_group is not None, "Server Systems group not found"
    print(f"Server Systems Group Domain: {server_group['domain']}")
    assert server_group["domain"] == "IT"

    status, assets = make_request(f"{BASE_URL}/api/taxonomy/assets", headers=headers_l2)
    assert status == 200, f"Failed to get assets: {status} - {assets}"
    
    # Let's find Blade Server asset
    workstation_asset = next((a for a in assets if a["name"] == "Blade Server"), None)
    assert workstation_asset is not None, "Blade Server asset not found"
    print(f"Blade Server Asset Info - Group ID: {workstation_asset['asset_group_id']}, Type ID: {workstation_asset['asset_type_id']}")

    # 4. Fetch list of current instances to find the latest Blade Server instance
    status, instances = make_request(f"{BASE_URL}/api/assets", headers=headers_l2)
    assert status == 200, f"Failed to get instances: {status} - {instances}"
    workstation_instances = [inst for inst in instances if inst["asset"]["name"] == "Blade Server"]
    workstation_instances.sort(key=lambda x: x["id"], reverse=True)
    print(f"Found {len(workstation_instances)} existing Blade Server instances.")
    latest_existing_workstation = workstation_instances[0] if workstation_instances else None
    if latest_existing_workstation:
        print(f"Latest existing Blade Server identifier: {latest_existing_workstation['identifier']} (ID: {latest_existing_workstation['id']})")

    # 5. Create a new Blade Server asset instance as L2 Admin
    print("\n[STEP 4] Registering a new Blade Server asset instance as L2 Admin...")
    ts = int(time.time())
    new_asset_body = {
        "asset_id": workstation_asset["id"],
        "identifier": f"OHPC-IT-BLADESERVER-{ts}",
        "description": "Test Blade Server for verification",
        "manufacturer": "Dell",
        "model_number": "Precision T5820",
        "serial_number": f"SN-TEST-{ts}",
        "owner_id": 1,  # Admin HQ
        "custodian_id": 2,  # custodian.it
        "location_id": 1,
        "security_classification": "Confidential",
        "business_criticality": "Medium",
        "backup_available": True,
        "backup_location": "NAS-TEST-BAK",
        "backup_owner_id": None
    }
    status, created_instance = make_request(f"{BASE_URL}/api/assets", method="POST", headers=headers_l2, data=new_asset_body)
    assert status in [200, 201], f"Asset creation failed ({status}): {created_instance}"
    print(f"✓ Success: Registered asset {created_instance['identifier']} (ID: {created_instance['id']})")
    
    # 6. Verify previous asset link of the newly created asset
    print("\n[STEP 5] Verifying previous asset link auto-assignment...")
    print(f"Assigned prev_asset_instance_id: {created_instance['prev_asset_instance_id']}")
    print(f"Assigned prev_asset_identifier: {created_instance['prev_asset_identifier']}")
    if latest_existing_workstation:
        assert created_instance["prev_asset_instance_id"] == latest_existing_workstation["id"], "Previous asset instance ID mismatch!"
        assert created_instance["prev_asset_identifier"] == latest_existing_workstation["identifier"], "Previous asset identifier mismatch!"
        print("✓ Success: Auto-linking with the previous Blade Server of the same type works perfectly.")
    else:
        assert created_instance["prev_asset_instance_id"] is None
        print("✓ Success: Initial entry has no previous asset link.")

    # 7. Check if the previous asset now points to this new asset as its next asset
    if latest_existing_workstation:
        print("\n[STEP 6] Verifying backlink updates (next asset pointer)...")
        status, instances_after = make_request(f"{BASE_URL}/api/assets", headers=headers_l2)
        assert status == 200, f"Failed to get instances: {status} - {instances_after}"
        prev_inst = next((inst for inst in instances_after if inst["id"] == latest_existing_workstation["id"]), None)
        assert prev_inst is not None
        print(f"Previous asset instance next_asset_instance_id: {prev_inst['next_asset_instance_id']}")
        print(f"Previous asset instance next_asset_identifier: {prev_inst['next_asset_identifier']}")
        assert prev_inst["next_asset_instance_id"] == created_instance["id"], "Backlink next asset instance ID mismatch!"
        assert prev_inst["next_asset_identifier"] == created_instance["identifier"], "Backlink next asset identifier mismatch!"
        print("✓ Success: Backlink update verified.")

    # 8. Test role boundary checks for L1 Admin (admin.hq)
    print("\n[STEP 7] Verifying security boundaries for L1 Admin (admin.hq)...")
    # L1 Admin should be able to view all assets
    status, instances_l1 = make_request(f"{BASE_URL}/api/assets", headers=headers_l1)
    assert status == 200, f"L1 Admin was blocked from viewing assets! ({status}) - {instances_l1}"
    print(f"L1 Admin successfully retrieved all {len(instances_l1)} assets.")

    # L1 Admin should NOT be able to create assets
    print("Testing if L1 Admin is blocked from asset creation...")
    status, err_resp = make_request(f"{BASE_URL}/api/assets", method="POST", headers=headers_l1, data=new_asset_body)
    print(f"Response status code (expected 403/401): {status}")
    assert status in [403, 401], f"L1 Admin was allowed to create an asset! Status: {status} - {err_resp}"
    print("✓ Success: L1 Admin blocked from asset creation.")

    # L1 Admin should NOT be able to edit assets
    print("Testing if L1 Admin is blocked from asset editing...")
    status, err_resp = make_request(f"{BASE_URL}/api/assets/{created_instance['id']}", method="PUT", headers=headers_l1, data={"description": "Tampered description"})
    print(f"Response status code (expected 403/401): {status}")
    assert status in [403, 401], f"L1 Admin was allowed to edit an asset! Status: {status} - {err_resp}"
    print("✓ Success: L1 Admin blocked from asset editing.")

    print("\nAll integration checks passed successfully! ✓")

if __name__ == "__main__":
    test_workflow()
