from pydantic import BaseModel, Field, ConfigDict
from typing import Optional, List, Dict, Any
from datetime import datetime, timezone
from enum import Enum
import uuid

# Enums
class UserRole(str, Enum):
    SUPER_ADMIN = "SuperAdmin"
    SUPERVISOR = "Supervisor"
    SALES = "Sales"
    DESIGNER = "Designer"
    PRINTER = "Printer"

class OrderStatus(str, Enum):
    DRAFT = "Draft"
    ESTIMATED = "Estimated"
    PAYMENT_PENDING = "PaymentPending"
    PAID = "Paid"
    ASSIGNED = "Assigned"
    IN_PRODUCTION = "InProduction"
    READY_FOR_DELIVERY = "ReadyForDelivery"
    OUT_FOR_DELIVERY = "OutForDelivery"
    DELIVERED = "Delivered"
    READY_FOR_PICKUP = "ReadyForPickup"
    PICKED_UP = "PickedUp"
    CANCELLED = "Cancelled"

class FulfillmentType(str, Enum):
    PICKUP = "Pickup"
    DELIVERY = "Delivery"

class PaymentStatus(str, Enum):
    PENDING = "Pending"
    SUCCESS = "Success"
    FAILED = "Failed"
    REFUNDED = "Refunded"

# User Models
class User(BaseModel):
    model_config = ConfigDict(extra="ignore")
    
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    email: str
    password_hash: str
    role: UserRole
    is_active: bool = True
    twofa_enabled: bool = False
    twofa_secret: Optional[str] = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class UserCreate(BaseModel):
    email: str
    password: str
    role: UserRole

class UserLogin(BaseModel):
    email: str
    password: str
    twofa_code: Optional[str] = None

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: Dict[str, Any]

# Price Rule Models
class PaperType(BaseModel):
    id: str
    name: str
    perPage_bw: float
    perPage_color: float

class PriceRule(BaseModel):
    model_config = ConfigDict(extra="ignore")
    
    id: str = Field(default_factory=lambda: f"rule_{uuid.uuid4().hex[:8]}")
    name: str
    active: bool = True
    effectiveFrom: datetime
    effectiveTo: Optional[datetime] = None
    paperTypes: List[PaperType]
    lamination: Dict[str, float]
    binding: Dict[str, float]
    deliveryCharge: Dict[str, float]
    fallbackMultipliers: Dict[str, float]
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class PriceRuleCreate(BaseModel):
    name: str
    effectiveFrom: datetime
    effectiveTo: Optional[datetime] = None
    paperTypes: List[PaperType]
    lamination: Dict[str, float]
    binding: Dict[str, float]
    deliveryCharge: Dict[str, float]
    fallbackMultipliers: Dict[str, float]

class PriceRuleUpdate(BaseModel):
    name: Optional[str] = None
    active: Optional[bool] = None
    effectiveTo: Optional[datetime] = None
    paperTypes: Optional[List[PaperType]] = None
    lamination: Optional[Dict[str, float]] = None
    binding: Optional[Dict[str, float]] = None
    deliveryCharge: Optional[Dict[str, float]] = None
    fallbackMultipliers: Optional[Dict[str, float]] = None

class PricingAudit(BaseModel):
    model_config = ConfigDict(extra="ignore")
    
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    rule_id: str
    changed_by: str
    changed_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    reason: str
    diff: Dict[str, Any]
    previous_value: Dict[str, Any]
    new_value: Dict[str, Any]

# Vendor Models
class VendorLocation(BaseModel):
    latitude: float
    longitude: float
    address: str
    city: str
    pincode: str

class Vendor(BaseModel):
    model_config = ConfigDict(extra="ignore")
    
    id: str = Field(default_factory=lambda: f"vendor_{uuid.uuid4().hex[:8]}")
    name: str
    shop_name: str
    registration_number: str = ""
    certified: bool = False
    badge: str = "none"  # none, bronze, silver, gold, diamond, platinum
    location: VendorLocation
    contact_phone: str
    contact_email: str
    password_hash: Optional[str] = None
    address: str = ""
    working_hours: str = "9 AM - 6 PM"
    store_open: bool = True
    current_workload_count: int = 0
    total_sales: int = 0
    total_earnings: float = 0.0
    profile_image_url: Optional[str] = None
    description: str = ""
    payout_history: List[Dict[str, Any]] = []
    autoAcceptRadiusKm: float = 5.0
    is_active: bool = True
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class VendorCreate(BaseModel):
    name: str
    location: VendorLocation
    contact_phone: str
    contact_email: str
    autoAcceptRadiusKm: float = 5.0

# Order Models
class OrderItem(BaseModel):
    file_url: str
    file_name: str
    num_pages: int
    num_copies: int
    paper_type_id: str
    is_color: bool
    lamination_sheets: int = 0
    binding_type: str = "none"
    perPagePriceApplied: float
    itemSubtotal: float

class EstimateRequest(BaseModel):
    items: List[OrderItem]
    fulfillment_type: FulfillmentType
    customer_location: Optional[VendorLocation] = None

class EstimateResponse(BaseModel):
    items_total: float
    delivery_charge: float
    total: float
    breakdown: List[Dict[str, Any]]
    applied_rule_id: str
    estimated_vendor: Optional[Dict[str, Any]] = None
    delivery_quote: Optional[Dict[str, Any]] = None

class Order(BaseModel):
    model_config = ConfigDict(extra="ignore")
    
    id: str = Field(default_factory=lambda: f"order_{uuid.uuid4().hex[:8]}")
    customer_email: str
    customer_phone: str
    customer_name: str
    items: List[OrderItem]
    fulfillment_type: FulfillmentType
    customer_location: Optional[VendorLocation] = None
    items_total: float
    delivery_charge: float
    total: float
    status: OrderStatus = OrderStatus.DRAFT
    appliedPricingSnapshot: Dict[str, Any]
    assigned_vendor_id: Optional[str] = None
    assigned_vendor_snapshot: Optional[Dict[str, Any]] = None
    delivery_partner_id: Optional[str] = None
    delivery_tracking_id: Optional[str] = None
    payment_session_id: Optional[str] = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class OrderCreate(BaseModel):
    customer_email: str
    customer_phone: str
    customer_name: str
    items: List[OrderItem]
    fulfillment_type: FulfillmentType
    customer_location: Optional[VendorLocation] = None

# Payment Models
class PaymentSession(BaseModel):
    model_config = ConfigDict(extra="ignore")
    
    id: str = Field(default_factory=lambda: f"session_{uuid.uuid4().hex[:8]}")
    order_id: str
    amount: float
    currency: str = "INR"
    gateway: str
    gateway_session_id: Optional[str] = None
    status: PaymentStatus = PaymentStatus.PENDING
    payment_url: Optional[str] = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class PaymentWebhook(BaseModel):
    gateway: str
    payload: Dict[str, Any]
    signature: Optional[str] = None

# Notification Models
class NotificationLog(BaseModel):
    model_config = ConfigDict(extra="ignore")
    
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    type: str  # WhatsApp, Email
    recipient: str
    subject: Optional[str] = None
    message: str
    status: str  # Simulated, Sent, Failed
    order_id: Optional[str] = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

# S3 Upload Models
class UploadInitRequest(BaseModel):
    file_name: str
    file_type: str
    file_size: int

class UploadInitResponse(BaseModel):
    upload_id: str
    signed_url: str
    file_key: str
