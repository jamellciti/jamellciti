#!/usr/bin/env python3
"""
Comprehensive Backend API Testing for Aura Vision
Tests all critical backend endpoints and workflows
"""

import requests
import json
import time
from datetime import datetime, timedelta
from typing import Dict, Any, Optional
import uuid

# Configuration
BASE_URL = "https://0cf8f361-2398-415b-b274-ff11de2ad810.preview.emergentagent.com/api"
DEMO_USER_EMAIL = "admin@aura.vision"
DEMO_USER_PASSWORD = "demo123"

class AuraVisionAPITester:
    def __init__(self):
        self.base_url = BASE_URL
        self.auth_token = None
        self.user_data = None
        self.test_results = []
        
    def log_test(self, test_name: str, success: bool, details: str = "", data: Any = None):
        """Log test results"""
        result = {
            "test": test_name,
            "success": success,
            "details": details,
            "timestamp": datetime.now().isoformat(),
            "data": data
        }
        self.test_results.append(result)
        status = "✅ PASS" if success else "❌ FAIL"
        print(f"{status} {test_name}: {details}")
        if data and not success:
            print(f"   Response: {json.dumps(data, indent=2)}")
    
    def make_request(self, method: str, endpoint: str, data: Dict = None, headers: Dict = None) -> tuple:
        """Make HTTP request and return (success, response_data)"""
        url = f"{self.base_url}{endpoint}"
        
        # Default headers
        default_headers = {"Content-Type": "application/json"}
        if self.auth_token:
            default_headers["Authorization"] = f"Bearer {self.auth_token}"
        
        if headers:
            default_headers.update(headers)
        
        try:
            if method.upper() == "GET":
                response = requests.get(url, headers=default_headers, timeout=30)
            elif method.upper() == "POST":
                response = requests.post(url, json=data, headers=default_headers, timeout=30)
            elif method.upper() == "PATCH":
                response = requests.patch(url, json=data, headers=default_headers, timeout=30)
            else:
                return False, {"error": f"Unsupported method: {method}"}
            
            # Try to parse JSON response
            try:
                response_data = response.json()
            except:
                response_data = {"raw_response": response.text, "status_code": response.status_code}
            
            return response.status_code < 400, response_data
            
        except requests.exceptions.RequestException as e:
            return False, {"error": str(e)}
    
    def test_api_health(self):
        """Test basic API health"""
        success, data = self.make_request("GET", "/")
        self.log_test(
            "API Health Check",
            success and data.get("status") == "active",
            f"API Status: {data.get('status', 'unknown')}" if success else f"Error: {data}",
            data
        )
        return success
    
    def test_user_registration(self):
        """Test user registration"""
        # Registration endpoint expects query parameters
        endpoint = f"/auth/register?email={DEMO_USER_EMAIL}&password={DEMO_USER_PASSWORD}&role=admin&city=phoenix"
        
        success, data = self.make_request("POST", endpoint)
        
        # Registration might fail if user already exists - that's okay
        if not success and "already exists" in str(data).lower():
            self.log_test(
                "User Registration",
                True,
                f"Demo user {DEMO_USER_EMAIL} already exists (expected)",
                data
            )
            return True
        
        self.log_test(
            "User Registration",
            success,
            f"Created user {DEMO_USER_EMAIL}" if success else f"Registration failed: {data}",
            data
        )
        return success or "already exists" in str(data).lower()
    
    def test_user_login(self):
        """Test user authentication"""
        login_data = {
            "email": DEMO_USER_EMAIL,
            "password": DEMO_USER_PASSWORD
        }
        
        success, data = self.make_request("POST", "/auth/login", login_data)
        
        if success and data.get("access_token"):
            self.auth_token = data["access_token"]
            self.user_data = data.get("user", {})
            self.log_test(
                "User Authentication",
                True,
                f"Successfully authenticated {DEMO_USER_EMAIL}",
                {"user_id": self.user_data.get("id"), "role": self.user_data.get("role")}
            )
            return True
        
        self.log_test(
            "User Authentication",
            False,
            f"Login failed: {data}",
            data
        )
        return False
    
    def test_consent_workflow(self):
        """Test PVI consent system"""
        if not self.auth_token:
            self.log_test("Consent Workflow", False, "No auth token available")
            return False
        
        # Test getting current consent status
        success, data = self.make_request("GET", "/v1/consent")
        if not success:
            self.log_test("Get Consent Status", False, f"Failed to get consent: {data}", data)
            return False
        
        current_level = data.get("level", "none")
        self.log_test("Get Consent Status", True, f"Current consent level: {current_level}", data)
        
        # Test updating consent to CIVIC level
        consent_update = {"level": "civic"}
        success, data = self.make_request("POST", "/v1/consent", consent_update)
        
        if success:
            chain_of_custody = data.get("chain_of_custody", "")
            self.log_test(
                "Update Consent Level",
                True,
                f"Updated consent to CIVIC (CoC: {chain_of_custody[:12]}...)",
                data
            )
            return True
        
        self.log_test("Update Consent Level", False, f"Failed to update consent: {data}", data)
        return False
    
    def test_subscription_status(self):
        """Test subscription/billing system"""
        if not self.auth_token:
            self.log_test("Subscription Status", False, "No auth token available")
            return False
        
        success, data = self.make_request("GET", "/v1/subscription/status")
        
        if success:
            tier = data.get("tier", "unknown")
            active = data.get("active", False)
            self.log_test(
                "Subscription Status",
                True,
                f"Subscription tier: {tier}, Active: {active}",
                data
            )
            return True
        
        self.log_test("Subscription Status", False, f"Failed to get subscription: {data}", data)
        return False
    
    def test_event_ingestion(self):
        """Test event ingestion and rule engine"""
        if not self.auth_token:
            self.log_test("Event Ingestion", False, "No auth token available")
            return False
        
        # Create API key first
        endpoint = "/admin/api-keys?name=test-device-key&city=phoenix"
        
        success, key_response = self.make_request("POST", endpoint)
        if not success:
            self.log_test("Create API Key", False, f"Failed to create API key: {key_response}", key_response)
            return False
        
        api_key = key_response.get("api_key")
        self.log_test("Create API Key", True, f"Created API key: {api_key[:12]}...", key_response)
        
        # Test different event types to trigger rule engine
        test_events = [
            {
                "type": "pothole",
                "lat": 33.4484,
                "lon": -112.0740,
                "severity": 4,
                "score": 0.85,
                "city": "phoenix",
                "device_id": "test-device-001"
            },
            {
                "type": "litter_dumping", 
                "lat": 33.4485,
                "lon": -112.0741,
                "severity": 3,
                "score": 0.92,
                "city": "phoenix",
                "device_id": "test-device-001"
            },
            {
                "type": "illegal_uturn",
                "lat": 33.4486,
                "lon": -112.0742,
                "severity": 2,
                "score": 0.78,
                "city": "phoenix",
                "device_id": "test-device-001"
            },
            {
                "type": "speeding_school_zone",
                "lat": 33.4487,
                "lon": -112.0743,
                "severity": 1,
                "score": 0.95,
                "city": "phoenix",
                "device_id": "test-device-001"
            }
        ]
        
        ingested_events = []
        for event_data in test_events:
            headers = {"X-API-Key": api_key}
            success, response = self.make_request("POST", "/ingest/events", event_data, headers)
            
            if success:
                event_id = response.get("event_id")
                actions = response.get("actions", {})
                work_orders = len(actions.get("work_orders", []))
                citations = len(actions.get("citations", []))
                video_reviews = len(actions.get("video_reviews", []))
                
                self.log_test(
                    f"Ingest {event_data['type']} Event",
                    True,
                    f"Event {event_id[:8]}... → {work_orders} WO, {citations} citations, {video_reviews} videos",
                    response
                )
                ingested_events.append(event_id)
            else:
                self.log_test(
                    f"Ingest {event_data['type']} Event",
                    False,
                    f"Failed to ingest event: {response}",
                    response
                )
        
        return len(ingested_events) > 0
    
    def test_kpis_dashboard(self):
        """Test KPI dashboard data"""
        if not self.auth_token:
            self.log_test("KPIs Dashboard", False, "No auth token available")
            return False
        
        success, data = self.make_request("GET", "/kpis")
        
        if success:
            events_today = data.get("events_today", 0)
            work_orders_open = data.get("work_orders_open", 0)
            citations_issued = data.get("citations_issued", 0)
            total_fine_value = data.get("total_fine_value", 0)
            
            self.log_test(
                "KPIs Dashboard",
                True,
                f"Events today: {events_today}, Open WOs: {work_orders_open}, Citations: {citations_issued}, Fines: ${total_fine_value}",
                data
            )
            return True
        
        self.log_test("KPIs Dashboard", False, f"Failed to get KPIs: {data}", data)
        return False
    
    def test_work_orders(self):
        """Test work order management"""
        if not self.auth_token:
            self.log_test("Work Orders", False, "No auth token available")
            return False
        
        # Get work orders
        success, data = self.make_request("GET", "/work-orders")
        
        if success:
            work_orders = data if isinstance(data, list) else []
            self.log_test(
                "Get Work Orders",
                True,
                f"Retrieved {len(work_orders)} work orders",
                {"count": len(work_orders)}
            )
            
            # Test updating a work order if any exist
            if work_orders:
                wo_id = work_orders[0].get("id")
                endpoint = f"/work-orders/{wo_id}?status=in_progress"
                success, response = self.make_request("PATCH", endpoint)
                
                self.log_test(
                    "Update Work Order",
                    success,
                    f"Updated work order {wo_id[:8]}... status" if success else f"Failed to update: {response}",
                    response
                )
            
            return True
        
        self.log_test("Get Work Orders", False, f"Failed to get work orders: {data}", data)
        return False
    
    def test_citations(self):
        """Test citation management"""
        if not self.auth_token:
            self.log_test("Citations", False, "No auth token available")
            return False
        
        # Get citations
        success, data = self.make_request("GET", "/citations")
        
        if success:
            citations = data if isinstance(data, list) else []
            self.log_test(
                "Get Citations",
                True,
                f"Retrieved {len(citations)} citations",
                {"count": len(citations)}
            )
            return True
        
        self.log_test("Get Citations", False, f"Failed to get citations: {data}", data)
        return False
    
    def test_video_reviews(self):
        """Test video review system"""
        if not self.auth_token:
            self.log_test("Video Reviews", False, "No auth token available")
            return False
        
        # Get video reviews
        success, data = self.make_request("GET", "/video-reviews")
        
        if success:
            video_reviews = data if isinstance(data, list) else []
            self.log_test(
                "Get Video Reviews",
                True,
                f"Retrieved {len(video_reviews)} video reviews",
                {"count": len(video_reviews)}
            )
            return True
        
        self.log_test("Get Video Reviews", False, f"Failed to get video reviews: {data}", data)
        return False
    
    def test_clusters(self):
        """Test event clustering system"""
        if not self.auth_token:
            self.log_test("Event Clusters", False, "No auth token available")
            return False
        
        # Get clusters
        success, data = self.make_request("GET", "/clusters")
        
        if success:
            clusters = data if isinstance(data, list) else []
            self.log_test(
                "Get Event Clusters",
                True,
                f"Retrieved {len(clusters)} event clusters",
                {"count": len(clusters)}
            )
            return True
        
        self.log_test("Get Event Clusters", False, f"Failed to get clusters: {data}", data)
        return False
    
    def run_all_tests(self):
        """Run comprehensive test suite"""
        print("🚀 Starting Aura Vision Backend API Tests")
        print(f"🔗 Testing against: {self.base_url}")
        print("=" * 60)
        
        # Core functionality tests
        tests = [
            ("API Health", self.test_api_health),
            ("User Registration", self.test_user_registration),
            ("User Authentication", self.test_user_login),
            ("Consent Workflow", self.test_consent_workflow),
            ("Subscription Status", self.test_subscription_status),
            ("Event Ingestion", self.test_event_ingestion),
            ("KPIs Dashboard", self.test_kpis_dashboard),
            ("Work Orders", self.test_work_orders),
            ("Citations", self.test_citations),
            ("Video Reviews", self.test_video_reviews),
            ("Event Clusters", self.test_clusters),
        ]
        
        passed = 0
        total = len(tests)
        
        for test_name, test_func in tests:
            try:
                if test_func():
                    passed += 1
            except Exception as e:
                self.log_test(test_name, False, f"Test exception: {str(e)}")
            
            # Small delay between tests
            time.sleep(0.5)
        
        print("=" * 60)
        print(f"🏁 Test Results: {passed}/{total} tests passed")
        
        # Summary of critical issues
        failed_tests = [r for r in self.test_results if not r["success"]]
        if failed_tests:
            print("\n❌ Failed Tests:")
            for test in failed_tests:
                print(f"   - {test['test']}: {test['details']}")
        
        return passed, total, self.test_results

def main():
    """Main test execution"""
    tester = AuraVisionAPITester()
    passed, total, results = tester.run_all_tests()
    
    # Save detailed results
    with open("/app/backend_test_results.json", "w") as f:
        json.dump({
            "summary": {
                "passed": passed,
                "total": total,
                "success_rate": round(passed/total*100, 1) if total > 0 else 0,
                "timestamp": datetime.now().isoformat()
            },
            "detailed_results": results
        }, f, indent=2)
    
    print(f"\n📊 Detailed results saved to backend_test_results.json")
    
    # Return exit code based on results
    return 0 if passed == total else 1

if __name__ == "__main__":
    exit(main())