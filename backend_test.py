#!/usr/bin/env python3
"""
Comprehensive Backend API Test Suite for Family Task & Rewards App
Tests all critical user flows and API endpoints
"""

import requests
import json
import base64
from datetime import datetime, timedelta
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv('/app/frontend/.env')

# Get backend URL from environment
BACKEND_URL = os.getenv('EXPO_PUBLIC_BACKEND_URL', 'https://mobile-app-maker-14.preview.emergentagent.com')
API_BASE = f"{BACKEND_URL}/api"

print(f"Testing backend at: {API_BASE}")

class FamilyTasksAPITester:
    def __init__(self):
        self.parent_token = None
        self.child_token = None
        self.family_id = None
        self.invite_code = None
        self.task_id = None
        self.task_instance_id = None
        self.submission_id = None
        self.parent_user_id = None
        self.child_user_id = None
        
        # Test data with unique emails
        import time
        timestamp = str(int(time.time()))
        self.parent_data = {
            "email": f"parent{timestamp}@familytasks.com",
            "password": "ParentPass123!",
            "display_name": "Sarah Johnson",
            "role": "parent"
        }
        
        self.child_data = {
            "email": f"child{timestamp}@familytasks.com", 
            "password": "ChildPass123!",
            "display_name": "Alex Johnson",
            "role": "child"
        }
        
        self.family_data = {
            "name": "The Johnson Family"
        }
        
        self.task_data = {
            "title": "Clean Your Room",
            "description": "Make bed, organize toys, vacuum floor",
            "category": "Chores",
            "reward_points": 50,
            "requires_proof": True
        }
        
        # Sample base64 image for testing
        self.sample_image_b64 = "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=="
        
    def make_request(self, method, endpoint, data=None, token=None):
        """Make HTTP request with proper headers"""
        url = f"{API_BASE}{endpoint}"
        headers = {"Content-Type": "application/json"}
        
        if token:
            headers["Authorization"] = f"Bearer {token}"
            
        try:
            if method == "GET":
                response = requests.get(url, headers=headers, timeout=10)
            elif method == "POST":
                response = requests.post(url, headers=headers, json=data, timeout=10)
            elif method == "PUT":
                response = requests.put(url, headers=headers, json=data, timeout=10)
            elif method == "DELETE":
                response = requests.delete(url, headers=headers, timeout=10)
            else:
                raise ValueError(f"Unsupported method: {method}")
                
            return response
        except requests.exceptions.Timeout:
            print(f"❌ Request timeout for {method} {url}")
            return None
        except requests.exceptions.ConnectionError:
            print(f"❌ Connection error for {method} {url}")
            return None
        except Exception as e:
            print(f"❌ Request failed: {e}")
            return None
    
    def test_health_check(self):
        """Test health check endpoint"""
        print("\n🔍 Testing Health Check...")
        response = self.make_request("GET", "/health")
        
        if response and response.status_code == 200:
            print("✅ Health check passed")
            return True
        else:
            print(f"❌ Health check failed: {response.status_code if response else 'No response'}")
            return False
    
    def test_parent_registration(self):
        """Test parent user registration"""
        print("\n👨‍👩‍👧‍👦 Testing Parent Registration...")
        response = self.make_request("POST", "/auth/register", self.parent_data)
        
        if response and response.status_code == 200:
            user_data = response.json()
            self.parent_user_id = user_data.get("id")
            print(f"✅ Parent registered successfully: {user_data['display_name']}")
            return True
        else:
            error_msg = response.json().get("detail", "Unknown error") if response else "No response"
            print(f"❌ Parent registration failed: {error_msg}")
            return False
    
    def test_parent_login(self):
        """Test parent login"""
        print("\n🔐 Testing Parent Login...")
        login_data = {
            "email": self.parent_data["email"],
            "password": self.parent_data["password"]
        }
        response = self.make_request("POST", "/auth/login", login_data)
        
        if response and response.status_code == 200:
            data = response.json()
            self.parent_token = data.get("access_token")
            print("✅ Parent login successful")
            return True
        else:
            error_msg = response.json().get("detail", "Unknown error") if response else "No response"
            print(f"❌ Parent login failed: {error_msg}")
            return False
    
    def test_family_creation(self):
        """Test family creation by parent"""
        print("\n🏠 Testing Family Creation...")
        response = self.make_request("POST", "/families", self.family_data, self.parent_token)
        
        if response and response.status_code == 200:
            family_data = response.json()
            self.family_id = family_data.get("id")
            self.invite_code = family_data.get("invite_code")
            print(f"✅ Family created: {family_data['name']} (Code: {self.invite_code})")
            
            # Re-login parent to get updated token with family_id
            login_data = {
                "email": self.parent_data["email"],
                "password": self.parent_data["password"]
            }
            response = self.make_request("POST", "/auth/login", login_data)
            if response and response.status_code == 200:
                data = response.json()
                self.parent_token = data.get("access_token")
                print("✅ Parent token updated with family info")
            
            return True
        else:
            error_msg = response.json().get("detail", "Unknown error") if response else "No response"
            print(f"❌ Family creation failed: {error_msg}")
            return False
    
    def test_child_registration(self):
        """Test child user registration"""
        print("\n👶 Testing Child Registration...")
        response = self.make_request("POST", "/auth/register", self.child_data)
        
        if response and response.status_code == 200:
            user_data = response.json()
            self.child_user_id = user_data.get("id")
            print(f"✅ Child registered successfully: {user_data['display_name']}")
            return True
        else:
            error_msg = response.json().get("detail", "Unknown error") if response else "No response"
            print(f"❌ Child registration failed: {error_msg}")
            return False
    
    def test_child_login(self):
        """Test child login"""
        print("\n🔐 Testing Child Login...")
        login_data = {
            "email": self.child_data["email"],
            "password": self.child_data["password"]
        }
        response = self.make_request("POST", "/auth/login", login_data)
        
        if response and response.status_code == 200:
            data = response.json()
            self.child_token = data.get("access_token")
            print("✅ Child login successful")
            return True
        else:
            error_msg = response.json().get("detail", "Unknown error") if response else "No response"
            print(f"❌ Child login failed: {error_msg}")
            return False
    
    def test_family_join(self):
        """Test child joining family via invite code"""
        print("\n🤝 Testing Family Join...")
        response = self.make_request("POST", f"/families/join/{self.invite_code}", {}, self.child_token)
        
        if response and response.status_code == 200:
            data = response.json()
            print(f"✅ Child joined family: {data['family_name']}")
            return True
        else:
            error_msg = response.json().get("detail", "Unknown error") if response else "No response"
            print(f"❌ Family join failed: {error_msg}")
            return False
    
    def test_family_members(self):
        """Test getting family members"""
        print("\n👥 Testing Family Members...")
        response = self.make_request("GET", "/families/members", token=self.parent_token)
        
        if response and response.status_code == 200:
            members = response.json()
            print(f"✅ Family has {len(members)} members")
            for member in members:
                print(f"   - {member['display_name']} ({member['role']})")
            return True
        else:
            error_msg = response.json().get("detail", "Unknown error") if response else "No response"
            print(f"❌ Get family members failed: {error_msg}")
            return False
    
    def test_task_creation(self):
        """Test task creation by parent"""
        print("\n📝 Testing Task Creation...")
        response = self.make_request("POST", "/tasks", self.task_data, self.parent_token)
        
        if response and response.status_code == 200:
            task_data = response.json()
            self.task_id = task_data.get("id")
            print(f"✅ Task created: {task_data['title']} ({task_data['reward_points']} points)")
            return True
        else:
            error_msg = response.json().get("detail", "Unknown error") if response else "No response"
            print(f"❌ Task creation failed: {error_msg}")
            return False
    
    def test_get_tasks(self):
        """Test getting all family tasks"""
        print("\n📋 Testing Get Tasks...")
        response = self.make_request("GET", "/tasks", token=self.parent_token)
        
        if response and response.status_code == 200:
            tasks = response.json()
            print(f"✅ Retrieved {len(tasks)} tasks")
            return True
        else:
            error_msg = response.json().get("detail", "Unknown error") if response else "No response"
            print(f"❌ Get tasks failed: {error_msg}")
            return False
    
    def test_task_assignment(self):
        """Test assigning task to child"""
        print("\n🎯 Testing Task Assignment...")
        assignment_data = {
            "child_id": self.child_user_id,
            "due_at": (datetime.utcnow() + timedelta(days=1)).isoformat() + "Z"
        }
        response = self.make_request("POST", f"/tasks/{self.task_id}/assign", assignment_data, self.parent_token)
        
        if response and response.status_code == 200:
            instance_data = response.json()
            self.task_instance_id = instance_data.get("id")
            print(f"✅ Task assigned to child (Instance ID: {self.task_instance_id})")
            return True
        else:
            error_msg = response.json().get("detail", "Unknown error") if response else "No response"
            print(f"❌ Task assignment failed: {error_msg}")
            if response:
                print(f"Status code: {response.status_code}")
                print(f"Response: {response.text}")
            return False
    
    def test_get_task_instances_child(self):
        """Test child getting their assigned tasks"""
        print("\n📱 Testing Child Get Task Instances...")
        response = self.make_request("GET", "/task-instances", token=self.child_token)
        
        if response and response.status_code == 200:
            instances = response.json()
            print(f"✅ Child has {len(instances)} assigned tasks")
            for instance in instances:
                print(f"   - {instance['title']} (Status: {instance['status']})")
            return True
        else:
            error_msg = response.json().get("detail", "Unknown error") if response else "No response"
            print(f"❌ Get task instances failed: {error_msg}")
            return False
    
    def test_task_submission(self):
        """Test child submitting task with photo proof"""
        print("\n📸 Testing Task Submission...")
        submission_data = {
            "media_base64": self.sample_image_b64,
            "media_type": "image/png",
            "caption": "Room is all clean!"
        }
        response = self.make_request("POST", f"/task-instances/{self.task_instance_id}/submit", submission_data, self.child_token)
        
        if response and response.status_code == 200:
            data = response.json()
            self.submission_id = data.get("submission_id")
            print(f"✅ Task submitted with photo proof")
            return True
        else:
            error_msg = response.json().get("detail", "Unknown error") if response else "No response"
            print(f"❌ Task submission failed: {error_msg}")
            return False
    
    def test_get_task_instances_parent(self):
        """Test parent getting submitted tasks for approval"""
        print("\n👨‍💼 Testing Parent Get Task Instances...")
        response = self.make_request("GET", "/task-instances?status=submitted", token=self.parent_token)
        
        if response and response.status_code == 200:
            instances = response.json()
            print(f"✅ Parent sees {len(instances)} submitted tasks")
            return True
        else:
            error_msg = response.json().get("detail", "Unknown error") if response else "No response"
            print(f"❌ Parent get task instances failed: {error_msg}")
            return False
    
    def test_task_approval(self):
        """Test parent approving task"""
        print("\n✅ Testing Task Approval...")
        approval_data = {
            "decision": "approved",
            "reason": "Great job! Room looks perfect!"
        }
        response = self.make_request("POST", f"/task-instances/{self.task_instance_id}/approve", approval_data, self.parent_token)
        
        if response and response.status_code == 200:
            data = response.json()
            print(f"✅ Task approved successfully")
            return True
        else:
            error_msg = response.json().get("detail", "Unknown error") if response else "No response"
            print(f"❌ Task approval failed: {error_msg}")
            return False
    
    def test_wallet_balance(self):
        """Test child checking wallet balance"""
        print("\n💰 Testing Wallet Balance...")
        response = self.make_request("GET", "/wallet", token=self.child_token)
        
        if response and response.status_code == 200:
            wallet = response.json()
            print(f"✅ Child wallet balance: {wallet['points_balance']} points")
            return True
        else:
            error_msg = response.json().get("detail", "Unknown error") if response else "No response"
            print(f"❌ Get wallet balance failed: {error_msg}")
            return False
    
    def test_transaction_history(self):
        """Test child checking transaction history"""
        print("\n📊 Testing Transaction History...")
        response = self.make_request("GET", "/wallet/transactions", token=self.child_token)
        
        if response and response.status_code == 200:
            transactions = response.json()
            print(f"✅ Child has {len(transactions)} transactions")
            for tx in transactions:
                print(f"   - {tx['type']}: {tx['amount_points']} points - {tx['memo']}")
            return True
        else:
            error_msg = response.json().get("detail", "Unknown error") if response else "No response"
            print(f"❌ Get transaction history failed: {error_msg}")
            return False
    
    def test_auth_me_endpoints(self):
        """Test /auth/me endpoint for both users"""
        print("\n🔍 Testing Auth Me Endpoints...")
        
        # Test parent
        response = self.make_request("GET", "/auth/me", token=self.parent_token)
        if response and response.status_code == 200:
            user_data = response.json()
            print(f"✅ Parent auth/me: {user_data['display_name']} ({user_data['role']})")
        else:
            print("❌ Parent auth/me failed")
            return False
        
        # Test child
        response = self.make_request("GET", "/auth/me", token=self.child_token)
        if response and response.status_code == 200:
            user_data = response.json()
            print(f"✅ Child auth/me: {user_data['display_name']} ({user_data['role']})")
            return True
        else:
            print("❌ Child auth/me failed")
            return False
    
    def test_role_based_access_control(self):
        """Test role-based access control"""
        print("\n🛡️ Testing Role-Based Access Control...")
        
        # Test child trying to create task (should fail)
        response = self.make_request("POST", "/tasks", self.task_data, self.child_token)
        if response and response.status_code == 403:
            print("✅ Child correctly denied task creation")
        else:
            print("❌ Child should not be able to create tasks")
            return False
        
        # Test parent trying to access child wallet (should fail)
        response = self.make_request("GET", "/wallet", token=self.parent_token)
        if response and response.status_code == 403:
            print("✅ Parent correctly denied wallet access")
            return True
        else:
            print("❌ Parent should not be able to access child wallet")
            return False
    
    def run_all_tests(self):
        """Run complete test suite"""
        print("🚀 Starting Family Tasks & Rewards API Test Suite")
        print("=" * 60)
        
        tests = [
            self.test_health_check,
            self.test_parent_registration,
            self.test_parent_login,
            self.test_family_creation,
            self.test_child_registration,
            self.test_child_login,
            self.test_family_join,
            self.test_family_members,
            self.test_task_creation,
            self.test_get_tasks,
            self.test_task_assignment,
            self.test_get_task_instances_child,
            self.test_task_submission,
            self.test_get_task_instances_parent,
            self.test_task_approval,
            self.test_wallet_balance,
            self.test_transaction_history,
            self.test_auth_me_endpoints,
            self.test_role_based_access_control
        ]
        
        passed = 0
        failed = 0
        
        for test in tests:
            try:
                if test():
                    passed += 1
                else:
                    failed += 1
            except Exception as e:
                print(f"❌ Test {test.__name__} crashed: {e}")
                failed += 1
        
        print("\n" + "=" * 60)
        print(f"🏁 Test Results: {passed} passed, {failed} failed")
        
        if failed == 0:
            print("🎉 All tests passed! Backend API is working correctly.")
            return True
        else:
            print("⚠️ Some tests failed. Check the output above for details.")
            return False

if __name__ == "__main__":
    tester = FamilyTasksAPITester()
    success = tester.run_all_tests()
    exit(0 if success else 1)