import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Printer, Package, CheckCircle, Search } from 'lucide-react';
import { toast } from 'sonner';
import axios from 'axios';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const OrderTrackingPage = () => {
  const navigate = useNavigate();
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [loading, setLoading] = useState(false);
  
  const [trackingForm, setTrackingForm] = useState({ orderNumber: '', mobile: '', email: '' });
  const [publicOrders, setPublicOrders] = useState([]);
  const [userOrders, setUserOrders] = useState([]);

  useEffect(() => {
    const token = localStorage.getItem('auth_token');
    setIsLoggedIn(!!token);
    if (token) fetchUserOrders(token);
  }, []);

  const fetchUserOrders = async (token) => {
    setLoading(true);
    try {
      const response = await axios.get(`${API}/orders/my-orders`, { headers: { Authorization: `Bearer ${token}` } });
      setUserOrders(response.data);
    } catch (error) {
      toast.error('Failed to load orders');
    } finally {
      setLoading(false);
    }
  };

  const handlePublicTracking = async (e) => {
    e.preventDefault();
    if (!trackingForm.orderNumber && !trackingForm.mobile && !trackingForm.email) {
      toast.error('Please provide Order Number OR Mobile/Email');
      return;
    }
    
    setLoading(true);
    try {
      const formData = new FormData();
      if (trackingForm.orderNumber) formData.append('order_number', trackingForm.orderNumber);
      if (trackingForm.mobile) formData.append('mobile', trackingForm.mobile);
      if (trackingForm.email) formData.append('email', trackingForm.email);
      
      const response = await axios.post(`${API}/orders/track`, formData);
      setPublicOrders(response.data);
      toast.success(`Found ${response.data.length} order(s)!`);
    } catch (error) {
      toast.error(error.response?.data?.detail || 'No orders found');
      setPublicOrders([]);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    const colors = { 'Estimated': 'bg-gray-100 text-gray-800', 'Paid': 'bg-blue-100 text-blue-800', 'Assigned': 'bg-purple-100 text-purple-800', 'InProduction': 'bg-orange-100 text-orange-800', 'ReadyForPickup': 'bg-green-100 text-green-800', 'Completed': 'bg-green-100 text-green-800' };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const OrderCard = ({ order }) => (
    <Card className="border-2">
      <CardContent className="pt-6">
        <div className="flex justify-between mb-4">
          <div>
            <h3 className="text-lg font-semibold mb-2">Order #{order.id}</h3>
            <p className="text-sm text-gray-600">{new Date(order.created_at).toLocaleDateString()}</p>
          </div>
          <div>
            <Badge className={getStatusColor(order.status)}>{order.status}</Badge>
            <div className="text-xl font-bold text-indigo-600 mt-2">₹{order.total?.toLocaleString()}</div>
          </div>
        </div>
        <div className="space-y-2 text-sm">
          <div><span className="text-gray-600">Customer:</span> <span className="font-medium">{order.customer_name}</span></div>
          {order.vendor_name && <div><span className="text-gray-600">Vendor:</span> <span className="font-medium">{order.vendor_name}</span></div>}
          {order.total_pages && <div><span className="text-gray-600">Pages:</span> <span className="font-medium">{order.total_pages}</span></div>}
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      <header className="border-b bg-white/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => navigate('/')}>
            <div className="w-10 h-10 rounded-lg bg-indigo-600 flex items-center justify-center">
              <Printer className="w-6 h-6 text-white" />
            </div>
            <h1 className="text-xl font-bold">Vaishnavi Printers</h1>
          </div>
          <nav className="hidden md:flex gap-6">
            <button onClick={() => navigate('/')} className="hover:text-indigo-600">Home</button>
            <button onClick={() => navigate('/track')} className="text-indigo-600 font-semibold">Track Order</button>
            <button onClick={() => navigate('/contact')} className="hover:text-indigo-600">Contact</button>
          </nav>
          <div className="flex gap-3">
            {!isLoggedIn ? (
              <>
                <Button variant="outline" onClick={() => navigate('/login')}>Login</Button>
                <Button className="bg-indigo-600" onClick={() => navigate('/register')}>Sign Up</Button>
              </>
            ) : <Button variant="outline" onClick={() => navigate('/my-orders')}>My Orders</Button>}
          </div>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-4 py-12">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold mb-4">Track Your Order</h2>
          <p className="text-lg text-gray-600">
            {isLoggedIn ? 'Your recent orders' : 'Enter Order Number OR Mobile/Email'}
          </p>
        </div>

        {!isLoggedIn ? (
          <div className="space-y-6">
            <Card className="max-w-2xl mx-auto">
              <CardHeader>
                <CardTitle className="flex items-center gap-2"><Search className="w-5 h-5 text-indigo-600" />Track Your Orders</CardTitle>
                <CardDescription>Provide Order Number OR Mobile/Email</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handlePublicTracking} className="space-y-4">
                  <div>
                    <Label>Order Number (Optional)</Label>
                    <Input placeholder="ORD-2025-001234" value={trackingForm.orderNumber} onChange={(e) => setTrackingForm({ ...trackingForm, orderNumber: e.target.value })} />
                  </div>
                  <div className="text-center text-sm font-medium text-gray-500">-- OR --</div>
                  <div>
                    <Label>Mobile Number (Optional)</Label>
                    <Input type="tel" placeholder="+91 9618667700" value={trackingForm.mobile} onChange={(e) => setTrackingForm({ ...trackingForm, mobile: e.target.value })} />
                  </div>
                  <div>
                    <Label>Email Address (Optional)</Label>
                    <Input type="email" placeholder="your.email@example.com" value={trackingForm.email} onChange={(e) => setTrackingForm({ ...trackingForm, email: e.target.value })} />
                  </div>
                  <Button type="submit" className="w-full bg-indigo-600" disabled={loading}>{loading ? 'Searching...' : 'Track Orders'}</Button>
                </form>
              </CardContent>
            </Card>

            {publicOrders.length > 0 && (
              <div className="space-y-4">
                <h3 className="text-2xl font-bold">Found {publicOrders.length} Order(s)</h3>
                {publicOrders.map(order => <OrderCard key={order.id} order={order} />)}
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-6">
            {loading ? <div className="text-center py-12">Loading...</div> : userOrders.length === 0 ? (
              <Card><CardContent className="py-12 text-center">
                <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-600 mb-4">No orders yet</p>
                <Button onClick={() => navigate('/print')} className="bg-indigo-600">Create Order</Button>
              </CardContent></Card>
            ) : (
              <><h3 className="text-2xl font-bold">Your Recent Orders</h3>
              {userOrders.map(order => <OrderCard key={order.id} order={order} />)}</>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default OrderTrackingPage;
