import React, { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { io } from 'socket.io-client';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { Bell, Package, PlayCircle, CheckCircle, LogOut, Loader2 } from 'lucide-react';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;
const SOCKET_URL = process.env.REACT_APP_BACKEND_URL || 'https://vaishnavi-print.preview.emergentagent.com';

const VendorDashboard = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showNotifications, setShowNotifications] = useState(false);
  const navigate = useNavigate();
  const socketRef = useRef(null);
  const audioRef = useRef(null);

  useEffect(() => {
    const token = localStorage.getItem('auth_token');
    const vendorId = localStorage.getItem('vendor_id');
    
    if (!token) {
      navigate('/vendor/login');
      return;
    }

    fetchOrders();
    
    // Setup Socket.IO
    if (vendorId) {
      socketRef.current = io(SOCKET_URL, {
        path: '/socket.io',
        auth: { vendor_id: vendorId },
        transports: ['websocket', 'polling']
      });

      socketRef.current.on('connect', () => {
        console.log('Socket connected');
      });

      socketRef.current.on('notification', (data) => {
        console.log('Notification received:', data);
        toast.info(`New order: ${data.data.orderId}`);
        if (audioRef.current) {
          audioRef.current.play().catch(e => console.log('Audio play failed:', e));
        }
        fetchOrders();
      });

      socketRef.current.on('notification_count', (data) => {
        setUnreadCount(data.count);
      });

      socketRef.current.on('disconnect', () => {
        console.log('Socket disconnected');
      });
    }

    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
    };
  }, [navigate]);

  const fetchOrders = async () => {
    try {
      const token = localStorage.getItem('auth_token');
      const response = await axios.get(`${API}/vendor/orders`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setOrders(response.data);
    } catch (error) {
      console.error('Failed to fetch orders:', error);
      if (error.response?.status === 401) {
        navigate('/vendor/login');
      } else {
        toast.error('Failed to load orders');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleAccept = async (orderId) => {
    try {
      const token = localStorage.getItem('auth_token');
      await axios.patch(`${API}/vendor/orders/${orderId}/accept`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success('Order accepted');
      fetchOrders();
    } catch (error) {
      toast.error('Failed to accept order');
    }
  };

  const handleStart = async (orderId) => {
    try {
      const token = localStorage.getItem('auth_token');
      await axios.patch(`${API}/vendor/orders/${orderId}/start`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success('Production started');
      fetchOrders();
    } catch (error) {
      toast.error('Failed to start production');
    }
  };

  const handleComplete = async (orderId) => {
    try {
      const token = localStorage.getItem('auth_token');
      await axios.patch(`${API}/vendor/orders/${orderId}/complete`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success('Order completed');
      fetchOrders();
    } catch (error) {
      toast.error('Failed to complete order');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('vendor_id');
    navigate('/vendor/login');
  };

  const markNotificationsRead = () => {
    if (socketRef.current) {
      socketRef.current.emit('mark_read', {});
    }
    setUnreadCount(0);
    setShowNotifications(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <audio ref={audioRef} src="data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBTGH0fPTgjMGHm7A7+OZURU" preload="auto" />
      
      <header className="bg-white border-b sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-900" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
            Vendor Dashboard
          </h1>
          <div className="flex items-center gap-4">
            <div className="relative">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setShowNotifications(!showNotifications)}
                data-testid="notification-bell"
              >
                <Bell className="w-5 h-5" />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-600 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center" data-testid="unread-count">
                    {unreadCount}
                  </span>
                )}
              </Button>
              {showNotifications && (
                <div className="absolute right-0 mt-2 w-64 bg-white rounded-lg shadow-lg p-4">
                  <p className="text-sm text-gray-600 mb-2">{unreadCount} new notifications</p>
                  <Button size="sm" onClick={markNotificationsRead} className="w-full">
                    Mark all as read
                  </Button>
                </div>
              )}
            </div>
            <Button variant="ghost" onClick={handleLogout} data-testid="logout-btn">
              <LogOut className="w-4 h-4 mr-2" />
              Logout
            </Button>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-8" data-testid="vendor-dashboard">
        <h2 className="text-xl font-semibold mb-6">Orders ({orders.length})</h2>
        
        {orders.length === 0 ? (
          <div className="bg-white rounded-lg p-12 text-center">
            <Package className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">No orders assigned yet</p>
          </div>
        ) : (
          <div className="space-y-4">
            {orders.map((order) => (
              <div key={order.id} className="bg-white rounded-lg p-6 shadow-sm" data-testid={`vendor-order-${order.id}`}>
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="font-semibold text-lg">Order #{order.id}</h3>
                    <p className="text-sm text-gray-500">{new Date(order.created_at).toLocaleString()}</p>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-sm ${
                    order.status === 'Paid' ? 'bg-green-100 text-green-800' :
                    order.status === 'Assigned' ? 'bg-blue-100 text-blue-800' :
                    order.status === 'InProduction' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {order.status}
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-4 mb-4">
                  <div>
                    <p className="text-sm text-gray-600">Customer</p>
                    <p className="font-medium">{order.customer_name}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Items</p>
                    <p className="font-medium">{order.items.length} file(s)</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Total</p>
                    <p className="font-medium text-lg">₹{order.total.toFixed(2)}</p>
                  </div>
                </div>

                <div className="flex gap-2">
                  {order.status === 'Paid' && (
                    <Button onClick={() => handleAccept(order.id)} size="sm" data-testid={`accept-${order.id}`}>
                      <CheckCircle className="w-4 h-4 mr-2" />
                      Accept
                    </Button>
                  )}
                  {order.status === 'Assigned' && (
                    <Button onClick={() => handleStart(order.id)} size="sm" variant="outline" data-testid={`start-${order.id}`}>
                      <PlayCircle className="w-4 h-4 mr-2" />
                      Start Production
                    </Button>
                  )}
                  {order.status === 'InProduction' && (
                    <Button onClick={() => handleComplete(order.id)} size="sm" className="bg-green-600 hover:bg-green-700" data-testid={`complete-${order.id}`}>
                      <CheckCircle className="w-4 h-4 mr-2" />
                      Mark Complete
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default VendorDashboard;
