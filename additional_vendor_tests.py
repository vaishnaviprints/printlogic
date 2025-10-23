#!/usr/bin/env python3
"""
Additional Vendor API Tests - Edge Cases and Error Scenarios
"""

import requests
import json
from datetime import datetime

BACKEND_URL = "https://printify-app.preview.emergentagent.com/api"

class AdditionalVendorTests:
    def __init__(self):
        self.base_url = BACKEND_URL
        self.session = requests.Session()
        
    def log(self, message, level="INFO"):
        timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        print(f"[{timestamp}] [{level}] {message}")
    
    def test_invalid_credentials(self):
        """Test login with invalid credentials"""
        self.log("Testing login with invalid credentials...")
        
        login_data = {
            'email': 'invalid@email.com',
            'password': 'wrongpassword'
        }
        
        response = self.session.post(
            f"{self.base_url}/auth/vendor/login",
            data=login_data,
            headers={'Content-Type': 'application/x-www-form-urlencoded'}
        )
        
        if response.status_code == 401:
            self.log("✅ Invalid credentials correctly rejected with 401")
            return True
        else:
            self.log(f"❌ Expected 401, got {response.status_code}")
            return False
    
    def test_dashboard_without_token(self):
        """Test dashboard access without authentication"""
        self.log("Testing dashboard access without token...")
        
        response = self.session.get(f"{self.base_url}/vendor/dashboard")
        
        if response.status_code == 401:
            self.log("✅ Dashboard correctly requires authentication (401)")
            return True
        else:
            self.log(f"❌ Expected 401, got {response.status_code}")
            return False
    
    def test_dashboard_with_invalid_token(self):
        """Test dashboard with invalid token"""
        self.log("Testing dashboard with invalid token...")
        
        headers = {'Authorization': 'Bearer invalid_token_here'}
        response = self.session.get(
            f"{self.base_url}/vendor/dashboard",
            headers=headers
        )
        
        if response.status_code == 401:
            self.log("✅ Invalid token correctly rejected (401)")
            return True
        else:
            self.log(f"❌ Expected 401, got {response.status_code}")
            return False
    
    def test_malformed_auth_header(self):
        """Test dashboard with malformed Authorization header"""
        self.log("Testing dashboard with malformed auth header...")
        
        headers = {'Authorization': 'InvalidFormat token_here'}
        response = self.session.get(
            f"{self.base_url}/vendor/dashboard",
            headers=headers
        )
        
        if response.status_code == 401:
            self.log("✅ Malformed auth header correctly rejected (401)")
            return True
        else:
            self.log(f"❌ Expected 401, got {response.status_code}")
            return False
    
    def run_all_tests(self):
        """Run all additional tests"""
        self.log("=" * 50)
        self.log("RUNNING ADDITIONAL VENDOR API TESTS")
        self.log("=" * 50)
        
        tests = [
            self.test_invalid_credentials,
            self.test_dashboard_without_token,
            self.test_dashboard_with_invalid_token,
            self.test_malformed_auth_header
        ]
        
        passed = 0
        total = len(tests)
        
        for test in tests:
            if test():
                passed += 1
        
        self.log("=" * 50)
        self.log(f"RESULTS: {passed}/{total} tests passed")
        
        if passed == total:
            self.log("✅ ALL ADDITIONAL TESTS PASSED")
            return True
        else:
            self.log("❌ SOME TESTS FAILED")
            return False

if __name__ == "__main__":
    tester = AdditionalVendorTests()
    success = tester.run_all_tests()
    
    if success:
        print("\n🎉 All additional tests passed!")
    else:
        print("\n💥 Some additional tests failed!")