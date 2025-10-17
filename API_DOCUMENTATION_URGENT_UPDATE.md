# API Documentation - Urgent Update Features

**Base URL:** `https://printshop-flow.preview.emergentagent.com/api`

---

## Authentication

All authenticated endpoints require a JWT token in the Authorization header:
```
Authorization: Bearer {token}
```

### Get Admin Token
```bash
POST /auth/login
Content-Type: application/json

{
  "email": "admin@vaishnavi.com",
  "password": "admin123"
}
```

**Response:**
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "token_type": "bearer",
  "user": {
    "id": "user_admin_001",
    "email": "admin@vaishnavi.com",
    "role": "SuperAdmin"
  }
}
```

### Get Vendor Token
```bash
POST /auth/vendor/login
Content-Type: application/x-www-form-urlencoded

email=central@vaishnavi.com
password=vendor123
```

**Response:**
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "token_type": "bearer",
  "user": {
    "id": "vendor_central",
    "name": "Vaishnavi Printers - Central Store",
    "shop_name": "Vaishnavi Central",
    "email": "central@vaishnavi.com",
    "type": "vendor",
    "badge": "gold",
    "certified": true
  }
}
```

---

## 1. Admin Pricing Management

### 1.1 Get Paper Types
```bash
GET /admin/price-rules/paper-types
Authorization: Bearer {admin_token}
```

**Response:**
```json
[
  {
    "id": "a4_70gsm",
    "name": "A4 70 GSM",
    "perPage_bw": 0.50,
    "perPage_color": 3.00
  },
  {
    "id": "a4_80gsm",
    "name": "A4 80 GSM",
    "perPage_bw": 0.75,
    "perPage_color": 4.00
  },
  {
    "id": "a3_70gsm",
    "name": "A3 70 GSM",
    "perPage_bw": 1.50,
    "perPage_color": 8.00
  }
]
```

### 1.2 Add New Paper Type
```bash
POST /admin/price-rules/paper-types
Authorization: Bearer {admin_token}
Content-Type: application/json

{
  "id": "a4_100gsm",
  "name": "A4 100 GSM Premium",
  "perPage_bw": 1.00,
  "perPage_color": 5.00
}
```

**Response:**
```json
{
  "message": "Paper type added",
  "paper_type": {
    "id": "a4_100gsm",
    "name": "A4 100 GSM Premium",
    "perPage_bw": 1.00,
    "perPage_color": 5.00
  }
}
```

### 1.3 Update Paper Type (Creates Audit)
```bash
PUT /admin/price-rules/paper-types/a4_70gsm
Authorization: Bearer {admin_token}
Content-Type: application/x-www-form-urlencoded

perPage_bw=0.65&perPage_color=3.50&reason=Market rate adjustment for 2025
```

**Response:**
```json
{
  "message": "Paper type updated",
  "paper_type": {
    "id": "a4_70gsm",
    "name": "A4 70 GSM",
    "perPage_bw": 0.65,
    "perPage_color": 3.50
  }
}
```

**Note:** This automatically creates a PricingAudit entry with diff tracking.

### 1.4 Delete Paper Type
```bash
DELETE /admin/price-rules/paper-types/a4_100gsm?reason=No longer offering this paper
Authorization: Bearer {admin_token}
```

**Response:**
```json
{
  "message": "Paper type deleted"
}
```

### 1.5 Get Pricing Audit History
```bash
GET /pricing-audits?rule_id=rule_001
Authorization: Bearer {admin_token}
```

**Response:**
```json
[
  {
    "id": "audit_abc123",
    "rule_id": "rule_001",
    "changed_by": "admin@vaishnavi.com",
    "changed_at": "2025-01-17T10:30:00Z",
    "reason": "Market rate adjustment for 2025",
    "diff": {
      "paperType": "a4_70gsm",
      "changes": {
        "perPage_bw": {
          "old": 0.50,
          "new": 0.65
        },
        "perPage_color": {
          "old": 3.00,
          "new": 3.50
        }
      }
    },
    "previous_value": { "id": "a4_70gsm", "perPage_bw": 0.50, "perPage_color": 3.00 },
    "new_value": { "id": "a4_70gsm", "perPage_bw": 0.65, "perPage_color": 3.50 }
  }
]
```

---

## 2. Admin Vendors Management

### 2.1 List All Vendors
```bash
GET /admin/vendors/list
Authorization: Bearer {admin_token}
```

**Response:**
```json
[
  {
    "id": "vendor_central",
    "name": "Vaishnavi Printers - Central Store",
    "shop_name": "Vaishnavi Central",
    "registration_number": "VP-VND-2025001234",
    "certified": true,
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
    "address": "123 MG Road, Bangalore 560001",
    "working_hours": "9 AM - 9 PM",
    "store_open": true,
    "current_workload_count": 0,
    "total_sales": 250,
    "total_earnings": 125000.0,
    "description": "Premium printing services with 10+ years experience",
    "autoAcceptRadiusKm": 5.0,
    "is_active": true
  },
  {
    "id": "vendor_north",
    "name": "Vaishnavi Printers - North Branch",
    "shop_name": "Vaishnavi North",
    "registration_number": "VP-VND-2025002345",
    "certified": false,
    "badge": "silver",
    "store_open": false,
    "total_sales": 75,
    "total_earnings": 45000.0
  }
]
```

### 2.2 Update Vendor Details
```bash
PUT /admin/vendors/vendor_central
Authorization: Bearer {admin_token}
Content-Type: application/json

{
  "certified": true,
  "badge": "platinum",
  "description": "Top-rated certified vendor",
  "autoAcceptRadiusKm": 10.0
}
```

**Response:**
```json
{
  "message": "Vendor updated successfully"
}
```

**Note:** This creates an entry in vendor_audits collection.

### 2.3 Get Badge Configuration
```bash
GET /admin/badges/config
Authorization: Bearer {admin_token}
```

**Response:**
```json
{
  "none": {
    "minSales": 0,
    "color": "#9CA3AF"
  },
  "bronze": {
    "minSales": 10,
    "color": "#CD7F32"
  },
  "silver": {
    "minSales": 50,
    "color": "#C0C0C0"
  },
  "gold": {
    "minSales": 200,
    "color": "#FFD700"
  },
  "diamond": {
    "minSales": 500,
    "color": "#B9F2FF"
  },
  "platinum": {
    "minSales": 1000,
    "color": "#E5E4E2"
  }
}
```

### 2.4 Update Badge Configuration
```bash
POST /admin/badges/config
Authorization: Bearer {admin_token}
Content-Type: application/json

{
  "bronze": {
    "minSales": 15,
    "color": "#CD7F32"
  },
  "silver": {
    "minSales": 60,
    "color": "#C0C0C0"
  },
  "gold": {
    "minSales": 250,
    "color": "#FFD700"
  }
}
```

**Response:**
```json
{
  "message": "Badge configuration updated",
  "thresholds": {
    "bronze": { "minSales": 15, "color": "#CD7F32" },
    "silver": { "minSales": 60, "color": "#C0C0C0" },
    "gold": { "minSales": 250, "color": "#FFD700" }
  }
}
```

---

## 3. Vendor Registration & Profile

### 3.1 Register New Vendor
```bash
POST /vendor/register
Content-Type: application/json

{
  "name": "Print Express",
  "shop_name": "Print Express Store",
  "location": {
    "latitude": 12.9350,
    "longitude": 77.6245,
    "address": "Koramangala, Bangalore",
    "city": "Bangalore",
    "pincode": "560034"
  },
  "contact_phone": "+919988776655",
  "contact_email": "express@print.com",
  "password": "express123",
  "address": "45 Koramangala 5th Block, Bangalore",
  "description": "Fast printing services in Koramangala",
  "autoAcceptRadiusKm": 5.0
}
```

**Response:**
```json
{
  "message": "Vendor registered successfully",
  "vendor_id": "vendor_a1b2c3d4",
  "registration_number": "VP-VND-2025123456"
}
```

**Note:** Registration number is auto-generated in format `VP-VND-{YEAR}{6-digits}`.

### 3.2 Get Vendor Profile
```bash
GET /vendor/profile
Authorization: Bearer {vendor_token}
```

**Response:**
```json
{
  "id": "vendor_central",
  "name": "Vaishnavi Printers - Central Store",
  "shop_name": "Vaishnavi Central",
  "registration_number": "VP-VND-2025001234",
  "certified": true,
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
  "address": "123 MG Road, Bangalore 560001",
  "working_hours": "9 AM - 9 PM",
  "store_open": true,
  "current_workload_count": 0,
  "total_sales": 250,
  "total_earnings": 125000.0,
  "payout_history": [],
  "description": "Premium printing services with 10+ years experience",
  "profile_image_url": null,
  "autoAcceptRadiusKm": 5.0,
  "is_active": true
}
```

### 3.3 Update Vendor Profile
```bash
PUT /vendor/profile
Authorization: Bearer {vendor_token}
Content-Type: application/x-www-form-urlencoded

name=Vaishnavi Central Premium&description=Premium printing with same-day delivery&working_hours=8 AM - 10 PM
```

**Response:**
```json
{
  "message": "Profile updated successfully"
}
```

---

## 4. Vendor Store Toggle

### 4.1 Toggle Store Open/Closed
```bash
PUT /vendor/store
Authorization: Bearer {vendor_token}
Content-Type: application/x-www-form-urlencoded

store_open=false
```

**Response:**
```json
{
  "message": "Store marked as closed",
  "store_open": false
}
```

**Behavior:**
- When `store_open=false`, vendor will NOT receive new order assignments
- When `store_open=true`, vendor becomes eligible for order assignments
- Creates audit log entry in `vendor_audits` collection

### 4.2 Re-open Store
```bash
PUT /vendor/store
Authorization: Bearer {vendor_token}
Content-Type: application/x-www-form-urlencoded

store_open=true
```

**Response:**
```json
{
  "message": "Store marked as open",
  "store_open": true
}
```

---

## 5. Vendor Order Actions (Accept/Decline)

### 5.1 Get Vendor Orders
```bash
GET /vendor/orders
Authorization: Bearer {vendor_token}
```

**Response:**
```json
[
  {
    "id": "order_abc123",
    "customer_name": "John Doe",
    "customer_email": "john@example.com",
    "customer_phone": "+919876543210",
    "items": [
      {
        "file_name": "document.pdf",
        "num_pages": 10,
        "num_copies": 2,
        "paper_type_id": "a4_70gsm",
        "is_color": false
      }
    ],
    "total": 150.50,
    "status": "Paid",
    "fulfillment_type": "Pickup",
    "assigned_vendor_id": "vendor_central",
    "vendor_acceptance": {
      "status": "pending",
      "pending_since": "2025-01-17T10:00:00Z",
      "timeout_at": "2025-01-17T10:02:00Z",
      "accepted_at": null,
      "declined_at": null,
      "reassignment_attempts": 0
    },
    "created_at": "2025-01-17T10:00:00Z",
    "statusHistory": [
      {
        "status": "Estimated",
        "by": "system",
        "note": "Order created",
        "at": "2025-01-17T10:00:00Z"
      },
      {
        "status": "Paid",
        "by": "system",
        "note": "Payment confirmed",
        "at": "2025-01-17T10:01:00Z"
      }
    ]
  }
]
```

### 5.2 Accept Order
```bash
PUT /vendor/orders/order_abc123/action
Authorization: Bearer {vendor_token}
Content-Type: application/x-www-form-urlencoded

action=accept&note=Order accepted, will start printing immediately
```

**Response:**
```json
{
  "message": "Order accepted successfully",
  "status": "success"
}
```

**Effect:**
- Order status → `Assigned`
- `vendor_acceptance.status` → `accepted`
- `vendor_acceptance.accepted_at` → current timestamp
- `vendor_acceptance.accepted_by_vendor_id` → vendor ID
- `assigned_vendor_snapshot` created with vendor details
- Customer receives WhatsApp notification
- statusHistory updated with acceptance event

### 5.3 Decline Order
```bash
PUT /vendor/orders/order_abc123/action
Authorization: Bearer {vendor_token}
Content-Type: application/x-www-form-urlencoded

action=decline&note=Too busy with current orders
```

**Response:**
```json
{
  "message": "Order declined, reassigning to next vendor",
  "status": "success"
}
```

**Effect:**
- `vendor_acceptance.status` → `declined`
- `vendor_acceptance.declined_at` → current timestamp
- `vendor_acceptance.reassignment_attempts` incremented
- Vendor's `current_workload_count` decremented
- System automatically tries next eligible vendor
- If max attempts (3) reached, order flagged for manual assignment

---

## 6. Order Workflow & Manual Assignment

### 6.1 Get Order Details (with Vendor Acceptance Status)
```bash
GET /orders/order_abc123
Authorization: Bearer {customer_token}
```

**Response:**
```json
{
  "id": "order_abc123",
  "customer_email": "customer@test.com",
  "customer_phone": "+919876543210",
  "customer_name": "Test Customer",
  "items": [...],
  "total": 150.50,
  "status": "Paid",
  "assigned_vendor_id": "vendor_central",
  "assigned_vendor_snapshot": {
    "vendorId": "vendor_central",
    "shopName": "Vaishnavi Central",
    "address": "123 MG Road, Bangalore 560001",
    "contact": "+919876543210",
    "location": {
      "latitude": 12.9716,
      "longitude": 77.5946
    }
  },
  "vendor_acceptance": {
    "status": "accepted",
    "pending_since": "2025-01-17T10:00:00Z",
    "accepted_at": "2025-01-17T10:01:30Z",
    "declined_at": null,
    "timeout_at": null,
    "accepted_by_vendor_id": "vendor_central",
    "reassignment_attempts": 0
  },
  "need_manual_assign": false,
  "appliedPricingSnapshot": {
    "id": "rule_001",
    "name": "Standard Pricing 2025",
    "paperTypes": [...]
  },
  "statusHistory": [
    {
      "status": "Estimated",
      "by": "system",
      "note": "Order created",
      "at": "2025-01-17T10:00:00Z"
    },
    {
      "status": "Paid",
      "by": "system",
      "note": "Payment confirmed",
      "at": "2025-01-17T10:01:00Z"
    },
    {
      "status": "Assigned",
      "by": "vendor_central",
      "note": "Vendor accepted order",
      "at": "2025-01-17T10:01:30Z"
    }
  ]
}
```

### 6.2 Get Orders Needing Manual Assignment (Admin)
```bash
GET /orders?need_manual_assign=true
Authorization: Bearer {admin_token}
```

**Response:**
```json
[
  {
    "id": "order_xyz789",
    "customer_name": "Jane Smith",
    "total": 250.00,
    "status": "Paid",
    "need_manual_assign": true,
    "vendor_acceptance": {
      "status": "timeout",
      "reassignment_attempts": 3
    },
    "statusHistory": [...]
  }
]
```

### 6.3 Manually Assign Order to Vendor (Admin)
```bash
PATCH /orders/order_xyz789/status
Authorization: Bearer {admin_token}
Content-Type: application/json

{
  "status": "Assigned",
  "assigned_vendor_id": "vendor_south",
  "note": "Manually assigned by admin"
}
```

**Response:**
```json
{
  "status": "updated"
}
```

---

## 7. Vendor Order Completion (with Badge Check)

### 7.1 Start Production
```bash
PATCH /vendor/orders/order_abc123/start
Authorization: Bearer {vendor_token}
```

**Response:**
```json
{
  "message": "Production started",
  "status": "success"
}
```

### 7.2 Complete Order (Triggers Badge Check)
```bash
PATCH /vendor/orders/order_abc123/complete?proof_url=https://s3.../proof.jpg
Authorization: Bearer {vendor_token}
```

**Response:**
```json
{
  "message": "Order completed",
  "status": "success",
  "badgeUpgraded": true,
  "newBadge": "platinum"
}
```

**Effect:**
- Order status → `ReadyForPickup` or `ReadyForDelivery`
- `vendor.total_sales` incremented
- `vendor.total_earnings` increased by vendor share (90% of order total)
- `vendor.current_workload_count` decremented
- Badge recalculated based on new total_sales
- If badge upgraded, Socket.IO notification sent to vendor
- Customer receives WhatsApp notification

---

## 8. Real-time Notifications (Socket.IO)

### 8.1 Connection
```javascript
import { io } from 'socket.io-client';

const socket = io('https://printshop-flow.preview.emergentagent.com', {
  path: '/socket.io',
  auth: {
    vendor_id: 'vendor_central'  // from logged-in vendor
  },
  transports: ['websocket', 'polling']
});

socket.on('connect', () => {
  console.log('Connected to notification service');
});
```

### 8.2 Notification Events

#### New Order Notification
```javascript
socket.on('notification', (data) => {
  console.log(data);
  /* Output:
  {
    "type": "order.new",
    "data": {
      "orderId": "order_abc123",
      "summary": "2 file(s) - 20 pages",
      "total": "₹150.50",
      "createdAt": "2025-01-17T10:00:00Z",
      "timeoutMinutes": 2
    },
    "timestamp": "2025-01-17T10:00:00Z"
  }
  */
});
```

#### Badge Upgrade Notification
```javascript
socket.on('notification', (data) => {
  /* Output:
  {
    "type": "badge.upgrade",
    "data": {
      "newBadge": "platinum",
      "message": "Congratulations! You've been upgraded to PLATINUM badge!"
    }
  }
  */
});
```

#### Notification Count Update
```javascript
socket.on('notification_count', (data) => {
  console.log(data);
  /* Output:
  {
    "count": 3
  }
  */
  updateBellBadge(data.count);
});
```

### 8.3 Mark Notifications as Read
```javascript
socket.emit('mark_read', {});
// Server will respond with notification_count: { count: 0 }
```

---

## 9. Testing Scenarios

### Scenario 1: Complete Order Flow with Accept
```bash
# 1. Customer creates order (gets assigned to vendor_central)
curl -X POST ".../api/orders" -H "Authorization: Bearer {customer_token}" -d '{...}'
# Response: { "id": "order_123", "assigned_vendor_id": "vendor_central" }

# 2. Vendor receives Socket.IO notification (order.new)

# 3. Vendor accepts order
curl -X PUT ".../api/vendor/orders/order_123/action" \
  -H "Authorization: Bearer {vendor_token}" \
  -F "action=accept" \
  -F "note=Accepted"
# Response: { "message": "Order accepted successfully" }

# 4. Vendor starts production
curl -X PATCH ".../api/vendor/orders/order_123/start" \
  -H "Authorization: Bearer {vendor_token}"

# 5. Vendor completes order
curl -X PATCH ".../api/vendor/orders/order_123/complete" \
  -H "Authorization: Bearer {vendor_token}"
# Response: { "badgeUpgraded": true, "newBadge": "platinum" }
```

### Scenario 2: Decline with Auto-Reassignment
```bash
# 1. Order assigned to vendor_central

# 2. Vendor declines
curl -X PUT ".../api/vendor/orders/order_123/action" \
  -H "Authorization: Bearer {vendor_token}" \
  -F "action=decline" \
  -F "note=Too busy"
# Response: { "message": "Order declined, reassigning to next vendor" }

# 3. System auto-assigns to next vendor (vendor_south)
# 4. vendor_south receives Socket.IO notification
```

### Scenario 3: Store Closed - No Assignment
```bash
# 1. Vendor closes store
curl -X PUT ".../api/vendor/store" \
  -H "Authorization: Bearer {vendor_token}" \
  -F "store_open=false"

# 2. New order created - vendor_central is skipped (store closed)
# 3. Order assigned to next open vendor
```

### Scenario 4: Timeout → Auto-Reassignment
```bash
# 1. Order assigned to vendor_central at 10:00:00
# 2. Vendor does NOT accept within 2 minutes
# 3. At 10:02:00, system automatically:
#    - Marks vendor_acceptance.status = "timeout"
#    - Decrements vendor workload
#    - Tries next eligible vendor
```

### Scenario 5: Max Attempts → Manual Assignment
```bash
# 1. Order declined/timeout by 3 vendors
# 2. Order marked need_manual_assign=true
# 3. Admin gets order in manual queue

# Admin manually assigns:
curl -X PATCH ".../api/orders/order_123/status" \
  -H "Authorization: Bearer {admin_token}" \
  -d '{"status": "Assigned", "assigned_vendor_id": "vendor_south"}'
```

---

## 10. Error Responses

### 401 Unauthorized
```json
{
  "detail": "Could not validate credentials"
}
```

### 403 Forbidden
```json
{
  "detail": "Not a vendor account"
}
```

### 404 Not Found
```json
{
  "detail": "Order not found"
}
```

### 400 Bad Request
```json
{
  "detail": "Invalid action"
}
```

---

## 11. cURL Command Examples

### Admin Edit Price
```bash
# Login
ADMIN_TOKEN=$(curl -s -X POST "https://printshop-flow.preview.emergentagent.com/api/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@vaishnavi.com","password":"admin123"}' | jq -r '.access_token')

# Update price
curl -X PUT "https://printshop-flow.preview.emergentagent.com/api/admin/price-rules/paper-types/a4_70gsm" \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -F "perPage_bw=0.65" \
  -F "perPage_color=3.50" \
  -F "reason=2025 market rate adjustment"
```

### Vendor Accept Order
```bash
# Login
VENDOR_TOKEN=$(curl -s -X POST "https://printshop-flow.preview.emergentagent.com/api/auth/vendor/login" \
  -F "email=central@vaishnavi.com" \
  -F "password=vendor123" | jq -r '.access_token')

# Accept order
curl -X PUT "https://printshop-flow.preview.emergentagent.com/api/vendor/orders/order_abc123/action" \
  -H "Authorization: Bearer $VENDOR_TOKEN" \
  -F "action=accept" \
  -F "note=Accepted, will start immediately"
```

### Toggle Store
```bash
curl -X PUT "https://printshop-flow.preview.emergentagent.com/api/vendor/store" \
  -H "Authorization: Bearer $VENDOR_TOKEN" \
  -F "store_open=false"
```

---

## Summary

All endpoints are deployed and functional on:
**https://printshop-flow.preview.emergentagent.com/api**

Key features:
- ✅ Admin pricing with audit trail
- ✅ Vendor CRUD with audit logging
- ✅ Badge system with auto-calculation
- ✅ Vendor accept/decline with timeout
- ✅ Auto-reassignment logic (max 3 attempts)
- ✅ Manual assignment for failed cases
- ✅ Real-time Socket.IO notifications
- ✅ Earnings and sales tracking
- ✅ Store open/close control

Test with the provided cURL commands or import into Postman for easier testing.
