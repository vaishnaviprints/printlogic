import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';
import { Printer, Home, LogOut, CheckCircle, XCircle, Clock, Bell, Store, TrendingUp, DollarSign } from 'lucide-react';
import Footer from '@/components/Footer';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

// Notification sound (simple beep)
const playOrderSound = () => {
  const audioContext = new (window.AudioContext || window.webkitAudioContext)();
  const oscillator = audioContext.createOscillator();
  const gainNode = audioContext.createGain();
  
  oscillator.connect(gainNode);
  gainNode.connect(audioContext.destination);
  
  oscillator.frequency.value = 800;
  oscillator.type = 'sine';
  
  gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
  gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);
  
  oscillator.start(audioContext.currentTime);
  oscillator.stop(audioContext.currentTime + 0.5);
};

const VendorDashboard = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [vendor, setVendor] = useState(null);
  const [dashboardData, setDashboardData] = useState(null);
  const [storeOpen, setStoreOpen] = useState(true);
  const [previousPendingCount, setPreviousPendingCount] = useState(0);

  useEffect(() => {
    fetchDashboard();
    const interval = setInterval(fetchDashboard, 10000); // Refresh every 10s
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    // Check for new orders and play sound
    if (dashboardData && dashboardData.stats) {
      const currentPendingCount = dashboardData.stats.pending_count;
      if (currentPendingCount > previousPendingCount) {
        playOrderSound();
        
        // Browser notification
        if (Notification.permission === 'granted') {
          new Notification('🔔 New Order Received!', {
            body: `You have ${currentPendingCount} pending order(s)`,
            icon: '/logo.png',
            tag: 'vendor-order'
          });
        }
        
        toast.success('🔔 New order received!', { duration: 5000 });
      }
      setPreviousPendingCount(currentPendingCount);
    }
  }, [dashboardData]);

  useEffect(() => {
    // Request notification permission
    if (Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, []);

  const fetchDashboard = async () => {
    try {
      const token = localStorage.getItem('vendor_token');
      const response = await axios.get(`${API}/vendor/dashboard`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setDashboardData(response.data);
      setVendor(response.data.vendor);
      setStoreOpen(response.data.vendor.is_online);
    } catch (error) {
      console.error('Failed to fetch dashboard:', error);
      if (error.response?.status === 401) {
        navigate('/vendor/login');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleToggleStore = async () => {
    try {
      const newStatus = !storeOpen;
      const token = localStorage.getItem('vendor_token');
      await axios.post(
        `${API}/vendor/toggle-store`,
        { is_online: newStatus },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      setStoreOpen(newStatus);
      toast.success(newStatus ? 'Store is now ONLINE ✅' : 'Store is now OFFLINE ❌');
      fetchDashboard();
    } catch (error) {
      console.error('Failed to toggle store:', error);
      toast.error('Failed to update store status');
    }
  };

  const handleAcceptOrder = async (orderId) => {
    try {
      const token = localStorage.getItem('vendor_token');
      await axios.post(
        `${API}/vendor/orders/${orderId}/accept`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      toast.success('Order accepted successfully!');
      fetchDashboard();
    } catch (error) {
      console.error('Failed to accept order:', error);
      toast.error('Failed to accept order');
    }
  };

  const handleDeclineOrder = async (orderId) => {
    const reason = prompt('Please enter reason for declining:');
    if (!reason) return;

    try {
      const token = localStorage.getItem('vendor_token');
      await axios.post(
        `${API}/vendor/orders/${orderId}/decline`,
        { reason },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      toast.success('Order declined');
      fetchDashboard();
    } catch (error) {
      console.error('Failed to decline order:', error);
      toast.error('Failed to decline order');
    }
  };

  const handleCompleteOrder = async (orderId) => {
    if (!confirm('Mark this order as completed?')) return;

    try {
      const token = localStorage.getItem('vendor_token');
      await axios.post(
        `${API}/vendor/orders/${orderId}/complete`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      toast.success('Order marked as completed!');
      fetchDashboard();
    } catch (error) {
      console.error('Failed to complete order:', error);
      toast.error('Failed to complete order');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('vendor_token');
    navigate('/vendor/login');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p>Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      {/* Header */}
      <header className="border-b bg-white shadow-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-lg bg-indigo-600 flex items-center justify-center">
                <Printer className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold">Vendor Dashboard</h1>
                <p className="text-sm text-gray-600">{vendor?.shop_name || vendor?.name}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Button variant="outline" onClick={() => navigate('/')} size="sm">
                <Home className="w-4 h-4 mr-2" />
                Home
              </Button>
              <Button variant="outline" onClick={() => navigate('/vendor/pricing')} size="sm">
                <DollarSign className="w-4 h-4 mr-2" />
                My Pricing
              </Button>
              <Button variant="outline" onClick={() => navigate('/vendor/bank-details')} size="sm" className="border-green-500 text-green-700">
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                </svg>
                Bank Details
              </Button>
              <Button variant="outline" onClick={handleLogout} size="sm">
                <LogOut className="w-4 h-4 mr-2" />
                Logout
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-8 space-y-6">
        {/* Store Status Toggle - PROMINENT */}
        <Card className={`border-4 ${storeOpen ? 'border-green-500 bg-green-50' : 'border-red-500 bg-red-50'}`}>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <Store className={`w-12 h-12 ${storeOpen ? 'text-green-600' : 'text-red-600'}`} />
                <div>
                  <h2 className="text-2xl font-bold">
                    Store is {storeOpen ? 'ONLINE' : 'OFFLINE'}
                  </h2>
                  <p className="text-gray-600">
                    {storeOpen ? 'You are receiving orders' : 'You will not receive new orders'}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <Switch
                  checked={storeOpen}
                  onCheckedChange={handleToggleStore}
                  className="scale-150"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Stats Cards */}
        <div className="grid md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <Bell className="w-8 h-8 text-orange-600" />
                <div>
                  <p className="text-sm text-gray-600">Pending Orders</p>
                  <p className="text-2xl font-bold">{dashboardData?.stats?.pending_count || 0}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <Clock className="w-8 h-8 text-blue-600" />
                <div>
                  <p className="text-sm text-gray-600">In Progress</p>
                  <p className="text-2xl font-bold">{dashboardData?.stats?.in_progress_count || 0}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <TrendingUp className="w-8 h-8 text-green-600" />
                <div>
                  <p className="text-sm text-gray-600">Total Sales</p>
                  <p className="text-2xl font-bold">{vendor?.total_sales || 0}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <DollarSign className="w-8 h-8 text-indigo-600" />
                <div>
                  <p className="text-sm text-gray-600">Total Earnings</p>
                  <p className="text-2xl font-bold">₹{vendor?.total_earnings || 0}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Pending Orders - PROMINENT */}
        {dashboardData?.pending_orders && dashboardData.pending_orders.length > 0 && (
          <Card className="border-2 border-orange-400">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-orange-700">
                <Bell className="w-5 h-5 animate-bounce" />
                Pending Orders Requesting Your Acceptance
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {dashboardData.pending_orders.map((order) => (
                  <Card key={order.id} className="bg-orange-50 border-orange-200">
                    <CardContent className="pt-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <Badge variant="outline" className="bg-orange-100 text-orange-800">
                              {order.id}
                            </Badge>
                            <span className="font-semibold text-lg">₹{order.total_amount}</span>
                          </div>
                          <p className="text-sm text-gray-700">
                            Customer: {order.customer_name || order.customer_email}
                          </p>
                          <p className="text-xs text-gray-500 mt-1">
                            {new Date(order.created_at).toLocaleString()}
                          </p>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            onClick={() => handleAcceptOrder(order.id)}
                            size="sm"
                            className="bg-green-600 hover:bg-green-700"
                          >
                            <CheckCircle className="w-4 h-4 mr-1" />
                            Accept
                          </Button>
                          <Button
                            onClick={() => handleDeclineOrder(order.id)}
                            size="sm"
                            variant="outline"
                            className="text-red-600 border-red-300"
                          >
                            <XCircle className="w-4 h-4 mr-1" />
                            Decline
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* In Progress Orders */}
        {dashboardData?.in_progress_orders && dashboardData.in_progress_orders.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>In Progress Orders</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {dashboardData.in_progress_orders.map((order) => (
                  <Card key={order.id} className="bg-blue-50">
                    <CardContent className="pt-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <Badge>{order.id}</Badge>
                            <span className="font-semibold">₹{order.total_amount}</span>
                          </div>
                          <p className="text-sm text-gray-700">
                            {order.customer_name || order.customer_email}
                          </p>
                        </div>
                        <Button
                          onClick={() => handleCompleteOrder(order.id)}
                          size="sm"
                          className="bg-indigo-600"
                        >
                          Mark Complete
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Completed Orders Today */}
        {dashboardData?.completed_orders && dashboardData.completed_orders.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Recently Completed</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {dashboardData.completed_orders.slice(0, 5).map((order) => (
                  <div key={order.id} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                    <div>
                      <Badge variant="outline">{order.id}</Badge>
                      <span className="ml-3 text-sm">{order.customer_name || order.customer_email}</span>
                    </div>
                    <span className="font-semibold text-green-600">₹{order.total_amount}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      <Footer />
    </div>
  );
};

export default VendorDashboard;
