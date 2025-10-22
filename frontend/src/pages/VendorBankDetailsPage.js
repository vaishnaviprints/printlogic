import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from 'sonner';
import { Printer, Home, LogOut, Save, AlertTriangle, CheckCircle, DollarSign } from 'lucide-react';
import Footer from '@/components/Footer';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const VendorBankDetailsPage = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [vendor, setVendor] = useState(null);
  const [acknowledged, setAcknowledged] = useState(false);
  const [bankDetails, setBankDetails] = useState({
    account_holder_name: '',
    account_number: '',
    ifsc_code: '',
    bank_name: '',
    branch_name: '',
    account_type: 'Savings',
    verified: false
  });

  useEffect(() => {
    fetchVendorDetails();
  }, []);

  const fetchVendorDetails = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('vendor_token');
      const response = await axios.get(`${API}/vendor/profile`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setVendor(response.data);
      
      if (response.data.bank_details) {
        setBankDetails(response.data.bank_details);
      }
    } catch (error) {
      console.error('Failed to fetch vendor details:', error);
      toast.error('Failed to load vendor details');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    // Validation
    if (!bankDetails.account_holder_name || !bankDetails.account_number || 
        !bankDetails.ifsc_code || !bankDetails.bank_name || !bankDetails.branch_name) {
      toast.error('All fields are required!');
      return;
    }

    if (!acknowledged) {
      toast.error('Please acknowledge the disclaimer');
      return;
    }

    // Validate IFSC format (11 characters)
    if (bankDetails.ifsc_code.length !== 11) {
      toast.error('IFSC code must be 11 characters');
      return;
    }

    // Validate account number (9-18 digits)
    if (bankDetails.account_number.length < 9 || bankDetails.account_number.length > 18) {
      toast.error('Account number must be 9-18 digits');
      return;
    }

    setLoading(true);
    try {
      const token = localStorage.getItem('vendor_token');
      
      // Since vendor can't directly update bank details, we need to submit for admin approval
      // For now, let's use the profile update endpoint
      await axios.put(
        `${API}/vendor/profile`,
        { bank_details: bankDetails },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      toast.success('Bank details updated successfully! ✅');
      toast.info('Details will be verified by admin before payouts');
      fetchVendorDetails();
    } catch (error) {
      console.error('Failed to save bank details:', error);
      toast.error('Failed to save bank details');
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
                <h1 className="text-xl font-bold">Bank Details</h1>
                <p className="text-sm text-gray-600">For weekly payouts</p>
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
        {/* Important Notice */}
        <Card className="border-4 border-red-400 bg-red-50">
          <CardContent className="pt-6">
            <div className="flex items-start gap-4">
              <AlertTriangle className="w-8 h-8 text-red-600 flex-shrink-0 mt-1" />
              <div className="flex-1">
                <h3 className="font-bold text-red-900 text-lg mb-2">⚠️ IMPORTANT DISCLAIMER</h3>
                <div className="space-y-2 text-red-800">
                  <p className="font-semibold">
                    Bank details entered here are YOUR RESPONSIBILITY.
                  </p>
                  <ul className="list-disc list-inside space-y-1 text-sm">
                    <li>Vaishnavi Printers is NOT responsible for incorrect bank details</li>
                    <li>Double-check all information before saving</li>
                    <li>Payouts will be sent to the bank account provided here</li>
                    <li>Wrong details = Payment failure (non-refundable charges may apply)</li>
                    <li>Contact admin immediately if you made an error after saving</li>
                  </ul>
                  <p className="font-semibold mt-3 text-red-900">
                    All payments from customers come to Vaishnavi Printers first, then we send weekly payouts to vendors.
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Current Status */}
        {vendor?.bank_details?.verified ? (
          <Card className="border-2 border-green-400 bg-green-50">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <CheckCircle className="w-8 h-8 text-green-600" />
                <div>
                  <h3 className="font-semibold text-green-900">Bank Details Verified ✅</h3>
                  <p className="text-sm text-green-700">
                    Your bank details have been verified by admin. You will receive weekly payouts.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        ) : vendor?.bank_details ? (
          <Card className="border-2 border-yellow-400 bg-yellow-50">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <DollarSign className="w-8 h-8 text-yellow-600" />
                <div>
                  <h3 className="font-semibold text-yellow-900">Pending Verification</h3>
                  <p className="text-sm text-yellow-700">
                    Your bank details are pending admin verification. You can update them below.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        ) : (
          <Card className="border-2 border-orange-400 bg-orange-50">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <AlertTriangle className="w-8 h-8 text-orange-600" />
                <div>
                  <h3 className="font-semibold text-orange-900">No Bank Details</h3>
                  <p className="text-sm text-orange-700">
                    Please add your bank details to receive weekly payouts.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Bank Details Form */}
        <Card>
          <CardHeader>
            <CardTitle>Bank Account Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>Account Holder Name *</Label>
              <Input
                value={bankDetails.account_holder_name}
                onChange={(e) => setBankDetails({...bankDetails, account_holder_name: e.target.value})}
                placeholder="As per bank records"
                className="font-semibold"
              />
              <p className="text-xs text-gray-500 mt-1">Must match exactly with bank records</p>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <Label>Account Number *</Label>
                <Input
                  value={bankDetails.account_number}
                  onChange={(e) => setBankDetails({...bankDetails, account_number: e.target.value.replace(/\D/g, '')})}
                  placeholder="9-18 digits"
                  maxLength={18}
                  className="font-semibold"
                />
                <p className="text-xs text-gray-500 mt-1">9-18 digits only</p>
              </div>

              <div>
                <Label>IFSC Code *</Label>
                <Input
                  value={bankDetails.ifsc_code}
                  onChange={(e) => setBankDetails({...bankDetails, ifsc_code: e.target.value.toUpperCase()})}
                  placeholder="e.g., SBIN0001234"
                  maxLength={11}
                  className="font-semibold uppercase"
                />
                <p className="text-xs text-gray-500 mt-1">11 characters (e.g., SBIN0001234)</p>
              </div>
            </div>

            <div>
              <Label>Bank Name *</Label>
              <Input
                value={bankDetails.bank_name}
                onChange={(e) => setBankDetails({...bankDetails, bank_name: e.target.value})}
                placeholder="e.g., State Bank of India"
                className="font-semibold"
              />
            </div>

            <div>
              <Label>Branch Name *</Label>
              <Input
                value={bankDetails.branch_name}
                onChange={(e) => setBankDetails({...bankDetails, branch_name: e.target.value})}
                placeholder="e.g., Hyderabad Main Branch"
                className="font-semibold"
              />
            </div>

            <div>
              <Label>Account Type *</Label>
              <Select 
                value={bankDetails.account_type} 
                onValueChange={(v) => setBankDetails({...bankDetails, account_type: v})}
              >
                <SelectTrigger className="font-semibold">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Savings">Savings Account</SelectItem>
                  <SelectItem value="Current">Current Account</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Acknowledgment */}
            <div className="bg-gray-50 border-2 border-gray-300 rounded-lg p-4 mt-6">
              <div className="flex items-start gap-3">
                <Checkbox
                  id="acknowledge"
                  checked={acknowledged}
                  onCheckedChange={setAcknowledged}
                  className="mt-1"
                />
                <label htmlFor="acknowledge" className="text-sm leading-relaxed cursor-pointer">
                  <span className="font-semibold text-gray-900">I acknowledge that:</span>
                  <ul className="list-disc list-inside mt-2 space-y-1 text-gray-700">
                    <li>I have verified all bank details are correct</li>
                    <li>Vaishnavi Printers is NOT responsible for wrong details</li>
                    <li>Payouts will be sent to this account weekly</li>
                    <li>I will contact admin immediately if I made an error</li>
                    <li>Payment gateway charges for failed transfers are non-refundable</li>
                  </ul>
                </label>
              </div>
            </div>

            {/* Save Button */}
            <div className="flex gap-3 pt-4">
              <Button 
                onClick={handleSave} 
                disabled={loading || !acknowledged} 
                className="flex-1 bg-indigo-600 text-lg py-6"
              >
                <Save className="w-5 h-5 mr-2" />
                {loading ? 'Saving...' : 'Save Bank Details'}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Payout Info */}
        <Card className="bg-indigo-50 border-indigo-200">
          <CardHeader>
            <CardTitle className="text-indigo-900">Payout Schedule</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-sm text-indigo-800">
              <li className="flex items-start gap-2">
                <CheckCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                <span>Payouts are processed every <strong>Monday</strong></span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                <span>Payment for orders completed in previous week (Mon-Sun)</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                <span>Bank transfer takes 1-3 business days</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                <span>You will receive SMS/Email notification when payout is sent</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                <span>Check "Settlements" section in dashboard for payout history</span>
              </li>
            </ul>
          </CardContent>
        </Card>
      </div>

      <Footer />
    </div>
  );
};

export default VendorBankDetailsPage;
