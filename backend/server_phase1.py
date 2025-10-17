from fastapi import FastAPI, APIRouter, HTTPException, Depends, Request, File, UploadFile
from fastapi.security import HTTPBearer
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import socketio
import os
import logging
from pathlib import Path
from typing import List, Optional
from datetime import datetime, timezone
import uuid

# Import models and services
from models import *
from auth import get_current_user, require_role
from customer_auth import generate_otp, send_otp_sms, store_otp, verify_otp, create_customer_token, pwd_context
from vendor_auth import create_vendor_token, verify_password as verify_vendor_password, get_password_hash
from pricing import get_active_price_rule, calculate_estimate, load_price_rules, save_price_rules
from vendors import auto_assign_vendor
from delivery import get_delivery_quotes, select_cheapest_partner, book_delivery
from payments import create_payment_session, verify_webhook_signature, handle_payment_webhook, get_active_gateway
from notifications import NotificationService
from uploads import generate_upload_signed_url, simulate_virus_scan
from socketio_manager import sio, notify_vendor

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Create the main app
app = FastAPI(title="Vaishnavi Printers API - Phase 1")
api_router = APIRouter(prefix="/api")

# Wrap FastAPI app with Socket.IO
socket_app = socketio.ASGIApp(sio, app)

# Notification service
notification_service = NotificationService(mode="SIMULATED")

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

# ==================== CUSTOMER AUTH ENDPOINTS ====================

@api_router.post("/auth/customer/register")
async def customer_register(email: str, password: str, name: str, mobile: str):
    """Register new customer with email+password"""
    # Check if customer exists
    existing = await db.customers.find_one({"$or": [{"email": email}, {"mobile": mobile}]})
    if existing:
        raise HTTPException(status_code=400, detail="Email or mobile already registered")
    
    # Create customer
    customer = {
        "id": f"cust_{uuid.uuid4().hex[:12]}",
        "email": email,
        "password_hash": pwd_context.hash(password),
        "name": name,
        "mobile": mobile,
        "email_verified": False,
        "mobile_verified": False,
        "created_at": datetime.now(timezone.utc).isoformat(),
        "updated_at": datetime.now(timezone.utc).isoformat()
    }
    
    await db.customers.insert_one(customer)
    
    # Create token
    token = create_customer_token(customer['id'], email, mobile)
    
    return {
        "access_token": token,
        "token_type": "bearer",
        "customer": {
            "id": customer['id'],
            "email": email,
            "name": name,
            "mobile": mobile
        }
    }

@api_router.post("/auth/customer/login")
async def customer_login(email: str, password: str):
    """Login customer with email+password"""
    customer = await db.customers.find_one({"email": email})
    if not customer or not pwd_context.verify(password, customer['password_hash']):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    token = create_customer_token(customer['id'], customer['email'], customer['mobile'])
    
    return {
        "access_token": token,
        "token_type": "bearer",
        "customer": {
            "id": customer['id'],
            "email": customer['email'],
            "name": customer['name'],
            "mobile": customer['mobile']
        }
    }

@api_router.post("/auth/customer/request-otp")
async def request_mobile_otp(mobile: str):
    """Send OTP to mobile for login"""
    # Check if customer exists
    customer = await db.customers.find_one({"mobile": mobile})
    if not customer:
        raise HTTPException(status_code=404, detail="Mobile not registered")
    
    # Generate and send OTP
    otp = generate_otp()
    store_otp(mobile, otp)
    send_otp_sms(mobile, otp)
    
    return {"message": "OTP sent successfully", "mobile": mobile}

@api_router.post("/auth/customer/verify-otp")
async def verify_mobile_otp(mobile: str, otp: str):
    """Verify OTP and login"""
    if not verify_otp(mobile, otp):
        raise HTTPException(status_code=401, detail="Invalid or expired OTP")
    
    # Get customer
    customer = await db.customers.find_one({"mobile": mobile})
    if not customer:
        raise HTTPException(status_code=404, detail="Customer not found")
    
    # Mark mobile as verified
    await db.customers.update_one(
        {"id": customer['id']},
        {"$set": {"mobile_verified": True, "updated_at": datetime.now(timezone.utc).isoformat()}}
    )
    
    token = create_customer_token(customer['id'], customer['email'], mobile)
    
    return {
        "access_token": token,
        "token_type": "bearer",
        "customer": {
            "id": customer['id'],
            "email": customer['email'],
            "name": customer['name'],
            "mobile": mobile
        }
    }

@api_router.get("/auth/customer/me")
async def get_customer_profile(current_user: dict = Depends(get_current_user)):
    """Get current customer profile"""
    if current_user.get('type') != 'customer':
        raise HTTPException(status_code=403, detail="Not a customer account")
    
    customer = await db.customers.find_one({"id": current_user['sub']}, {"_id": 0, "password_hash": 0})
    if not customer:
        raise HTTPException(status_code=404, detail="Customer not found")
    
    return customer

# ==================== CUSTOMER MY ORDERS ====================

@api_router.get("/customer/orders")
async def get_customer_orders(current_user: dict = Depends(get_current_user)):
    """Get all orders for logged-in customer"""
    if current_user.get('type') != 'customer':
        raise HTTPException(status_code=403, detail="Not a customer account")
    
    customer = await db.customers.find_one({"id": current_user['sub']})
    if not customer:
        raise HTTPException(status_code=404, detail="Customer not found")
    
    # Get orders by customer email
    orders = await db.orders.find(
        {"customer_email": customer['email']},
        {"_id": 0}
    ).sort("created_at", -1).to_list(100)
    
    # Convert datetime fields
    for order in orders:
        if isinstance(order.get('created_at'), str):
            order['created_at'] = datetime.fromisoformat(order['created_at'])
        if isinstance(order.get('updated_at'), str):
            order['updated_at'] = datetime.fromisoformat(order['updated_at'])
    
    return orders

# ==================== VENDOR AUTH & DASHBOARD ====================

@api_router.post("/auth/vendor/login")
async def vendor_login(email: str, password: str):
    """Login vendor"""
    vendor = await db.vendors.find_one({"contact_email": email})
    if not vendor:
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    # Check if vendor has password (add during seeding)
    if 'password_hash' not in vendor:
        raise HTTPException(status_code=401, detail="Vendor account not configured")
    
    if not verify_vendor_password(password, vendor['password_hash']):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    token = create_vendor_token(vendor['id'], vendor['contact_email'], vendor['name'])
    
    return {
        "access_token": token,
        "token_type": "bearer",
        "vendor": {
            "id": vendor['id'],
            "name": vendor['name'],
            "email": vendor['contact_email']
        }
    }

@api_router.get("/vendor/orders")
async def get_vendor_orders(current_user: dict = Depends(get_current_user)):
    """Get all orders assigned to vendor"""
    if current_user.get('type') != 'vendor':
        raise HTTPException(status_code=403, detail="Not a vendor account")
    
    vendor_id = current_user['sub']
    
    # Get orders assigned to this vendor
    orders = await db.orders.find(
        {"assigned_vendor_id": vendor_id},
        {"_id": 0}
    ).sort("created_at", -1).to_list(100)
    
    # Convert datetime fields
    for order in orders:
        if isinstance(order.get('created_at'), str):
            order['created_at'] = datetime.fromisoformat(order['created_at'])
        if isinstance(order.get('updated_at'), str):
            order['updated_at'] = datetime.fromisoformat(order['updated_at'])
    
    return orders

@api_router.patch("/vendor/orders/{order_id}/accept")
async def vendor_accept_order(order_id: str, current_user: dict = Depends(get_current_user)):
    """Vendor accepts order"""
    if current_user.get('type') != 'vendor':
        raise HTTPException(status_code=403, detail="Not a vendor account")
    
    order = await db.orders.find_one({"id": order_id})
    if not order or order.get('assigned_vendor_id') != current_user['sub']:
        raise HTTPException(status_code=404, detail="Order not found")
    
    # Update order status
    status_update = {
        "status": "Assigned",
        "by": current_user['sub'],
        "note": "Vendor accepted order",
        "at": datetime.now(timezone.utc).isoformat()
    }
    
    await db.orders.update_one(
        {"id": order_id},
        {
            "$set": {"status": OrderStatus.ASSIGNED.value, "updated_at": datetime.now(timezone.utc).isoformat()},
            "$push": {"statusHistory": status_update}
        }
    )
    
    return {"message": "Order accepted"}

@api_router.patch("/vendor/orders/{order_id}/start")
async def vendor_start_order(order_id: str, current_user: dict = Depends(get_current_user)):
    """Vendor starts production"""
    if current_user.get('type') != 'vendor':
        raise HTTPException(status_code=403, detail="Not a vendor account")
    
    status_update = {
        "status": "InProduction",
        "by": current_user['sub'],
        "note": "Production started",
        "at": datetime.now(timezone.utc).isoformat()
    }
    
    await db.orders.update_one(
        {"id": order_id},
        {
            "$set": {"status": OrderStatus.IN_PRODUCTION.value, "updated_at": datetime.now(timezone.utc).isoformat()},
            "$push": {"statusHistory": status_update}
        }
    )
    
    return {"message": "Production started"}

@api_router.patch("/vendor/orders/{order_id}/complete")
async def vendor_complete_order(order_id: str, proof_url: Optional[str] = None, current_user: dict = Depends(get_current_user)):
    """Vendor marks order as ready"""
    if current_user.get('type') != 'vendor':
        raise HTTPException(status_code=403, detail="Not a vendor account")
    
    order = await db.orders.find_one({"id": order_id})
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    
    # Determine next status based on fulfillment type
    if order['fulfillment_type'] == 'Pickup':
        new_status = OrderStatus.READY_FOR_PICKUP.value
        note = "Order ready for pickup"
    else:
        new_status = OrderStatus.READY_FOR_DELIVERY.value
        note = "Order ready for delivery"
    
    status_update = {
        "status": new_status,
        "by": current_user['sub'],
        "note": note,
        "at": datetime.now(timezone.utc).isoformat()
    }
    
    update_data = {
        "$set": {"status": new_status, "updated_at": datetime.now(timezone.utc).isoformat()},
        "$push": {"statusHistory": status_update}
    }
    
    if proof_url:
        update_data["$set"]["proof_url"] = proof_url
    
    await db.orders.update_one({"id": order_id}, update_data)
    
    # Send notification to customer
    await notification_service.send_whatsapp(
        order['customer_phone'],
        f"Your order {order_id} is ready!",
        order_id
    )
    
    return {"message": "Order marked as ready"}

# Continue in next part...
