from fastapi import FastAPI, APIRouter, HTTPException, Depends, Request, Form
from fastapi.security import HTTPBearer
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import socketio
import os
import logging
from pathlib import Path
from typing import List, Optional, Dict, Any
from datetime import datetime, timezone
import uuid
import json

# Import models and services
from models import (
    User, UserCreate, UserLogin, TokenResponse, UserRole,
    PriceRule, PriceRuleCreate, PriceRuleUpdate, PricingAudit,
    Vendor, VendorCreate, VendorLocation,
    Order, OrderCreate, OrderStatus, EstimateRequest, EstimateResponse, OrderItem,
    PaymentSession, PaymentWebhook, PaymentStatus,
    NotificationLog, UploadInitRequest, UploadInitResponse
)
from auth import (
    get_password_hash, verify_password, create_access_token,
    get_current_user, require_role, decode_token
)
from pricing import (
    get_active_price_rule, calculate_estimate, load_price_rules,
    save_price_rules
)
from vendors import auto_assign_vendor, find_nearest_vendor
from delivery import get_delivery_quotes, select_cheapest_partner, book_delivery
from payments import (
    create_payment_session, verify_webhook_signature,
    handle_payment_webhook, get_active_gateway
)
from notifications import NotificationService, get_order_confirmation_message
from uploads import generate_upload_signed_url, simulate_virus_scan
from customer_auth import (
    generate_otp, send_otp_sms, store_otp, verify_otp, 
    create_customer_token, pwd_context
)
from vendor_auth import (
    create_vendor_token, verify_password as verify_vendor_password
)
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

# Wrap with Socket.IO
socket_app = socketio.ASGIApp(
    sio, 
    app,
    socketio_path='socket.io'
)

# Notification service
notification_service = NotificationService(mode="SIMULATED")

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# ==================== AUTH ENDPOINTS ====================

@api_router.post("/auth/register", response_model=TokenResponse)
async def register(user_data: UserCreate):
    """Register a new admin user"""
    # Check if user already exists
    existing = await db.users.find_one({"email": user_data.email})
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    # Create user
    user = User(
        email=user_data.email,
        password_hash=get_password_hash(user_data.password),
        role=user_data.role
    )
    
    user_dict = user.model_dump()
    user_dict['created_at'] = user_dict['created_at'].isoformat()
    user_dict['updated_at'] = user_dict['updated_at'].isoformat()
    
    await db.users.insert_one(user_dict)
    
    # Create token
    token = create_access_token({
        "sub": user.id,
        "email": user.email,
        "role": user.role.value
    })
    
    return TokenResponse(
        access_token=token,
        user={
            "id": user.id,
            "email": user.email,
            "role": user.role.value
        }
    )

@api_router.post("/auth/login", response_model=TokenResponse)
async def login(credentials: UserLogin):
    """Login admin user"""
    user_doc = await db.users.find_one({"email": credentials.email})
    if not user_doc:
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    if not verify_password(credentials.password, user_doc['password_hash']):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    if not user_doc.get('is_active', True):
        raise HTTPException(status_code=403, detail="Account is disabled")
    
    # Create token
    token = create_access_token({
        "sub": user_doc['id'],
        "email": user_doc['email'],
        "role": user_doc['role']
    })
    
    return TokenResponse(
        access_token=token,
        user={
            "id": user_doc['id'],
            "email": user_doc['email'],
            "role": user_doc['role']
        }
    )

@api_router.get("/auth/me")
async def get_me(current_user: dict = Depends(get_current_user)):
    """Get current user info"""
    return current_user

# ==================== PRICE RULES ENDPOINTS ====================

@api_router.get("/price-rules", response_model=List[PriceRule])
async def get_price_rules(current_user: dict = Depends(require_role([UserRole.SUPER_ADMIN, UserRole.SUPERVISOR]))):
    """Get all price rules (admin only)"""
    rules = load_price_rules()
    return rules

@api_router.get("/price-rules/active", response_model=PriceRule)
async def get_active_rule():
    """Get currently active price rule (public)"""
    rule = get_active_price_rule()
    if not rule:
        raise HTTPException(status_code=404, detail="No active price rule found")
    return rule

@api_router.post("/price-rules", response_model=PriceRule)
async def create_price_rule(
    rule_data: PriceRuleCreate,
    current_user: dict = Depends(require_role([UserRole.SUPER_ADMIN]))
):
    """Create new price rule (SuperAdmin only)"""
    rule = PriceRule(**rule_data.model_dump())
    
    # Load existing rules and add new one
    rules = load_price_rules()
    rules.append(rule)
    save_price_rules(rules)
    
    # Log audit
    audit = PricingAudit(
        rule_id=rule.id,
        changed_by=current_user['email'],
        reason="New price rule created",
        diff={},
        previous_value={},
        new_value=rule.model_dump()
    )
    
    audit_dict = audit.model_dump()
    audit_dict['changed_at'] = audit_dict['changed_at'].isoformat()
    await db.pricing_audits.insert_one(audit_dict)
    
    return rule

@api_router.patch("/price-rules/{rule_id}", response_model=PriceRule)
async def update_price_rule(
    rule_id: str,
    updates: PriceRuleUpdate,
    reason: str,
    current_user: dict = Depends(require_role([UserRole.SUPER_ADMIN]))
):
    """Update price rule (SuperAdmin only)"""
    rules = load_price_rules()
    rule = next((r for r in rules if r.id == rule_id), None)
    
    if not rule:
        raise HTTPException(status_code=404, detail="Price rule not found")
    
    previous_value = rule.model_dump()
    
    # Apply updates
    update_data = updates.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(rule, key, value)
    
    rule.updated_at = datetime.now(timezone.utc)
    
    # Save updated rules
    save_price_rules(rules)
    
    # Log audit
    audit = PricingAudit(
        rule_id=rule.id,
        changed_by=current_user['email'],
        reason=reason,
        diff=update_data,
        previous_value=previous_value,
        new_value=rule.model_dump()
    )
    
    audit_dict = audit.model_dump()
    audit_dict['changed_at'] = audit_dict['changed_at'].isoformat()
    await db.pricing_audits.insert_one(audit_dict)
    
    return rule

@api_router.get("/pricing-audits", response_model=List[PricingAudit])
async def get_pricing_audits(
    rule_id: Optional[str] = None,
    current_user: dict = Depends(require_role([UserRole.SUPER_ADMIN, UserRole.SUPERVISOR]))
):
    """Get pricing audit history"""
    query = {"rule_id": rule_id} if rule_id else {}
    audits = await db.pricing_audits.find(query, {"_id": 0}).to_list(100)
    
    for audit in audits:
        if isinstance(audit['changed_at'], str):
            audit['changed_at'] = datetime.fromisoformat(audit['changed_at'])
    
    return audits

# ==================== VENDOR ENDPOINTS ====================

@api_router.get("/vendors", response_model=List[Vendor])
async def get_vendors(
    current_user: dict = Depends(require_role([UserRole.SUPER_ADMIN, UserRole.SUPERVISOR, UserRole.SALES]))
):
    """Get all vendors"""
    vendors = await db.vendors.find({}, {"_id": 0}).to_list(100)
    
    for vendor in vendors:
        if isinstance(vendor['created_at'], str):
            vendor['created_at'] = datetime.fromisoformat(vendor['created_at'])
        if isinstance(vendor['updated_at'], str):
            vendor['updated_at'] = datetime.fromisoformat(vendor['updated_at'])
    
    return vendors

@api_router.post("/vendors", response_model=Vendor)
async def create_vendor(
    vendor_data: VendorCreate,
    current_user: dict = Depends(require_role([UserRole.SUPER_ADMIN, UserRole.SUPERVISOR]))
):
    """Create new vendor"""
    vendor = Vendor(**vendor_data.model_dump())
    
    vendor_dict = vendor.model_dump()
    vendor_dict['created_at'] = vendor_dict['created_at'].isoformat()
    vendor_dict['updated_at'] = vendor_dict['updated_at'].isoformat()
    
    await db.vendors.insert_one(vendor_dict)
    
    return vendor

@api_router.patch("/vendors/{vendor_id}", response_model=Vendor)
async def update_vendor(
    vendor_id: str,
    updates: dict,
    current_user: dict = Depends(require_role([UserRole.SUPER_ADMIN, UserRole.SUPERVISOR]))
):
    """Update vendor"""
    vendor_doc = await db.vendors.find_one({"id": vendor_id}, {"_id": 0})
    if not vendor_doc:
        raise HTTPException(status_code=404, detail="Vendor not found")
    
    updates['updated_at'] = datetime.now(timezone.utc).isoformat()
    await db.vendors.update_one({"id": vendor_id}, {"$set": updates})
    
    vendor_doc.update(updates)
    return Vendor(**vendor_doc)

# ==================== UPLOAD ENDPOINTS ====================

@api_router.post("/upload/init", response_model=UploadInitResponse)
async def init_upload(request: UploadInitRequest):
    """Initialize file upload (get signed URL)"""
    try:
        upload_data = generate_upload_signed_url(
            request.file_name,
            request.file_type
        )
        
        return UploadInitResponse(
            upload_id=upload_data['upload_id'],
            signed_url=upload_data['signed_url'],
            file_key=upload_data['file_key']
        )
    except Exception as e:
        logger.error(f"Upload init error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@api_router.post("/upload/verify/{upload_id}")
async def verify_upload(upload_id: str, file_key: str):
    """Verify upload and run virus scan"""
    try:
        scan_result = simulate_virus_scan(file_key)
        
        if scan_result['status'] != 'clean':
            raise HTTPException(status_code=400, detail="File failed virus scan")
        
        return {
            "status": "verified",
            "upload_id": upload_id,
            "file_key": file_key,
            "scan_result": scan_result
        }
    except Exception as e:
        logger.error(f"Upload verification error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# ==================== ESTIMATE ENDPOINTS ====================

@api_router.post("/calculate-estimate", response_model=EstimateResponse)
async def calculate_order_estimate(request: EstimateRequest):
    """Calculate order estimate"""
    try:
        estimate = calculate_estimate(request)
        
        # If pickup, find suggested vendor
        if request.fulfillment_type.value == "Pickup" and request.customer_location:
            vendors = await db.vendors.find({}, {"_id": 0}).to_list(100)
            vendor_objs = [Vendor(**v) for v in vendors]
            
            assignment = await auto_assign_vendor(request.customer_location, vendor_objs)
            
            if assignment['status'] == 'auto_assigned':
                estimate.estimated_vendor = {
                    "id": assignment['vendor'].id,
                    "name": assignment['vendor'].name,
                    "distance_km": assignment['distance_km']
                }
            else:
                estimate.estimated_vendor = {
                    "status": "manual_selection_required",
                    "suggestions": [
                        {
                            "id": s['vendor'].id,
                            "name": s['vendor'].name,
                            "distance_km": s['distance_km'],
                            "radius_km": s['radius_km']
                        }
                        for s in assignment['suggestions']
                    ]
                }
        
        # If delivery, get delivery quotes
        if request.fulfillment_type.value == "Delivery" and request.customer_location:
            vendors = await db.vendors.find({"is_active": True}, {"_id": 0}).limit(1).to_list(1)
            if vendors:
                vendor = Vendor(**vendors[0])
                quotes = get_delivery_quotes(vendor.location, request.customer_location)
                if quotes:
                    cheapest = select_cheapest_partner(quotes)
                    estimate.delivery_quote = cheapest
                    estimate.delivery_charge = cheapest['cost']
                    estimate.total = estimate.items_total + estimate.delivery_charge
        
        return estimate
    except Exception as e:
        logger.error(f"Estimate calculation error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# ==================== ORDER ENDPOINTS ====================

@api_router.post("/orders", response_model=Order)
async def create_order(order_data: OrderCreate):
    """Create new order"""
    try:
        # Calculate estimate to get pricing snapshot
        estimate_request = EstimateRequest(
            items=order_data.items,
            fulfillment_type=order_data.fulfillment_type,
            customer_location=order_data.customer_location
        )
        estimate = calculate_estimate(estimate_request)
        
        # Get active price rule for snapshot
        price_rule = get_active_price_rule()
        
        # Create order
        order = Order(
            customer_email=order_data.customer_email,
            customer_phone=order_data.customer_phone,
            customer_name=order_data.customer_name,
            items=order_data.items,
            fulfillment_type=order_data.fulfillment_type,
            customer_location=order_data.customer_location,
            items_total=estimate.items_total,
            delivery_charge=estimate.delivery_charge,
            total=estimate.total,
            status=OrderStatus.ESTIMATED,
            appliedPricingSnapshot=price_rule.model_dump()
        )
        
        order_dict = order.model_dump()
        order_dict['created_at'] = order_dict['created_at'].isoformat()
        order_dict['updated_at'] = order_dict['updated_at'].isoformat()
        
        await db.orders.insert_one(order_dict)
        
        return order
    except Exception as e:
        logger.error(f"Order creation error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@api_router.get("/orders/{order_id}", response_model=Order)
async def get_order(order_id: str):
    """Get order by ID"""
    order_doc = await db.orders.find_one({"id": order_id}, {"_id": 0})
    if not order_doc:
        raise HTTPException(status_code=404, detail="Order not found")
    
    if isinstance(order_doc['created_at'], str):
        order_doc['created_at'] = datetime.fromisoformat(order_doc['created_at'])
    if isinstance(order_doc['updated_at'], str):
        order_doc['updated_at'] = datetime.fromisoformat(order_doc['updated_at'])
    
    return Order(**order_doc)

@api_router.get("/orders", response_model=List[Order])
async def get_orders(
    status: Optional[str] = None,
    customer_email: Optional[str] = None,
    current_user: dict = Depends(get_current_user)
):
    """Get orders with filters"""
    query = {}
    if status:
        query['status'] = status
    if customer_email:
        query['customer_email'] = customer_email
    
    orders = await db.orders.find(query, {"_id": 0}).to_list(100)
    
    for order in orders:
        if isinstance(order['created_at'], str):
            order['created_at'] = datetime.fromisoformat(order['created_at'])
        if isinstance(order['updated_at'], str):
            order['updated_at'] = datetime.fromisoformat(order['updated_at'])
    
    return orders

@api_router.patch("/orders/{order_id}/status")
async def update_order_status(
    order_id: str,
    status: OrderStatus,
    current_user: dict = Depends(get_current_user)
):
    """Update order status"""
    order_doc = await db.orders.find_one({"id": order_id})
    if not order_doc:
        raise HTTPException(status_code=404, detail="Order not found")
    
    await db.orders.update_one(
        {"id": order_id},
        {"$set": {"status": status.value, "updated_at": datetime.now(timezone.utc).isoformat()}}
    )
    
    # Send notification
    if status == OrderStatus.READY_FOR_PICKUP:
        await notification_service.send_whatsapp(
            order_doc['customer_phone'],
            f"Your order {order_id} is ready for pickup!",
            order_id
        )
    
    return {"status": "updated"}

# ==================== PAYMENT ENDPOINTS ====================

@api_router.post("/payments/create-session", response_model=PaymentSession)
async def create_payment(order_id: str):
    """Create payment session for order"""
    try:
        order_doc = await db.orders.find_one({"id": order_id}, {"_id": 0})
        if not order_doc:
            raise HTTPException(status_code=404, detail="Order not found")
        
        if order_doc['status'] not in [OrderStatus.ESTIMATED.value, OrderStatus.PAYMENT_PENDING.value]:
            raise HTTPException(status_code=400, detail="Order not ready for payment")
        
        # Create payment session
        session = create_payment_session(order_id, order_doc['total'])
        
        session_dict = session.model_dump()
        session_dict['created_at'] = session_dict['created_at'].isoformat()
        session_dict['updated_at'] = session_dict['updated_at'].isoformat()
        
        await db.payment_sessions.insert_one(session_dict)
        
        # Update order
        await db.orders.update_one(
            {"id": order_id},
            {"$set": {
                "payment_session_id": session.id,
                "status": OrderStatus.PAYMENT_PENDING.value,
                "updated_at": datetime.now(timezone.utc).isoformat()
            }}
        )
        
        return session
    except Exception as e:
        logger.error(f"Payment session creation error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@api_router.get("/payments/config")
async def get_payment_config():
    """Get active payment gateway config (public, no secrets)"""
    try:
        gateway = get_active_gateway()
        return {
            "gateway": gateway['id'],
            "name": gateway['name'],
            "mode": gateway['mode']
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@api_router.post("/webhooks/payment/{gateway}")
async def payment_webhook(gateway: str, request: Request):
    """Handle payment gateway webhooks"""
    try:
        payload = await request.json()
        signature = request.headers.get('X-Signature', '')
        
        # Verify signature
        if not verify_webhook_signature(gateway, payload, signature):
            raise HTTPException(status_code=401, detail="Invalid signature")
        
        # Handle webhook
        result = handle_payment_webhook(gateway, payload)
        
        if result['status'] == 'success':
            order_id = result['order_id']
            
            # Update payment session
            await db.payment_sessions.update_one(
                {"order_id": order_id},
                {"$set": {
                    "status": PaymentStatus.SUCCESS.value,
                    "updated_at": datetime.now(timezone.utc).isoformat()
                }}
            )
            
            # Update order
            order_doc = await db.orders.find_one({"id": order_id})
            await db.orders.update_one(
                {"id": order_id},
                {"$set": {
                    "status": OrderStatus.PAID.value,
                    "updated_at": datetime.now(timezone.utc).isoformat()
                }}
            )
            
            # Send confirmation notification
            if order_doc:
                await notification_service.send_whatsapp(
                    order_doc['customer_phone'],
                    get_order_confirmation_message(order_id, order_doc['total']),
                    order_id
                )
                
                await notification_service.send_email(
                    order_doc['customer_email'],
                    "Order Confirmation",
                    get_order_confirmation_message(order_id, order_doc['total']),
                    order_id
                )
        
        return {"status": "processed"}
    except Exception as e:
        logger.error(f"Payment webhook error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# ==================== DELIVERY ENDPOINTS ====================

@api_router.post("/delivery/book/{order_id}")
async def book_order_delivery(
    order_id: str,
    partner_id: Optional[str] = None,
    current_user: dict = Depends(get_current_user)
):
    """Book delivery for order"""
    try:
        order_doc = await db.orders.find_one({"id": order_id}, {"_id": 0})
        if not order_doc:
            raise HTTPException(status_code=404, detail="Order not found")
        
        if order_doc['fulfillment_type'] != "Delivery":
            raise HTTPException(status_code=400, detail="Order is not for delivery")
        
        # Get vendor location
        vendor_doc = await db.vendors.find_one({"id": order_doc.get('assigned_vendor_id')}, {"_id": 0})
        if not vendor_doc:
            raise HTTPException(status_code=400, detail="No vendor assigned")
        
        vendor = Vendor(**vendor_doc)
        customer_location = VendorLocation(**order_doc['customer_location'])
        
        # Get quotes if partner not specified
        if not partner_id:
            quotes = get_delivery_quotes(vendor.location, customer_location)
            if not quotes:
                raise HTTPException(status_code=404, detail="No delivery partners available")
            cheapest = select_cheapest_partner(quotes)
            partner_id = cheapest['partner_id']
        
        # Book delivery
        booking = book_delivery(partner_id, order_id, vendor.location, customer_location)
        
        # Update order
        await db.orders.update_one(
            {"id": order_id},
            {"$set": {
                "delivery_partner_id": partner_id,
                "delivery_tracking_id": booking['tracking_id'],
                "status": OrderStatus.OUT_FOR_DELIVERY.value,
                "updated_at": datetime.now(timezone.utc).isoformat()
            }}
        )
        
        return booking
    except Exception as e:
        logger.error(f"Delivery booking error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@api_router.post("/webhooks/delivery/{partner}")
async def delivery_webhook(partner: str, request: Request):
    """Handle delivery partner webhooks"""
    try:
        payload = await request.json()
        tracking_id = payload.get('tracking_id')
        status = payload.get('status')
        
        # Find order by tracking ID
        order_doc = await db.orders.find_one({"delivery_tracking_id": tracking_id})
        if not order_doc:
            raise HTTPException(status_code=404, detail="Order not found")
        
        # Update order status based on delivery status
        status_map = {
            "Delivered": OrderStatus.DELIVERED.value,
            "InTransit": OrderStatus.OUT_FOR_DELIVERY.value
        }
        
        new_status = status_map.get(status, order_doc['status'])
        
        await db.orders.update_one(
            {"id": order_doc['id']},
            {"$set": {
                "status": new_status,
                "updated_at": datetime.now(timezone.utc).isoformat()
            }}
        )
        
        return {"status": "processed"}
    except Exception as e:
        logger.error(f"Delivery webhook error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# ==================== ROOT & HEALTH ====================

@api_router.get("/")
async def root():
    return {"message": "Vaishnavi Printers API", "version": "1.0.0"}

@api_router.get("/health")
async def health():
    return {"status": "healthy"}

# Include router in app
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
