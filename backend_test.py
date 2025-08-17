#!/usr/bin/env python3
"""
AutismSpeak Pro AAC Backend API Testing Suite
Tests all backend API endpoints for functionality, edge cases, and performance
"""

import requests
import json
import time
import uuid
from datetime import datetime
from typing import Dict, List, Any
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv('/app/frontend/.env')

# Get backend URL from environment
BACKEND_URL = os.getenv('EXPO_PUBLIC_BACKEND_URL', 'https://app-idea-3.preview.emergentagent.com')
API_BASE_URL = f"{BACKEND_URL}/api"

class AutismSpeakAPITester:
    def __init__(self):
        self.base_url = API_BASE_URL
        self.test_results = []
        self.created_users = []
        
    def log_test(self, test_name: str, success: bool, message: str, response_time: float = 0):
        """Log test results"""
        result = {
            'test_name': test_name,
            'success': success,
            'message': message,
            'response_time_ms': round(response_time * 1000, 2),
            'timestamp': datetime.now().isoformat()
        }
        self.test_results.append(result)
        status = "✅ PASS" if success else "❌ FAIL"
        print(f"{status} {test_name}: {message} ({result['response_time_ms']}ms)")
        
    def test_user_profile_creation(self):
        """Test POST /api/users with sample data"""
        print("\n=== Testing User Profile Creation ===")
        
        test_users = [
            {"name": "Emma Johnson", "age": 5},
            {"name": "Alex Smith", "age": 10},
            {"name": "Jordan Davis", "age": 16}
        ]
        
        for user_data in test_users:
            start_time = time.time()
            try:
                response = requests.post(f"{self.base_url}/users", json=user_data, timeout=10)
                response_time = time.time() - start_time
                
                if response.status_code == 200:
                    user = response.json()
                    self.created_users.append(user['id'])
                    
                    # Validate response structure
                    required_fields = ['id', 'name', 'age', 'age_group', 'developmental_level', 
                                     'sensory_profile', 'unlocked_symbols', 'created_at']
                    missing_fields = [field for field in required_fields if field not in user]
                    
                    if missing_fields:
                        self.log_test(f"Create User {user_data['name']}", False, 
                                    f"Missing fields: {missing_fields}", response_time)
                    else:
                        # Validate age group assignment
                        expected_age_group = self._get_expected_age_group(user_data['age'])
                        if user['age_group'] == expected_age_group:
                            self.log_test(f"Create User {user_data['name']}", True, 
                                        f"User created successfully with correct age group", response_time)
                        else:
                            self.log_test(f"Create User {user_data['name']}", False, 
                                        f"Incorrect age group: got {user['age_group']}, expected {expected_age_group}", response_time)
                else:
                    self.log_test(f"Create User {user_data['name']}", False, 
                                f"HTTP {response.status_code}: {response.text}", response_time)
                    
            except Exception as e:
                response_time = time.time() - start_time
                self.log_test(f"Create User {user_data['name']}", False, f"Exception: {str(e)}", response_time)
    
    def _get_expected_age_group(self, age: int) -> str:
        """Helper to determine expected age group"""
        if age <= 6:
            return "early_childhood"
        elif age <= 13:
            return "school_age"
        else:
            return "teen_adult"
    
    def test_user_profile_retrieval(self):
        """Test GET /api/users/{user_id}"""
        print("\n=== Testing User Profile Retrieval ===")
        
        if not self.created_users:
            self.log_test("Get User Profile", False, "No users created to test retrieval", 0)
            return
            
        for user_id in self.created_users:
            start_time = time.time()
            try:
                response = requests.get(f"{self.base_url}/users/{user_id}", timeout=10)
                response_time = time.time() - start_time
                
                if response.status_code == 200:
                    user = response.json()
                    if user['id'] == user_id:
                        self.log_test(f"Get User {user_id[:8]}", True, 
                                    "User retrieved successfully", response_time)
                    else:
                        self.log_test(f"Get User {user_id[:8]}", False, 
                                    "User ID mismatch in response", response_time)
                else:
                    self.log_test(f"Get User {user_id[:8]}", False, 
                                f"HTTP {response.status_code}: {response.text}", response_time)
                    
            except Exception as e:
                response_time = time.time() - start_time
                self.log_test(f"Get User {user_id[:8]}", False, f"Exception: {str(e)}", response_time)
    
    def test_symbols_retrieval(self):
        """Test GET /api/symbols with different filters"""
        print("\n=== Testing Symbols Retrieval ===")
        
        # Test basic symbols retrieval
        start_time = time.time()
        try:
            response = requests.get(f"{self.base_url}/symbols", timeout=10)
            response_time = time.time() - start_time
            
            if response.status_code == 200:
                symbols = response.json()
                if len(symbols) >= 26:  # Should have at least 26 default symbols
                    self.log_test("Get All Symbols", True, 
                                f"Retrieved {len(symbols)} symbols", response_time)
                else:
                    self.log_test("Get All Symbols", False, 
                                f"Expected at least 26 symbols, got {len(symbols)}", response_time)
            else:
                self.log_test("Get All Symbols", False, 
                            f"HTTP {response.status_code}: {response.text}", response_time)
                
        except Exception as e:
            response_time = time.time() - start_time
            self.log_test("Get All Symbols", False, f"Exception: {str(e)}", response_time)
        
        # Test category filtering
        categories = ["basic_needs", "emotions", "actions", "emergency"]
        for category in categories:
            start_time = time.time()
            try:
                response = requests.get(f"{self.base_url}/symbols?category={category}", timeout=10)
                response_time = time.time() - start_time
                
                if response.status_code == 200:
                    symbols = response.json()
                    if all(symbol['category'] == category for symbol in symbols):
                        self.log_test(f"Filter by {category}", True, 
                                    f"Retrieved {len(symbols)} {category} symbols", response_time)
                    else:
                        self.log_test(f"Filter by {category}", False, 
                                    "Some symbols don't match category filter", response_time)
                else:
                    self.log_test(f"Filter by {category}", False, 
                                f"HTTP {response.status_code}: {response.text}", response_time)
                    
            except Exception as e:
                response_time = time.time() - start_time
                self.log_test(f"Filter by {category}", False, f"Exception: {str(e)}", response_time)
        
        # Test age group filtering
        age_groups = ["early_childhood", "school_age", "teen_adult"]
        for age_group in age_groups:
            start_time = time.time()
            try:
                response = requests.get(f"{self.base_url}/symbols?age_group={age_group}", timeout=10)
                response_time = time.time() - start_time
                
                if response.status_code == 200:
                    symbols = response.json()
                    valid_symbols = all(age_group in symbol['age_groups'] for symbol in symbols)
                    if valid_symbols:
                        self.log_test(f"Filter by {age_group}", True, 
                                    f"Retrieved {len(symbols)} symbols for {age_group}", response_time)
                    else:
                        self.log_test(f"Filter by {age_group}", False, 
                                    "Some symbols don't match age group filter", response_time)
                else:
                    self.log_test(f"Filter by {age_group}", False, 
                                f"HTTP {response.status_code}: {response.text}", response_time)
                    
            except Exception as e:
                response_time = time.time() - start_time
                self.log_test(f"Filter by {age_group}", False, f"Exception: {str(e)}", response_time)
    
    def test_emergency_symbols(self):
        """Test GET /api/symbols/emergency"""
        print("\n=== Testing Emergency Symbols ===")
        
        start_time = time.time()
        try:
            response = requests.get(f"{self.base_url}/symbols/emergency", timeout=10)
            response_time = time.time() - start_time
            
            if response.status_code == 200:
                symbols = response.json()
                if all(symbol['is_emergency'] for symbol in symbols):
                    expected_emergency = ["Help", "Bathroom", "Pain"]
                    symbol_names = [symbol['name'] for symbol in symbols]
                    has_expected = all(name in symbol_names for name in expected_emergency)
                    
                    if has_expected:
                        self.log_test("Get Emergency Symbols", True, 
                                    f"Retrieved {len(symbols)} emergency symbols", response_time)
                    else:
                        missing = [name for name in expected_emergency if name not in symbol_names]
                        self.log_test("Get Emergency Symbols", False, 
                                    f"Missing expected emergency symbols: {missing}", response_time)
                else:
                    self.log_test("Get Emergency Symbols", False, 
                                "Some symbols are not marked as emergency", response_time)
            else:
                self.log_test("Get Emergency Symbols", False, 
                            f"HTTP {response.status_code}: {response.text}", response_time)
                
        except Exception as e:
            response_time = time.time() - start_time
            self.log_test("Get Emergency Symbols", False, f"Exception: {str(e)}", response_time)
    
    def test_user_specific_symbols(self):
        """Test GET /api/symbols/user/{user_id}"""
        print("\n=== Testing User-Specific Symbols ===")
        
        if not self.created_users:
            self.log_test("Get User Symbols", False, "No users created to test user symbols", 0)
            return
            
        for user_id in self.created_users:
            start_time = time.time()
            try:
                response = requests.get(f"{self.base_url}/symbols/user/{user_id}", timeout=10)
                response_time = time.time() - start_time
                
                if response.status_code == 200:
                    symbols = response.json()
                    if len(symbols) > 0:
                        self.log_test(f"Get User Symbols {user_id[:8]}", True, 
                                    f"Retrieved {len(symbols)} user-specific symbols", response_time)
                    else:
                        self.log_test(f"Get User Symbols {user_id[:8]}", False, 
                                    "No symbols returned for user", response_time)
                else:
                    self.log_test(f"Get User Symbols {user_id[:8]}", False, 
                                f"HTTP {response.status_code}: {response.text}", response_time)
                    
            except Exception as e:
                response_time = time.time() - start_time
                self.log_test(f"Get User Symbols {user_id[:8]}", False, f"Exception: {str(e)}", response_time)
    
    def test_communication_logging(self):
        """Test POST /api/communication"""
        print("\n=== Testing Communication Logging ===")
        
        if not self.created_users:
            self.log_test("Log Communication", False, "No users created to test communication logging", 0)
            return
        
        # First get some symbols to use
        try:
            symbols_response = requests.get(f"{self.base_url}/symbols?category=basic_needs", timeout=10)
            if symbols_response.status_code != 200:
                self.log_test("Log Communication", False, "Could not retrieve symbols for testing", 0)
                return
            symbols = symbols_response.json()[:3]  # Use first 3 symbols
            symbol_ids = [symbol['id'] for symbol in symbols]
        except Exception as e:
            self.log_test("Log Communication", False, f"Error getting symbols: {str(e)}", 0)
            return
        
        for user_id in self.created_users:
            communication_data = {
                "user_id": user_id,
                "symbols_used": symbol_ids,
                "text_output": "I want water and food",
                "success": True,
                "response_time_ms": 1500,
                "assistance_level": "independent",
                "context": "meal_time"
            }
            
            start_time = time.time()
            try:
                response = requests.post(f"{self.base_url}/communication", 
                                       json=communication_data, timeout=10)
                response_time = time.time() - start_time
                
                if response.status_code == 200:
                    event = response.json()
                    required_fields = ['id', 'user_id', 'symbols_used', 'text_output', 'timestamp']
                    missing_fields = [field for field in required_fields if field not in event]
                    
                    if not missing_fields:
                        self.log_test(f"Log Communication {user_id[:8]}", True, 
                                    "Communication event logged successfully", response_time)
                    else:
                        self.log_test(f"Log Communication {user_id[:8]}", False, 
                                    f"Missing fields in response: {missing_fields}", response_time)
                else:
                    self.log_test(f"Log Communication {user_id[:8]}", False, 
                                f"HTTP {response.status_code}: {response.text}", response_time)
                    
            except Exception as e:
                response_time = time.time() - start_time
                self.log_test(f"Log Communication {user_id[:8]}", False, f"Exception: {str(e)}", response_time)
    
    def test_analytics(self):
        """Test GET /api/analytics/user/{user_id}"""
        print("\n=== Testing Analytics ===")
        
        if not self.created_users:
            self.log_test("Get Analytics", False, "No users created to test analytics", 0)
            return
            
        for user_id in self.created_users:
            start_time = time.time()
            try:
                response = requests.get(f"{self.base_url}/analytics/user/{user_id}", timeout=10)
                response_time = time.time() - start_time
                
                if response.status_code == 200:
                    analytics = response.json()
                    required_fields = ['total_communications', 'successful_communications', 
                                     'success_rate', 'most_used_symbols']
                    missing_fields = [field for field in required_fields if field not in analytics]
                    
                    if not missing_fields:
                        self.log_test(f"Get Analytics {user_id[:8]}", True, 
                                    f"Analytics retrieved: {analytics['total_communications']} communications", response_time)
                    else:
                        self.log_test(f"Get Analytics {user_id[:8]}", False, 
                                    f"Missing fields in analytics: {missing_fields}", response_time)
                else:
                    self.log_test(f"Get Analytics {user_id[:8]}", False, 
                                f"HTTP {response.status_code}: {response.text}", response_time)
                    
            except Exception as e:
                response_time = time.time() - start_time
                self.log_test(f"Get Analytics {user_id[:8]}", False, f"Exception: {str(e)}", response_time)
    
    def test_sensory_profile_updates(self):
        """Test PUT /api/users/{user_id}/sensory"""
        print("\n=== Testing Sensory Profile Updates ===")
        
        if not self.created_users:
            self.log_test("Update Sensory Profile", False, "No users created to test sensory updates", 0)
            return
        
        sensory_data = {
            "contrast_level": 4.5,
            "reduce_motion": True,
            "large_touch_targets": True,
            "high_contrast_mode": True
        }
        
        for user_id in self.created_users:
            start_time = time.time()
            try:
                response = requests.put(f"{self.base_url}/users/{user_id}/sensory", 
                                      json=sensory_data, timeout=10)
                response_time = time.time() - start_time
                
                if response.status_code == 200:
                    user = response.json()
                    if 'sensory_profile' in user:
                        profile = user['sensory_profile']
                        if profile['contrast_level'] == 4.5 and profile['reduce_motion'] == True:
                            self.log_test(f"Update Sensory {user_id[:8]}", True, 
                                        "Sensory profile updated successfully", response_time)
                        else:
                            self.log_test(f"Update Sensory {user_id[:8]}", False, 
                                        "Sensory profile not updated correctly", response_time)
                    else:
                        self.log_test(f"Update Sensory {user_id[:8]}", False, 
                                    "No sensory_profile in response", response_time)
                else:
                    self.log_test(f"Update Sensory {user_id[:8]}", False, 
                                f"HTTP {response.status_code}: {response.text}", response_time)
                    
            except Exception as e:
                response_time = time.time() - start_time
                self.log_test(f"Update Sensory {user_id[:8]}", False, f"Exception: {str(e)}", response_time)
    
    def test_edge_cases(self):
        """Test edge cases and error handling"""
        print("\n=== Testing Edge Cases ===")
        
        # Test invalid user ID
        start_time = time.time()
        try:
            response = requests.get(f"{self.base_url}/users/invalid-user-id", timeout=10)
            response_time = time.time() - start_time
            
            if response.status_code == 404:
                self.log_test("Invalid User ID", True, 
                            "Correctly returned 404 for invalid user", response_time)
            else:
                self.log_test("Invalid User ID", False, 
                            f"Expected 404, got {response.status_code}", response_time)
                
        except Exception as e:
            response_time = time.time() - start_time
            self.log_test("Invalid User ID", False, f"Exception: {str(e)}", response_time)
        
        # Test missing data in user creation
        start_time = time.time()
        try:
            response = requests.post(f"{self.base_url}/users", json={"name": "Test"}, timeout=10)
            response_time = time.time() - start_time
            
            if response.status_code in [400, 422]:  # Bad request or validation error
                self.log_test("Missing User Data", True, 
                            "Correctly rejected incomplete user data", response_time)
            else:
                self.log_test("Missing User Data", False, 
                            f"Expected 400/422, got {response.status_code}", response_time)
                
        except Exception as e:
            response_time = time.time() - start_time
            self.log_test("Missing User Data", False, f"Exception: {str(e)}", response_time)
        
        # Test invalid symbol category
        start_time = time.time()
        try:
            response = requests.get(f"{self.base_url}/symbols?category=invalid_category", timeout=10)
            response_time = time.time() - start_time
            
            if response.status_code in [200, 400, 422]:  # Should handle gracefully
                symbols = response.json() if response.status_code == 200 else []
                self.log_test("Invalid Category Filter", True, 
                            f"Handled invalid category gracefully, returned {len(symbols)} symbols", response_time)
            else:
                self.log_test("Invalid Category Filter", False, 
                            f"Unexpected status code: {response.status_code}", response_time)
                
        except Exception as e:
            response_time = time.time() - start_time
            self.log_test("Invalid Category Filter", False, f"Exception: {str(e)}", response_time)
    
    def test_performance(self):
        """Test response times and performance"""
        print("\n=== Testing Performance ===")
        
        # Test bulk symbol retrieval performance
        start_time = time.time()
        try:
            response = requests.get(f"{self.base_url}/symbols", timeout=10)
            response_time = time.time() - start_time
            
            if response.status_code == 200:
                symbols = response.json()
                if response_time < 2.0:  # Should respond within 2 seconds
                    self.log_test("Symbol Retrieval Performance", True, 
                                f"Retrieved {len(symbols)} symbols in acceptable time", response_time)
                else:
                    self.log_test("Symbol Retrieval Performance", False, 
                                f"Slow response: {response_time:.2f}s for {len(symbols)} symbols", response_time)
            else:
                self.log_test("Symbol Retrieval Performance", False, 
                            f"HTTP {response.status_code}: {response.text}", response_time)
                
        except Exception as e:
            response_time = time.time() - start_time
            self.log_test("Symbol Retrieval Performance", False, f"Exception: {str(e)}", response_time)
    
    def test_database_integration(self):
        """Test database persistence and CRUD operations"""
        print("\n=== Testing Database Integration ===")
        
        # Test symbol count (should have 26 default symbols)
        start_time = time.time()
        try:
            response = requests.get(f"{self.base_url}/symbols", timeout=10)
            response_time = time.time() - start_time
            
            if response.status_code == 200:
                symbols = response.json()
                if len(symbols) >= 26:
                    self.log_test("Default Symbols Initialization", True, 
                                f"Database initialized with {len(symbols)} symbols (expected ≥26)", response_time)
                else:
                    self.log_test("Default Symbols Initialization", False, 
                                f"Only {len(symbols)} symbols found, expected at least 26", response_time)
            else:
                self.log_test("Default Symbols Initialization", False, 
                            f"HTTP {response.status_code}: {response.text}", response_time)
                
        except Exception as e:
            response_time = time.time() - start_time
            self.log_test("Default Symbols Initialization", False, f"Exception: {str(e)}", response_time)
        
        # Test data persistence by creating and retrieving a user
        if self.created_users:
            user_id = self.created_users[0]
            start_time = time.time()
            try:
                # Get user twice to test persistence
                response1 = requests.get(f"{self.base_url}/users/{user_id}", timeout=10)
                response2 = requests.get(f"{self.base_url}/users/{user_id}", timeout=10)
                response_time = time.time() - start_time
                
                if response1.status_code == 200 and response2.status_code == 200:
                    user1 = response1.json()
                    user2 = response2.json()
                    if user1['id'] == user2['id'] and user1['name'] == user2['name']:
                        self.log_test("Data Persistence", True, 
                                    "User data persisted correctly across requests", response_time)
                    else:
                        self.log_test("Data Persistence", False, 
                                    "User data inconsistent across requests", response_time)
                else:
                    self.log_test("Data Persistence", False, 
                                f"Failed to retrieve user: {response1.status_code}, {response2.status_code}", response_time)
                    
            except Exception as e:
                response_time = time.time() - start_time
                self.log_test("Data Persistence", False, f"Exception: {str(e)}", response_time)
    
    def run_all_tests(self):
        """Run all test suites"""
        print(f"🚀 Starting AutismSpeak Pro Backend API Tests")
        print(f"📍 Testing against: {self.base_url}")
        print("=" * 80)
        
        # Run all test suites
        self.test_database_integration()
        self.test_user_profile_creation()
        self.test_user_profile_retrieval()
        self.test_symbols_retrieval()
        self.test_emergency_symbols()
        self.test_user_specific_symbols()
        self.test_communication_logging()
        self.test_analytics()
        self.test_sensory_profile_updates()
        self.test_edge_cases()
        self.test_performance()
        
        # Print summary
        self.print_summary()
    
    def print_summary(self):
        """Print test summary"""
        print("\n" + "=" * 80)
        print("📊 TEST SUMMARY")
        print("=" * 80)
        
        total_tests = len(self.test_results)
        passed_tests = sum(1 for result in self.test_results if result['success'])
        failed_tests = total_tests - passed_tests
        
        print(f"Total Tests: {total_tests}")
        print(f"✅ Passed: {passed_tests}")
        print(f"❌ Failed: {failed_tests}")
        print(f"Success Rate: {(passed_tests/total_tests*100):.1f}%")
        
        if failed_tests > 0:
            print(f"\n🔍 FAILED TESTS:")
            for result in self.test_results:
                if not result['success']:
                    print(f"  ❌ {result['test_name']}: {result['message']}")
        
        # Performance summary
        response_times = [r['response_time_ms'] for r in self.test_results if r['response_time_ms'] > 0]
        if response_times:
            avg_response = sum(response_times) / len(response_times)
            max_response = max(response_times)
            print(f"\n⚡ PERFORMANCE:")
            print(f"  Average Response Time: {avg_response:.1f}ms")
            print(f"  Max Response Time: {max_response:.1f}ms")
        
        print("=" * 80)

if __name__ == "__main__":
    tester = AutismSpeakAPITester()
    tester.run_all_tests()