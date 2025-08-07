#!/usr/bin/env python3
"""
Aura Vision Backend Testing Suite
Tests all backend APIs, authentication, WebSocket, clustering, and KPI endpoints
"""

import asyncio
import json
import time
import requests
import websockets
from datetime import datetime, timedelta
from typing import Dict, List, Optional
import uuid

# Configuration
BACKEND_URL = "https://64fd6267-0033-41b0-9cf5-16f4e283c680.preview.emergentagent.com"
API_BASE = f"{BACKEND_URL}/api"
WS_URL = f"wss://64fd6267-0033-41b0-9cf5-16f4e283c680.preview.emergentagent.com/ws/live"

# Demo credentials
DEMO_EMAIL = "admin@aura.vision"
DEMO_PASSWORD = "demo123"

class AuraVisionTester:
    def __init__(self):
        self.session = requests.Session()
        self.jwt_token = None
        self.api_key = None
        self.test_results = {}
        
    def log_test(self, test_name: str, success: bool, message: str, details: Dict = None):
        """Log test results"""
        self.test_results[test_name] = {
            "success": success,
            "message": message,
            "details": details or {},
            "timestamp": datetime.utcnow().isoformat()
        }
        status = "✅ PASS" if success else "❌ FAIL"
        print(f"{status} {test_name}: {message}")
        if details:
            print(f"    Details: {details}")
    
    def test_api_health(self) -> bool:
        """Test basic API connectivity"""
        try:
            response = self.session.get(f"{API_BASE}/", timeout=10)
            if response.status_code == 200:
                data = response.json()
                self.log_test("API Health Check", True, f"API is active: {data.get('message', 'Unknown')}")
                return True
            else:
                self.log_test("API Health Check", False, f"API returned status {response.status_code}")
                return False
        except Exception as e:
            self.log_test("API Health Check", False, f"Connection failed: {str(e)}")
            return False
    
    def test_authentication_login(self) -> bool:
        """Test JWT authentication login"""
        try:
            login_data = {
                "email": DEMO_EMAIL,
                "password": DEMO_PASSWORD
            }
            
            response = self.session.post(f"{API_BASE}/auth/login", json=login_data, timeout=10)
            
            if response.status_code == 200:
                data = response.json()
                self.jwt_token = data.get("access_token")
                user_info = data.get("user", {})
                
                if self.jwt_token:
                    # Set authorization header for future requests
                    self.session.headers.update({"Authorization": f"Bearer {self.jwt_token}"})
                    self.log_test("Authentication Login", True, 
                                f"Login successful for {user_info.get('email', 'unknown user')}")
                    return True
                else:
                    self.log_test("Authentication Login", False, "No access token in response")
                    return False
            else:
                self.log_test("Authentication Login", False, 
                            f"Login failed with status {response.status_code}: {response.text}")
                return False
                
        except Exception as e:
            self.log_test("Authentication Login", False, f"Login request failed: {str(e)}")
            return False
    
    def test_api_key_creation(self) -> bool:
        """Test API key creation (requires JWT token)"""
        if not self.jwt_token:
            self.log_test("API Key Creation", False, "No JWT token available")
            return False
            
        try:
            api_key_data = {
                "name": "test-key-" + str(uuid.uuid4())[:8],
                "city": "phoenix"
            }
            
            response = self.session.post(f"{API_BASE}/admin/api-keys", 
                                       params=api_key_data, timeout=10)
            
            if response.status_code == 200:
                data = response.json()
                self.api_key = data.get("api_key")
                
                if self.api_key:
                    self.log_test("API Key Creation", True, 
                                f"API key created: {data.get('name')} for {data.get('city')}")
                    return True
                else:
                    self.log_test("API Key Creation", False, "No API key in response")
                    return False
            else:
                self.log_test("API Key Creation", False, 
                            f"API key creation failed with status {response.status_code}: {response.text}")
                return False
                
        except Exception as e:
            self.log_test("API Key Creation", False, f"API key creation failed: {str(e)}")
            return False
    
    def test_event_ingestion(self) -> bool:
        """Test event ingestion API with API key authentication"""
        if not self.api_key:
            self.log_test("Event Ingestion API", False, "No API key available")
            return False
            
        try:
            # Create test event data
            event_data = {
                "type": "pothole",
                "lat": 33.4484,  # Phoenix coordinates
                "lon": -112.0740,
                "severity": 4,
                "score": 0.85,
                "city": "phoenix",
                "device_id": "test-device-001"
            }
            
            headers = {"X-API-Key": self.api_key}
            response = self.session.post(f"{API_BASE}/ingest/events", 
                                       json=event_data, headers=headers, timeout=10)
            
            if response.status_code == 200:
                data = response.json()
                event_id = data.get("event_id")
                status = data.get("status")
                actions = data.get("actions", {})
                
                self.log_test("Event Ingestion API", True, 
                            f"Event {event_id} ingested with status {status}",
                            {"actions": actions})
                return True
            else:
                self.log_test("Event Ingestion API", False, 
                            f"Event ingestion failed with status {response.status_code}: {response.text}")
                return False
                
        except Exception as e:
            self.log_test("Event Ingestion API", False, f"Event ingestion failed: {str(e)}")
            return False
    
    def test_kpi_endpoints(self) -> bool:
        """Test KPI dashboard endpoints"""
        if not self.jwt_token:
            self.log_test("KPI Endpoints", False, "No JWT token available")
            return False
            
        try:
            response = self.session.get(f"{API_BASE}/kpis", timeout=10)
            
            if response.status_code == 200:
                data = response.json()
                
                # Check for expected KPI fields
                expected_fields = [
                    "events_today", "work_orders_open", "work_orders_closed",
                    "citations_issued", "total_fine_value", "avg_sla_hours", "grant_potential"
                ]
                
                missing_fields = [field for field in expected_fields if field not in data]
                
                if not missing_fields:
                    self.log_test("KPI Endpoints", True, 
                                f"KPI data retrieved successfully", 
                                {"kpis": data})
                    return True
                else:
                    self.log_test("KPI Endpoints", False, 
                                f"Missing KPI fields: {missing_fields}")
                    return False
            else:
                self.log_test("KPI Endpoints", False, 
                            f"KPI request failed with status {response.status_code}: {response.text}")
                return False
                
        except Exception as e:
            self.log_test("KPI Endpoints", False, f"KPI request failed: {str(e)}")
            return False
    
    def test_events_endpoint(self) -> bool:
        """Test events retrieval endpoint"""
        if not self.jwt_token:
            self.log_test("Events Endpoint", False, "No JWT token available")
            return False
            
        try:
            response = self.session.get(f"{API_BASE}/events?limit=10", timeout=10)
            
            if response.status_code == 200:
                events = response.json()
                self.log_test("Events Endpoint", True, 
                            f"Retrieved {len(events)} events")
                return True
            else:
                self.log_test("Events Endpoint", False, 
                            f"Events request failed with status {response.status_code}: {response.text}")
                return False
                
        except Exception as e:
            self.log_test("Events Endpoint", False, f"Events request failed: {str(e)}")
            return False
    
    def test_work_orders_endpoint(self) -> bool:
        """Test work orders endpoint"""
        if not self.jwt_token:
            self.log_test("Work Orders Endpoint", False, "No JWT token available")
            return False
            
        try:
            response = self.session.get(f"{API_BASE}/work-orders", timeout=10)
            
            if response.status_code == 200:
                work_orders = response.json()
                self.log_test("Work Orders Endpoint", True, 
                            f"Retrieved {len(work_orders)} work orders")
                return True
            else:
                self.log_test("Work Orders Endpoint", False, 
                            f"Work orders request failed with status {response.status_code}: {response.text}")
                return False
                
        except Exception as e:
            self.log_test("Work Orders Endpoint", False, f"Work orders request failed: {str(e)}")
            return False
    
    def test_citations_endpoint(self) -> bool:
        """Test citations endpoint"""
        if not self.jwt_token:
            self.log_test("Citations Endpoint", False, "No JWT token available")
            return False
            
        try:
            response = self.session.get(f"{API_BASE}/citations", timeout=10)
            
            if response.status_code == 200:
                citations = response.json()
                self.log_test("Citations Endpoint", True, 
                            f"Retrieved {len(citations)} citations")
                return True
            else:
                self.log_test("Citations Endpoint", False, 
                            f"Citations request failed with status {response.status_code}: {response.text}")
                return False
                
        except Exception as e:
            self.log_test("Citations Endpoint", False, f"Citations request failed: {str(e)}")
            return False
    
    def test_clustering_endpoints(self) -> bool:
        """Test event clustering endpoints"""
        if not self.jwt_token:
            self.log_test("Event Clustering", False, "No JWT token available")
            return False
            
        try:
            # Test clusters endpoint
            response = self.session.get(f"{API_BASE}/clusters?hours_back=24", timeout=10)
            
            if response.status_code == 200:
                clusters = response.json()
                
                # Test clustering performance endpoint
                perf_response = self.session.get(f"{API_BASE}/clustering/performance", timeout=10)
                
                if perf_response.status_code == 200:
                    perf_data = perf_response.json()
                    
                    self.log_test("Event Clustering", True, 
                                f"Retrieved {len(clusters)} clusters",
                                {"performance": perf_data})
                    return True
                else:
                    self.log_test("Event Clustering", False, 
                                f"Clustering performance request failed: {perf_response.status_code}")
                    return False
            else:
                self.log_test("Event Clustering", False, 
                            f"Clusters request failed with status {response.status_code}: {response.text}")
                return False
                
        except Exception as e:
            self.log_test("Event Clustering", False, f"Clustering request failed: {str(e)}")
            return False
    
    async def test_websocket_connection(self) -> bool:
        """Test WebSocket live feed connection"""
        try:
            # Connect to WebSocket
            async with websockets.connect(WS_URL) as websocket:
                
                # Wait for initial data
                try:
                    initial_message = await asyncio.wait_for(websocket.recv(), timeout=5.0)
                    initial_data = json.loads(initial_message)
                    
                    if initial_data.get("type") == "INITIAL_DATA":
                        data = initial_data.get("data", {})
                        clusters = data.get("clusters", [])
                        work_orders = data.get("work_orders", [])
                        citations = data.get("citations", [])
                        
                        self.log_test("WebSocket Live Feed", True, 
                                    "WebSocket connection established and initial data received",
                                    {
                                        "clusters_count": len(clusters),
                                        "work_orders_count": len(work_orders),
                                        "citations_count": len(citations)
                                    })
                        
                        # Test ping/pong
                        ping_message = {"type": "ping", "timestamp": datetime.utcnow().isoformat()}
                        await websocket.send(json.dumps(ping_message))
                        
                        # Wait for pong response
                        try:
                            pong_response = await asyncio.wait_for(websocket.recv(), timeout=3.0)
                            pong_data = json.loads(pong_response)
                            
                            if pong_data.get("type") == "pong":
                                self.log_test("WebSocket Ping/Pong", True, "Ping/pong successful")
                            else:
                                self.log_test("WebSocket Ping/Pong", False, f"Unexpected response: {pong_data}")
                        except asyncio.TimeoutError:
                            self.log_test("WebSocket Ping/Pong", False, "Pong response timeout")
                        
                        return True
                    else:
                        self.log_test("WebSocket Live Feed", False, 
                                    f"Unexpected initial message type: {initial_data.get('type')}")
                        return False
                        
                except asyncio.TimeoutError:
                    self.log_test("WebSocket Live Feed", False, "Timeout waiting for initial data")
                    return False
                    
        except Exception as e:
            self.log_test("WebSocket Live Feed", False, f"WebSocket connection failed: {str(e)}")
            return False
    
    def test_manual_clustering_trigger(self) -> bool:
        """Test manual clustering trigger (admin only)"""
        if not self.jwt_token:
            self.log_test("Manual Clustering Trigger", False, "No JWT token available")
            return False
            
        try:
            response = self.session.post(f"{API_BASE}/clustering/run", timeout=15)
            
            if response.status_code == 200:
                data = response.json()
                stats = data.get("stats", {})
                
                self.log_test("Manual Clustering Trigger", True, 
                            "Manual clustering completed successfully",
                            {"stats": stats})
                return True
            else:
                self.log_test("Manual Clustering Trigger", False, 
                            f"Manual clustering failed with status {response.status_code}: {response.text}")
                return False
                
        except Exception as e:
            self.log_test("Manual Clustering Trigger", False, f"Manual clustering failed: {str(e)}")
            return False
    
    def test_websocket_stats(self) -> bool:
        """Test WebSocket statistics endpoint"""
        if not self.jwt_token:
            self.log_test("WebSocket Stats", False, "No JWT token available")
            return False
            
        try:
            response = self.session.get(f"{API_BASE}/websocket/stats", timeout=10)
            
            if response.status_code == 200:
                stats = response.json()
                
                self.log_test("WebSocket Stats", True, 
                            "WebSocket statistics retrieved",
                            {"stats": stats})
                return True
            else:
                self.log_test("WebSocket Stats", False, 
                            f"WebSocket stats failed with status {response.status_code}: {response.text}")
                return False
                
        except Exception as e:
            self.log_test("WebSocket Stats", False, f"WebSocket stats failed: {str(e)}")
            return False
    
    async def run_all_tests(self):
        """Run all backend tests in sequence"""
        print("🚀 Starting Aura Vision Backend Testing Suite")
        print(f"🔗 Backend URL: {BACKEND_URL}")
        print(f"📡 WebSocket URL: {WS_URL}")
        print("=" * 60)
        
        # Test sequence
        tests = [
            ("API Health Check", self.test_api_health),
            ("Authentication Login", self.test_authentication_login),
            ("API Key Creation", self.test_api_key_creation),
            ("Event Ingestion API", self.test_event_ingestion),
            ("KPI Endpoints", self.test_kpi_endpoints),
            ("Events Endpoint", self.test_events_endpoint),
            ("Work Orders Endpoint", self.test_work_orders_endpoint),
            ("Citations Endpoint", self.test_citations_endpoint),
            ("Event Clustering", self.test_clustering_endpoints),
            ("Manual Clustering Trigger", self.test_manual_clustering_trigger),
            ("WebSocket Stats", self.test_websocket_stats),
        ]
        
        # Run synchronous tests
        for test_name, test_func in tests:
            try:
                test_func()
                time.sleep(0.5)  # Brief pause between tests
            except Exception as e:
                self.log_test(test_name, False, f"Test execution failed: {str(e)}")
        
        # Run WebSocket test separately (async)
        try:
            await self.test_websocket_connection()
        except Exception as e:
            self.log_test("WebSocket Live Feed", False, f"WebSocket test failed: {str(e)}")
        
        # Print summary
        self.print_test_summary()
    
    def print_test_summary(self):
        """Print test results summary"""
        print("\n" + "=" * 60)
        print("📊 TEST RESULTS SUMMARY")
        print("=" * 60)
        
        passed = sum(1 for result in self.test_results.values() if result["success"])
        total = len(self.test_results)
        
        print(f"✅ Passed: {passed}/{total}")
        print(f"❌ Failed: {total - passed}/{total}")
        
        if total - passed > 0:
            print("\n🔍 FAILED TESTS:")
            for test_name, result in self.test_results.items():
                if not result["success"]:
                    print(f"  ❌ {test_name}: {result['message']}")
        
        print("\n🎯 HIGH PRIORITY COMPONENTS STATUS:")
        
        # Map tests to high priority components
        priority_mapping = {
            "Event Ingestion API": ["Event Ingestion API"],
            "Authentication System": ["Authentication Login", "API Key Creation"],
            "WebSocket Live Feed": ["WebSocket Live Feed", "WebSocket Stats"],
            "Event Clustering": ["Event Clustering", "Manual Clustering Trigger"],
            "KPI Endpoints": ["KPI Endpoints"]
        }
        
        for component, test_names in priority_mapping.items():
            component_passed = all(
                self.test_results.get(test_name, {}).get("success", False) 
                for test_name in test_names
            )
            status = "✅ WORKING" if component_passed else "❌ FAILING"
            print(f"  {status} {component}")

async def main():
    """Main test execution"""
    tester = AuraVisionTester()
    await tester.run_all_tests()

if __name__ == "__main__":
    asyncio.run(main())