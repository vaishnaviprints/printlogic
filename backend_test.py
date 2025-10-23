#!/usr/bin/env python3
"""
Backend API Testing for Vaishnavi Printers
Testing vendor authentication and dashboard functionality
"""

import requests
import json
import sys
import os
from datetime import datetime

# Configuration
BACKEND_URL = "https://printify-app.preview.emergentagent.com/api"
VENDOR_EMAIL = "central@vaishnavi.com"
VENDOR_PASSWORD = "vendor123"

class VendorAPITester:
    def __init__(self):
        self.base_url = BACKEND_URL
        self.access_token = None
        self.session = requests.Session()
        self.session.headers.update({
            'Content-Type': 'application/json',
            'Accept': 'application/json'
        })
        
    def log(self, message, level="INFO"):
        timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        print(f"[{timestamp}] [{level}] {message}")
        
    def test_vendor_login(self):
        """Test vendor login with provided credentials"""
        self.log("Testing vendor login...")
        
        # Use form data for login as per the backend implementation
        login_data = {
            'email': VENDOR_EMAIL,
            'password': VENDOR_PASSWORD
        }
        
        try:
            response = self.session.post(
                f"{self.base_url}/auth/vendor/login",
                data=login_data,  # Using form data instead of JSON
                headers={'Content-Type': 'application/x-www-form-urlencoded'}
            )
            
            self.log(f"Login response status: {response.status_code}")
            self.log(f"Login response headers: {dict(response.headers)}")
            
            if response.status_code == 200:
                response_data = response.json()
                self.log(f"Login response data: {json.dumps(response_data, indent=2)}")
                
                if 'access_token' in response_data:
                    self.access_token = response_data['access_token']
                    self.log("✅ Login successful - access token obtained")
                    return True, response_data
                else:
                    self.log("❌ Login failed - no access token in response")
                    return False, response_data
            else:
                self.log(f"❌ Login failed with status {response.status_code}")
                try:
                    error_data = response.json()
                    self.log(f"Error details: {json.dumps(error_data, indent=2)}")
                except:
                    self.log(f"Error response text: {response.text}")
                return False, None
                
        except Exception as e:
            self.log(f"❌ Login request failed: {str(e)}", "ERROR")
            return False, None
    
    def test_vendor_dashboard(self):
        """Test vendor dashboard API with authentication"""
        if not self.access_token:
            self.log("❌ No access token available for dashboard test")
            return False, None
            
        self.log("Testing vendor dashboard...")
        
        try:
            headers = {
                'Authorization': f'Bearer {self.access_token}',
                'Content-Type': 'application/json'
            }
            
            response = self.session.get(
                f"{self.base_url}/vendor/dashboard",
                headers=headers
            )
            
            self.log(f"Dashboard response status: {response.status_code}")
            self.log(f"Dashboard response headers: {dict(response.headers)}")
            
            if response.status_code == 200:
                response_data = response.json()
                self.log(f"Dashboard response data: {json.dumps(response_data, indent=2)}")
                
                # Verify expected fields
                if 'vendor' in response_data:
                    vendor_data = response_data['vendor']
                    required_fields = ['id', 'name', 'shop_name', 'badge', 'total_sales', 'total_earnings', 'is_online']
                    
                    missing_fields = [field for field in required_fields if field not in vendor_data]
                    if missing_fields:
                        self.log(f"❌ Dashboard missing required fields: {missing_fields}")
                        return False, response_data
                    else:
                        self.log("✅ Dashboard API successful - all required fields present")
                        self.log(f"Vendor badge: {vendor_data.get('badge', 'N/A')}")
                        return True, response_data
                else:
                    self.log("❌ Dashboard response missing 'vendor' field")
                    return False, response_data
            else:
                self.log(f"❌ Dashboard failed with status {response.status_code}")
                try:
                    error_data = response.json()
                    self.log(f"Error details: {json.dumps(error_data, indent=2)}")
                except:
                    self.log(f"Error response text: {response.text}")
                return False, None
                
        except Exception as e:
            self.log(f"❌ Dashboard request failed: {str(e)}", "ERROR")
            return False, None
    
    def check_vendor_exists(self):
        """Check if vendor exists by attempting to get vendor list (if accessible)"""
        self.log("Checking if vendor exists in system...")
        
        # Try to check if we can find any info about the vendor
        # This is just for debugging purposes
        try:
            # First, let's try a basic health check
            response = self.session.get(f"{self.base_url}/health")
            if response.status_code == 200:
                self.log("✅ Backend API is accessible")
            else:
                self.log(f"⚠️ Backend health check returned {response.status_code}")
                
        except Exception as e:
            self.log(f"❌ Backend not accessible: {str(e)}", "ERROR")
            return False
            
        return True
    
    def run_full_test(self):
        """Run complete vendor authentication and dashboard test"""
        self.log("=" * 60)
        self.log("STARTING VENDOR AUTHENTICATION AND DASHBOARD TEST")
        self.log("=" * 60)
        
        # Step 1: Check backend accessibility
        if not self.check_vendor_exists():
            self.log("❌ Backend not accessible, aborting tests")
            return False
        
        # Step 2: Test vendor login
        login_success, login_data = self.test_vendor_login()
        if not login_success:
            self.log("❌ Vendor login failed, cannot proceed with dashboard test")
            return False
        
        # Step 3: Test vendor dashboard
        dashboard_success, dashboard_data = self.test_vendor_dashboard()
        if not dashboard_success:
            self.log("❌ Vendor dashboard test failed")
            return False
        
        self.log("=" * 60)
        self.log("✅ ALL TESTS PASSED SUCCESSFULLY")
        self.log("=" * 60)
        return True

def main():
    """Main test execution"""
    tester = VendorAPITester()
    
    print(f"Testing Backend URL: {BACKEND_URL}")
    print(f"Vendor Email: {VENDOR_EMAIL}")
    print(f"Testing Time: {datetime.now().isoformat()}")
    print()
    
    success = tester.run_full_test()
    
    if success:
        print("\n🎉 All vendor authentication and dashboard tests completed successfully!")
        sys.exit(0)
    else:
        print("\n💥 Some tests failed. Check the logs above for details.")
        sys.exit(1)

if __name__ == "__main__":
    main()