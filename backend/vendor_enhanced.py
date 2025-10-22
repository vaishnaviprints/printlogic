"""
Enhanced Vendor Endpoints for Vaishnavi Printers
Includes: Store Toggle, Vendor Pricing, Dashboard with Orders
"""

from fastapi import APIRouter, Depends, HTTPException
from typing import List, Optional
import os
from datetime import datetime, timezone
import jwt
from enhanced_models import VendorPricing

router = APIRouter(prefix="/api/vendor", tags=["vendor_enhanced"])

# Database connection
db = None

def set_database(database):
    global db
    db = database

SECRET_KEY = os.getenv("JWT_SECRET", "your-secret-key-change-in-production")

async def verify_vendor(token: str):
    """Verify vendor token"""
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=["HS256"])
        vendor_id = payload.get("sub")
        
        vendor = await db.vendors.find_one({"id": vendor_id})
        if not vendor:
            raise HTTPException(status_code=401, detail="Invalid token")
        
        return vendor
    except:
        raise HTTPException(status_code=401, detail="Invalid token")

# ============= STORE MANAGEMENT =============

@router.post("/toggle-store", response_model=dict)
async def toggle_store_status(is_online: bool, token: str = Depends(verify_vendor)):
    """Toggle vendor store online/offline status"""
    vendor_id = token["id"]
    
    result = await db.vendors.update_one(
        {"id": vendor_id},
        {"$set": {
            "is_online": is_online,
            "store_open": is_online,  # Also update store_open for backwards compatibility
            "updated_at": datetime.now(timezone.utc).isoformat()
        }}
    )
    
    status_text = "online" if is_online else "offline"
    
    return {
        "message": f"Store is now {status_text}",
        "is_online": is_online
    }

@router.get("/store-status", response_model=dict)
async def get_store_status(token: str = Depends(verify_vendor)):
    """Get current store status"""
    vendor_id = token["id"]
    vendor = await db.vendors.find_one({"id": vendor_id})
    
    return {
        "is_online": vendor.get("is_online", True),
        "store_open": vendor.get("store_open", True)
    }

# ============= VENDOR PRICING =============

@router.get("/pricing", response_model=VendorPricing)
async def get_vendor_pricing(token: str = Depends(verify_vendor)):
    """Get vendor's custom pricing"""
    vendor_id = token["id"]
    vendor = await db.vendors.find_one({"id": vendor_id})
    
    pricing = vendor.get("vendor_pricing", {})
    return VendorPricing(**pricing) if pricing else VendorPricing()

@router.put("/pricing", response_model=dict)
async def update_vendor_pricing(
    pricing: VendorPricing,
    token: str = Depends(verify_vendor)
):
    """Update vendor's custom pricing"""
    vendor_id = token["id"]
    
    result = await db.vendors.update_one(
        {"id": vendor_id},
        {"$set": {
            "vendor_pricing": pricing.model_dump(),
            "updated_at": datetime.now(timezone.utc).isoformat()
        }}
    )
    
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Vendor not found")
    
    return {"message": "Pricing updated successfully"}

# ============= VENDOR DASHBOARD =============

@router.get("/dashboard", response_model=dict)
async def get_vendor_dashboard(token: str = Depends(verify_vendor)):
    """Get vendor dashboard data"""
    vendor_id = token["id"]
    
    # Get vendor info
    vendor = await db.vendors.find_one({"id": vendor_id})
    
    # Get pending orders (requesting)
    pending_orders = await db.orders.find({
        "vendor_id": vendor_id,
        "status": {"$in": ["pending", "assigned"]}
    }).sort("created_at", -1).to_list(length=10)
    
    # Get in-progress orders
    in_progress_orders = await db.orders.find({
        "vendor_id": vendor_id,
        "status": "in_production"
    }).to_list(length=10)
    
    # Get completed orders (recent)
    completed_orders = await db.orders.find({
        "vendor_id": vendor_id,
        "status": {"$in": ["completed", "delivered", "picked_up"]}
    }).sort("completed_at", -1).limit(10).to_list(length=10)
    
    # Clean up MongoDB _id
    for order_list in [pending_orders, in_progress_orders, completed_orders]:
        for order in order_list:
            order["_id"] = str(order["_id"])
    
    return {
        "vendor": {
            "id": vendor["id"],
            "name": vendor.get("name"),
            "shop_name": vendor.get("shop_name"),
            "badge": vendor.get("badge", "none"),
            "is_online": vendor.get("is_online", True),
            "total_sales": vendor.get("total_sales", 0),
            "total_earnings": vendor.get("total_earnings", 0.0),
            "current_workload": vendor.get("current_workload_count", 0)
        },
        "pending_orders": pending_orders,
        "in_progress_orders": in_progress_orders,
        "completed_orders": completed_orders,
        "stats": {
            "pending_count": len(pending_orders),
            "in_progress_count": len(in_progress_orders),
            "completed_today": len([o for o in completed_orders if o.get("completed_at", "").startswith(datetime.now(timezone.utc).date().isoformat())])
        }
    }

@router.get("/orders/pending", response_model=List[dict])
async def get_pending_orders(token: str = Depends(verify_vendor)):
    """Get all pending orders for vendor"""
    vendor_id = token["id"]
    
    orders = await db.orders.find({
        "vendor_id": vendor_id,
        "status": {"$in": ["pending", "assigned"]}
    }).sort("created_at", -1).to_list(length=None)
    
    for order in orders:
        order["_id"] = str(order["_id"])
    
    return orders

@router.post("/orders/{order_id}/accept", response_model=dict)
async def accept_order(order_id: str, token: str = Depends(verify_vendor)):
    """Accept a pending order"""
    vendor_id = token["id"]
    
    # Verify order belongs to this vendor
    order = await db.orders.find_one({"id": order_id, "vendor_id": vendor_id})
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    
    # Update order status
    await db.orders.update_one(
        {"id": order_id},
        {"$set": {
            "status": "in_production",
            "accepted_at": datetime.now(timezone.utc).isoformat()
        }}
    )
    
    # Increment vendor workload
    await db.vendors.update_one(
        {"id": vendor_id},
        {"$inc": {"current_workload_count": 1}}
    )
    
    return {"message": "Order accepted successfully"}

@router.post("/orders/{order_id}/decline", response_model=dict)
async def decline_order(
    order_id: str,
    reason: str,
    token: str = Depends(verify_vendor)
):
    """Decline a pending order"""
    vendor_id = token["id"]
    
    # Verify order belongs to this vendor
    order = await db.orders.find_one({"id": order_id, "vendor_id": vendor_id})
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    
    # Update order status
    await db.orders.update_one(
        {"id": order_id},
        {"$set": {
            "status": "pending",
            "vendor_id": None,
            "declined_by": vendor_id,
            "decline_reason": reason,
            "declined_at": datetime.now(timezone.utc).isoformat()
        }}
    )
    
    return {"message": "Order declined, will be reassigned"}

@router.post("/orders/{order_id}/complete", response_model=dict)
async def complete_order(order_id: str, token: str = Depends(verify_vendor)):
    """Mark order as completed"""
    vendor_id = token["id"]
    
    # Verify order belongs to this vendor
    order = await db.orders.find_one({"id": order_id, "vendor_id": vendor_id})
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    
    # Update order status
    await db.orders.update_one(
        {"id": order_id},
        {"$set": {
            "status": "ready_for_pickup",
            "completed_at": datetime.now(timezone.utc).isoformat()
        }}
    )
    
    # Update vendor stats
    await db.vendors.update_one(
        {"id": vendor_id},
        {
            "$inc": {
                "current_workload_count": -1,
                "total_sales": 1,
                "total_earnings": order.get("total_amount", 0)
            }
        }
    )
    
    return {"message": "Order marked as completed"}

# ============= VENDOR PROFILE =============

@router.get("/profile", response_model=dict)
async def get_vendor_profile(token: str = Depends(verify_vendor)):
    """Get vendor profile"""
    vendor_id = token["id"]
    vendor = await db.vendors.find_one({"id": vendor_id})
    
    if not vendor:
        raise HTTPException(status_code=404, detail="Vendor not found")
    
    # Remove sensitive data
    vendor.pop("password_hash", None)
    vendor.pop("_id", None)
    
    return vendor

@router.put("/profile", response_model=dict)
async def update_vendor_profile(
    update_data: dict,
    token: str = Depends(verify_vendor)
):
    """Update vendor profile (limited fields)"""
    vendor_id = token["id"]
    
    # Only allow certain fields to be updated by vendor
    allowed_fields = ["name", "shop_name", "working_hours", "description", "contact_phone", "bank_details"]
    update_dict = {k: v for k, v in update_data.items() if k in allowed_fields}
    
    if not update_dict:
        raise HTTPException(status_code=400, detail="No valid fields to update")
    
    # If bank_details updated, set verified to False
    if "bank_details" in update_dict:
        update_dict["bank_details"]["verified"] = False
    
    update_dict["updated_at"] = datetime.now(timezone.utc).isoformat()
    
    result = await db.vendors.update_one(
        {"id": vendor_id},
        {"$set": update_dict}
    )
    
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Vendor not found")
    
    return {"message": "Profile updated successfully"}
