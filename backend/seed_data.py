#!/usr/bin/env python3
"""Seed database with initial data for testing"""
import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
import os
from dotenv import load_dotenv
from pathlib import Path
from auth import get_password_hash
from models import UserRole
from datetime import datetime, timezone

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

mongo_url = os.environ['MONGO_URL']
db_name = os.environ['DB_NAME']

async def seed_database():
    client = AsyncIOMotorClient(mongo_url)
    db = client[db_name]
    
    print("Seeding database...")
    
    # Clear existing data
    await db.users.delete_many({})
    await db.vendors.delete_many({})
    await db.orders.delete_many({})
    await db.payment_sessions.delete_many({})
    await db.pricing_audits.delete_many({})
    
    # Clear customer data
    await db.customers.delete_many({})
    
    # Seed admin user
    admin_user = {
        "id": "user_admin_001",
        "email": "admin@vaishnavi.com",
        "password_hash": get_password_hash("admin123"),
        "role": UserRole.SUPER_ADMIN.value,
        "is_active": True,
        "twofa_enabled": False,
        "twofa_secret": None,
        "created_at": datetime.now(timezone.utc).isoformat(),
        "updated_at": datetime.now(timezone.utc).isoformat()
    }
    await db.users.insert_one(admin_user)
    print("✓ Admin user created (admin@vaishnavi.com / admin123)")
    
    # Seed test customer
    test_customer = {
        "id": "cust_test_001",
        "email": "customer@test.com",
        "password_hash": get_password_hash("customer123"),
        "name": "Test Customer",
        "mobile": "+919876543210",
        "email_verified": True,
        "mobile_verified": True,
        "created_at": datetime.now(timezone.utc).isoformat(),
        "updated_at": datetime.now(timezone.utc).isoformat()
    }
    await db.customers.insert_one(test_customer)
    print("✓ Test customer created (customer@test.com / customer123 | Mobile: +919876543210)")
    
    # Seed vendors
    vendors = [
        {
            "id": "vendor_central",
            "name": "Vaishnavi Printers - Central Store",
            "shop_name": "Vaishnavi Central",
            "registration_number": "VP-VND-2025001234",
            "certified": True,
            "badge": "gold",
            "location": {
                "latitude": 12.9716,
                "longitude": 77.5946,
                "address": "MG Road, Bangalore",
                "city": "Bangalore",
                "pincode": "560001"
            },
            "contact_phone": "+919876543210",
            "contact_email": "central@vaishnavi.com",
            "password_hash": get_password_hash("vendor123"),
            "address": "123 MG Road, Bangalore 560001",
            "working_hours": "9 AM - 9 PM",
            "store_open": True,
            "current_workload_count": 0,
            "total_sales": 250,
            "total_earnings": 125000.0,
            "description": "Premium printing services with 10+ years experience",
            "payout_history": [],
            "autoAcceptRadiusKm": 5.0,
            "is_active": True,
            "created_at": datetime.now(timezone.utc).isoformat(),
            "updated_at": datetime.now(timezone.utc).isoformat()
        },
        {
            "id": "vendor_north",
            "name": "Vaishnavi Printers - North Branch",
            "shop_name": "Vaishnavi North",
            "registration_number": "VP-VND-2025002345",
            "certified": False,
            "badge": "silver",
            "location": {
                "latitude": 13.0358,
                "longitude": 77.5970,
                "address": "Hebbal, Bangalore",
                "city": "Bangalore",
                "pincode": "560024"
            },
            "contact_phone": "+919876543211",
            "contact_email": "north@vaishnavi.com",
            "password_hash": get_password_hash("vendor123"),
            "address": "456 Hebbal Main Road, Bangalore 560024",
            "working_hours": "8 AM - 8 PM",
            "store_open": False,
            "current_workload_count": 0,
            "total_sales": 75,
            "total_earnings": 45000.0,
            "description": "Fast service for North Bangalore customers",
            "payout_history": [],
            "autoAcceptRadiusKm": 7.0,
            "is_active": True,
            "created_at": datetime.now(timezone.utc).isoformat(),
            "updated_at": datetime.now(timezone.utc).isoformat()
        },
        {
            "id": "vendor_south",
            "name": "Vaishnavi Printers - South Branch",
            "shop_name": "Vaishnavi South",
            "registration_number": "VP-VND-2025003456",
            "certified": True,
            "badge": "bronze",
            "location": {
                "latitude": 12.9141,
                "longitude": 77.6411,
                "address": "HSR Layout, Bangalore",
                "city": "Bangalore",
                "pincode": "560102"
            },
            "contact_phone": "+919876543212",
            "contact_email": "south@vaishnavi.com",
            "password_hash": get_password_hash("vendor123"),
            "address": "789 HSR Layout Sector 1, Bangalore 560102",
            "working_hours": "10 AM - 7 PM",
            "store_open": True,
            "current_workload_count": 2,
            "total_sales": 25,
            "total_earnings": 15000.0,
            "description": "Quality printing for HSR and nearby areas",
            "payout_history": [],
            "autoAcceptRadiusKm": 6.0,
            "is_active": True,
            "created_at": datetime.now(timezone.utc).isoformat(),
            "updated_at": datetime.now(timezone.utc).isoformat()
        }
    ]
    await db.vendors.insert_many(vendors)
    print(f"✓ {len(vendors)} vendors created")
    
    print("\n✅ Database seeded successfully!")
    print("\n=== Test Credentials ===")
    print("\n🔐 Admin Portal:")
    print("  Email: admin@vaishnavi.com")
    print("  Password: admin123")
    print("\n👤 Customer Portal:")
    print("  Email: customer@test.com")
    print("  Password: customer123")
    print("  Mobile: +919876543210")
    print("\n🏪 Vendor Portal:")
    print("  Email: central@vaishnavi.com")
    print("  Password: vendor123")
    print("\n  (North & South vendors use same password with their respective emails)")
    
    client.close()

if __name__ == "__main__":
    asyncio.run(seed_database())
