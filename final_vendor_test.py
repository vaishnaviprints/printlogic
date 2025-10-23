#!/usr/bin/env python3
"""
Final Comprehensive Vendor Authentication and Dashboard Test
This test validates the exact scenario described in the review request
"""

import requests
import json
from datetime import datetime

BACKEND_URL = "https://printify-app.preview.emergentagent.com/api"
VENDOR_EMAIL = "central@vaishnavi.com"
VENDOR_PASSWORD = "vendor123"

def main():
    print("=" * 80)
    print("FINAL VENDOR AUTHENTICATION AND DASHBOARD TEST")
    print("=" * 80)
    print(f"Backend URL: {BACKEND_URL}")
    print(f"Vendor Email: {VENDOR_EMAIL}")
    print(f"Test Time: {datetime.now().isoformat()}")
    print()
    
    session = requests.Session()
    
    # Step 1: Login as vendor
    print("STEP 1: Login as vendor with credentials")
    print("-" * 40)
    
    login_data = {
        'email': VENDOR_EMAIL,
        'password': VENDOR_PASSWORD
    }
    
    login_response = session.post(
        f"{BACKEND_URL}/auth/vendor/login",
        data=login_data,
        headers={'Content-Type': 'application/x-www-form-urlencoded'}
    )
    
    print(f"Login Status Code: {login_response.status_code}")
    
    if login_response.status_code != 200:
        print("❌ LOGIN FAILED")
        print(f"Response: {login_response.text}")
        return False
    
    login_data = login_response.json()
    print("✅ LOGIN SUCCESSFUL")
    print(f"Response: {json.dumps(login_data, indent=2)}")
    
    # Step 2: Capture access_token
    print("\nSTEP 2: Capture access_token from login response")
    print("-" * 40)
    
    if 'access_token' not in login_data:
        print("❌ NO ACCESS TOKEN IN RESPONSE")
        return False
    
    access_token = login_data['access_token']
    print(f"✅ ACCESS TOKEN CAPTURED: {access_token[:50]}...")
    
    # Step 3: Use token to call dashboard API
    print("\nSTEP 3: Call GET /api/vendor/dashboard with Authorization: Bearer {token}")
    print("-" * 40)
    
    headers = {
        'Authorization': f'Bearer {access_token}',
        'Content-Type': 'application/json'
    }
    
    dashboard_response = session.get(
        f"{BACKEND_URL}/vendor/dashboard",
        headers=headers
    )
    
    print(f"Dashboard Status Code: {dashboard_response.status_code}")
    
    if dashboard_response.status_code != 200:
        print("❌ DASHBOARD API FAILED")
        print(f"Response: {dashboard_response.text}")
        return False
    
    dashboard_data = dashboard_response.json()
    print("✅ DASHBOARD API SUCCESSFUL")
    print(f"Response: {json.dumps(dashboard_data, indent=2)}")
    
    # Step 4: Verify dashboard returns vendor data with badge field
    print("\nSTEP 4: Verify dashboard returns vendor data with badge field")
    print("-" * 40)
    
    if 'vendor' not in dashboard_data:
        print("❌ NO VENDOR OBJECT IN DASHBOARD RESPONSE")
        return False
    
    vendor_data = dashboard_data['vendor']
    required_fields = ['id', 'name', 'shop_name', 'badge', 'total_sales', 'total_earnings', 'is_online']
    
    missing_fields = []
    for field in required_fields:
        if field not in vendor_data:
            missing_fields.append(field)
    
    if missing_fields:
        print(f"❌ MISSING REQUIRED FIELDS: {missing_fields}")
        return False
    
    print("✅ ALL REQUIRED FIELDS PRESENT")
    print(f"Vendor ID: {vendor_data['id']}")
    print(f"Vendor Name: {vendor_data['name']}")
    print(f"Shop Name: {vendor_data['shop_name']}")
    print(f"Badge: {vendor_data['badge']}")
    print(f"Total Sales: {vendor_data['total_sales']}")
    print(f"Total Earnings: {vendor_data['total_earnings']}")
    print(f"Is Online: {vendor_data['is_online']}")
    
    print("\n" + "=" * 80)
    print("🎉 ALL TEST STEPS COMPLETED SUCCESSFULLY!")
    print("✅ Login works (200 OK)")
    print("✅ Access token captured")
    print("✅ Dashboard API works (200 OK)")
    print("✅ Vendor data contains badge field")
    print("✅ Authentication issue has been RESOLVED")
    print("=" * 80)
    
    return True

if __name__ == "__main__":
    success = main()
    if not success:
        exit(1)