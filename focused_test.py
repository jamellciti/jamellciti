#!/usr/bin/env python3
"""
Focused Backend API Test for Family Task & Rewards App
Tests core functionality step by step
"""

import requests
import json
from datetime import datetime, timedelta
import time

API_BASE = "https://mobile-app-maker-14.preview.emergentagent.com/api"

def test_complete_flow():
    """Test complete user flow from registration to task completion"""
    
    # Use timestamp for unique emails
    timestamp = str(int(time.time()))
    
    print("🚀 Starting Focused Family Tasks API Test")
    print("=" * 50)
    
    # Step 1: Register Parent
    print("\n1️⃣ Registering Parent...")
    parent_data = {
        "email": f"parent{timestamp}@test.com",
        "password": "TestPass123!",
        "display_name": "Test Parent",
        "role": "parent"
    }
    
    response = requests.post(f"{API_BASE}/auth/register", json=parent_data, timeout=10)
    if response.status_code != 200:
        print(f"❌ Parent registration failed: {response.text}")
        return False
    
    parent_user = response.json()
    parent_id = parent_user["id"]
    print(f"✅ Parent registered: {parent_user['display_name']} (ID: {parent_id})")
    
    # Step 2: Parent Login
    print("\n2️⃣ Parent Login...")
    login_data = {"email": parent_data["email"], "password": parent_data["password"]}
    response = requests.post(f"{API_BASE}/auth/login", json=login_data, timeout=10)
    if response.status_code != 200:
        print(f"❌ Parent login failed: {response.text}")
        return False
    
    login_result = response.json()
    parent_token = login_result["access_token"]
    print("✅ Parent login successful")
    
    # Step 3: Create Family
    print("\n3️⃣ Creating Family...")
    family_data = {"name": f"Test Family {timestamp}"}
    headers = {"Authorization": f"Bearer {parent_token}", "Content-Type": "application/json"}
    
    response = requests.post(f"{API_BASE}/families", json=family_data, headers=headers, timeout=10)
    if response.status_code != 200:
        print(f"❌ Family creation failed: {response.text}")
        return False
    
    family = response.json()
    family_id = family["id"]
    invite_code = family["invite_code"]
    print(f"✅ Family created: {family['name']} (Code: {invite_code})")
    
    # Step 4: Register Child
    print("\n4️⃣ Registering Child...")
    child_data = {
        "email": f"child{timestamp}@test.com",
        "password": "TestPass123!",
        "display_name": "Test Child",
        "role": "child"
    }
    
    response = requests.post(f"{API_BASE}/auth/register", json=child_data, timeout=10)
    if response.status_code != 200:
        print(f"❌ Child registration failed: {response.text}")
        return False
    
    child_user = response.json()
    child_id = child_user["id"]
    print(f"✅ Child registered: {child_user['display_name']} (ID: {child_id})")
    
    # Step 5: Child Login
    print("\n5️⃣ Child Login...")
    child_login_data = {"email": child_data["email"], "password": child_data["password"]}
    response = requests.post(f"{API_BASE}/auth/login", json=child_login_data, timeout=10)
    if response.status_code != 200:
        print(f"❌ Child login failed: {response.text}")
        return False
    
    child_login_result = response.json()
    child_token = child_login_result["access_token"]
    print("✅ Child login successful")
    
    # Step 6: Child Join Family
    print("\n6️⃣ Child Joining Family...")
    child_headers = {"Authorization": f"Bearer {child_token}", "Content-Type": "application/json"}
    
    response = requests.post(f"{API_BASE}/families/join/{invite_code}", json={}, headers=child_headers, timeout=10)
    if response.status_code != 200:
        print(f"❌ Child join family failed: {response.text}")
        return False
    
    join_result = response.json()
    print(f"✅ Child joined family: {join_result['family_name']}")
    
    # Step 7: Create Task
    print("\n7️⃣ Creating Task...")
    task_data = {
        "title": "Clean Your Room",
        "description": "Make bed and organize toys",
        "reward_points": 50,
        "requires_proof": True
    }
    
    response = requests.post(f"{API_BASE}/tasks", json=task_data, headers=headers, timeout=10)
    if response.status_code != 200:
        print(f"❌ Task creation failed: {response.text}")
        return False
    
    task = response.json()
    task_id = task["id"]
    print(f"✅ Task created: {task['title']} ({task['reward_points']} points)")
    
    # Step 8: Assign Task
    print("\n8️⃣ Assigning Task...")
    assignment_data = {
        "child_id": child_id,
        "due_at": (datetime.utcnow() + timedelta(days=1)).isoformat() + "Z"
    }
    
    response = requests.post(f"{API_BASE}/tasks/{task_id}/assign", json=assignment_data, headers=headers, timeout=10)
    if response.status_code != 200:
        print(f"❌ Task assignment failed: {response.text}")
        print(f"Response: {response.status_code} - {response.text}")
        return False
    
    task_instance = response.json()
    instance_id = task_instance["id"]
    print(f"✅ Task assigned to child (Instance: {instance_id})")
    
    # Step 9: Child Submit Task
    print("\n9️⃣ Child Submitting Task...")
    submission_data = {
        "media_base64": "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==",
        "media_type": "image/png",
        "caption": "Room is clean!"
    }
    
    response = requests.post(f"{API_BASE}/task-instances/{instance_id}/submit", json=submission_data, headers=child_headers, timeout=10)
    if response.status_code != 200:
        print(f"❌ Task submission failed: {response.text}")
        return False
    
    submission_result = response.json()
    print(f"✅ Task submitted with photo proof")
    
    # Step 10: Parent Approve Task
    print("\n🔟 Parent Approving Task...")
    approval_data = {
        "decision": "approved",
        "reason": "Great job!"
    }
    
    response = requests.post(f"{API_BASE}/task-instances/{instance_id}/approve", json=approval_data, headers=headers, timeout=10)
    if response.status_code != 200:
        print(f"❌ Task approval failed: {response.text}")
        return False
    
    approval_result = response.json()
    print(f"✅ Task approved successfully")
    
    # Step 11: Check Child Wallet
    print("\n1️⃣1️⃣ Checking Child Wallet...")
    response = requests.get(f"{API_BASE}/wallet", headers=child_headers, timeout=10)
    if response.status_code != 200:
        print(f"❌ Wallet check failed: {response.text}")
        return False
    
    wallet = response.json()
    print(f"✅ Child wallet balance: {wallet['points_balance']} points")
    
    # Step 12: Check Transaction History
    print("\n1️⃣2️⃣ Checking Transaction History...")
    response = requests.get(f"{API_BASE}/wallet/transactions", headers=child_headers, timeout=10)
    if response.status_code != 200:
        print(f"❌ Transaction history failed: {response.text}")
        return False
    
    transactions = response.json()
    print(f"✅ Found {len(transactions)} transactions")
    for tx in transactions:
        print(f"   - {tx['type']}: {tx['amount_points']} points - {tx['memo']}")
    
    print("\n" + "=" * 50)
    print("🎉 All tests passed! Complete user flow working correctly.")
    return True

if __name__ == "__main__":
    success = test_complete_flow()
    exit(0 if success else 1)