# Vaishnavi Printers - Complete Implementation Roadmap

## COMPLETED ✅
1. Location updates: All Bangalore → Hyderabad (2-49, Taranagar, Serilingampally, Hyderabad - 500019)
2. Terms & Conditions created (Customer + Vendor)
3. Enhanced Customer Print Portal with per-file configurations
4. QR code integration for in-store

## CRITICAL PRIORITIES (Implement Immediately)

### PHASE 1: Admin Portal Enhancements
- [ ] **Order List Filters** (Status, Date, Vendor, Payment, Customer)
- [ ] **Pricing Edit Functionality** - Fix existing + Add/Delete materials
- [ ] **Pricing Updates**: Hard binding = ₹250
- [ ] **Vendor Banking Details** - Add fields to vendor model
- [ ] **Vendor Name Edit** - Enable after creation
- [ ] **Vendor Custom Fields** - Dynamic field addition (text, phone, certificates)
- [ ] **Vendor Export to CSV** - Download vendor list
- [ ] **Vendor Login Management** - Reset password, show credentials, forgot ID
- [ ] **Complaints/Feedback Section** - New admin page
- [ ] **Assistant Admin** - Role-based access with toggles
- [ ] **Super Admin** - Upgrade current admin

### PHASE 2: Vendor Features
- [ ] **Vendor Dashboard Redesign**:
  - Present orders (requesting)
  - Store on/off toggle
  - Vendor-specific pricing
  - Fix: Home button, Footer
  - **Loud order alert sound**
- [ ] **Vendor QR Codes** - Unique QR per vendor (backend generation)
- [ ] **Vendor Individual Pricing** - Override system pricing
- [ ] **Backend Pricing Logic** - Use vendor prices when assigned

### PHASE 3: In-Store System
- [ ] **System Tray/Popup** - 4×4 or 3×4 window, bottom-right
- [ ] **Real-time Order Display** for storekeeper
- [ ] **Auto-refresh** orders list

### PHASE 4: Settings & Configuration
- [ ] **Settings Page Enhancement**:
  - Currency settings
  - Printer IP configuration (Color/BW)
  - System preferences
  - Email/SMS settings

### PHASE 5: Backend Order Processing
- [ ] **Order Watermark** - Add order number to PDFs
  - ≤10 pages: Small bottom-right on first page
  - >10 pages: Separate cover page with details
- [ ] **Page Range Processing** - Extract specific pages from PDFs
- [ ] **Print Job Creation** - With routing info (Color IP / BW IP)

### PHASE 6: Print Client (Local System)
- [ ] Python print client with WebSocket
- [ ] Auto-route to printer based on color/BW
- [ ] Direct printing capability

## IMPLEMENTATION ORDER

### WEEK 1: Critical Fixes & Admin Features
Days 1-2:
- Fix Track Order issue
- Pricing edit functionality
- Hard binding price update
- Admin order filters

Days 3-4:
- Vendor banking details
- Vendor edit functionality
- Vendor custom fields
- Vendor export

Day 5:
- Complaints section
- Vendor login management
- Assistant admin creation

### WEEK 2: Vendor & In-Store Features
Days 6-7:
- Vendor Dashboard redesign
- Vendor QR codes
- Vendor-specific pricing
- Loud order alerts

Days 8-9:
- In-store system tray/popup
- Real-time updates
- Settings page enhancements

Day 10:
- Backend order processing
- PDF watermarking
- Page range extraction

### WEEK 3: Print Client & Integration
Days 11-13:
- Python print client development
- WebSocket integration
- Printer routing logic

Days 14-15:
- Testing & bug fixes
- Performance optimization
- WordPress integration guide

## TECHNICAL ARCHITECTURE

### Database Updates Needed:
1. **Vendors Collection**:
   - bankDetails (object with account, IFSC, branch)
   - customFields (array of {key, value, type})
   - qrCode (string - URL or base64)
   - loginCredentials (username, passwordHash, lastPasswordReset)
   - pricing (object - vendor-specific prices)
   - isOnline (boolean - store on/off)

2. **Admins Collection**:
   - role (superAdmin, assistantAdmin)
   - permissions (array of permission flags)

3. **Complaints Collection**:
   - orderId
   - customerId
   - vendorId
   - complaint
   - proofImages (array)
   - status (pending, resolved, rejected)
   - resolution
   - createdAt

4. **Settings Collection**:
   - currency
   - colorPrinterIP
   - bwPrinterIP
   - systemPreferences

### Frontend Components Needed:
1. Admin:
   - ComplaintsPage.js
   - AssistantAdminPage.js
   - Enhanced SettingsPage.js
   - Enhanced VendorsPage.js (with banking, custom fields)
   - Enhanced OrdersPage.js (with filters)
   - Enhanced PricingManagerPage.js (editable)

2. Vendor:
   - Enhanced VendorDashboard.js
   - VendorPricingPage.js
   - VendorOrdersPage.js (with accept/decline)

3. In-Store:
   - SystemTrayPopup.js (React component for Electron/Desktop)

### Backend Endpoints Needed:
1. `/api/admin/vendors/{id}/banking` - POST/PUT/GET
2. `/api/admin/vendors/{id}/custom-fields` - POST/PUT/DELETE
3. `/api/admin/vendors/{id}/qr-code` - GET (generates QR)
4. `/api/admin/vendors/{id}/reset-password` - POST
5. `/api/admin/complaints` - GET/POST/PUT
6. `/api/admin/assistant-admins` - POST/GET/PUT/DELETE
7. `/api/admin/settings` - GET/PUT
8. `/api/vendor/toggle-store` - POST
9. `/api/vendor/pricing` - GET/PUT
10. `/api/orders/create-instore` - POST (with watermarking)
11. `/api/print-jobs/queue` - GET (for system tray)

## CURRENT STATUS
- Basic infrastructure complete
- Customer portal functional
- Admin portal needs enhancements
- Vendor portal needs complete rebuild
- In-store system needs creation
- Print client needs creation

## ESTIMATED TIMELINE
- Phase 1: 5 days (Admin portal)
- Phase 2: 5 days (Vendor features)
- Phase 3: 2 days (In-store system)
- Phase 4: 2 days (Settings)
- Phase 5: 3 days (Backend processing)
- Phase 6: 3 days (Print client)

**Total: 20 working days (4 weeks) for complete implementation**

## NEXT IMMEDIATE STEPS
1. Create backend endpoints for admin features
2. Update database models
3. Enhance admin frontend pages
4. Build vendor dashboard
5. Create in-store system
6. Develop print client
7. Testing & deployment
