"""
Enhanced Admin Endpoints for Vaishnavi Printers
Includes: Assistant Admin, Complaints, Enhanced Vendor Management, Settings
"""

from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from fastapi.responses import StreamingResponse
from typing import List, Optional
import os
from datetime import datetime, timezone
from motor.motor_asyncio import AsyncIOMotorClient
import bcrypt
import jwt
import io
import csv
import qrcode
from enhanced_models import (
    Admin, AdminCreate, AdminUpdate,
    VendorEnhanced, VendorUpdateEnhanced, BankDetails, CustomField, VendorPricing,
    Complaint, ComplaintCreate, ComplaintUpdate,
    SystemSettings, SystemSettingsUpdate, OrderFilters
)

router = APIRouter(prefix="/api/admin", tags=["admin_enhanced"])

# Database connection (will be injected)
db = None

def set_database(database):
    global db
    db = database

SECRET_KEY = os.getenv("JWT_SECRET", "your-secret-key-change-in-production")

def verify_super_admin(token: str):
    """Verify token and check if user is super admin"""
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=["HS256"])
        admin_id = payload.get("sub")
        
        admin = db.admins.find_one({"id": admin_id})
        if not admin or admin.get("role") != "super_admin":
            raise HTTPException(status_code=403, detail="Super admin access required")
        
        return admin
    except:
        raise HTTPException(status_code=401, detail="Invalid token")

def verify_admin(token: str, required_permission: Optional[str] = None):
    """Verify token and check permissions"""
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=["HS256"])
        admin_id = payload.get("sub")
        
        admin = db.admins.find_one({"id": admin_id})
        if not admin:
            raise HTTPException(status_code=401, detail="Invalid token")
        
        # Super admin has all permissions
        if admin.get("role") == "super_admin":
            return admin
        
        # Check specific permission for assistant admin
        if required_permission:
            permissions = admin.get("permissions", {})
            if not permissions.get(required_permission, False):
                raise HTTPException(status_code=403, detail=f"Permission denied: {required_permission}")
        
        return admin
    except HTTPException:
        raise
    except:
        raise HTTPException(status_code=401, detail="Invalid token")

# ============= ASSISTANT ADMIN MANAGEMENT =============

@router.post("/assistant-admins", response_model=dict)
async def create_assistant_admin(admin_data: AdminCreate, token: str = Depends(verify_super_admin)):
    """Create new assistant admin (Super admin only)"""
    
    # Check if email already exists
    existing = await db.admins.find_one({"email": admin_data.email})
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    # Hash password
    password_hash = bcrypt.hashpw(admin_data.password.encode(), bcrypt.gensalt()).decode()
    
    admin = Admin(
        email=admin_data.email,
        password_hash=password_hash,
        name=admin_data.name,
        role=admin_data.role,
        permissions=admin_data.permissions or AdminPermissions(),
        created_by=token["id"]
    )
    
    await db.admins.insert_one(admin.model_dump())
    
    return {"message": "Assistant admin created successfully", "admin_id": admin.id}

@router.get("/assistant-admins", response_model=List[dict])
async def list_assistant_admins(token: str = Depends(verify_super_admin)):
    """List all assistant admins"""
    admins = await db.admins.find({"role": "assistant_admin"}).to_list(length=None)
    
    # Remove password hashes
    for admin in admins:
        admin.pop("password_hash", None)
        admin["_id"] = str(admin["_id"])
    
    return admins

@router.put("/assistant-admins/{admin_id}", response_model=dict)
async def update_assistant_admin(
    admin_id: str,
    update_data: AdminUpdate,
    token: str = Depends(verify_super_admin)
):
    """Update assistant admin"""
    update_dict = {k: v for k, v in update_data.model_dump().items() if v is not None}
    
    if not update_dict:
        raise HTTPException(status_code=400, detail="No fields to update")
    
    result = await db.admins.update_one(
        {"id": admin_id},
        {"$set": update_dict}
    )
    
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Admin not found")
    
    return {"message": "Admin updated successfully"}

@router.delete("/assistant-admins/{admin_id}")
async def delete_assistant_admin(admin_id: str, token: str = Depends(verify_super_admin)):
    """Delete assistant admin"""
    result = await db.admins.delete_one({"id": admin_id, "role": "assistant_admin"})
    
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Admin not found")
    
    return {"message": "Admin deleted successfully"}

# ============= VENDOR ENHANCEMENTS =============

@router.put("/vendors/{vendor_id}/banking", response_model=dict)
async def update_vendor_banking(
    vendor_id: str,
    bank_details: BankDetails,
    token: str = Depends(lambda t: verify_admin(t, "can_edit_vendors"))
):
    """Update vendor banking details"""
    result = await db.vendors.update_one(
        {"id": vendor_id},
        {"$set": {"bank_details": bank_details.model_dump(), "updated_at": datetime.now(timezone.utc).isoformat()}}
    )
    
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Vendor not found")
    
    return {"message": "Banking details updated successfully"}

@router.post("/vendors/{vendor_id}/custom-fields", response_model=dict)
async def add_vendor_custom_field(
    vendor_id: str,
    field: CustomField,
    token: str = Depends(lambda t: verify_admin(t, "can_edit_vendors"))
):
    """Add custom field to vendor"""
    vendor = await db.vendors.find_one({"id": vendor_id})
    if not vendor:
        raise HTTPException(status_code=404, detail="Vendor not found")
    
    custom_fields = vendor.get("custom_fields", [])
    custom_fields.append(field.model_dump())
    
    await db.vendors.update_one(
        {"id": vendor_id},
        {"$set": {"custom_fields": custom_fields, "updated_at": datetime.now(timezone.utc).isoformat()}}
    )
    
    return {"message": "Custom field added", "field_id": field.id}

@router.delete("/vendors/{vendor_id}/custom-fields/{field_id}")
async def delete_vendor_custom_field(
    vendor_id: str,
    field_id: str,
    token: str = Depends(lambda t: verify_admin(t, "can_edit_vendors"))
):
    """Delete vendor custom field"""
    result = await db.vendors.update_one(
        {"id": vendor_id},
        {"$pull": {"custom_fields": {"id": field_id}}}
    )
    
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Vendor not found")
    
    return {"message": "Custom field deleted"}

@router.get("/vendors/{vendor_id}/qr-code")
async def generate_vendor_qr_code(vendor_id: str):
    """Generate and return QR code for vendor"""
    vendor = await db.vendors.find_one({"id": vendor_id})
    if not vendor:
        raise HTTPException(status_code=404, detail="Vendor not found")
    
    # Generate QR code URL pointing to in-store portal with vendor ID
    qr_url = f"{os.getenv('FRONTEND_URL', 'http://localhost:3000')}/print?vendor={vendor_id}"
    
    # Create QR code
    qr = qrcode.QRCode(version=1, box_size=10, border=4)
    qr.add_data(qr_url)
    qr.make(fit=True)
    
    img = qr.make_image(fill_color="black", back_color="white")
    
    # Convert to bytes
    img_byte_arr = io.BytesIO()
    img.save(img_byte_arr, format='PNG')
    img_byte_arr.seek(0)
    
    # Save QR URL to vendor record
    await db.vendors.update_one(
        {"id": vendor_id},
        {"$set": {"qr_code_url": qr_url}}
    )
    
    return StreamingResponse(img_byte_arr, media_type="image/png")

@router.post("/vendors/{vendor_id}/reset-password")
async def reset_vendor_password(
    vendor_id: str,
    new_password: str,
    token: str = Depends(lambda t: verify_admin(t, "can_edit_vendors"))
):
    """Reset vendor password"""
    password_hash = bcrypt.hashpw(new_password.encode(), bcrypt.gensalt()).decode()
    
    result = await db.vendors.update_one(
        {"id": vendor_id},
        {"$set": {
            "password_hash": password_hash,
            "last_password_reset": datetime.now(timezone.utc).isoformat()
        }}
    )
    
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Vendor not found")
    
    return {"message": "Password reset successfully"}

@router.get("/vendors/{vendor_id}/credentials")
async def get_vendor_credentials(
    vendor_id: str,
    token: str = Depends(verify_super_admin)
):
    """Get vendor login credentials (Super admin only)"""
    vendor = await db.vendors.find_one({"id": vendor_id})
    if not vendor:
        raise HTTPException(status_code=404, detail="Vendor not found")
    
    return {
        "vendor_id": vendor_id,
        "username": vendor.get("username", vendor.get("contact_email")),
        "email": vendor.get("contact_email"),
        "last_password_reset": vendor.get("last_password_reset")
    }

@router.put("/vendors/{vendor_id}/pricing")
async def update_vendor_pricing(
    vendor_id: str,
    pricing: VendorPricing,
    token: str = Depends(lambda t: verify_admin(t, "can_edit_vendors"))
):
    """Update vendor-specific pricing"""
    result = await db.vendors.update_one(
        {"id": vendor_id},
        {"$set": {"vendor_pricing": pricing.model_dump(), "updated_at": datetime.now(timezone.utc).isoformat()}}
    )
    
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Vendor not found")
    
    return {"message": "Vendor pricing updated"}

@router.get("/vendors/export")
async def export_vendors_csv(token: str = Depends(lambda t: verify_admin(t, "can_view_vendors"))):
    """Export all vendors to CSV"""
    vendors = await db.vendors.find({}).to_list(length=None)
    
    # Create CSV
    output = io.StringIO()
    writer = csv.writer(output)
    
    # Header
    writer.writerow([
        "ID", "Name", "Shop Name", "Email", "Phone", "City", "Pincode",
        "Badge", "Total Sales", "Total Earnings", "Store Open", "Created At"
    ])
    
    # Data
    for vendor in vendors:
        writer.writerow([
            vendor.get("id"),
            vendor.get("name"),
            vendor.get("shop_name"),
            vendor.get("contact_email"),
            vendor.get("contact_phone"),
            vendor.get("city", "Hyderabad"),
            vendor.get("pincode"),
            vendor.get("badge", "none"),
            vendor.get("total_sales", 0),
            vendor.get("total_earnings", 0.0),
            "Yes" if vendor.get("store_open", True) else "No",
            vendor.get("created_at", "")
        ])
    
    output.seek(0)
    
    return StreamingResponse(
        iter([output.getvalue()]),
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=vendors_export.csv"}
    )

# ============= COMPLAINTS MANAGEMENT =============

@router.post("/complaints", response_model=dict)
async def create_complaint(complaint: ComplaintCreate):
    """Create new complaint (public endpoint)"""
    complaint_obj = Complaint(
        **complaint.model_dump(),
        customer_id=None  # Can link to customer if logged in
    )
    
    await db.complaints.insert_one(complaint_obj.model_dump())
    
    return {"message": "Complaint submitted successfully", "complaint_id": complaint_obj.id}

@router.get("/complaints", response_model=List[dict])
async def list_complaints(
    status: Optional[str] = None,
    token: str = Depends(lambda t: verify_admin(t, "can_view_complaints"))
):
    """List all complaints"""
    query = {}
    if status:
        query["status"] = status
    
    complaints = await db.complaints.find(query).sort("created_at", -1).to_list(length=None)
    
    for complaint in complaints:
        complaint["_id"] = str(complaint["_id"])
    
    return complaints

@router.put("/complaints/{complaint_id}", response_model=dict)
async def update_complaint(
    complaint_id: str,
    update_data: ComplaintUpdate,
    token: str = Depends(lambda t: verify_admin(t, "can_resolve_complaints"))
):
    """Update complaint status and resolution"""
    update_dict = {k: v for k, v in update_data.model_dump().items() if v is not None}
    
    if update_data.status in ["resolved", "approved", "rejected"]:
        update_dict["resolved_at"] = datetime.now(timezone.utc).isoformat()
        update_dict["resolved_by"] = token["id"]
    
    result = await db.complaints.update_one(
        {"id": complaint_id},
        {"$set": update_dict}
    )
    
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Complaint not found")
    
    return {"message": "Complaint updated successfully"}

# ============= SETTINGS MANAGEMENT =============

@router.get("/settings", response_model=SystemSettings)
async def get_settings(token: str = Depends(lambda t: verify_admin(t, "can_view_settings"))):
    """Get system settings"""
    settings = await db.settings.find_one({"id": "system_settings"})
    
    if not settings:
        # Create default settings
        default_settings = SystemSettings()
        await db.settings.insert_one(default_settings.model_dump())
        return default_settings
    
    settings.pop("_id", None)
    return SystemSettings(**settings)

@router.put("/settings", response_model=dict)
async def update_settings(
    settings_update: SystemSettingsUpdate,
    token: str = Depends(lambda t: verify_admin(t, "can_edit_settings"))
):
    """Update system settings"""
    update_dict = {k: v for k, v in settings_update.model_dump().items() if v is not None}
    update_dict["updated_at"] = datetime.now(timezone.utc).isoformat()
    update_dict["updated_by"] = token["id"]
    
    result = await db.settings.update_one(
        {"id": "system_settings"},
        {"$set": update_dict},
        upsert=True
    )
    
    return {"message": "Settings updated successfully"}

# ============= ENHANCED ORDER FILTERS =============

@router.post("/orders/filter", response_model=List[dict])
async def filter_orders(
    filters: OrderFilters,
    token: str = Depends(lambda t: verify_admin(t, "can_view_orders"))
):
    """Filter orders with multiple criteria"""
    query = {}
    
    if filters.status:
        query["status"] = filters.status
    
    if filters.payment_status:
        query["payment_status"] = filters.payment_status
    
    if filters.vendor_id:
        query["vendor_id"] = filters.vendor_id
    
    if filters.customer_email:
        query["customer_email"] = filters.customer_email
    
    if filters.date_from or filters.date_to:
        query["created_at"] = {}
        if filters.date_from:
            query["created_at"]["$gte"] = filters.date_from.isoformat()
        if filters.date_to:
            query["created_at"]["$lte"] = filters.date_to.isoformat()
    
    if filters.min_amount is not None or filters.max_amount is not None:
        query["total_amount"] = {}
        if filters.min_amount is not None:
            query["total_amount"]["$gte"] = filters.min_amount
        if filters.max_amount is not None:
            query["total_amount"]["$lte"] = filters.max_amount
    
    if filters.search_query:
        query["$or"] = [
            {"id": {"$regex": filters.search_query, "$options": "i"}},
            {"customer_name": {"$regex": filters.search_query, "$options": "i"}},
            {"customer_email": {"$regex": filters.search_query, "$options": "i"}}
        ]
    
    orders = await db.orders.find(query).sort("created_at", -1).to_list(length=None)
    
    for order in orders:
        order["_id"] = str(order["_id"])
    
    return orders
