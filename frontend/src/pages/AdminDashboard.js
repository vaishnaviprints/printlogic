import React, { useState } from 'react';
import { Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Printer, LogOut, Settings, Package, DollarSign, MapPin, BarChart3, FileText } from 'lucide-react';

// Admin sub-pages
import OrdersPage from './admin/OrdersPage';
import PricingPage from './admin/PricingPage';
import VendorsPage from './admin/VendorsPage';
import SettingsPage from './admin/SettingsPage';
import ContentManagerPage from './admin/ContentManagerPage';
import ReportsPage from './admin/ReportsPage';
import AuditLogsPage from './admin/AuditLogsPage';
import ComplaintsPage from './admin/ComplaintsPage';
import AssistantAdminPage from './admin/AssistantAdminPage';

const AdminDashboard = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const getActiveTab = () => {
    const path = location.pathname;
    if (path.includes('pricing')) return 'pricing';
    if (path.includes('vendors')) return 'vendors';
    if (path.includes('reports')) return 'reports';
    if (path.includes('audits')) return 'audits';
    if (path.includes('settings')) return 'settings';
    return 'orders';
  };

  const handleTabChange = (value) => {
    navigate(`/system-admin-portal-2025/${value}`);
  };

  const handleLogout = () => {
    logout();
    navigate('/system-admin-portal-2025/login');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-indigo-600 flex items-center justify-center">
                <Printer className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">Admin Dashboard</h1>
                <p className="text-xs text-gray-500">{user?.email}</p>
              </div>
            </div>
            <Button
              variant="outline"
              onClick={handleLogout}
              className="flex items-center gap-2"
              data-testid="logout-btn"
            >
              <LogOut className="w-4 h-4" />
              Logout
            </Button>
          </div>
        </div>
      </header>

      {/* Navigation */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4">
          <Tabs value={getActiveTab()} onValueChange={handleTabChange}>
            <TabsList className="w-full justify-start border-none bg-transparent">
              <TabsTrigger value="orders" className="gap-2" data-testid="orders-tab">
                <Package className="w-4 h-4" />
                Orders
              </TabsTrigger>
              <TabsTrigger value="pricing" className="gap-2" data-testid="pricing-tab">
                <DollarSign className="w-4 h-4" />
                Pricing
              </TabsTrigger>
              <TabsTrigger value="vendors" className="gap-2" data-testid="vendors-tab">
                <MapPin className="w-4 h-4" />
                Vendors
              </TabsTrigger>
              <TabsTrigger value="reports" className="gap-2" data-testid="reports-tab">
                <BarChart3 className="w-4 h-4" />
                Reports
              </TabsTrigger>
              <TabsTrigger value="audits" className="gap-2" data-testid="audits-tab">
                <FileText className="w-4 h-4" />
                Audit Logs
              </TabsTrigger>
              <TabsTrigger value="complaints" className="gap-2" data-testid="complaints-tab">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Complaints
              </TabsTrigger>
              <TabsTrigger value="admins" className="gap-2" data-testid="admins-tab">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
                Admin Users
              </TabsTrigger>
              <TabsTrigger value="content" className="gap-2" data-testid="content-tab">
                <FileText className="w-4 h-4" />
                Content
              </TabsTrigger>
              <TabsTrigger value="settings" className="gap-2" data-testid="settings-tab">
                <Settings className="w-4 h-4" />
                Settings
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        <Routes>
          <Route path="dashboard" element={<OrdersPage />} />
          <Route path="orders" element={<OrdersPage />} />
          <Route path="pricing" element={<PricingPage />} />
          <Route path="vendors" element={<VendorsPage />} />
          <Route path="reports" element={<ReportsPage />} />
          <Route path="audits" element={<AuditLogsPage />} />
          <Route path="complaints" element={<ComplaintsPage />} />
          <Route path="admins" element={<AssistantAdminPage />} />
          <Route path="content" element={<ContentManagerPage />} />
          <Route path="settings" element={<SettingsPage />} />
          <Route path="*" element={<OrdersPage />} />
        </Routes>
      </div>
    </div>
  );
};

export default AdminDashboard;
