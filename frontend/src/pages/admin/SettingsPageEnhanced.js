import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { Save, DollarSign, AlertCircle } from 'lucide-react';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const SettingsPage = () => {
  const [loading, setLoading] = useState(false);
  const [commissionSettings, setCommissionSettings] = useState({
    global_commission_percentage: 5.0,
    commission_type: 'platform_fee'
  });

  useEffect(() => {
    fetchCommissionSettings();
  }, []);

  const fetchCommissionSettings = async () => {
    try {
      const token = localStorage.getItem('admin_token');
      const response = await axios.get(`${API}/admin/commission-settings`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setCommissionSettings({
        global_commission_percentage: response.data.global_commission_percentage || 5.0,
        commission_type: response.data.commission_type || 'platform_fee'
      });
    } catch (error) {
      console.error('Failed to fetch commission settings:', error);
    }
  };

  const handleSaveCommission = async () => {
    if (commissionSettings.global_commission_percentage < 0 || commissionSettings.global_commission_percentage > 50) {
      toast.error('Commission must be between 0% and 50%');
      return;
    }

    setLoading(true);
    try {
      const token = localStorage.getItem('admin_token');
      const response = await axios.put(
        `${API}/admin/commission-settings?new_percentage=${commissionSettings.global_commission_percentage}&commission_type=${commissionSettings.commission_type}`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      toast.success(`✅ ${response.data.message}`);
      toast.info(`🔔 ${response.data.vendors_notified} vendors notified`);
    } catch (error) {
      console.error('Failed to save commission:', error);
      toast.error('Failed to save commission settings');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div data-testid="settings-page">
      <h2 className="text-2xl font-bold mb-6">System Settings</h2>

      <div className="space-y-6">
        {/* Commission/Platform Fee Settings */}
        <Card className="border-2 border-indigo-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="w-5 h-5 text-indigo-600" />
              Commission & Platform Fee
            </CardTitle>
            <CardDescription>
              Set the percentage you deduct from vendor earnings for weekly payouts
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Important Notice */}
            <div className="bg-orange-50 border-2 border-orange-300 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-orange-600 mt-0.5 flex-shrink-0" />
                <div className="space-y-2 text-sm">
                  <p className="font-semibold text-orange-900">How it works:</p>
                  <ul className="list-disc list-inside space-y-1 text-orange-800">
                    <li><strong>Vendor earns:</strong> Total order amount from completed orders</li>
                    <li><strong>Commission deducted:</strong> Earnings × Commission%</li>
                    <li><strong>Net Payout:</strong> Earnings - Commission</li>
                    <li><strong>Example:</strong> ₹10,000 earnings × 5% = ₹500 commission → ₹9,500 payout</li>
                  </ul>
                  <p className="font-semibold text-orange-900 mt-2">⚠️ All vendors will be notified when you change this!</p>
                </div>
              </div>
            </div>

            {/* Commission Type */}
            <div>
              <Label className="text-base font-semibold">Fee Type</Label>
              <Select 
                value={commissionSettings.commission_type} 
                onValueChange={(v) => setCommissionSettings({...commissionSettings, commission_type: v})}
              >
                <SelectTrigger className="mt-2">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="platform_fee">Platform Fee</SelectItem>
                  <SelectItem value="commission">Commission</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-gray-500 mt-1">
                This is just a label - both work the same way
              </p>
            </div>

            {/* Commission Percentage */}
            <div>
              <Label className="text-base font-semibold">Global Percentage (%)</Label>
              <div className="flex items-center gap-4 mt-2">
                <Input
                  type="number"
                  step="0.5"
                  min="0"
                  max="50"
                  value={commissionSettings.global_commission_percentage}
                  onChange={(e) => setCommissionSettings({
                    ...commissionSettings, 
                    global_commission_percentage: parseFloat(e.target.value) || 0
                  })}
                  className="text-2xl font-bold text-center w-32"
                />
                <span className="text-3xl font-bold text-indigo-600">%</span>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Enter a number between 0 and 50 (e.g., 5 for 5%, 7 for 7%)
              </p>
            </div>

            {/* Live Calculation Example */}
            <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-4">
              <h4 className="font-semibold text-indigo-900 mb-3">Example Calculation:</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-700">Vendor Weekly Earnings:</span>
                  <span className="font-semibold">₹10,000</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-700">{commissionSettings.commission_type.replace('_', ' ')} ({commissionSettings.global_commission_percentage}%):</span>
                  <span className="font-semibold text-red-600">- ₹{(10000 * commissionSettings.global_commission_percentage / 100).toFixed(0)}</span>
                </div>
                <div className="flex justify-between pt-2 border-t border-indigo-300">
                  <span className="font-semibold text-indigo-900">Net Payout to Vendor:</span>
                  <span className="font-bold text-green-600 text-lg">₹{(10000 - (10000 * commissionSettings.global_commission_percentage / 100)).toFixed(0)}</span>
                </div>
              </div>
            </div>

            {/* Current Status */}
            <div className="bg-gray-50 p-4 rounded-lg">
              <p className="text-sm font-semibold text-gray-700 mb-2">Current Settings:</p>
              <p className="text-sm text-gray-600">
                Type: <span className="font-semibold">{commissionSettings.commission_type.replace('_', ' ')}</span>
              </p>
              <p className="text-sm text-gray-600">
                Rate: <span className="font-semibold text-xl text-indigo-600">{commissionSettings.global_commission_percentage}%</span>
              </p>
            </div>

            {/* Save Button */}
            <Button 
              onClick={handleSaveCommission} 
              disabled={loading}
              className="w-full bg-indigo-600 text-lg py-6"
            >
              <Save className="w-5 h-5 mr-2" />
              {loading ? 'Saving & Notifying Vendors...' : 'Save & Notify All Vendors'}
            </Button>
          </CardContent>
        </Card>

        {/* Payment Gateway Settings */}
        <Card>
          <CardHeader>
            <CardTitle>Payment Gateway</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>Active Gateway</Label>
              <Select defaultValue="razorpay">
                <SelectTrigger data-testid="gateway-select">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="razorpay">Razorpay</SelectItem>
                  <SelectItem value="payu">PayU</SelectItem>
                  <SelectItem value="paytm">PayTM</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Mode</Label>
              <Select defaultValue="SIMULATED">
                <SelectTrigger data-testid="mode-select">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="SIMULATED">SIMULATED</SelectItem>
                  <SelectItem value="LIVE">LIVE</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default SettingsPage;
