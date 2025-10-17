import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Button } from '@/components/ui/button';
import { Printer, Package, Truck, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const OrderTrackingPage = () => {
  const { orderId } = useParams();
  const navigate = useNavigate();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchOrder();
  }, [orderId]);

  const fetchOrder = async () => {
    try {
      const response = await axios.get(`${API}/orders/${orderId}`);
      setOrder(response.data);
    } catch (error) {
      console.error('Failed to fetch order:', error);
      toast.error('Order not found');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading order...</p>
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Order Not Found</h2>
          <Button onClick={() => navigate('/')}>Back to Home</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      <header className="border-b bg-white/80 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => navigate('/')}>
            <div className="w-10 h-10 rounded-lg bg-indigo-600 flex items-center justify-center">
              <Printer className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">Vaishnavi Printers</h1>
              <p className="text-xs text-gray-500">Order Tracking</p>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-3xl mx-auto px-4 py-12" data-testid="order-tracking">
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-2" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
            Order #{order.id}
          </h2>
          <p className="text-gray-600 mb-6">Status: <span className="font-semibold text-indigo-600">{order.status}</span></p>

          {/* Order Details */}
          <div className="space-y-4 mb-8">
            <div className="border-b pb-4">
              <h3 className="font-semibold mb-2">Customer Information</h3>
              <p className="text-sm text-gray-600">Name: {order.customer_name}</p>
              <p className="text-sm text-gray-600">Email: {order.customer_email}</p>
              <p className="text-sm text-gray-600">Phone: {order.customer_phone}</p>
            </div>

            <div className="border-b pb-4">
              <h3 className="font-semibold mb-2">Order Items</h3>
              {order.items.map((item, idx) => (
                <div key={idx} className="text-sm text-gray-600 py-1">
                  {item.file_name} - {item.num_pages} pages × {item.num_copies} copies
                </div>
              ))}
            </div>

            <div className="flex justify-between text-lg font-bold">
              <span>Total Amount</span>
              <span className="text-indigo-600">₹{order.total.toFixed(2)}</span>
            </div>
          </div>

          {/* Status Timeline */}
          <div className="space-y-4">
            <h3 className="font-semibold mb-4">Order Progress</h3>
            <StatusTimeline status={order.status} />
          </div>
        </div>
      </div>
    </div>
  );
};

const StatusTimeline = ({ status }) => {
  const statuses = [
    { key: 'Paid', icon: CheckCircle, label: 'Payment Confirmed' },
    { key: 'InProduction', icon: Printer, label: 'In Production' },
    { key: 'ReadyForDelivery', icon: Package, label: 'Ready' },
    { key: 'Delivered', icon: Truck, label: 'Delivered' }
  ];

  const currentIndex = statuses.findIndex(s => s.key === status);

  return (
    <div className="space-y-3">
      {statuses.map((s, idx) => {
        const Icon = s.icon;
        const isComplete = idx <= currentIndex;
        const isCurrent = idx === currentIndex;

        return (
          <div key={s.key} className="flex items-center gap-3">
            <div
              className={`w-10 h-10 rounded-full flex items-center justify-center ${
                isComplete ? 'bg-indigo-600 text-white' : 'bg-gray-200 text-gray-400'
              }`}
            >
              <Icon className="w-5 h-5" />
            </div>
            <div>
              <p className={`font-medium ${isCurrent ? 'text-indigo-600' : isComplete ? 'text-gray-900' : 'text-gray-400'}`}>
                {s.label}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default OrderTrackingPage;
