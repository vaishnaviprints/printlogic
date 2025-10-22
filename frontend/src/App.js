import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from '@/components/ui/sonner';
import '@/App.css';

// Public pages
import HomePage from '@/pages/HomePage';
import AboutPage from '@/pages/AboutPage';
import PricingPage from '@/pages/PricingPage';
import ContactPage from '@/pages/ContactPage';

// Customer pages
import CustomerLoginPage from '@/pages/CustomerLoginPage';
import CustomerRegisterPage from '@/pages/CustomerRegisterPage';
import CustomerPortal from '@/pages/CustomerPortal';
import MyOrdersPage from '@/pages/MyOrdersPage';
import ForgotPasswordPage from '@/pages/ForgotPasswordPage';

// Vendor pages
import VendorLoginPage from '@/pages/VendorLoginPage';
import VendorDashboard from '@/pages/VendorDashboard';
import VendorForgotPasswordPage from '@/pages/VendorForgotPasswordPage';

// Admin pages
import AdminLoginPage from '@/pages/AdminLoginPage';
import AdminDashboard from '@/pages/AdminDashboard';
import OrderTrackingPage from '@/pages/OrderTrackingPage';

// Auth context
import { AuthProvider } from '@/context/AuthContext';
import ProtectedRoute from '@/components/ProtectedRoute';

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <div className="App">
          <Routes>
            {/* Public routes */}
            <Route path="/" element={<HomePage />} />
            <Route path="/about" element={<AboutPage />} />
            <Route path="/pricing" element={<PricingPage />} />
            <Route path="/contact" element={<ContactPage />} />
            <Route path="/track" element={<OrderTrackingPage />} />
            
            {/* Customer routes */}
            <Route path="/login" element={<CustomerLoginPage />} />
            <Route path="/register" element={<CustomerRegisterPage />} />
            <Route path="/print" element={<CustomerPortal />} />
            <Route path="/my-orders" element={<MyOrdersPage />} />
            <Route path="/track/:orderId" element={<OrderTrackingPage />} />
            
            {/* Vendor routes */}
            <Route path="/vendor/login" element={<VendorLoginPage />} />
            <Route path="/vendor/dashboard" element={<VendorDashboard />} />
            
            {/* Admin routes - Hidden URL for security */}
            <Route path="/system-admin-portal-2025/login" element={<AdminLoginPage />} />
            <Route
              path="/system-admin-portal-2025/*"
              element={
                <ProtectedRoute>
                  <AdminDashboard />
                </ProtectedRoute>
              }
            />
            {/* Backward compatibility - redirect old admin URLs */}
            <Route path="/admin/login" element={<Navigate to="/system-admin-portal-2025/login" replace />} />
            <Route path="/admin/*" element={<Navigate to="/system-admin-portal-2025/dashboard" replace />} />
            
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
          <Toaster position="top-right" />
        </div>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
