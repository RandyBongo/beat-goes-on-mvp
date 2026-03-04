#!/usr/bin/env python3
"""
Backend API Testing for The Beat Goes On - Testing with provided admin credentials
Tests all CRUD operations, authentication, and data integrity.
"""

import requests
import sys
import json
from datetime import datetime
from typing import Dict, Any, Optional

class BeatGoesOnAPITester:
    def __init__(self, base_url="https://beat-archive-1.preview.emergentagent.com"):
        self.base_url = base_url
        self.api_url = f"{base_url}/api"
        self.token = None
        self.admin_token = None
        self.test_user_id = None
        self.admin_user_id = None
        self.test_episode_id = None
        self.tests_run = 0
        self.tests_passed = 0
        self.failed_tests = []
        self.results = {}

    def log_result(self, test_name: str, success: bool, details: str = "", response_data: Any = None):
        """Log test result"""
        self.tests_run += 1
        status = "✅ PASS" if success else "❌ FAIL"
        print(f"{status} - {test_name}: {details}")
        
        if success:
            self.tests_passed += 1
        else:
            self.failed_tests.append(f"{test_name}: {details}")
            
        self.results[test_name] = {
            "success": success,
            "details": details,
            "response_data": response_data
        }
        return success

    def make_request(self, method: str, endpoint: str, data: Dict = None, auth_token: str = None) -> tuple:
        """Make HTTP request with error handling"""
        url = f"{self.api_url}/{endpoint}"
        headers = {'Content-Type': 'application/json'}
        
        if auth_token:
            headers['Authorization'] = f'Bearer {auth_token}'

        try:
            if method == 'GET':
                response = requests.get(url, headers=headers, timeout=30)
            elif method == 'POST':
                response = requests.post(url, json=data, headers=headers, timeout=30)
            elif method == 'PUT':
                response = requests.put(url, json=data, headers=headers, timeout=30)
            elif method == 'DELETE':
                response = requests.delete(url, headers=headers, timeout=30)
            else:
                raise ValueError(f"Unsupported method: {method}")

            # Try to parse JSON response
            try:
                response_data = response.json()
            except:
                response_data = {"text": response.text, "status": response.status_code}

            return response.status_code, response_data

        except requests.exceptions.RequestException as e:
            return 0, {"error": str(e)}

    def test_api_root(self):
        """Test API root endpoint"""
        status, data = self.make_request('GET', '', auth_token=None)
        success = status == 200 and "Beat Goes On" in str(data)
        return self.log_result("API Root", success, f"Status: {status}", data)

    def test_get_episodes_count(self):
        """Test that exactly 10 unique episodes exist"""
        status, data = self.make_request('GET', 'episodes')
        success = False
        details = f"Status: {status}"
        
        if status == 200 and isinstance(data, list):
            episode_count = len(data)
            block_numbers = [ep.get('block_number') for ep in data]
            unique_blocks = sorted(set(block_numbers))
            
            # Check for exactly 10 unique episodes (BLOCK #01 to #10)
            expected_blocks = list(range(1, 11))
            success = (episode_count == 10 and 
                      unique_blocks == expected_blocks and 
                      len(block_numbers) == len(unique_blocks))
            
            if success:
                details = f"Found exactly 10 unique episodes (BLOCK #01-#10)"
            else:
                details = f"Found {episode_count} episodes, blocks: {unique_blocks}, expected: 1-10"
        
        return self.log_result("Timeline 10 Unique Episodes", success, details, {"count": len(data) if isinstance(data, list) else 0})

    def test_get_genres_count(self):
        """Test that 100+ genres exist"""
        status, data = self.make_request('GET', 'genres')
        success = False
        
        if status == 200 and isinstance(data, list):
            genre_count = len(data)
            success = genre_count >= 100
            details = f"Found {genre_count} genres (expected 100+)"
        else:
            details = f"Status: {status}, failed to get genres"
            
        return self.log_result("Genre Grid 100+ Genres", success, details)

    def test_pioneer_count(self):
        """Test pioneer count shows correct remaining spots"""
        status, data = self.make_request('GET', 'auth/pioneer-count')
        success = status == 200 and 'total_users' in data and 'pioneers_remaining' in data
        
        if success:
            remaining = data['pioneers_remaining']
            total = data['total_users']
            details = f"Pioneer spots: {remaining} remaining, {total} total users"
        else:
            details = f"Status: {status}, Response: {data}"
            
        return self.log_result("Pioneer Count Correct", success, details, data)

    def test_admin_login(self):
        """Test admin login with provided credentials"""
        login_data = {
            "email": "admin@beatgoeson.com",
            "password": "Admin123!"
        }
        
        status, data = self.make_request('POST', 'auth/login', login_data)
        success = status == 200 and 'access_token' in data and 'user' in data
        
        if success:
            self.admin_token = data['access_token']
            user = data['user']
            is_admin = user.get('is_admin', False)
            details = f"Successfully logged in admin user, Admin status: {is_admin}"
            success = is_admin  # Must be admin
        else:
            details = f"Status: {status}, Response: {data}"
            
        return self.log_result("Admin User Login", success, details, data)

    def test_admin_dashboard_access(self):
        """Test admin can access dashboard data"""
        if not self.admin_token:
            return self.log_result("Admin Dashboard Access", False, "No admin token available", None)
        
        # Test accessing episodes as admin
        status, data = self.make_request('GET', 'episodes', auth_token=self.admin_token)
        success = status == 200 and isinstance(data, list)
        
        if success:
            details = f"Admin can access episodes list ({len(data)} episodes)"
        else:
            details = f"Failed to access episodes as admin: Status {status}"
            
        return self.log_result("Admin Dashboard Access", success, details)

    def test_episode_modal_data(self):
        """Test that episode data is complete for modal display"""
        status, episodes = self.make_request('GET', 'episodes')
        success = False
        
        if status == 200 and episodes and len(episodes) > 0:
            episode = episodes[0]  # Test first episode
            required_fields = ['id', 'title', 'subtitle', 'description', 'location', 'pioneers', 'year_start', 'year_end', 'image_url']
            
            missing_fields = [field for field in required_fields if field not in episode or not episode[field]]
            
            if not missing_fields:
                success = True
                details = f"Episode has all required fields for modal display"
            else:
                details = f"Episode missing fields: {missing_fields}"
        else:
            details = f"No episodes available to test"
            
        return self.log_result("Episode Modal Data Complete", success, details)

    def test_new_user_signup(self):
        """Test new pioneer user signup"""
        test_email = f"pioneer_{datetime.now().strftime('%H%M%S')}@example.com"
        user_data = {
            "name": "New Pioneer",
            "email": test_email,
            "password": "Test123!"
        }
        
        status, data = self.make_request('POST', 'auth/signup', user_data)
        success = status == 200 and 'access_token' in data and 'user' in data
        
        if success:
            self.token = data['access_token']
            user = data['user']
            is_pioneer = user.get('is_pioneer', False)
            pioneer_number = user.get('pioneer_number')
            details = f"Created pioneer user, Pioneer: {is_pioneer}"
            if is_pioneer and pioneer_number:
                details += f" (#{pioneer_number})"
        else:
            details = f"Status: {status}, Response: {data}"
            
        return self.log_result("New Pioneer Signup", success, details, data)

    def test_jwt_token_persistence(self):
        """Test JWT auth token works and user stays logged in"""
        if not self.token:
            return self.log_result("JWT Token Persistence", False, "No user token available", None)
        
        status, data = self.make_request('GET', 'auth/me', auth_token=self.token)
        success = status == 200 and 'id' in data and 'email' in data
        
        if success:
            details = f"JWT token valid, user stays logged in: {data['email']}"
        else:
            details = f"JWT token validation failed: Status {status}"
            
        return self.log_result("JWT Token Persistence", success, details, data)

    def test_admin_episode_operations(self):
        """Test admin can create, view, update episodes"""
        if not self.admin_token:
            return self.log_result("Admin Episode Operations", False, "No admin token available", None)
        
        # Test creating episode
        episode_data = {
            "block_number": 50,
            "year_start": 2024,
            "year_end": 2026,
            "title": "Test Admin Episode",
            "subtitle": "Testing Admin Powers",
            "description": "This episode tests admin functionality.",
            "location": "Test Lab",
            "pioneers": ["Admin Tester"],
            "image_url": "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=800"
        }
        
        status, data = self.make_request('POST', 'episodes', episode_data, self.admin_token)
        create_success = status in [200, 201]
        
        if create_success and isinstance(data, dict) and 'id' in data:
            episode_id = data['id']
            
            # Test updating episode
            update_data = episode_data.copy()
            update_data['title'] = 'Updated Admin Episode'
            
            status, update_result = self.make_request('PUT', f'episodes/{episode_id}', update_data, self.admin_token)
            update_success = status == 200
            
            # Clean up - delete episode
            status, delete_result = self.make_request('DELETE', f'episodes/{episode_id}', auth_token=self.admin_token)
            delete_success = status == 200
            
            if create_success and update_success and delete_success:
                details = "Admin can create, update, and delete episodes"
                success = True
            else:
                details = f"Create: {create_success}, Update: {update_success}, Delete: {delete_success}"
                success = False
        else:
            details = f"Failed to create episode: Status {status}, Response: {data}"
            success = False
            
        return self.log_result("Admin Episode Operations", success, details)

    def print_summary(self):
        """Print test summary"""
        print("\n" + "="*60)
        print("🎵 THE BEAT GOES ON - FEATURE TEST SUMMARY")
        print("="*60)
        print(f"Total Tests: {self.tests_run}")
        print(f"Passed: {self.tests_passed}")
        print(f"Failed: {len(self.failed_tests)}")
        print(f"Success Rate: {(self.tests_passed/self.tests_run*100):.1f}%" if self.tests_run > 0 else "0%")
        
        if self.failed_tests:
            print("\n❌ FAILED TESTS:")
            for failure in self.failed_tests:
                print(f"  • {failure}")
        
        print("="*60)
        return len(self.failed_tests) == 0

def main():
    """Run all feature tests based on review requirements"""
    print("🎵 Testing The Beat Goes On Features...")
    print("="*60)
    
    tester = BeatGoesOnAPITester()
    
    # Feature tests based on review request
    tester.test_api_root()
    tester.test_get_episodes_count()  # Timeline displays exactly 10 unique episodes
    tester.test_get_genres_count()    # Genre grid with 100+ genres
    tester.test_pioneer_count()       # Pioneer count shows correct remaining spots
    tester.test_admin_login()         # Admin user can log in
    tester.test_admin_dashboard_access()  # Admin user can access /admin dashboard
    tester.test_episode_modal_data()  # Episode modal data complete
    tester.test_new_user_signup()     # Sign up creates new pioneer user
    tester.test_jwt_token_persistence() # JWT auth token stored and user stays logged in
    tester.test_admin_episode_operations()  # Admin episode management
    
    # Print results
    success = tester.print_summary()
    
    # Save results to file
    with open('/app/test_reports/backend_test_results_iteration_2.json', 'w') as f:
        json.dump(tester.results, f, indent=2)
    
    return 0 if success else 1

if __name__ == "__main__":
    sys.exit(main())