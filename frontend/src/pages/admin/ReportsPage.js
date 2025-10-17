import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Package, DollarSign, Users, TrendingUp, Award } from 'lucide-react';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const getBadgeColor = (badge) => {
  const colors = {
    none: '#9CA3AF',
    bronze: '#CD7F32',
    silver: '#C0C0C0',
    gold: '#FFD700',
    diamond: '#B9F2FF',
    platinum: '#E5E4E2'
  };
  return colors[badge] || colors.none;
};

const ReportsPage = () => {
  const [loading, setLoading] = useState(false);
  const [vendors, setVendors] = useState([]);
  const [orders, setOrders] = useState([]);
  const [stats, setStats] = useState({
    totalOrdersToday: 0,
    totalOrdersMonth: 0,
    totalRevenue: 0,
    activeVendors: 0
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('admin_token');
      
      // Fetch vendors
      const vendorsRes = await axios.get(`${API}/admin/vendors/list`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setVendors(vendorsRes.data);

      // Fetch orders
      const ordersRes = await axios.get(`${API}/orders`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setOrders(ordersRes.data);

      // Calculate stats
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);

      const ordersToday = ordersRes.data.filter(o => new Date(o.created_at) >= today).length;
      const ordersMonth = ordersRes.data.filter(o => new Date(o.created_at) >= startOfMonth).length;
      const revenue = ordersRes.data
        .filter(o => o.status === 'Paid' || o.status === 'Completed' || o.status === 'ReadyForPickup')
        .reduce((sum, o) => sum + (o.total || 0), 0);
      const activeVendorCount = vendorsRes.data.filter(v => v.is_active).length;

      setStats({
        totalOrdersToday: ordersToday,
        totalOrdersMonth: ordersMonth,
        totalRevenue: revenue,
        activeVendors: activeVendorCount
      });

    } catch (error) {
      console.error('Failed to fetch data:', error);
      toast.error('Failed to load reports data');
    } finally {
      setLoading(false);
    }
  };

  // Prepare chart data
  const vendorPerformanceData = vendors
    .sort((a, b) => (b.total_sales || 0) - (a.total_sales || 0))
    .slice(0, 10)
    .map(v => ({
      name: v.shop_name || v.name,
      sales: v.total_sales || 0,
      earnings: v.total_earnings || 0
    }));

  const badgeDistributionData = [
    { name: 'None', value: vendors.filter(v => v.badge === 'none' || !v.badge).length, color: '#9CA3AF' },
    { name: 'Bronze', value: vendors.filter(v => v.badge === 'bronze').length, color: '#CD7F32' },
    { name: 'Silver', value: vendors.filter(v => v.badge === 'silver').length, color: '#C0C0C0' },
    { name: 'Gold', value: vendors.filter(v => v.badge === 'gold').length, color: '#FFD700' },
    { name: 'Diamond', value: vendors.filter(v => v.badge === 'diamond').length, color: '#B9F2FF' },
    { name: 'Platinum', value: vendors.filter(v => v.badge === 'platinum').length, color: '#E5E4E2' }
  ].filter(item => item.value > 0);

  return (
    <div data-testid="reports-page">
      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="vendors">Vendor Analytics</TabsTrigger>
          <TabsTrigger value="orders">Order Analytics</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          {/* Summary Cards */}
          <div className="grid md:grid-cols-4 gap-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Orders Today</CardTitle>
                <Package className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.totalOrdersToday}</div>
                <p className="text-xs text-muted-foreground">
                  {stats.totalOrdersMonth} this month
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">₹{stats.totalRevenue.toLocaleString()}</div>
                <p className="text-xs text-muted-foreground">
                  From all completed orders
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Active Vendors</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.activeVendors}</div>
                <p className="text-xs text-muted-foreground">
                  Out of {vendors.length} total
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Avg Order Value</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  ₹{orders.length > 0 ? Math.round(stats.totalRevenue / orders.length).toLocaleString() : 0}
                </div>
                <p className="text-xs text-muted-foreground">
                  Per order
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Badge Distribution */}
          <Card>
            <CardHeader>
              <CardTitle>Badge Distribution</CardTitle>
              <CardDescription>Distribution of vendor badges across the platform</CardDescription>
            </CardHeader>
            <CardContent>
              {badgeDistributionData.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={badgeDistributionData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={(entry) => `${entry.name}: ${entry.value}`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {badgeDistributionData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="text-center py-12 text-gray-500">No badge data available</div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Vendor Analytics Tab */}
        <TabsContent value="vendors" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Top 10 Vendors by Sales</CardTitle>
              <CardDescription>Vendors with highest total sales count</CardDescription>
            </CardHeader>
            <CardContent>
              {vendorPerformanceData.length > 0 ? (
                <ResponsiveContainer width="100%" height={400}>
                  <BarChart data={vendorPerformanceData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" angle={-45} textAnchor="end" height={100} />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="sales" fill="#4F46E5" name="Total Sales" />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="text-center py-12 text-gray-500">No vendor performance data available</div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Vendor Earnings</CardTitle>
              <CardDescription>Top vendors by total earnings</CardDescription>
            </CardHeader>
            <CardContent>
              {vendorPerformanceData.length > 0 ? (
                <ResponsiveContainer width="100%" height={400}>
                  <BarChart data={vendorPerformanceData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" angle={-45} textAnchor="end" height={100} />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="earnings" fill="#10B981" name="Total Earnings (₹)" />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="text-center py-12 text-gray-500">No earnings data available</div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Order Analytics Tab */}
        <TabsContent value="orders" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Order Status Distribution</CardTitle>
              <CardDescription>Current status of all orders</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {['Estimated', 'Paid', 'Assigned', 'InProduction', 'ReadyForPickup', 'Completed', 'Cancelled'].map(status => {
                  const count = orders.filter(o => o.status === status).length;
                  const percentage = orders.length > 0 ? Math.round((count / orders.length) * 100) : 0;
                  return (
                    <div key={status} className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Badge variant="outline">{status}</Badge>
                        <span className="text-sm text-gray-600">{count} orders</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-32 bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-indigo-600 h-2 rounded-full"
                            style={{ width: `${percentage}%` }}
                          />
                        </div>
                        <span className="text-sm font-medium w-12 text-right">{percentage}%</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Recent Orders</CardTitle>
              <CardDescription>Latest orders in the system</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {orders.slice(0, 10).map(order => (
                  <div key={order.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <div className="font-medium">{order.id}</div>
                      <div className="text-sm text-gray-500">
                        {order.customer_name} • {new Date(order.created_at).toLocaleDateString()}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-medium">₹{order.total?.toLocaleString()}</div>
                      <Badge variant={order.status === 'Completed' ? 'default' : 'outline'}>
                        {order.status}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ReportsPage;
