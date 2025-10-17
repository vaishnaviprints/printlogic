import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { Package, Clock, CheckCircle, Loader2 } from 'lucide-react';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const MyOrdersPage = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      const token = localStorage.getItem('auth_token');
      if (!token) {
        navigate('/login');
        return;
      }

      const response = await axios.get(`${API}/customer/orders`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setOrders(response.data);
    } catch (error) {
      console.error('Failed to fetch orders:', error);
      if (error.response?.status === 401) {
        navigate('/login');
      } else {
        toast.error('Failed to load orders');
      }
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navigation />
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      
      <div className="max-w-6xl mx-auto px-4 py-12" data-testid="my-orders-page">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold text-gray-900" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
            My Orders
          </h1>
          <Button onClick={() => navigate('/print')} data-testid="new-order-btn">
            New Order
          </Button>
        </div>

        {orders.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm p-12 text-center">
            <Package className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No orders yet</h3>
            <p className="text-gray-600 mb-6">Start your first print order now!</p>
            <Button onClick={() => navigate('/print')}>Create Order</Button>
          </div>
        ) : (
          <div className="space-y-4">
            {orders.map((order) => (
              <OrderCard key={order.id} order={order} />
            ))}
          </div>
        )}
      </div>
      
      <Footer />
    </div>
  );
};

const OrderCard = ({ order }) => {
  const getStatusIcon = (status) => {
    if (status === 'Delivered' || status === 'PickedUp') return <CheckCircle className="w-5 h-5 text-green-600" />;
    if (status === 'InProduction' || status === 'Assigned') return <Clock className="w-5 h-5 text-yellow-600" />;
    return <Package className="w-5 h-5 text-indigo-600" />;
  };

  const getStatusColor = (status) => {
    if (status === 'Delivered' || status === 'PickedUp') return 'bg-green-100 text-green-800';
    if (status === 'InProduction' || status === 'Assigned') return 'bg-yellow-100 text-yellow-800';
    return 'bg-indigo-100 text-indigo-800';
  };

  return (
    <div className="bg-white rounded-lg shadow-sm p-6" data-testid={`order-${order.id}`}>
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="font-semibold text-lg">Order #{order.id}</h3>
          <p className="text-sm text-gray-500">
            {new Date(order.created_at).toLocaleString()}
          </p>
        </div>
        <div className={`flex items-center gap-2 px-3 py-1 rounded-full ${getStatusColor(order.status)}`}>
          {getStatusIcon(order.status)}
          <span className="text-sm font-medium">{order.status}</span>
        </div>
      </div>

      <div className="grid md:grid-cols-3 gap-4 mb-4">
        <div>
          <p className="text-sm text-gray-600">Items</p>
          <p className="font-medium">{order.items.length} file(s)</p>
        </div>
        <div>
          <p className="text-sm text-gray-600">Total</p>
          <p className="font-medium text-lg">₹{order.total.toFixed(2)}</p>
        </div>
        <div>
          <p className="text-sm text-gray-600">Fulfillment</p>
          <p className="font-medium">{order.fulfillment_type}</p>
        </div>
      </div>

      {order.statusHistory && order.statusHistory.length > 0 && (
        <div className="mt-4 pt-4 border-t">
          <p className="text-sm font-medium text-gray-700 mb-2">Timeline</p>
          <div className="space-y-2">
            {order.statusHistory.slice(0, 3).map((history, idx) => (
              <div key={idx} className="text-sm flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-indigo-600"></div>
                <span className="text-gray-600">{history.note}</span>
                <span className="text-gray-400 text-xs">
                  {new Date(history.at).toLocaleString()}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default MyOrdersPage;
