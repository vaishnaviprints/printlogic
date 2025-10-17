"""Order assignment and vendor acceptance logic"""
from typing import List, Optional, Dict, Any
from datetime import datetime, timedelta, timezone
from models import Vendor, VendorLocation, Order
from vendors import calculate_distance
import asyncio

# Configuration
ACCEPT_TIMEOUT_MINUTES = 2
MAX_REASSIGNMENT_ATTEMPTS = 3

async def find_eligible_vendors(
    customer_location: VendorLocation,
    db,
    max_radius_km: float = 10.0
) -> List[Dict[str, Any]]:
    """Find vendors eligible for assignment, sorted by priority"""
    vendors = await db.vendors.find({
        "is_active": True,
        "store_open": True
    }, {"_id": 0}).to_list(100)
    
    eligible = []
    for vendor_doc in vendors:
        vendor = Vendor(**vendor_doc)
        
        # Calculate distance
        distance = calculate_distance(
            customer_location.latitude,
            customer_location.longitude,
            vendor.location.latitude,
            vendor.location.longitude
        )
        
        if distance <= max_radius_km:
            eligible.append({
                "vendor": vendor,
                "distance_km": distance,
                "workload": vendor.current_workload_count,
                "priority_score": calculate_priority_score(distance, vendor.current_workload_count, vendor.badge)
            })
    
    # Sort by priority score (lower is better)
    eligible.sort(key=lambda x: x['priority_score'])
    
    return eligible

def calculate_priority_score(distance: float, workload: int, badge: str) -> float:
    """Calculate vendor priority score (lower is better)"""
    # Badge priority weights
    badge_weights = {
        "platinum": 0.5,
        "diamond": 0.6,
        "gold": 0.7,
        "silver": 0.8,
        "bronze": 0.9,
        "none": 1.0
    }
    
    badge_weight = badge_weights.get(badge, 1.0)
    
    # Score = distance * badge_weight + workload * 2
    return (distance * badge_weight) + (workload * 2)

async def assign_order_to_vendor(
    order_id: str,
    vendor_id: str,
    db,
    notify_func
) -> bool:
    """Assign order to vendor and send notification"""
    try:
        # Get vendor
        vendor = await db.vendors.find_one({"id": vendor_id})
        if not vendor:
            return False
        
        # Update order with tentative assignment
        pending_since = datetime.now(timezone.utc)
        timeout_at = pending_since + timedelta(minutes=ACCEPT_TIMEOUT_MINUTES)
        
        await db.orders.update_one(
            {"id": order_id},
            {
                "$set": {
                    "assigned_vendor_id": vendor_id,
                    "vendor_acceptance.status": "pending",
                    "vendor_acceptance.pending_since": pending_since.isoformat(),
                    "vendor_acceptance.timeout_at": timeout_at.isoformat(),
                    "updated_at": datetime.now(timezone.utc).isoformat()
                }
            }
        )
        
        # Increment vendor workload
        await db.vendors.update_one(
            {"id": vendor_id},
            {"$inc": {"current_workload_count": 1}}
        )
        
        # Get order details
        order = await db.orders.find_one({"id": order_id})
        
        # Send real-time notification
        await notify_func(
            vendor_id,
            "order.new",
            {
                "orderId": order_id,
                "summary": f"{len(order['items'])} file(s) - {sum(item['num_pages'] for item in order['items'])} pages",
                "total": f"₹{order['total']:.2f}",
                "createdAt": order['created_at'],
                "timeoutMinutes": ACCEPT_TIMEOUT_MINUTES
            }
        )
        
        # Schedule timeout check
        asyncio.create_task(check_acceptance_timeout(order_id, vendor_id, db, notify_func))
        
        return True
        
    except Exception as e:
        print(f"Error assigning order: {e}")
        return False

async def check_acceptance_timeout(order_id: str, vendor_id: str, db, notify_func):
    """Check if vendor accepted order within timeout"""
    await asyncio.sleep(ACCEPT_TIMEOUT_MINUTES * 60)
    
    order = await db.orders.find_one({"id": order_id})
    if not order:
        return
    
    # Check if still pending
    if order.get('vendor_acceptance', {}).get('status') == 'pending':
        # Timeout - reassign
        print(f"Order {order_id} timed out for vendor {vendor_id}")
        
        # Mark as timeout
        await db.orders.update_one(
            {"id": order_id},
            {
                "$set": {
                    "vendor_acceptance.status": "timeout",
                    "vendor_acceptance.timeout_at": datetime.now(timezone.utc).isoformat()
                },
                "$inc": {"vendor_acceptance.reassignment_attempts": 1}
            }
        )
        
        # Decrement vendor workload
        await db.vendors.update_one(
            {"id": vendor_id},
            {"$inc": {"current_workload_count": -1}}
        )
        
        # Try reassignment
        await reassign_order(order_id, db, notify_func)

async def reassign_order(order_id: str, db, notify_func):
    """Reassign order to next available vendor"""
    order = await db.orders.find_one({"id": order_id})
    if not order:
        return
    
    attempts = order.get('vendor_acceptance', {}).get('reassignment_attempts', 0)
    
    if attempts >= MAX_REASSIGNMENT_ATTEMPTS:
        # Max attempts reached - flag for manual assignment
        await db.orders.update_one(
            {"id": order_id},
            {
                "$set": {
                    "need_manual_assign": True,
                    "assigned_vendor_id": None,
                    "updated_at": datetime.now(timezone.utc).isoformat()
                }
            }
        )
        
        # Notify admin
        print(f"Order {order_id} needs manual assignment after {attempts} attempts")
        return
    
    # Find next eligible vendor (excluding previous attempts)
    if order.get('customer_location'):
        from models import VendorLocation
        customer_location = VendorLocation(**order['customer_location'])
        
        eligible_vendors = await find_eligible_vendors(customer_location, db)
        
        # Filter out vendors who already timed out or declined
        # For now, just try the next one
        if eligible_vendors and len(eligible_vendors) > attempts:
            next_vendor = eligible_vendors[attempts]['vendor']
            await assign_order_to_vendor(order_id, next_vendor.id, db, notify_func)
        else:
            # No more vendors available
            await db.orders.update_one(
                {"id": order_id},
                {
                    "$set": {
                        "need_manual_assign": True,
                        "assigned_vendor_id": None
                    }
                }
            )
