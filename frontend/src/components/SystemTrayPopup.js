import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { X, Minimize2, Maximize2, RefreshCw, CheckCircle, DollarSign, Clock } from 'lucide-react';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const SystemTrayPopup = () => {
  const [minimized, setMinimized] = useState(false);
  const [pendingOrders, setPendingOrders] = useState([]);
  const [activeOrders, setActiveOrders] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchOrders();
    const interval = setInterval(fetchOrders, 10000); // Refresh every 10s
    return () => clearInterval(interval);
  }, []);

  const fetchOrders = async () => {
    try {
      const [pendingRes, activeRes] = await Promise.all([
        axios.get(`${API}/orders/instore/pending`),
        axios.get(`${API}/orders/instore/active`)
      ]);
      
      setPendingOrders(pendingRes.data);
      setActiveOrders(activeRes.data);
    } catch (error) {
      console.error('Failed to fetch orders:', error);
    }
  };

  const handleApproveCashPayment = async (orderId) => {
    setLoading(true);
    try {
      await axios.post(`${API}/orders/instore/${orderId}/approve`);
      toast.success('Payment approved! Order sent to printing');
      fetchOrders();
    } catch (error) {
      console.error('Failed to approve payment:', error);
      toast.error('Failed to approve payment');
    } finally {
      setLoading(false);
    }
  };

  if (minimized) {
    return (
      <div
        className="fixed bottom-4 right-4 bg-indigo-600 text-white rounded-lg shadow-2xl cursor-pointer hover:bg-indigo-700 transition-colors"
        onClick={() => setMinimized(false)}
        style={{ width: '200px', zIndex: 9999 }}
      >
        <div className="p-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse"></div>
            <span className="font-semibold text-sm">In-Store Orders</span>
          </div>
          {(pendingOrders.length + activeOrders.length) > 0 && (
            <Badge className="bg-red-500">{pendingOrders.length + activeOrders.length}</Badge>
          )}
        </div>
      </div>
    );
  }

  return (
    <div
      className="fixed bottom-4 right-4 bg-white rounded-lg shadow-2xl border-2 border-indigo-200"
      style={{ width: '400px', maxHeight: '600px', zIndex: 9999 }}
    >
      {/* Header */}
      <div className="bg-indigo-600 text-white p-3 rounded-t-lg flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse"></div>
          <h3 className="font-semibold">In-Store Orders</h3>
          {(pendingOrders.length + activeOrders.length) > 0 && (
            <Badge className="bg-red-500">{pendingOrders.length + activeOrders.length}</Badge>
          )}
        </div>
        <div className="flex gap-2">
          <button
            onClick={fetchOrders}
            className="hover:bg-indigo-700 p-1 rounded"
            disabled={loading}
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
          <button
            onClick={() => setMinimized(true)}
            className="hover:bg-indigo-700 p-1 rounded"
          >
            <Minimize2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="overflow-y-auto" style={{ maxHeight: '530px' }}>
        {/* Pending Cash Payments */}
        {pendingOrders.length > 0 && (
          <div className="p-3 border-b bg-orange-50">
            <h4 className="font-semibold text-orange-900 mb-2 flex items-center gap-2">
              <DollarSign className="w-4 h-4" />
              Awaiting Cash Payment ({pendingOrders.length})
            </h4>
            <div className="space-y-2">
              {pendingOrders.map((order) => (
                <Card key={order.id} className="border-orange-200">
                  <CardContent className="p-3">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <Badge variant="outline" className="text-xs">{order.id}</Badge>
                        <p className="font-semibold text-lg mt-1">₹{order.total_amount}</p>
                      </div>
                      <Button
                        onClick={() => handleApproveCashPayment(order.id)}
                        size="sm"
                        className="bg-green-600 hover:bg-green-700"
                        disabled={loading}
                      >
                        <CheckCircle className="w-3 h-3 mr-1" />
                        Approve
                      </Button>
                    </div>
                    <p className="text-xs text-gray-600">
                      {order.customer_name || 'Walk-in Customer'}
                    </p>
                    <p className="text-xs text-gray-500">
                      {new Date(order.created_at).toLocaleString()}
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Active Print Jobs */}
        {activeOrders.length > 0 && (
          <div className="p-3 bg-blue-50">
            <h4 className="font-semibold text-blue-900 mb-2 flex items-center gap-2">
              <Clock className="w-4 h-4" />
              Active Orders ({activeOrders.length})
            </h4>
            <div className="space-y-2">
              {activeOrders.map((order) => (
                <Card key={order.id} className="border-blue-200">
                  <CardContent className="p-3">
                    <div className="flex justify-between items-start">
                      <div>
                        <Badge variant="outline" className="text-xs">{order.id}</Badge>
                        <p className="font-semibold mt-1">₹{order.total_amount}</p>
                        <p className="text-xs text-gray-600 mt-1">
                          {order.customer_name || 'Walk-in Customer'}
                        </p>
                        <Badge className="text-xs mt-1 bg-blue-600">
                          {order.status === 'printing' ? 'Printing...' : order.status}
                        </Badge>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Empty State */}
        {pendingOrders.length === 0 && activeOrders.length === 0 && (
          <div className="p-8 text-center text-gray-500">
            <p className="text-sm">No orders at the moment</p>
            <p className="text-xs mt-1">Orders will appear here automatically</p>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="p-2 bg-gray-50 rounded-b-lg border-t text-center text-xs text-gray-600">
        Auto-refreshes every 10 seconds
      </div>
    </div>
  );
};

export default SystemTrayPopup;
