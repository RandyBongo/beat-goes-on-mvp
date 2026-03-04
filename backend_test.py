#!/usr/bin/env python3
"""
Backend API Testing for The Beat Goes On - Dance Music Documentary Protocol
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
        elif self.token:
            headers['Authorization'] = f'Bearer {self.token}'

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

    def test_seed_data(self):
        """Test seeding initial data"""
        status, data = self.make_request('POST', 'seed')
        success = status == 200
        return self.log_result("Seed Data", success, f"Status: {status}, Response: {data}", data)

    def test_get_episodes(self):
        """Test fetching episodes"""
        status, data = self.make_request('GET', 'episodes')
        success = status == 200 and isinstance(data, list)
        episode_count = len(data) if isinstance(data, list) else 0
        
        # Check for duplicates
        if isinstance(data, list) and episode_count > 0:
            block_numbers = [ep.get('block_number') for ep in data]
            unique_blocks = set(block_numbers)
            has_duplicates = len(block_numbers) != len(unique_blocks)
            
            if has_duplicates:
                duplicates = [x for x in unique_blocks if block_numbers.count(x) > 1]
                success = False
                return self.log_result("Get Episodes", success, f"Found duplicate block numbers: {duplicates}", data)
        
        return self.log_result("Get Episodes", success, f"Found {episode_count} episodes", {"count": episode_count, "episodes": data[:2] if data else []})

    def test_get_genres(self):
        """Test fetching genres"""
        status, data = self.make_request('GET', 'genres')
        success = status == 200 and isinstance(data, list)
        genre_count = len(data) if isinstance(data, list) else 0
        return self.log_result("Get Genres", success, f"Found {genre_count} genres", {"count": genre_count})

    def test_pioneer_count(self):
        """Test pioneer count endpoint"""
        status, data = self.make_request('GET', 'auth/pioneer-count')
        success = status == 200 and 'total_users' in data and 'pioneers_remaining' in data
        return self.log_result("Pioneer Count", success, f"Status: {status}, Data: {data}", data)

    def test_user_signup(self):
        """Test user signup"""
        test_email = f"test_{datetime.now().strftime('%H%M%S')}@example.com"
        user_data = {
            "name": "Test User",
            "email": test_email,
            "password": "Test123!"
        }
        
        status, data = self.make_request('POST', 'auth/signup', user_data)
        success = status == 200 and 'access_token' in data and 'user' in data
        
        if success:
            self.token = data['access_token']
            self.test_user_id = data['user']['id']
            is_pioneer = data['user'].get('is_pioneer', False)
            pioneer_number = data['user'].get('pioneer_number')
            details = f"Created user {test_email}, Pioneer: {is_pioneer}"
            if is_pioneer:
                details += f" (#{pioneer_number})"
        else:
            details = f"Status: {status}, Response: {data}"
            
        return self.log_result("User Signup", success, details, data)

    def test_user_login(self):
        """Test user login with created account"""
        if not hasattr(self, '_signup_email'):
            # Create a test user first
            test_email = f"login_test_{datetime.now().strftime('%H%M%S')}@example.com"
            signup_data = {
                "name": "Login Test User", 
                "email": test_email,
                "password": "Test123!"
            }
            status, data = self.make_request('POST', 'auth/signup', signup_data)
            if status != 200:
                return self.log_result("User Login", False, f"Failed to create test user for login test: {status}", data)
            self._signup_email = test_email
        else:
            test_email = self._signup_email
            
        # Now test login
        login_data = {
            "email": test_email,
            "password": "Test123!"
        }
        
        status, data = self.make_request('POST', 'auth/login', login_data)
        success = status == 200 and 'access_token' in data
        
        if success:
            login_token = data['access_token']
            details = f"Successfully logged in {test_email}"
        else:
            details = f"Status: {status}, Response: {data}"
            
        return self.log_result("User Login", success, details, data)

    def test_get_current_user(self):
        """Test getting current user info"""
        if not self.token:
            return self.log_result("Get Current User", False, "No auth token available", None)
        
        status, data = self.make_request('GET', 'auth/me')
        success = status == 200 and 'id' in data and 'email' in data
        return self.log_result("Get Current User", success, f"Status: {status}", data)

    def test_admin_signup(self):
        """Test first user becomes admin"""
        # This test assumes we're testing on fresh database or first user
        admin_email = f"admin_{datetime.now().strftime('%H%M%S')}@example.com"
        admin_data = {
            "name": "Admin User",
            "email": admin_email,
            "password": "Admin123!"
        }
        
        status, data = self.make_request('POST', 'auth/signup', admin_data)
        success = status == 200 and 'access_token' in data
        
        if success:
            self.admin_token = data['access_token']
            self.admin_user_id = data['user']['id']
            is_admin = data['user'].get('is_admin', False)
            details = f"Created admin user {admin_email}, Admin status: {is_admin}"
        else:
            details = f"Status: {status}, Response: {data}"
            
        return self.log_result("Admin Signup", success, details, data)

    def test_create_episode_admin(self):
        """Test creating episode as admin"""
        if not self.admin_token:
            return self.log_result("Create Episode (Admin)", False, "No admin token available", None)
        
        episode_data = {
            "block_number": 99,
            "year_start": 2024,
            "year_end": 2026,
            "title": "Test Episode",
            "subtitle": "API Testing Block",
            "description": "This is a test episode created during API testing to verify admin functionality.",
            "location": "Test Environment",
            "pioneers": ["Test Pioneer 1", "Test Pioneer 2"],
            "image_url": "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=800"
        }
        
        status, data = self.make_request('POST', 'episodes', episode_data, self.admin_token)
        success = status == 201 or status == 200  # Accept both 200 and 201
        
        if success and isinstance(data, dict) and 'id' in data:
            self.test_episode_id = data['id']
            details = f"Created episode with ID: {data['id']}"
        else:
            details = f"Status: {status}, Response: {data}"
            
        return self.log_result("Create Episode (Admin)", success, details, data)

    def test_get_single_episode(self):
        """Test getting single episode by ID"""
        if not self.test_episode_id:
            # Try to get first available episode
            status, episodes = self.make_request('GET', 'episodes')
            if status == 200 and episodes and len(episodes) > 0:
                self.test_episode_id = episodes[0]['id']
            else:
                return self.log_result("Get Single Episode", False, "No episodes available to test", None)
        
        status, data = self.make_request('GET', f'episodes/{self.test_episode_id}')
        success = status == 200 and isinstance(data, dict) and 'id' in data
        return self.log_result("Get Single Episode", success, f"Status: {status}", data)

    def test_update_episode_admin(self):
        """Test updating episode as admin"""
        if not self.admin_token or not self.test_episode_id:
            return self.log_result("Update Episode (Admin)", False, "No admin token or episode ID", None)
        
        update_data = {
            "block_number": 99,
            "year_start": 2024,
            "year_end": 2026,
            "title": "Updated Test Episode",
            "subtitle": "Updated API Testing Block",
            "description": "This episode has been updated during API testing.",
            "location": "Updated Test Environment",
            "pioneers": ["Updated Pioneer 1", "Updated Pioneer 2"],
            "image_url": "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=800"
        }
        
        status, data = self.make_request('PUT', f'episodes/{self.test_episode_id}', update_data, self.admin_token)
        success = status == 200 and isinstance(data, dict)
        return self.log_result("Update Episode (Admin)", success, f"Status: {status}", data)

    def test_delete_episode_admin(self):
        """Test deleting episode as admin"""
        if not self.admin_token or not self.test_episode_id:
            return self.log_result("Delete Episode (Admin)", False, "No admin token or episode ID", None)
        
        status, data = self.make_request('DELETE', f'episodes/{self.test_episode_id}', auth_token=self.admin_token)
        success = status == 200 and 'message' in data
        return self.log_result("Delete Episode (Admin)", success, f"Status: {status}, Response: {data}", data)

    def test_unauthorized_episode_creation(self):
        """Test creating episode without admin privileges"""
        episode_data = {
            "block_number": 98,
            "year_start": 2024,
            "year_end": 2026,
            "title": "Unauthorized Test",
            "subtitle": "Should Fail",
            "description": "This should fail without admin access.",
            "location": "Unauthorized",
            "pioneers": ["Test"],
            "image_url": "https://example.com/image.jpg"
        }
        
        # Use regular user token instead of admin
        status, data = self.make_request('POST', 'episodes', episode_data, self.token)
        success = status == 403  # Should be forbidden
        return self.log_result("Unauthorized Episode Creation", success, f"Correctly blocked: Status {status}", data)

    def print_summary(self):
        """Print test summary"""
        print("\n" + "="*60)
        print("🎵 THE BEAT GOES ON - API TEST SUMMARY")
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
    """Run all API tests"""
    print("🎵 Testing The Beat Goes On API...")
    print("="*60)
    
    tester = BeatGoesOnAPITester()
    
    # Core API tests
    tester.test_api_root()
    tester.test_seed_data()
    tester.test_get_episodes()
    tester.test_get_genres()
    tester.test_pioneer_count()
    
    # Authentication tests  
    tester.test_user_signup()
    tester.test_user_login()
    tester.test_get_current_user()
    
    # Admin functionality tests
    tester.test_admin_signup()
    tester.test_create_episode_admin()
    tester.test_get_single_episode()
    tester.test_update_episode_admin()
    tester.test_unauthorized_episode_creation()
    tester.test_delete_episode_admin()
    
    # Print results
    success = tester.print_summary()
    
    # Save results to file
    with open('/app/test_reports/backend_test_results.json', 'w') as f:
        json.dump(tester.results, f, indent=2)
    
    return 0 if success else 1

if __name__ == "__main__":
    sys.exit(main())