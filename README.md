# Vaishnavi Printers - Minimal-Code Printing Platform

A production-ready printing order management system built with **minimal custom code** using configuration-driven architecture.

## ✅ Key Features

### 1. **Complete Business Logic Implementation**
- ✅ Full pricing engine with per-page rates (B&W/Color), lamination, binding, delivery charges
- ✅ Automatic price calculation with instant estimates
- ✅ Paper type selection changes price in real-time
- ✅ Order snapshotting with `appliedPricingSnapshot`
- ✅ Vendor auto-assignment based on `autoAcceptRadiusKm`
- ✅ Extended radius suggestions (5km/10km) when no auto-match
- ✅ Delivery partner selection (cheapest-first algorithm)
- ✅ Payment gateway abstraction (PayU/Razorpay/PayTM)
- ✅ Webhook-driven status updates
- ✅ SIMULATED mode for all integrations

### 2. **Configuration-Driven Architecture**
- All pricing rules in `/app/backend/config/price_rules.json`
- Delivery partners in `/app/backend/config/delivery_partners.json`
- Payment gateways in `/app/backend/config/payment_gateways.json`
- Admin can edit configs via UI (with audit trail)

### 3. **Automated Testing**
- ✅ Pricing calculation tests (7 test cases)
- ✅ Vendor assignment tests (distance, auto-assign, manual selection)
- ✅ Delivery quote selection tests
- All tests pass in SIMULATED mode

### 4. **Tech Stack**
- **Backend**: FastAPI (Python) - minimal functions (<200 LOC each)
- **Frontend**: React 19 with Tailwind CSS + shadcn/ui
- **Database**: MongoDB (with Motor async driver)
- **Auth**: JWT-based RBAC (5 roles: SuperAdmin, Supervisor, Sales, Designer, Printer)
- **File Storage**: AWS S3 with signed URLs (simulated in dev)
- **Notifications**: WhatsApp/Email (simulated, ready for LIVE)

---

## 🚀 Quick Start

### Prerequisites
- Python 3.11+
- Node.js 18+
- MongoDB running on `localhost:27017`

### 1. Backend Setup

```bash
cd /app/backend

# Install dependencies (already installed)
pip install -r requirements.txt

# Seed database with demo data
python seed_data.py

# Start backend (via supervisor)
sudo supervisorctl restart backend
```

### 2. Frontend Setup

```bash
cd /app/frontend

# Install dependencies (already installed)
yarn install

# Start frontend (via supervisor)
sudo supervisorctl restart frontend
```

### 3. Access the Application

- **Customer Portal**: https://vaishnavi-print.preview.emergentagent.com/print
- **Admin Dashboard**: https://vaishnavi-print.preview.emergentagent.com/admin/login
  - Email: `admin@vaishnavi.com`
  - Password: `admin123`

---

## 📝 API Documentation

### Core Endpoints

#### 1. **Upload Initialization**
```http
POST /api/upload/init
Content-Type: application/json

{
  "file_name": "document.pdf",
  "file_type": "application/pdf",
  "file_size": 1048576
}

Response:
{
  "upload_id": "abc123",
  "signed_url": "https://s3.../...",
  "file_key": "uploads/abc123/document.pdf"
}
```

#### 2. **Calculate Estimate**
```http
POST /api/calculate-estimate
Content-Type: application/json

{
  "items": [
    {
      "file_url": "uploads/abc123/doc.pdf",
      "file_name": "doc.pdf",
      "num_pages": 10,
      "num_copies": 2,
      "paper_type_id": "a4_70gsm",
      "is_color": false,
      "lamination_sheets": 0,
      "binding_type": "none",
      "perPagePriceApplied": 0,
      "itemSubtotal": 0
    }
  ],
  "fulfillment_type": "Pickup",
  "customer_location": null
}

Response:
{
  "items_total": 10.0,
  "delivery_charge": 0.0,
  "total": 10.0,
  "breakdown": [...],
  "applied_rule_id": "rule_001"
}
```

#### 3. **Create Payment Session**
```http
POST /api/payments/create-session?order_id=order_abc123

Response:
{
  "id": "session_xyz",
  "order_id": "order_abc123",
  "amount": 150.0,
  "currency": "INR",
  "gateway": "razorpay",
  "payment_url": "https://...",
  "status": "Pending"
}
```

#### 4. **Payment Webhook**
```http
POST /api/webhooks/payment/razorpay
X-Signature: <webhook_signature>
Content-Type: application/json

{
  "order_id": "order_abc123",
  "payment_id": "pay_xyz",
  "amount": 150.0,
  "status": "captured"
}
```

### Wix Backend Integration

For Wix integration, create backend code (Backend/http-functions.js):

```javascript
import { ok } from 'wix-http-functions';
import wixData from 'wix-data';

const API_URL = 'https://your-api.com/api';

export async function post_calculateEstimate(request) {
  const body = await request.body.text();
  const estimate = await fetch(`${API_URL}/calculate-estimate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: body
  });
  return ok({ body: await estimate.text() });
}

export async function post_createPaymentSession(request) {
  const { orderId } = await request.body.json();
  const session = await fetch(`${API_URL}/payments/create-session?order_id=${orderId}`, {
    method: 'POST'
  });
  return ok({ body: await session.text() });
}

export async function post_webhookPayment(request) {
  const signature = request.headers['x-signature'];
  const body = await request.body.text();
  
  const result = await fetch(`${API_URL}/webhooks/payment/razorpay`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Signature': signature
    },
    body: body
  });
  
  return ok({ body: await result.text() });
}
```

---

## 🧪 Testing

### Run Automated Tests

```bash
cd /app
PYTHONPATH=/app/backend python -m pytest tests/ -v
```

### Test Coverage

1. **Pricing Tests** (`test_pricing.py`):
   - Basic B&W pricing
   - Color pricing
   - Lamination pricing
   - Binding pricing
   - Multiple items
   - Paper type changes

2. **Vendor Tests** (`test_vendors.py`):
   - Distance calculation
   - Nearest vendor finding
   - Auto-assignment within radius
   - Manual selection required

3. **Delivery Tests** (`test_delivery.py`):
   - Quote generation
   - Cheapest partner selection
   - Booking simulation

### Manual Acceptance Tests

#### Test 1: Complete Order Flow (Pickup)
1. Go to `/print`
2. Enter customer details (Name, Email, Phone)
3. Upload a file
4. Set: 10 pages, 2 copies, A4 70 GSM, B&W
5. Select "Store Pickup"
6. Click "Calculate Estimate"
7. **Expected**: Auto-navigates to Estimate tab, shows ₹10.00 (10 pages × 2 copies × ₹0.50)
8. Click "Confirm Order"
9. Click "Proceed to Payment"
10. **Expected**: Payment confirmed, redirected to tracking page

#### Test 2: Price Change on Paper Type
1. Configure an item with A4 70 GSM
2. Calculate estimate - note price
3. Change to A4 80 GSM
4. Recalculate estimate
5. **Expected**: Price increases (0.50 → 0.75 per page)

#### Test 3: Admin Pricing Edit
1. Login to admin (`admin@vaishnavi.com` / `admin123`)
2. Go to Pricing tab
3. View active price rule
4. **Expected**: See all paper types, lamination, binding prices
5. **Expected**: Changes create audit log entry

---

## 🔧 Configuration Files

### 1. Price Rules (`/app/backend/config/price_rules.json`)

```json
{
  "rules": [
    {
      "id": "rule_001",
      "name": "Standard Pricing 2025",
      "active": true,
      "paperTypes": [
        {
          "id": "a4_70gsm",
          "name": "A4 70 GSM",
          "perPage_bw": 0.50,
          "perPage_color": 3.00
        }
      ],
      "lamination": { "perSheet": 10.00 },
      "binding": { "spiral": 25.00, "hardcover": 75.00 },
      "deliveryCharge": {
        "baseRate": 50.00,
        "perKmRate": 10.00,
        "freeAbove": 500.00
      }
    }
  ]
}
```

### 2. Delivery Partners (`/app/backend/config/delivery_partners.json`)

```json
{
  "partners": [
    {
      "id": "uber_direct",
      "name": "Uber Direct",
      "enabled": true,
      "mode": "SIMULATED",
      "baseRate": 40.00,
      "perKmRate": 8.00,
      "maxDistanceKm": 25
    }
  ]
}
```

---

## 🔒 Security

### Secrets Management
- JWT secret: Environment variable `JWT_SECRET_KEY`
- Payment gateway keys: Stored in `payment_gateways.json` (admin-editable)
- S3 credentials: Environment variables `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`
- Webhook verification: Signature validation for all webhooks

### Authentication
- JWT tokens with 24-hour expiration
- Role-based access control (RBAC)
- Password hashing with bcrypt
- Optional 2FA support (ready, not enabled)

---

## 🚀 Deployment (SIMULATED → LIVE)

### Step 1: Configure Payment Gateway

1. Get API keys from Razorpay/PayU/PayTM
2. Update `/app/backend/config/payment_gateways.json`:
   ```json
   {
     "gateways": [
       {
         "id": "razorpay",
         "sandboxKeyId": "rzp_test_...",
         "sandboxKeySecret": "...",
         "prodKeyId": "rzp_live_...",
         "prodKeySecret": "..."
       }
     ],
     "activeGateway": "razorpay",
     "mode": "LIVE"  // Change from SIMULATED
   }
   ```

### Step 2: Configure AWS S3

```bash
# Set environment variables
export USE_S3=true
export S3_BUCKET=vaishnavi-printers-prod
export AWS_ACCESS_KEY_ID=AKIA...
export AWS_SECRET_ACCESS_KEY=...
```

### Step 3: Enable WhatsApp Notifications

1. Get Meta WhatsApp Business API credentials
2. Update notification service mode to `LIVE`
3. Add credentials to `.env`

### Step 4: Restart Services

```bash
sudo supervisorctl restart backend frontend
```

---

## 📊 Monitoring & Logs

### View Logs

```bash
# Backend logs
tail -f /var/log/supervisor/backend.*.log

# Frontend logs
tail -f /var/log/supervisor/frontend.*.log
```

### Check Service Status

```bash
sudo supervisorctl status
```

---

## 📝 Audit Trail

All pricing changes are logged in `pricing_audits` collection:

```json
{
  "id": "audit_001",
  "rule_id": "rule_001",
  "changed_by": "admin@vaishnavi.com",
  "changed_at": "2025-01-15T10:30:00Z",
  "reason": "Updated paper prices for 2025",
  "diff": { "paperTypes[0].perPage_bw": { "old": 0.40, "new": 0.50 } },
  "previous_value": { ... },
  "new_value": { ... }
}
```

---

## 💻 Development

### Project Structure

```
/app/
├── backend/
│   ├── server.py           # Main FastAPI app
│   ├── models.py           # Pydantic models
│   ├── auth.py             # JWT authentication
│   ├── pricing.py          # Pricing engine (<200 LOC)
│   ├── vendors.py          # Vendor assignment
│   ├── delivery.py         # Delivery partners
│   ├── payments.py         # Payment gateway abstraction
│   ├── notifications.py    # WhatsApp/Email
│   ├── uploads.py          # S3 signed URLs
│   ├── config/
│   │   ├── price_rules.json
│   │   ├── delivery_partners.json
│   │   └── payment_gateways.json
│   ├── seed_data.py        # Database seeding
│   └── requirements.txt
│
├── frontend/
│   ├── src/
│   │   ├── pages/
│   │   │   ├── HomePage.js
│   │   │   ├── CustomerPortal.js  # Main ordering UI
│   │   │   ├── AdminDashboard.js
│   │   │   └── admin/
│   │   ├── context/AuthContext.js
│   │   ├── components/
│   │   └── App.js
│   └── package.json
│
├── tests/
│   ├── test_pricing.py
│   ├── test_vendors.py
│   └── test_delivery.py
│
└── README.md
```

### Code Principles

1. **Configuration over Code**: All business rules in JSON configs
2. **Function Size**: No function >200 LOC
3. **Testing**: Every business logic function has tests
4. **SIMULATED First**: All integrations work in simulated mode
5. **Audit Everything**: Price changes, status updates logged

---

## ✅ Acceptance Checklist

- [x] Pricing logic: All scenarios tested and working
- [x] Paper type change: Updates price immediately
- [x] Estimate button: Auto-navigates to Estimation tab
- [x] Order snapshotting: `appliedPricingSnapshot` saved
- [x] Pickup auto-assign: Works within `autoAcceptRadiusKm`
- [x] Extended radius: 5km/10km suggestions shown
- [x] Delivery quotes: Cheapest partner selected
- [x] Payment flow: Session created, webhook processed
- [x] Admin pricing: View and edit rules
- [x] Audit trail: All changes logged with diff
- [x] Automated tests: All pass
- [x] Documentation: Complete API docs and deployment guide

---

## 📞 Support

For issues or questions:
- Email: support@vaishnavi.com
- Admin Dashboard: Check logs and audit trail
- GitHub Issues: (if applicable)

---

## 📜 License

Proprietary - Vaishnavi Printers 2025
