import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';
import { RefreshCw, MapPin, Phone, Mail, Plus, Edit, Trash2, Award, DollarSign, ShoppingBag, Settings, Eye, Store, CheckCircle, XCircle } from 'lucide-react';

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

const VendorsPage = () => {
  const [vendors, setVendors] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterBadge, setFilterBadge] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  
  // Modals
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [badgeConfigDialogOpen, setBadgeConfigDialogOpen] = useState(false);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [selectedVendor, setSelectedVendor] = useState(null);
  
  // Badge config
  const [badgeConfig, setBadgeConfig] = useState({});
  const [editingBadgeConfig, setEditingBadgeConfig] = useState({});
  
  // Edit form
  const [editForm, setEditForm] = useState({});

  useEffect(() => {
    fetchVendors();
    fetchBadgeConfig();
  }, []);

  const fetchVendors = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('admin_token');
      const response = await axios.get(`${API}/admin/vendors/list`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setVendors(response.data);
    } catch (error) {
      console.error('Failed to fetch vendors:', error);
      toast.error('Failed to load vendors');
    } finally {
      setLoading(false);
    }
  };

  const fetchBadgeConfig = async () => {
    try {
      const token = localStorage.getItem('admin_token');
      const response = await axios.get(`${API}/admin/badges/config`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setBadgeConfig(response.data);
      setEditingBadgeConfig(response.data);
    } catch (error) {
      console.error('Failed to fetch badge config:', error);
    }
  };

  const handleEditVendor = (vendor) => {
    setSelectedVendor(vendor);
    setEditForm({
      certified: vendor.certified || false,
      badge: vendor.badge || 'none',
      description: vendor.description || '',
      autoAcceptRadiusKm: vendor.autoAcceptRadiusKm || 5,
      is_active: vendor.is_active !== false
    });
    setEditDialogOpen(true);
  };

  const handleViewVendor = (vendor) => {
    setSelectedVendor(vendor);
    setViewDialogOpen(true);
  };

  const handleDeleteVendor = (vendor) => {
    setSelectedVendor(vendor);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    try {
      const token = localStorage.getItem('token');
      await axios.delete(`${API}/admin/vendors/${selectedVendor.id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success('Vendor deleted successfully');
      fetchVendors();
      setDeleteDialogOpen(false);
      setSelectedVendor(null);
    } catch (error) {
      console.error('Failed to delete vendor:', error);
      toast.error(error.response?.data?.detail || 'Failed to delete vendor');
    }
  };

  const saveVendorEdit = async () => {
    try {
      const token = localStorage.getItem('token');
      await axios.put(`${API}/admin/vendors/${selectedVendor.id}`, editForm, {
        headers: { 
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      toast.success('Vendor updated successfully');
      fetchVendors();
      setEditDialogOpen(false);
      setSelectedVendor(null);
    } catch (error) {
      console.error('Failed to update vendor:', error);
      toast.error(error.response?.data?.detail || 'Failed to update vendor');
    }
  };

  const saveBadgeConfig = async () => {
    try {
      const token = localStorage.getItem('token');
      await axios.post(`${API}/admin/badges/config`, editingBadgeConfig, {
        headers: { 
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      toast.success('Badge configuration updated successfully');
      setBadgeConfig(editingBadgeConfig);
      setBadgeConfigDialogOpen(false);
    } catch (error) {
      console.error('Failed to update badge config:', error);
      toast.error(error.response?.data?.detail || 'Failed to update badge configuration');
    }
  };

  // Filter vendors
  const filteredVendors = vendors.filter(vendor => {
    const matchesSearch = vendor.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          vendor.shop_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          vendor.contact_email?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesBadge = filterBadge === 'all' || vendor.badge === filterBadge;
    const matchesStatus = filterStatus === 'all' || 
                          (filterStatus === 'active' && vendor.is_active) ||
                          (filterStatus === 'inactive' && !vendor.is_active);
    return matchesSearch && matchesBadge && matchesStatus;
  });

  return (
    <div data-testid="vendors-page">
      <Tabs defaultValue="vendors" className="space-y-6">
        <div className="flex items-center justify-between">
          <TabsList>
            <TabsTrigger value="vendors">Vendors List</TabsTrigger>
            <TabsTrigger value="badges">Badge System</TabsTrigger>
          </TabsList>
          <Button onClick={fetchVendors} disabled={loading} variant="outline" data-testid="refresh-vendors-btn">
            <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>

        {/* Vendors List Tab */}
        <TabsContent value="vendors" className="space-y-6">
          {/* Filters */}
          <Card>
            <CardHeader>
              <CardTitle>Filter Vendors</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-3 gap-4">
                <div>
                  <Label>Search</Label>
                  <Input
                    placeholder="Search by name, email..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
                <div>
                  <Label>Badge</Label>
                  <select
                    className="w-full h-10 px-3 rounded-md border border-gray-300"
                    value={filterBadge}
                    onChange={(e) => setFilterBadge(e.target.value)}
                  >
                    <option value="all">All Badges</option>
                    <option value="none">None</option>
                    <option value="bronze">Bronze</option>
                    <option value="silver">Silver</option>
                    <option value="gold">Gold</option>
                    <option value="diamond">Diamond</option>
                    <option value="platinum">Platinum</option>
                  </select>
                </div>
                <div>
                  <Label>Status</Label>
                  <select
                    className="w-full h-10 px-3 rounded-md border border-gray-300"
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value)}
                  >
                    <option value="all">All Status</option>
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                  </select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Vendors Grid */}
          <div className="grid md:grid-cols-2 gap-6">
            {filteredVendors.map((vendor) => (
              <Card key={vendor.id} data-testid={`vendor-card-${vendor.id}`}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <CardTitle className="text-lg">{vendor.shop_name || vendor.name}</CardTitle>
                        {vendor.certified && (
                          <CheckCircle className="w-5 h-5 text-green-600" title="Certified Vendor" />
                        )}
                      </div>
                      <CardDescription className="text-xs">{vendor.registration_number}</CardDescription>
                      <div className="flex items-center gap-2 mt-2">
                        <Badge 
                          style={{ backgroundColor: getBadgeColor(vendor.badge) }}
                          className="text-white"
                        >
                          <Award className="w-3 h-3 mr-1" />
                          {(vendor.badge || 'none').toUpperCase()}
                        </Badge>
                        {vendor.store_open ? (
                          <Badge variant="outline" className="text-green-600 border-green-600">
                            <Store className="w-3 h-3 mr-1" />
                            Open
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="text-red-600 border-red-600">
                            <XCircle className="w-3 h-3 mr-1" />
                            Closed
                          </Badge>
                        )}
                        <Badge variant={vendor.is_active ? "default" : "secondary"}>
                          {vendor.is_active ? 'Active' : 'Inactive'}
                        </Badge>
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {/* Stats */}
                    <div className="grid grid-cols-2 gap-3 p-3 bg-gray-50 rounded-lg">
                      <div>
                        <div className="text-xs text-gray-500 flex items-center gap-1">
                          <ShoppingBag className="w-3 h-3" />
                          Total Sales
                        </div>
                        <div className="text-lg font-bold">{vendor.total_sales || 0}</div>
                      </div>
                      <div>
                        <div className="text-xs text-gray-500 flex items-center gap-1">
                          <DollarSign className="w-3 h-3" />
                          Earnings
                        </div>
                        <div className="text-lg font-bold">₹{(vendor.total_earnings || 0).toLocaleString()}</div>
                      </div>
                    </div>

                    {/* Contact Info */}
                    <div className="space-y-2 text-sm">
                      <div className="flex items-start gap-2">
                        <MapPin className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
                        <div>
                          <div>{vendor.location?.address}</div>
                          <div className="text-gray-500">{vendor.location?.city}, {vendor.location?.pincode}</div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Phone className="w-4 h-4 text-gray-400" />
                        <span>{vendor.contact_phone}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Mail className="w-4 h-4 text-gray-400" />
                        <span className="truncate">{vendor.contact_email}</span>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2 pt-3 border-t">
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1"
                        onClick={() => handleViewVendor(vendor)}
                      >
                        <Eye className="w-4 h-4 mr-2" />
                        View
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1"
                        onClick={() => handleEditVendor(vendor)}
                      >
                        <Edit className="w-4 h-4 mr-2" />
                        Edit
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-red-600 hover:text-red-700"
                        onClick={() => handleDeleteVendor(vendor)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {filteredVendors.length === 0 && (
            <Card>
              <CardContent className="py-12 text-center text-gray-500">
                No vendors found matching your criteria
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Badge System Tab */}
        <TabsContent value="badges" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Badge System Configuration</CardTitle>
                  <CardDescription>Configure minimum sales thresholds for each badge tier</CardDescription>
                </div>
                <Button onClick={() => setBadgeConfigDialogOpen(true)}>
                  <Settings className="w-4 h-4 mr-2" />
                  Edit Configuration
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-3 gap-4">
                {Object.entries(badgeConfig).map(([badge, config]) => (
                  <Card key={badge} className="border-2" style={{ borderColor: config.color }}>
                    <CardHeader>
                      <div className="flex items-center gap-2">
                        <Award className="w-5 h-5" style={{ color: config.color }} />
                        <CardTitle className="text-lg uppercase">{badge}</CardTitle>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        <div className="text-2xl font-bold">{config.minSales}+ sales</div>
                        <div className="text-sm text-gray-500">Minimum sales required</div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Badge Distribution */}
          <Card>
            <CardHeader>
              <CardTitle>Badge Distribution</CardTitle>
              <CardDescription>Current distribution of badges across all vendors</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-6 gap-4">
                {['none', 'bronze', 'silver', 'gold', 'diamond', 'platinum'].map(badge => {
                  const count = vendors.filter(v => v.badge === badge).length;
                  return (
                    <div key={badge} className="text-center">
                      <div className="text-2xl font-bold">{count}</div>
                      <div 
                        className="text-xs uppercase font-medium mt-1"
                        style={{ color: getBadgeColor(badge) }}
                      >
                        {badge}
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* View Vendor Dialog */}
      <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Vendor Details</DialogTitle>
          </DialogHeader>
          {selectedVendor && (
            <div className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <Label className="text-gray-500">Vendor Name</Label>
                  <div className="font-medium">{selectedVendor.name}</div>
                </div>
                <div>
                  <Label className="text-gray-500">Shop Name</Label>
                  <div className="font-medium">{selectedVendor.shop_name}</div>
                </div>
                <div>
                  <Label className="text-gray-500">Registration Number</Label>
                  <div className="font-medium">{selectedVendor.registration_number}</div>
                </div>
                <div>
                  <Label className="text-gray-500">Status</Label>
                  <div className="flex gap-2">
                    <Badge variant={selectedVendor.is_active ? "default" : "secondary"}>
                      {selectedVendor.is_active ? 'Active' : 'Inactive'}
                    </Badge>
                    {selectedVendor.certified && (
                      <Badge variant="outline" className="text-green-600 border-green-600">
                        Certified
                      </Badge>
                    )}
                  </div>
                </div>
                <div className="md:col-span-2">
                  <Label className="text-gray-500">Description</Label>
                  <div className="font-medium">{selectedVendor.description || 'N/A'}</div>
                </div>
                <div>
                  <Label className="text-gray-500">Contact Phone</Label>
                  <div className="font-medium">{selectedVendor.contact_phone}</div>
                </div>
                <div>
                  <Label className="text-gray-500">Contact Email</Label>
                  <div className="font-medium">{selectedVendor.contact_email}</div>
                </div>
                <div>
                  <Label className="text-gray-500">Working Hours</Label>
                  <div className="font-medium">{selectedVendor.working_hours || 'N/A'}</div>
                </div>
                <div>
                  <Label className="text-gray-500">Auto-Accept Radius</Label>
                  <div className="font-medium">{selectedVendor.autoAcceptRadiusKm} km</div>
                </div>
                <div>
                  <Label className="text-gray-500">Current Workload</Label>
                  <div className="font-medium">{selectedVendor.current_workload_count || 0} orders</div>
                </div>
                <div>
                  <Label className="text-gray-500">Total Sales</Label>
                  <div className="font-medium text-lg">{selectedVendor.total_sales || 0}</div>
                </div>
                <div>
                  <Label className="text-gray-500">Total Earnings</Label>
                  <div className="font-medium text-lg">₹{(selectedVendor.total_earnings || 0).toLocaleString()}</div>
                </div>
                <div>
                  <Label className="text-gray-500">Badge</Label>
                  <Badge style={{ backgroundColor: getBadgeColor(selectedVendor.badge) }} className="text-white">
                    <Award className="w-3 h-3 mr-1" />
                    {(selectedVendor.badge || 'none').toUpperCase()}
                  </Badge>
                </div>
                <div className="md:col-span-2">
                  <Label className="text-gray-500">Address</Label>
                  <div className="font-medium">
                    {selectedVendor.location?.address}, {selectedVendor.location?.city} - {selectedVendor.location?.pincode}
                  </div>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Edit Vendor Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Edit Vendor</DialogTitle>
            <DialogDescription>Update vendor details and settings</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label>Certified Vendor</Label>
              <Switch
                checked={editForm.certified}
                onCheckedChange={(checked) => setEditForm({ ...editForm, certified: checked })}
              />
            </div>
            <div className="flex items-center justify-between">
              <Label>Active Status</Label>
              <Switch
                checked={editForm.is_active}
                onCheckedChange={(checked) => setEditForm({ ...editForm, is_active: checked })}
              />
            </div>
            <div>
              <Label>Badge</Label>
              <select
                className="w-full h-10 px-3 rounded-md border border-gray-300"
                value={editForm.badge}
                onChange={(e) => setEditForm({ ...editForm, badge: e.target.value })}
              >
                <option value="none">None</option>
                <option value="bronze">Bronze</option>
                <option value="silver">Silver</option>
                <option value="gold">Gold</option>
                <option value="diamond">Diamond</option>
                <option value="platinum">Platinum</option>
              </select>
            </div>
            <div>
              <Label>Auto-Accept Radius (km)</Label>
              <Input
                type="number"
                step="0.5"
                value={editForm.autoAcceptRadiusKm}
                onChange={(e) => setEditForm({ ...editForm, autoAcceptRadiusKm: parseFloat(e.target.value) })}
              />
            </div>
            <div>
              <Label>Description</Label>
              <Textarea
                value={editForm.description}
                onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditDialogOpen(false)}>Cancel</Button>
            <Button onClick={saveVendorEdit}>Save Changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the vendor "{selectedVendor?.name}". This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-red-600 hover:bg-red-700">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Badge Config Dialog */}
      <Dialog open={badgeConfigDialogOpen} onOpenChange={setBadgeConfigDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Badge Configuration</DialogTitle>
            <DialogDescription>Configure minimum sales thresholds for each badge tier</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {Object.entries(editingBadgeConfig).map(([badge, config]) => (
              <div key={badge} className="flex items-center gap-4 p-4 border rounded-lg">
                <Award className="w-6 h-6" style={{ color: config.color }} />
                <div className="flex-1">
                  <Label className="uppercase font-bold">{badge}</Label>
                </div>
                <div className="w-32">
                  <Label className="text-xs">Min Sales</Label>
                  <Input
                    type="number"
                    value={config.minSales}
                    onChange={(e) => setEditingBadgeConfig({
                      ...editingBadgeConfig,
                      [badge]: { ...config, minSales: parseInt(e.target.value) }
                    })}
                  />
                </div>
              </div>
            ))}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setEditingBadgeConfig(badgeConfig);
              setBadgeConfigDialogOpen(false);
            }}>
              Cancel
            </Button>
            <Button onClick={saveBadgeConfig}>Save Configuration</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default VendorsPage;
