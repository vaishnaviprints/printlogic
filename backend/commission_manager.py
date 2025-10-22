"""
Commission/Platform Fee Management
Handles commission calculations, settings, and notifications
"""

from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from typing import Optional
from datetime import datetime, timezone
import os
import jwt

router = APIRouter(prefix="/api/admin", tags=["commission"])

# Database connection
db = None

def set_database(database):
    global db
    db = database

SECRET_KEY = os.getenv("JWT_SECRET", "your-secret-key-change-in-production")

def verify_admin(token: str):
    """Verify admin token"""
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=["HS256"])
        admin_id = payload.get("sub")
        return {"id": admin_id}
    except:
        raise HTTPException(status_code=401, detail="Invalid token")

class CommissionSettings(BaseModel):
    """Commission/Platform fee settings"""
    global_commission_percentage: float = 5.0  # Default 5%
    commission_type: str = "platform_fee"  # or "commission"

class VendorCommissionUpdate(BaseModel):
    """Update commission for specific vendor"""
    vendor_id: str
    commission_percentage: float

@router.get("/commission-settings")
async def get_commission_settings(token: str = Depends(verify_admin)):
    """Get current commission settings"""
    settings = await db.settings.find_one({"id": "commission_settings"})
    
    if not settings:
        # Create default
        default_settings = {
            "id": "commission_settings",
            "global_commission_percentage": 5.0,
            "commission_type": "platform_fee",
            "updated_at": datetime.now(timezone.utc).isoformat()
        }
        await db.settings.insert_one(default_settings)
        return default_settings
    
    settings.pop("_id", None)
    return settings

@router.put("/commission-settings")
async def update_commission_settings(
    new_percentage: float,
    commission_type: str = "platform_fee",
    token: dict = Depends(verify_admin)
):
    """
    Update global commission percentage
    This will notify all vendors about the change
    """
    
    if new_percentage < 0 or new_percentage > 50:
        raise HTTPException(status_code=400, detail="Commission must be between 0% and 50%")
    
    # Get old settings
    old_settings = await db.settings.find_one({"id": "commission_settings"})
    old_percentage = old_settings.get("global_commission_percentage", 5.0) if old_settings else 5.0
    
    # Update settings
    new_settings = {
        "id": "commission_settings",
        "global_commission_percentage": new_percentage,
        "commission_type": commission_type,
        "updated_at": datetime.now(timezone.utc).isoformat(),
        "updated_by": token["id"]
    }
    
    await db.settings.update_one(
        {"id": "commission_settings"},
        {"$set": new_settings},
        upsert=True
    )
    
    # Create notification for all vendors
    notification_text = (
        f"⚠️ {commission_type.replace('_', ' ').title()} Updated\n"
        f"Old: {old_percentage}%\n"
        f"New: {new_percentage}%\n"
        f"Effective immediately for all new payouts."
    )
    
    vendors = await db.vendors.find({}).to_list(length=None)
    
    for vendor in vendors:
        notification = {
            "id": f"notif_{datetime.now(timezone.utc).timestamp()}_{vendor['id']}",
            "vendor_id": vendor["id"],
            "type": "commission_change",
            "title": f"{commission_type.replace('_', ' ').title()} Changed",
            "message": notification_text,
            "old_percentage": old_percentage,
            "new_percentage": new_percentage,
            "read": False,
            "created_at": datetime.now(timezone.utc).isoformat()
        }
        await db.notifications.insert_one(notification)
    
    # Log audit trail
    audit_log = {
        "id": f"audit_{datetime.now(timezone.utc).timestamp()}",
        "entity_type": "commission_settings",
        "action": "update",
        "old_value": old_percentage,
        "new_value": new_percentage,
        "performed_by": token["id"],
        "timestamp": datetime.now(timezone.utc).isoformat()
    }
    await db.audit_logs.insert_one(audit_log)
    
    return {
        "success": True,
        "message": f"{commission_type.replace('_', ' ').title()} updated from {old_percentage}% to {new_percentage}%",
        "old_percentage": old_percentage,
        "new_percentage": new_percentage,
        "vendors_notified": len(vendors)
    }

@router.post("/vendor-commission")
async def update_vendor_commission(
    data: VendorCommissionUpdate,
    token: dict = Depends(verify_admin)
):
    """
    Update commission for a specific vendor
    This overrides the global commission for this vendor only
    """
    
    if data.commission_percentage < 0 or data.commission_percentage > 50:
        raise HTTPException(status_code=400, detail="Commission must be between 0% and 50%")
    
    # Get vendor
    vendor = await db.vendors.find_one({"id": data.vendor_id})
    if not vendor:
        raise HTTPException(status_code=404, detail="Vendor not found")
    
    old_commission = vendor.get("custom_commission_percentage")
    
    # Update vendor commission
    await db.vendors.update_one(
        {"id": data.vendor_id},
        {"$set": {
            "custom_commission_percentage": data.commission_percentage,
            "has_custom_commission": True,
            "updated_at": datetime.now(timezone.utc).isoformat()
        }}
    )
    
    # Notify vendor
    notification_text = (
        f"⚠️ Your Commission Rate Updated\n"
        f"Old: {old_commission or 'Global'}%\n"
        f"New: {data.commission_percentage}%\n"
        f"This is a custom rate set specifically for your store."
    )
    
    notification = {
        "id": f"notif_{datetime.now(timezone.utc).timestamp()}_{data.vendor_id}",
        "vendor_id": data.vendor_id,
        "type": "commission_change",
        "title": "Your Commission Rate Changed",
        "message": notification_text,
        "old_percentage": old_commission,
        "new_percentage": data.commission_percentage,
        "read": False,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.notifications.insert_one(notification)
    
    return {
        "success": True,
        "message": f"Commission updated for {vendor.get('shop_name')}",
        "vendor_id": data.vendor_id,
        "old_commission": old_commission,
        "new_commission": data.commission_percentage
    }

@router.get("/vendor/{vendor_id}/payout-calculation")
async def calculate_vendor_payout(
    vendor_id: str,
    start_date: str,
    end_date: str,
    token: dict = Depends(verify_admin)
):
    """
    Calculate payout for a vendor for a given period
    Total Earnings - Commission% = Net Payout
    """
    
    vendor = await db.vendors.find_one({"id": vendor_id})
    if not vendor:
        raise HTTPException(status_code=404, detail="Vendor not found")
    
    # Get commission percentage
    if vendor.get("has_custom_commission"):
        commission_percentage = vendor.get("custom_commission_percentage", 5.0)
    else:
        settings = await db.settings.find_one({"id": "commission_settings"})
        commission_percentage = settings.get("global_commission_percentage", 5.0) if settings else 5.0
    
    # Get orders in date range
    orders = await db.orders.find({
        "vendor_id": vendor_id,
        "status": {"$in": ["completed", "delivered", "picked_up"]},
        "completed_at": {
            "$gte": start_date,
            "$lte": end_date
        }
    }).to_list(length=None)
    
    # Calculate totals
    total_orders = len(orders)
    total_earnings = sum(order.get("total_amount", 0) for order in orders)
    commission_amount = (total_earnings * commission_percentage) / 100
    net_payout = total_earnings - commission_amount
    
    return {
        "vendor_id": vendor_id,
        "vendor_name": vendor.get("shop_name"),
        "period": {
            "start": start_date,
            "end": end_date
        },
        "total_orders": total_orders,
        "total_earnings": round(total_earnings, 2),
        "commission_percentage": commission_percentage,
        "commission_amount": round(commission_amount, 2),
        "net_payout": round(net_payout, 2),
        "orders": [
            {
                "order_id": order.get("id"),
                "amount": order.get("total_amount"),
                "completed_at": order.get("completed_at")
            }
            for order in orders
        ]
    }
