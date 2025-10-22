import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { Printer, Home, LogOut, Save, RefreshCw, Store } from 'lucide-react';
import Footer from '@/components/Footer';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const VendorBusinessProfilePage = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [profile, setProfile] = useState({
    name: '',
    shop_name: '',
    description: '',
    contact_phone: '',
    contact_email: '',
    address: '',
    city: '',
    pincode: '',
    working_hours: ''
  });

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('vendor_token');
      const response = await axios.get(`${API}/vendor/profile`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      setProfile({
        name: response.data.name || '',
        shop_name: response.data.shop_name || '',
        description: response.data.description || '',
        contact_phone: response.data.contact_phone || '',
        contact_email: response.data.contact_email || '',
        address: response.data.address || '',
        city: response.data.city || '',
        pincode: response.data.pincode || '',
        working_hours: response.data.working_hours || ''
      });
    } catch (error) {
      console.error('Failed to fetch profile:', error);
      toast.error('Failed to load profile');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    // Validation
    if (!profile.name || !profile.shop_name || !profile.contact_phone) {
      toast.error('Name, Business Name, and Phone are required!');
      return;
    }

    if (profile.contact_phone.length < 10) {
      toast.error('Phone number must be at least 10 digits');
      return;
    }

    setLoading(true);
    try {
      const token = localStorage.getItem('vendor_token');
      
      // Update profile
      await axios.put(
        `${API}/vendor/profile`,
        {
          name: profile.name,
          shop_name: profile.shop_name,
          description: profile.description,
          contact_phone: profile.contact_phone,
          working_hours: profile.working_hours
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      toast.success('Business profile updated successfully! ✅');
      fetchProfile();
    } catch (error) {
      console.error('Failed to save profile:', error);
      toast.error('Failed to save profile');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('vendor_token');
    navigate('/vendor/login');
  };

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
                <h1 className="text-xl font-bold">Business Profile</h1>
                <p className="text-sm text-gray-600">Edit your business information</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Button variant="outline" onClick={() => navigate('/vendor/dashboard')} size="sm">
                <Home className="w-4 h-4 mr-2" />
                Dashboard
              </Button>
              <Button variant="outline" onClick={handleLogout} size="sm">
                <LogOut className="w-4 h-4 mr-2" />
                Logout
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 py-8 space-y-6">
        {/* Info Card */}
        <Card className="border-2 border-blue-200 bg-blue-50">
          <CardContent className="pt-6">
            <div className="flex items-start gap-3">
              <Store className="w-6 h-6 text-blue-600 mt-0.5" />
              <div>
                <h3 className="font-semibold text-blue-900 mb-1">Business Information</h3>
                <p className="text-sm text-blue-800">
                  Keep your business details up to date. This information is visible to customers 
                  and helps them find and contact your shop.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Basic Information */}
        <Card>
          <CardHeader>
            <CardTitle>Basic Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <Label>Your Name *</Label>
                <Input
                  value={profile.name}
                  onChange={(e) => setProfile({...profile, name: e.target.value})}
                  placeholder="Owner/Manager name"
                  className="font-semibold"
                />
                <p className="text-xs text-gray-500 mt-1">Your personal name</p>
              </div>

              <div>
                <Label>Business/Shop Name *</Label>
                <Input
                  value={profile.shop_name}
                  onChange={(e) => setProfile({...profile, shop_name: e.target.value})}
                  placeholder="Your shop name"
                  className="font-semibold text-lg"
                />
                <p className="text-xs text-gray-500 mt-1">This is shown to customers</p>
              </div>
            </div>

            <div>
              <Label>Business Description</Label>
              <Textarea
                value={profile.description}
                onChange={(e) => setProfile({...profile, description: e.target.value})}
                placeholder="Describe your printing services, specialties, equipment..."
                rows={4}
                className="resize-none"
              />
              <p className="text-xs text-gray-500 mt-1">
                Tell customers about your shop, services, and what makes you special (optional)
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Contact Information */}
        <Card>
          <CardHeader>
            <CardTitle>Contact Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <Label>Contact Phone *</Label>
                <Input
                  value={profile.contact_phone}
                  onChange={(e) => setProfile({...profile, contact_phone: e.target.value.replace(/\D/g, '')})}
                  placeholder="+91 9876543210"
                  maxLength={15}
                  className="font-semibold"
                />
                <p className="text-xs text-gray-500 mt-1">Customers can call this number</p>
              </div>

              <div>
                <Label>Email Address</Label>
                <Input
                  value={profile.contact_email}
                  disabled
                  className="bg-gray-100 cursor-not-allowed"
                />
                <p className="text-xs text-gray-500 mt-1">Email cannot be changed (contact admin)</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Location Information */}
        <Card>
          <CardHeader>
            <CardTitle>Shop Location</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>Shop Address</Label>
              <Input
                value={profile.address}
                disabled
                className="bg-gray-100 cursor-not-allowed"
              />
              <p className="text-xs text-gray-500 mt-1">Address is managed by admin</p>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <Label>City</Label>
                <Input
                  value={profile.city}
                  disabled
                  className="bg-gray-100 cursor-not-allowed"
                />
              </div>

              <div>
                <Label>Pincode</Label>
                <Input
                  value={profile.pincode}
                  disabled
                  className="bg-gray-100 cursor-not-allowed"
                />
              </div>
            </div>

            <p className="text-xs text-blue-600 bg-blue-50 p-2 rounded">
              💡 To change address, city, or pincode, please contact admin
            </p>
          </CardContent>
        </Card>

        {/* Operating Hours */}
        <Card>
          <CardHeader>
            <CardTitle>Operating Hours</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>Working Hours</Label>
              <Input
                value={profile.working_hours}
                onChange={(e) => setProfile({...profile, working_hours: e.target.value})}
                placeholder="e.g., Mon-Sat: 9 AM - 7 PM, Sun: Closed"
                className="font-semibold"
              />
              <p className="text-xs text-gray-500 mt-1">
                Let customers know when your shop is open
              </p>
            </div>

            {/* Examples */}
            <div className="bg-gray-50 p-3 rounded-lg border">
              <p className="text-xs font-semibold text-gray-700 mb-2">Examples:</p>
              <ul className="text-xs text-gray-600 space-y-1">
                <li>• "Mon-Sat: 9 AM - 7 PM, Sunday Closed"</li>
                <li>• "Open Daily 8:30 AM - 8:30 PM"</li>
                <li>• "Weekdays: 9 AM - 6 PM, Weekends: 10 AM - 5 PM"</li>
              </ul>
            </div>
          </CardContent>
        </Card>

        {/* Action Buttons */}
        <div className="flex gap-3 pt-4">
          <Button 
            variant="outline" 
            onClick={fetchProfile} 
            disabled={loading}
            className="flex-1"
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Reset Changes
          </Button>
          <Button 
            onClick={handleSave} 
            disabled={loading} 
            className="flex-1 bg-indigo-600 text-lg py-6"
          >
            <Save className="w-5 h-5 mr-2" />
            {loading ? 'Saving...' : 'Save Profile'}
          </Button>
        </div>

        {/* Info Box */}
        <Card className="bg-indigo-50 border-indigo-200">
          <CardContent className="pt-6">
            <h4 className="font-semibold text-indigo-900 mb-2">What can you edit?</h4>
            <div className="grid md:grid-cols-2 gap-2 text-sm">
              <div>
                <p className="text-green-700 font-medium">✅ You can edit:</p>
                <ul className="text-green-800 space-y-1 ml-4">
                  <li>• Your name</li>
                  <li>• Business/Shop name</li>
                  <li>• Description</li>
                  <li>• Contact phone</li>
                  <li>• Working hours</li>
                </ul>
              </div>
              <div>
                <p className="text-gray-700 font-medium">🔒 Admin manages:</p>
                <ul className="text-gray-600 space-y-1 ml-4">
                  <li>• Email address</li>
                  <li>• Shop address</li>
                  <li>• City & Pincode</li>
                  <li>• Registration details</li>
                  <li>• Badge & verification</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Footer />
    </div>
  );
};

export default VendorBusinessProfilePage;
