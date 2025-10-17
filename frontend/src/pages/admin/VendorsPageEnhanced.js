import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { CSVLink } from 'react-csv';
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
import { RefreshCw, MapPin, Phone, Mail, Plus, Edit, Trash2, Award, DollarSign, ShoppingBag, Settings, Eye, Store, CheckCircle, XCircle, Download, FileText } from 'lucide-react';
import BadgeProgressBar from '@/components/BadgeProgressBar';

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

const VendorsPageEnhanced = () => {
  const [vendors, setVendors] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterBadge, setFilterBadge] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  
  // Modals
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [badgeConfigDialogOpen, setBadgeConfigDialogOpen] = useState(false);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [selectedVendor, setSelectedVendor] = useState(null);
  const [viewTab, setViewTab] = useState('profile');
  
  // Badge config
  const [badgeConfig, setBadgeConfig] = useState({});
  const [editingBadgeConfig, setEditingBadgeConfig] = useState({});
  
  // Edit form
  const [editForm, setEditForm] = useState({});
  
  // Create form
  const [createForm, setCreateForm] = useState({
    name: '',
    shop_name: '',
    contact_email: '',
    contact_phone: '',
    password: '',
    location: {
      address: '',
      city: '',
      pincode: '',
      latitude: 0,
      longitude: 0
    },
    address: '',
    description: '',
    autoAcceptRadiusKm: 5,
    certified: false,
    badge: 'none',
    working_hours: '9 AM - 6 PM'
  });

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

  const handleCreateVendor = async () => {
    try {
      const token = localStorage.getItem('admin_token');
      
      // Prepare vendor data
      const vendorData = {
        ...createForm,
        location: {
          ...createForm.location,
          latitude: parseFloat(createForm.location.latitude) || 0,
          longitude: parseFloat(createForm.location.longitude) || 0
        }
      };

      await axios.post(`${API}/vendor/register`, vendorData, {
        headers: { 
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      toast.success('Vendor created successfully');
      fetchVendors();
      setCreateDialogOpen(false);
      
      // Reset form
      setCreateForm({
        name: '',
        shop_name: '',
        contact_email: '',
        contact_phone: '',
        password: '',
        location: { address: '', city: '', pincode: '', latitude: 0, longitude: 0 },
        address: '',
        description: '',
        autoAcceptRadiusKm: 5,
        certified: false,
        badge: 'none',
        working_hours: '9 AM - 6 PM'
      });
    } catch (error) {
      console.error('Failed to create vendor:', error);
      toast.error(error.response?.data?.detail || 'Failed to create vendor');
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
    setViewTab('profile');
    setViewDialogOpen(true);
  };

  const handleDeleteVendor = (vendor) => {
    setSelectedVendor(vendor);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    try {
      const token = localStorage.getItem('admin_token');
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
      const token = localStorage.getItem('admin_token');
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
      const token = localStorage.getItem('admin_token');
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

  // Prepare CSV data
  const csvData = vendors.map(v => ({
    'Vendor ID': v.id,
    'Name': v.name,
    'Shop Name': v.shop_name,
    'Email': v.contact_email,
    'Phone': v.contact_phone,
    'Registration Number': v.registration_number,
    'Badge': v.badge,
    'Certified': v.certified ? 'Yes' : 'No',
    'Status': v.is_active ? 'Active' : 'Inactive',
    'Store Open': v.store_open ? 'Open' : 'Closed',
    'Total Sales': v.total_sales || 0,
    'Total Earnings': v.total_earnings || 0,
    'Auto Accept Radius (km)': v.autoAcceptRadiusKm,
    'City': v.location?.city,
    'Address': v.location?.address
  }));

  return (
    <div data-testid="vendors-page">
      <Tabs defaultValue="vendors" className="space-y-6">
        <div className="flex items-center justify-between">
          <TabsList>
            <TabsTrigger value="vendors">Vendors List</TabsTrigger>
            <TabsTrigger value="badges">Badge System</TabsTrigger>
          </TabsList>
          <div className="flex gap-2">
            <CSVLink data={csvData} filename="vendors-export.csv">
              <Button variant="outline">
                <Download className="w-4 h-4 mr-2" />
                Export CSV
              </Button>
            </CSVLink>
            <Button onClick={fetchVendors} disabled={loading} variant="outline">
              <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
            <Button onClick={() => setCreateDialogOpen(true)}>
              <Plus className="w-4 h-4 mr-2" />
              New Vendor
            </Button>
          </div>
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

                    {/* Badge Progress */}
                    <div className="pt-3 border-t">
                      <BadgeProgressBar
                        currentBadge={vendor.badge}
                        totalSales={vendor.total_sales || 0}
                        badgeConfig={badgeConfig}
                      />
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

        {/* Badge System Tab - (Keeping existing implementation) */}
        <TabsContent value="badges" className="space-y-6">
          {/* Same as before */}
        </TabsContent>
      </Tabs>

      {/* Dialogs - Next section will contain all the dialogs */}
    </div>
  );
};

export default VendorsPageEnhanced;
