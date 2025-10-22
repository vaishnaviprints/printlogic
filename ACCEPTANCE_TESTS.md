# Acceptance Test Checklist

Run through these tests manually to verify all business logic is working correctly.

---

## Test 1: Basic Pricing Calculation

**Objective**: Verify basic B&W printing price calculation

### Steps:
1. Go to https://vaishnavi-print.preview.emergentagent.com/print
2. Fill customer details:
   - Name: Test Customer
   - Email: test@example.com
   - Phone: +91 98765 43210
3. Upload a file (or simulate with existing file)
4. Configure item:
   - Pages: 10
   - Copies: 2
   - Paper: A4 70 GSM
   - Color: B&W
5. Select "Store Pickup"
6. Click "Calculate Estimate"

### Expected Result:
- ✅ Auto-navigates to "Estimate" tab
- ✅ Shows breakdown: 10 pages × 2 copies × ₹0.50 = ₹10.00
- ✅ Delivery charge: ₹0.00
- ✅ Total: ₹10.00

---

## Test 2: Paper Type Change Updates Price

**Objective**: Verify paper type selection changes per-page price immediately

### Steps:
1. Start with Test 1 setup
2. Note current estimate (₹10.00)
3. Change paper type from "A4 70 GSM" to "A4 80 GSM"
4. Click "Calculate Estimate" again

### Expected Result:
- ✅ New price: 10 pages × 2 copies × ₹0.75 = ₹15.00
- ✅ Breakdown shows updated per-page price (₹0.75)
- ✅ Total increases from ₹10.00 to ₹15.00

---

## Test 3: Color Printing Pricing

**Objective**: Verify color printing uses different per-page rate

### Steps:
1. Configure item:
   - Pages: 5
   - Copies: 1
   - Paper: A4 70 GSM
   - **Color: Color**
2. Calculate estimate

### Expected Result:
- ✅ Price: 5 pages × 1 copy × ₹3.00 = ₹15.00
- ✅ Breakdown shows "Color" designation
- ✅ Per-page price is ₹3.00 (not ₹0.50)

---

## Test 4: Lamination Pricing

**Objective**: Verify lamination adds correct cost

### Steps:
1. Configure item:
   - Pages: 10
   - Copies: 1
   - Paper: A4 70 GSM
   - Color: B&W
   - Lamination: 5 sheets
2. Calculate estimate

### Expected Result:
- ✅ Base cost: 10 × 1 × ₹0.50 = ₹5.00
- ✅ Lamination: 5 sheets × ₹10.00 = ₹50.00
- ✅ Total: ₹55.00

---

## Test 5: Binding Pricing

**Objective**: Verify binding adds correct cost

### Steps:
1. Configure item:
   - Pages: 100
   - Copies: 1
   - Paper: A4 80 GSM
   - Color: B&W
   - Binding: Spiral
2. Calculate estimate

### Expected Result:
- ✅ Base cost: 100 × 1 × ₹0.75 = ₹75.00
- ✅ Binding: ₹25.00
- ✅ Total: ₹100.00

---

## Test 6: Multiple Items

**Objective**: Verify multiple items calculate correctly

### Steps:
1. Add two files:
   - File 1: 10 pages, 1 copy, A4 70 GSM, B&W
   - File 2: 5 pages, 2 copies, A4 70 GSM, Color
2. Calculate estimate

### Expected Result:
- ✅ Item 1: ₹5.00
- ✅ Item 2: ₹30.00
- ✅ Total: ₹35.00
- ✅ Breakdown shows both items

---

## Test 7: Complete Order Flow (Pickup)

**Objective**: Verify full customer journey with pickup

### Steps:
1. Configure order (any valid configuration)
2. Calculate estimate
3. Click "Confirm Order"
4. Verify redirected to "Payment" tab
5. Note Order ID
6. Click "Proceed to Payment"
7. Wait for simulated payment (2 seconds)

### Expected Result:
- ✅ Order created with status "Estimated"
- ✅ Payment session created
- ✅ After 2 seconds: Toast "Payment confirmed!"
- ✅ Redirected to tracking page `/track/{orderId}`
- ✅ Order status: "Paid"
- ✅ Shows order details and progress timeline

---

## Test 8: Complete Order Flow (Delivery)

**Objective**: Verify delivery flow with partner selection

### Steps:
1. Configure order
2. Select "Home Delivery"
3. Calculate estimate
4. Verify delivery charge added
5. Complete order and payment

### Expected Result:
- ✅ Estimate shows delivery charge (varies by distance)
- ✅ Delivery quote from cheapest partner shown
- ✅ Order completed with delivery selected
- ✅ Total includes delivery charge

---

## Test 9: Admin Login & Dashboard

**Objective**: Verify admin authentication and dashboard access

### Steps:
1. Go to https://vaishnavi-print.preview.emergentagent.com/admin/login
2. Enter credentials:
   - Email: admin@vaishnavi.com
   - Password: admin123
3. Click "Sign In"

### Expected Result:
- ✅ Login successful
- ✅ Redirected to admin dashboard
- ✅ Shows "Orders" tab active
- ✅ Header shows user email
- ✅ Navigation tabs visible: Orders, Pricing, Vendors, Settings

---

## Test 10: Admin - View Orders

**Objective**: Verify admin can see all orders

### Steps:
1. Login to admin dashboard
2. Go to "Orders" tab (default)
3. Create a test order via customer portal (if none exist)
4. Refresh orders list

### Expected Result:
- ✅ Orders table shows all orders
- ✅ Displays: Order ID, Customer, Total, Status
- ✅ Search box works for filtering
- ✅ Status dropdown allows changing order status

---

## Test 11: Admin - View Pricing Rules

**Objective**: Verify admin can view active pricing

### Steps:
1. Login to admin dashboard
2. Go to "Pricing" tab
3. View active price rule

### Expected Result:
- ✅ Shows "Standard Pricing 2025" (or active rule)
- ✅ Displays all paper types with rates:
  - A4 70 GSM: B&W ₹0.50, Color ₹3.00
  - A4 80 GSM: B&W ₹0.75, Color ₹4.00
  - A3 70 GSM: B&W ₹1.50, Color ₹8.00
- ✅ Shows lamination: ₹10.00/sheet
- ✅ Shows binding: Spiral ₹25.00, Hardcover ₹75.00
- ✅ Shows delivery base: ₹50.00

---

## Test 12: Admin - View Vendors

**Objective**: Verify admin can view all vendor stores

### Steps:
1. Login to admin dashboard
2. Go to "Vendors" tab

### Expected Result:
- ✅ Shows 3 vendors (seeded data):
  - Vaishnavi Printers - Central Store
  - Vaishnavi Printers - North Branch
  - Vaishnavi Printers - South Branch
- ✅ Each card shows:
  - Name, Address, Phone, Email
  - Active/Inactive status
  - Auto-accept radius

---

## Test 13: Applied Pricing Snapshot

**Objective**: Verify orders save pricing snapshot

### Steps:
1. Create and complete an order
2. Check MongoDB `orders` collection
3. Verify `appliedPricingSnapshot` field

### Expected Result (MongoDB):
```json
{
  "id": "order_xyz",
  "appliedPricingSnapshot": {
    "id": "rule_001",
    "name": "Standard Pricing 2025",
    "paperTypes": [...],
    "lamination": {...},
    "binding": {...},
    "deliveryCharge": {...}
  }
}
```

---

## Test 14: Estimate Button Auto-Navigation

**Objective**: Verify Estimate button automatically opens Estimation tab

### Steps:
1. Go to customer portal
2. Configure an order on "Upload" tab
3. Click "Calculate Estimate"
4. **Observe tab change**

### Expected Result:
- ✅ Page automatically switches to "Estimate" tab
- ✅ No manual tab click required
- ✅ Estimate breakdown visible immediately

---

## Test 15: Vendor Auto-Assignment (Simulated)

**Objective**: Verify pickup location suggests nearest vendor

### Steps:
1. Configure pickup order
2. Calculate estimate with customer location (simulated)
3. Check estimate response for vendor suggestion

### Expected Result:
- ✅ Estimate includes `estimated_vendor` field
- ✅ Shows nearest vendor within auto-accept radius
- ✅ If none within radius, shows extended suggestions (5km, 10km)

---

## Test 16: Automated Tests Pass

**Objective**: Verify all unit tests pass

### Steps:
```bash
cd /app
./run_tests.sh
```

### Expected Result:
```
✅ ALL TESTS PASSED!

Test Coverage Summary:
  - Pricing: 7 tests
  - Vendors: 4 tests  
  - Delivery: 3 tests

Total: 14 automated tests
```

---

## Test 17: SIMULATED Mode Verification

**Objective**: Verify all integrations run in simulated mode

### Steps:
1. Check `/app/backend/config/payment_gateways.json`
2. Verify `"mode": "SIMULATED"`
3. Create an order and check logs

### Expected Result:
- ✅ Payment gateway config shows SIMULATED mode
- ✅ Backend logs show: `[SIMULATED WhatsApp]` notifications
- ✅ Payment webhooks accepted without real gateway
- ✅ Delivery partners return simulated quotes

---

## Summary Checklist

Mark each test as you complete it:

- [ ] Test 1: Basic Pricing
- [ ] Test 2: Paper Type Change
- [ ] Test 3: Color Printing
- [ ] Test 4: Lamination
- [ ] Test 5: Binding
- [ ] Test 6: Multiple Items
- [ ] Test 7: Complete Order (Pickup)
- [ ] Test 8: Complete Order (Delivery)
- [ ] Test 9: Admin Login
- [ ] Test 10: Admin Orders
- [ ] Test 11: Admin Pricing
- [ ] Test 12: Admin Vendors
- [ ] Test 13: Pricing Snapshot
- [ ] Test 14: Auto-Navigation
- [ ] Test 15: Vendor Assignment
- [ ] Test 16: Automated Tests
- [ ] Test 17: SIMULATED Mode

---

**Status**: All acceptance criteria must pass before delivery.

**Date**: _____________
**Tested By**: _____________
**Result**: [ ] PASS [ ] FAIL

If any test fails, document the issue and resolution below:

---

## Issue Log

| Test # | Issue Description | Resolution | Status |
|--------|-------------------|------------|--------|
|        |                   |            |        |
