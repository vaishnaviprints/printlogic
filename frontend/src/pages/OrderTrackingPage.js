import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Printer, Package, Clock, CheckCircle, Truck, MapPin, Phone, FileText, Search } from 'lucide-react';
import { toast } from 'sonner';
import axios from 'axios';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const OrderTrackingPage = () => {
  const navigate = useNavigate();
  const { orderId } = useParams();
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [loading, setLoading] = useState(false);
  
  // Public tracking form
  const [trackingForm, setTrackingForm] = useState({
    orderNumber: orderId || '',
    mobile: ''
  });
  
  // Order data
  const [trackedOrder, setTrackedOrder] = useState(null);
  const [userOrders, setUserOrders] = useState([]);

  useEffect(() => {
    const token = localStorage.getItem('auth_token');
    setIsLoggedIn(!!token);
    
    if (token) {
      fetchUserOrders(token);
    }
  }, []);

  const fetchUserOrders = async (token) => {
    setLoading(true);
    try {
      const response = await axios.get(`${API}/orders/my-orders`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setUserOrders(response.data);
    } catch (error) {
      console.error('Failed to fetch orders:', error);
    } finally {
      setLoading(false);
    }
  };

  const handlePublicTracking = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      const response = await axios.post(`${API}/orders/track`, {
        order_number: trackingForm.orderNumber,
        mobile: trackingForm.mobile
      });
      setTrackedOrder(response.data);
      toast.success('Order found!');
    } catch (error) {
      console.error('Failed to track order:', error);
      toast.error(error.response?.data?.detail || 'Order not found. Please check your details.');
      setTrackedOrder(null);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      'Estimated': 'bg-gray-100 text-gray-800',
      'Paid': 'bg-blue-100 text-blue-800',
      'Assigned': 'bg-purple-100 text-purple-800',
      'InProduction': 'bg-orange-100 text-orange-800',
      'ReadyForPickup': 'bg-green-100 text-green-800',
      'OutForDelivery': 'bg-indigo-100 text-indigo-800',
      'Completed': 'bg-green-100 text-green-800',
      'Cancelled': 'bg-red-100 text-red-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const getStatusIcon = (status) => {
    const icons = {
      'Estimated': <FileText className="w-5 h-5" />,
      'Paid': <CheckCircle className="w-5 h-5" />,
      'Assigned': <Package className="w-5 h-5" />,
      'InProduction': <Clock className="w-5 h-5" />,
      'ReadyForPickup': <Package className="w-5 h-5" />,
      'OutForDelivery': <Truck className="w-5 h-5" />,
      'Completed': <CheckCircle className="w-5 h-5" />,
      'Cancelled': <FileText className="w-5 h-5" />
    };
    return icons[status] || <Package className="w-5 h-5" />;
  };

  const OrderTimeline = ({ order }) => {
    const timeline = [
      { status: 'Estimated', label: 'Order Created', completed: true },
      { status: 'Paid', label: 'Payment Confirmed', completed: order.status !== 'Estimated' },
      { status: 'Assigned', label: 'Assigned to Vendor', completed: ['Assigned', 'InProduction', 'ReadyForPickup', 'OutForDelivery', 'Completed'].includes(order.status) },
      { status: 'InProduction', label: 'In Production', completed: ['InProduction', 'ReadyForPickup', 'OutForDelivery', 'Completed'].includes(order.status) },
      { status: 'ReadyForPickup', label: 'Ready', completed: ['ReadyForPickup', 'OutForDelivery', 'Completed'].includes(order.status) },
      { status: 'Completed', label: 'Completed', completed: order.status === 'Completed' }
    ];

    return (
      <div className="space-y-4">
        {timeline.map((step, index) => (
          <div key={step.status} className="flex items-start gap-4">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
              step.completed ? 'bg-green-100' : 'bg-gray-100'
            }`}>
              {step.completed ? (
                <CheckCircle className="w-5 h-5 text-green-600" />
              ) : (
                <div className="w-3 h-3 rounded-full bg-gray-400" />
              )}
            </div>
            <div className="flex-1">
              <div className={`font-medium ${step.completed ? 'text-gray-900' : 'text-gray-400'}`}>
                {step.label}
              </div>
              {step.completed && order.status === step.status && (
                <div className="text-sm text-gray-500">Current Status</div>
              )}
            </div>
            {index < timeline.length - 1 && (
              <div className={`absolute left-5 w-0.5 h-8 mt-10 ${
                step.completed ? 'bg-green-200' : 'bg-gray-200'
              }`} style={{ marginTop: '2.5rem' }} />
            )}
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      {/* Header */}
      <header className="border-b bg-white/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3 cursor-pointer" onClick={() => navigate('/')}>
              <div className="w-10 h-10 rounded-lg bg-indigo-600 flex items-center justify-center">
                <Printer className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">Vaishnavi Printers</h1>
                <p className="text-xs text-gray-500">Order Tracking</p>
              </div>
            </div>
            
            <nav className="hidden md:flex items-center gap-6">
              <button onClick={() => navigate('/')} className="text-gray-700 hover:text-indigo-600 font-medium transition-colors">Home</button>
              <button onClick={() => navigate('/about')} className="text-gray-700 hover:text-indigo-600 font-medium transition-colors">About</button>
              <button onClick={() => navigate('/pricing')} className="text-gray-700 hover:text-indigo-600 font-medium transition-colors">Pricing</button>
              <button onClick={() => navigate('/track')} className="text-indigo-600 font-semibold">Track Order</button>
              <button onClick={() => navigate('/contact')} className="text-gray-700 hover:text-indigo-600 font-medium transition-colors">Contact</button>
            </nav>

            <div className="flex items-center gap-3">
              {!isLoggedIn ? (
                <>
                  <Button variant="outline" onClick={() => navigate('/login')}>Login</Button>
                  <Button className="bg-indigo-600 hover:bg-indigo-700" onClick={() => navigate('/register')}>Sign Up</Button>
                </>
              ) : (
                <Button variant="outline" onClick={() => navigate('/my-orders')}>My Orders</Button>
              )}
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-4 py-12">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold text-gray-900 mb-4">Track Your Order</h2>
          <p className="text-lg text-gray-600">
            {isLoggedIn ? 'View all your orders and their current status' : 'Enter your order details to track'}
          </p>
        </div>

        {!isLoggedIn ? (
          /* PUBLIC TRACKING FORM */
          <div className="max-w-2xl mx-auto">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Search className="w-5 h-5 text-indigo-600" />
                  Track Your Order
                </CardTitle>
                <CardDescription>Enter your order number and registered mobile number</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handlePublicTracking} className="space-y-4">
                  <div>
                    <Label>Order Number *</Label>
                    <Input
                      placeholder="e.g., ORD-2025-001234"
                      value={trackingForm.orderNumber}
                      onChange={(e) => setTrackingForm({ ...trackingForm, orderNumber: e.target.value })}
                      required
                    />
                  </div>
                  <div>
                    <Label>Mobile Number *</Label>
                    <Input
                      type="tel"
                      placeholder="+91 XXXXX XXXXX"
                      value={trackingForm.mobile}
                      onChange={(e) => setTrackingForm({ ...trackingForm, mobile: e.target.value })}
                      required
                    />
                  </div>
                  <Button type="submit" className="w-full bg-indigo-600 hover:bg-indigo-700" disabled={loading}>
                    {loading ? 'Tracking...' : 'Track Order'}
                  </Button>
                </form>
              </CardContent>
            </Card>

            {/* Tracked Order Display */}
            {trackedOrder && (
              <Card className="mt-6">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>Order #{trackedOrder.id}</CardTitle>
                      <CardDescription>Placed on {new Date(trackedOrder.created_at).toLocaleDateString()}</CardDescription>
                    </div>
                    <Badge className={getStatusColor(trackedOrder.status)}>
                      {trackedOrder.status}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid md:grid-cols-2 gap-6">
                    {/* Order Details */}
                    <div className="space-y-4">
                      <div>
                        <h4 className="font-semibold mb-2">Order Details</h4>
                        <div className="text-sm space-y-2">
                          <div className="flex justify-between">
                            <span className="text-gray-600">Customer:</span>
                            <span className="font-medium">{trackedOrder.customer_name}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">Total Amount:</span>
                            <span className="font-medium">₹{trackedOrder.total?.toLocaleString()}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">Delivery Type:</span>
                            <span className="font-medium">{trackedOrder.delivery_type || 'Pickup'}</span>
                          </div>
                        </div>
                      </div>

                      {trackedOrder.vendor_name && (
                        <div>
                          <h4 className="font-semibold mb-2">Vendor</h4>
                          <div className="text-sm">
                            <div className="font-medium">{trackedOrder.vendor_name}</div>
                            {trackedOrder.vendor_location && (
                              <div className="text-gray-600 flex items-start gap-1 mt-1">
                                <MapPin className="w-4 h-4 mt-0.5" />
                                <span>{trackedOrder.vendor_location}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Timeline */}
                    <div>
                      <h4 className="font-semibold mb-4">Order Timeline</h4>
                      <OrderTimeline order={trackedOrder} />
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        ) : (
          /* LOGGED IN - SHOW ALL ORDERS */
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Your Orders</CardTitle>
                <CardDescription>View and track all your recent orders</CardDescription>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="text-center py-12 text-gray-500">Loading your orders...</div>
                ) : userOrders.length === 0 ? (
                  <div className="text-center py-12">
                    <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-600 mb-4">No orders yet</p>
                    <Button onClick={() => navigate('/print')} className="bg-indigo-600 hover:bg-indigo-700">
                      Create Your First Order
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {userOrders.map((order) => (
                      <Card key={order.id} className="border-2">
                        <CardContent className="pt-6">
                          <div className="flex items-start justify-between mb-4">
                            <div>
                              <div className="flex items-center gap-3 mb-2">
                                <h3 className="text-lg font-semibold">Order #{order.id}</h3>
                                <Badge className={getStatusColor(order.status)}>
                                  {order.status}
                                </Badge>
                              </div>
                              <p className="text-sm text-gray-600">
                                Placed on {new Date(order.created_at).toLocaleDateString()} at {new Date(order.created_at).toLocaleTimeString()}
                              </p>
                            </div>
                            <div className="text-right">
                              <div className="text-2xl font-bold text-indigo-600">₹{order.total?.toLocaleString()}</div>
                              <p className="text-sm text-gray-600">Total Amount</p>
                            </div>
                          </div>

                          <div className="grid md:grid-cols-2 gap-6 mt-6">
                            {/* Order Info */}
                            <div className="space-y-2 text-sm">
                              <div className="flex items-center gap-2">
                                <Package className="w-4 h-4 text-gray-400" />
                                <span className="text-gray-600">Pages:</span>
                                <span className="font-medium">{order.total_pages || 'N/A'}</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <FileText className="w-4 h-4 text-gray-400" />
                                <span className="text-gray-600">Type:</span>
                                <span className="font-medium">{order.delivery_type || 'Pickup'}</span>
                              </div>
                              {order.vendor_name && (
                                <div className="flex items-center gap-2">
                                  <MapPin className="w-4 h-4 text-gray-400" />
                                  <span className="text-gray-600">Vendor:</span>
                                  <span className="font-medium">{order.vendor_name}</span>
                                </div>
                              )}
                            </div>

                            {/* Actions */}
                            <div className="flex items-center justify-end gap-3">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  setTrackedOrder(order);
                                  window.scrollTo({ top: 0, behavior: 'smooth' });
                                }}
                              >
                                View Details
                              </Button>
                              <Button
                                size="sm"
                                className="bg-indigo-600 hover:bg-indigo-700"
                                onClick={() => navigate(`/track/${order.id}`)}
                              >
                                Track Order
                              </Button>
                            </div>
                          </div>

                          {/* Quick Timeline */}
                          <div className="mt-4 pt-4 border-t">
                            <div className="flex items-center gap-2">
                              {getStatusIcon(order.status)}
                              <span className="text-sm font-medium">Current Status: {order.status}</span>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Selected Order Details */}
            {trackedOrder && (
              <Card>
                <CardHeader>
                  <CardTitle>Order #{trackedOrder.id} - Detailed Timeline</CardTitle>
                </CardHeader>
                <CardContent>
                  <OrderTimeline order={trackedOrder} />
                </CardContent>
              </Card>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default OrderTrackingPage;
