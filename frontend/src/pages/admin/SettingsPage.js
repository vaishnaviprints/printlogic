import React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';

const SettingsPage = () => {
  const handleSave = () => {
    toast.success('Settings saved (SIMULATED)');
  };

  return (
    <div data-testid="settings-page">
      <h2 className="text-2xl font-bold mb-6" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
        System Settings
      </h2>

      <div className="space-y-6">
        {/* Payment Gateway Settings */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold mb-4">Payment Gateway</h3>
          <div className="space-y-4">
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
          </div>
        </div>

        {/* Notification Settings */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold mb-4">Notifications</h3>
          <div className="space-y-4">
            <div>
              <Label>WhatsApp Mode</Label>
              <Select defaultValue="SIMULATED">
                <SelectTrigger data-testid="whatsapp-mode-select">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="SIMULATED">SIMULATED</SelectItem>
                  <SelectItem value="LIVE">LIVE</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Email Mode</Label>
              <Select defaultValue="SIMULATED">
                <SelectTrigger data-testid="email-mode-select">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="SIMULATED">SIMULATED</SelectItem>
                  <SelectItem value="LIVE">LIVE</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        <Button onClick={handleSave} className="bg-indigo-600 hover:bg-indigo-700" data-testid="save-settings-btn">
          Save Settings
        </Button>
      </div>
    </div>
  );
};

export default SettingsPage;
