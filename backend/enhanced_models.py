"""
Enhanced Models for Vaishnavi Printers
Adds: Banking details, Custom fields, Complaints, Assistant Admin, Vendor Pricing
"""

from pydantic import BaseModel, Field, ConfigDict
from typing import Optional, List, Dict, Any
from datetime import datetime, timezone
import uuid

# ============= ADMIN MODELS =============

class AdminRole(str):
    SUPER_ADMIN = "super_admin"
    ASSISTANT_ADMIN = "assistant_admin"

class AdminPermissions(BaseModel):
    """Granular permissions for assistant admins"""
    can_view_orders: bool = True
    can_edit_orders: bool = False
    can_view_vendors: bool = True
    can_edit_vendors: bool = False
    can_add_vendors: bool = False
    can_delete_vendors: bool = False
    can_view_pricing: bool = True
    can_edit_pricing: bool = False
    can_view_reports: bool = True
    can_view_complaints: bool = True
    can_resolve_complaints: bool = False
    can_view_settings: bool = False
    can_edit_settings: bool = False
    can_manage_admins: bool = False

class Admin(BaseModel):
    model_config = ConfigDict(extra="ignore")
    
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    email: str
    password_hash: str
    name: str
    role: str = AdminRole.ASSISTANT_ADMIN  # super_admin or assistant_admin
    permissions: AdminPermissions = Field(default_factory=AdminPermissions)
    is_active: bool = True
    created_by: Optional[str] = None  # ID of super admin who created this
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    last_login: Optional[datetime] = None

class AdminCreate(BaseModel):
    email: str
    password: str
    name: str
    role: str
    permissions: Optional[AdminPermissions] = None

class AdminUpdate(BaseModel):
    name: Optional[str] = None
    permissions: Optional[AdminPermissions] = None
    is_active: Optional[bool] = None

# ============= VENDOR ENHANCEMENTS =============

class BankDetails(BaseModel):
    """Banking information for vendor payouts"""
    account_holder_name: str
    account_number: str
    ifsc_code: str
    bank_name: str
    branch_name: str
    account_type: str = "Savings"  # Savings or Current
    verified: bool = False

class CustomField(BaseModel):
    """Dynamic custom fields for vendors"""
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    label: str  # e.g., "GST Number", "Certificate Number"
    value: str
    field_type: str = "text"  # text, phone, number, email, url
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class VendorPricing(BaseModel):
    """Vendor-specific pricing override"""
    enabled: bool = False
    a4_bw_single: Optional[float] = None
    a4_bw_double: Optional[float] = None
    a4_color_single_below_5: Optional[float] = None
    a4_color_double_below_5: Optional[float] = None
    a4_color_single_5_to_10: Optional[float] = None
    a4_color_double_5_to_10: Optional[float] = None
    a4_color_single_11_plus: Optional[float] = None
    a4_color_double_11_plus: Optional[float] = None
    a3_color_single_below_10: Optional[float] = None
    a3_color_double_below_10: Optional[float] = None
    a3_color_single_above_10: Optional[float] = None
    a3_color_double_above_10: Optional[float] = None
    spiral_binding_base: Optional[float] = None
    spiral_binding_per_50: Optional[float] = None
    lamination_a4: Optional[float] = None
    lamination_a3: Optional[float] = None

class VendorEnhanced(BaseModel):
    """Enhanced vendor model with all new fields"""
    model_config = ConfigDict(extra="ignore")
    
    id: str = Field(default_factory=lambda: f"vendor_{uuid.uuid4().hex[:8]}")
    name: str
    shop_name: str
    registration_number: str = ""
    certified: bool = False
    badge: str = "none"
    contact_phone: str
    contact_email: str
    password_hash: Optional[str] = None
    username: str = ""  # For login
    address: str = ""
    city: str = "Hyderabad"
    pincode: str = ""
    working_hours: str = "9 AM - 6 PM"
    store_open: bool = True
    is_online: bool = True  # Vendor can toggle this
    current_workload_count: int = 0
    total_sales: int = 0
    total_earnings: float = 0.0
    profile_image_url: Optional[str] = None
    description: str = ""
    
    # New fields
    bank_details: Optional[BankDetails] = None
    custom_fields: List[CustomField] = []
    vendor_pricing: VendorPricing = Field(default_factory=VendorPricing)
    qr_code_url: Optional[str] = None  # Unique QR code for this vendor
    last_password_reset: Optional[datetime] = None
    
    is_active: bool = True
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class VendorUpdateEnhanced(BaseModel):
    """Update model for enhanced vendor"""
    name: Optional[str] = None
    shop_name: Optional[str] = None
    contact_phone: Optional[str] = None
    contact_email: Optional[str] = None
    address: Optional[str] = None
    city: Optional[str] = None
    pincode: Optional[str] = None
    working_hours: Optional[str] = None
    description: Optional[str] = None
    bank_details: Optional[BankDetails] = None
    custom_fields: Optional[List[CustomField]] = None
    vendor_pricing: Optional[VendorPricing] = None
    is_online: Optional[bool] = None

# ============= COMPLAINTS =============

class ComplaintStatus(str):
    PENDING = "pending"
    UNDER_REVIEW = "under_review"
    APPROVED = "approved"  # Reprint approved
    REJECTED = "rejected"  # Complaint rejected
    RESOLVED = "resolved"

class Complaint(BaseModel):
    model_config = ConfigDict(extra="ignore")
    
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    order_id: str
    customer_id: Optional[str] = None
    customer_name: str
    customer_email: str
    customer_phone: str
    vendor_id: Optional[str] = None
    vendor_name: Optional[str] = None
    
    complaint_text: str
    complaint_type: str = "quality"  # quality, wrong_specs, damage, other
    proof_images: List[str] = []  # URLs to uploaded proof images
    
    status: str = ComplaintStatus.PENDING
    admin_notes: str = ""
    resolution: str = ""
    resolution_action: Optional[str] = None  # reprint, refund, reject
    
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    resolved_at: Optional[datetime] = None
    resolved_by: Optional[str] = None  # Admin ID

class ComplaintCreate(BaseModel):
    order_id: str
    customer_name: str
    customer_email: str
    customer_phone: str
    complaint_text: str
    complaint_type: str = "quality"
    proof_images: List[str] = []

class ComplaintUpdate(BaseModel):
    status: Optional[str] = None
    admin_notes: Optional[str] = None
    resolution: Optional[str] = None
    resolution_action: Optional[str] = None

# ============= SETTINGS =============

class PrinterSettings(BaseModel):
    color_printer_ip: str = "192.168.1.100"
    bw_printer_ip: str = "192.168.1.101"
    color_printer_name: str = "Color Printer"
    bw_printer_name: str = "B&W Printer"

class SystemSettings(BaseModel):
    model_config = ConfigDict(extra="ignore")
    
    id: str = "system_settings"
    currency: str = "INR"
    currency_symbol: str = "₹"
    
    printer_settings: PrinterSettings = Field(default_factory=PrinterSettings)
    
    # Business info
    business_name: str = "Vaishnavi Printers"
    business_address: str = "2-49, Taranagar, Serilingampally, Hyderabad - 500019"
    business_phone: str = "+91 9618667700"
    business_email: str = "support@vaishnaviprinters.com"
    
    # Order settings
    order_auto_cancel_hours: int = 24
    vendor_response_timeout_minutes: int = 15
    
    # Notification settings
    enable_sms: bool = True
    enable_email: bool = True
    loud_order_alert: bool = True  # For vendor dashboard
    
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_by: Optional[str] = None

class SystemSettingsUpdate(BaseModel):
    currency: Optional[str] = None
    printer_settings: Optional[PrinterSettings] = None
    business_name: Optional[str] = None
    business_address: Optional[str] = None
    business_phone: Optional[str] = None
    business_email: Optional[str] = None
    order_auto_cancel_hours: Optional[int] = None
    vendor_response_timeout_minutes: Optional[int] = None
    enable_sms: Optional[bool] = None
    enable_email: Optional[bool] = None
    loud_order_alert: Optional[bool] = None

# ============= ORDER FILTERS =============

class OrderFilters(BaseModel):
    """Filters for admin order list"""
    status: Optional[str] = None
    payment_status: Optional[str] = None
    vendor_id: Optional[str] = None
    customer_email: Optional[str] = None
    date_from: Optional[datetime] = None
    date_to: Optional[datetime] = None
    min_amount: Optional[float] = None
    max_amount: Optional[float] = None
    search_query: Optional[str] = None  # Search in order ID, customer name, etc.

# ============= ENHANCED ORDER FOR IN-STORE =============

class FileConfiguration(BaseModel):
    """Configuration for individual file in order"""
    file_name: str
    page_ranges: str  # e.g., "1-5,10-20,35"
    selected_pages: int
    paper_size: str = "A4"  # A4 or A3
    color_type: str = "black_white"  # black_white or color
    sides: str = "single"  # single or double
    copies: int = 1
    binding: str = "none"  # none or spiral
    lamination: str = "none"  # none, A4, or A3

class InStoreOrder(BaseModel):
    """Order with enhanced file configurations"""
    model_config = ConfigDict(extra="ignore")
    
    id: str = Field(default_factory=lambda: f"ORD-{uuid.uuid4().hex[:8].upper()}")
    customer_email: Optional[str] = None
    customer_name: str = "Walk-in Customer"
    customer_phone: Optional[str] = None
    
    file_configs: List[FileConfiguration]
    file_urls: List[str]  # S3 or local URLs
    
    delivery_type: str = "pickup"  # pickup or delivery
    delivery_address: Optional[Dict[str, str]] = None
    payment_method: str = "cash"  # cash or online
    payment_status: str = "pending"  # pending or paid
    
    estimate: Dict[str, Any]
    total_amount: float
    
    status: str = "pending"  # pending, printing, completed
    vendor_id: Optional[str] = None
    
    # Print job info
    needs_watermark: bool = True
    watermark_added: bool = False
    routed_to_printer: Optional[str] = None  # color_printer or bw_printer
    
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    completed_at: Optional[datetime] = None
