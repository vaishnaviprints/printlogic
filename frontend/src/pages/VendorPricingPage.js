import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';
import { DollarSign, Save, RefreshCw, Home, LogOut, Printer } from 'lucide-react';
import Footer from '@/components/Footer';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const VendorPricingPage = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [pricing, setPricing] = useState({
    enabled: false,
    a4_bw_single: null,
    a4_bw_double: null,
    a4_color_single_below_5: null,
    a4_color_double_below_5: null,
    a4_color_single_5_to_10: null,
    a4_color_double_5_to_10: null,
    a4_color_single_11_plus: null,
    a4_color_double_11_plus: null,
    a3_color_single_below_10: null,
    a3_color_double_below_10: null,
    a3_color_single_above_10: null,
    a3_color_double_above_10: null,
    a3_bw_single_below_10: null,
    a3_bw_double_below_10: null,
    a3_bw_single_above_10: null,
    a3_bw_double_above_10: null,
    spiral_binding_base: null,
    spiral_binding_per_50: null,
    lamination_a4: null,
    lamination_a3: null
  });

  useEffect(() => {
    fetchPricing();
  }, []);

  const fetchPricing = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('vendor_token');
      const response = await axios.get(`${API}/vendor/pricing`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setPricing(response.data);
    } catch (error) {
      console.error('Failed to fetch pricing:', error);
      toast.error('Failed to load pricing');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('vendor_token');
      await axios.put(`${API}/vendor/pricing`, pricing, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success('Pricing updated successfully!');
    } catch (error) {
      console.error('Failed to save pricing:', error);
      toast.error('Failed to save pricing');
    } finally {
      setLoading(false);
    }
  };

  const updatePrice = (field, value) => {
    setPricing({
      ...pricing,
      [field]: value === '' ? null : parseFloat(value)
    });
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
                <h1 className="text-xl font-bold">Vendor Pricing</h1>
                <p className="text-sm text-gray-600">Set your custom pricing</p>
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

      <div className="max-w-6xl mx-auto px-4 py-8 space-y-6">
        {/* Enable/Disable Toggle */}
        <Card className="border-2 border-indigo-200">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-lg mb-1">Custom Pricing</h3>
                <p className="text-sm text-gray-600">
                  {pricing.enabled 
                    ? 'Your custom prices are active. Leave fields empty to use default prices.' 
                    : 'Using default system prices. Enable custom pricing to override.'}
                </p>
              </div>
              <Switch
                checked={pricing.enabled}
                onCheckedChange={(checked) => setPricing({...pricing, enabled: checked})}
                className="scale-125"
              />
            </div>
          </CardContent>
        </Card>

        {pricing.enabled && (
          <>
            {/* A4 Pricing */}
            <Card>
              <CardHeader>
                <CardTitle>A4 Pricing (₹ per page)</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="font-semibold mb-3">Black & White</h4>
                    <div className="space-y-3">
                      <div>
                        <Label className="text-xs">Single Side</Label>
                        <Input
                          type="number"
                          step="0.5"
                          value={pricing.a4_bw_single || ''}
                          onChange={(e) => updatePrice('a4_bw_single', e.target.value)}
                          placeholder="Default: ₹3"
                        />
                      </div>
                      <div>
                        <Label className="text-xs">Double Side</Label>
                        <Input
                          type="number"
                          step="0.5"
                          value={pricing.a4_bw_double || ''}
                          onChange={(e) => updatePrice('a4_bw_double', e.target.value)}
                          placeholder="Default: ₹4"
                        />
                      </div>
                    </div>
                  </div>

                  <div>
                    <h4 className="font-semibold mb-3">Color (Tiered)</h4>
                    <div className="space-y-3">
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <Label className="text-xs">Below 5 - Single</Label>
                          <Input
                            type="number"
                            step="0.5"
                            value={pricing.a4_color_single_below_5 || ''}
                            onChange={(e) => updatePrice('a4_color_single_below_5', e.target.value)}
                            placeholder="₹15"
                          />
                        </div>
                        <div>
                          <Label className="text-xs">Below 5 - Double</Label>
                          <Input
                            type="number"
                            step="0.5"
                            value={pricing.a4_color_double_below_5 || ''}
                            onChange={(e) => updatePrice('a4_color_double_below_5', e.target.value)}
                            placeholder="₹25"
                          />
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <Label className="text-xs">5-10 - Single</Label>
                          <Input
                            type="number"
                            step="0.5"
                            value={pricing.a4_color_single_5_to_10 || ''}
                            onChange={(e) => updatePrice('a4_color_single_5_to_10', e.target.value)}
                            placeholder="₹12"
                          />
                        </div>
                        <div>
                          <Label className="text-xs">5-10 - Double</Label>
                          <Input
                            type="number"
                            step="0.5"
                            value={pricing.a4_color_double_5_to_10 || ''}
                            onChange={(e) => updatePrice('a4_color_double_5_to_10', e.target.value)}
                            placeholder="₹20"
                          />
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <Label className="text-xs">11+ - Single</Label>
                          <Input
                            type="number"
                            step="0.5"
                            value={pricing.a4_color_single_11_plus || ''}
                            onChange={(e) => updatePrice('a4_color_single_11_plus', e.target.value)}
                            placeholder="₹10"
                          />
                        </div>
                        <div>
                          <Label className="text-xs">11+ - Double</Label>
                          <Input
                            type="number"
                            step="0.5"
                            value={pricing.a4_color_double_11_plus || ''}
                            onChange={(e) => updatePrice('a4_color_double_11_plus', e.target.value)}
                            placeholder="₹20"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* A3 Pricing */}
            <Card>
              <CardHeader>
                <CardTitle>A3 Pricing (₹ per page)</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="font-semibold mb-3">Black & White</h4>
                    <div className="space-y-3">
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <Label className="text-xs">≤10 - Single</Label>
                          <Input
                            type="number"
                            step="0.5"
                            value={pricing.a3_bw_single_below_10 || ''}
                            onChange={(e) => updatePrice('a3_bw_single_below_10', e.target.value)}
                            placeholder="₹8"
                          />
                        </div>
                        <div>
                          <Label className="text-xs">≤10 - Double</Label>
                          <Input
                            type="number"
                            step="0.5"
                            value={pricing.a3_bw_double_below_10 || ''}
                            onChange={(e) => updatePrice('a3_bw_double_below_10', e.target.value)}
                            placeholder="₹12"
                          />
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <Label className="text-xs">>10 - Single</Label>
                          <Input
                            type="number"
                            step="0.5"
                            value={pricing.a3_bw_single_above_10 || ''}
                            onChange={(e) => updatePrice('a3_bw_single_above_10', e.target.value)}
                            placeholder="₹6"
                          />
                        </div>
                        <div>
                          <Label className="text-xs">>10 - Double</Label>
                          <Input
                            type="number"
                            step="0.5"
                            value={pricing.a3_bw_double_above_10 || ''}
                            onChange={(e) => updatePrice('a3_bw_double_above_10', e.target.value)}
                            placeholder="₹10"
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h4 className="font-semibold mb-3">Color</h4>
                    <div className="space-y-3">
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <Label className="text-xs">≤10 - Single</Label>
                          <Input
                            type="number"
                            step="0.5"
                            value={pricing.a3_color_single_below_10 || ''}
                            onChange={(e) => updatePrice('a3_color_single_below_10', e.target.value)}
                            placeholder="₹30"
                          />
                        </div>
                        <div>
                          <Label className="text-xs">≤10 - Double</Label>
                          <Input
                            type="number"
                            step="0.5"
                            value={pricing.a3_color_double_below_10 || ''}
                            onChange={(e) => updatePrice('a3_color_double_below_10', e.target.value)}
                            placeholder="₹40"
                          />
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <Label className="text-xs">>10 - Single</Label>
                          <Input
                            type="number"
                            step="0.5"
                            value={pricing.a3_color_single_above_10 || ''}
                            onChange={(e) => updatePrice('a3_color_single_above_10', e.target.value)}
                            placeholder="₹25"
                          />
                        </div>
                        <div>
                          <Label className="text-xs">>10 - Double</Label>
                          <Input
                            type="number"
                            step="0.5"
                            value={pricing.a3_color_double_above_10 || ''}
                            onChange={(e) => updatePrice('a3_color_double_above_10', e.target.value)}
                            placeholder="₹35"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Binding & Lamination */}
            <Card>
              <CardHeader>
                <CardTitle>Binding & Lamination (₹)</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="font-semibold mb-3">Spiral Binding</h4>
                    <div className="space-y-3">
                      <div>
                        <Label className="text-xs">Base Price (up to 50 pages)</Label>
                        <Input
                          type="number"
                          step="1"
                          value={pricing.spiral_binding_base || ''}
                          onChange={(e) => updatePrice('spiral_binding_base', e.target.value)}
                          placeholder="₹50"
                        />
                      </div>
                      <div>
                        <Label className="text-xs">Per 50 Pages Additional</Label>
                        <Input
                          type="number"
                          step="1"
                          value={pricing.spiral_binding_per_50 || ''}
                          onChange={(e) => updatePrice('spiral_binding_per_50', e.target.value)}
                          placeholder="₹20"
                        />
                      </div>
                    </div>
                  </div>

                  <div>
                    <h4 className="font-semibold mb-3">Lamination (per sheet)</h4>
                    <div className="space-y-3">
                      <div>
                        <Label className="text-xs">A4 Lamination</Label>
                        <Input
                          type="number"
                          step="1"
                          value={pricing.lamination_a4 || ''}
                          onChange={(e) => updatePrice('lamination_a4', e.target.value)}
                          placeholder="₹40"
                        />
                      </div>
                      <div>
                        <Label className="text-xs">A3 Lamination</Label>
                        <Input
                          type="number"
                          step="1"
                          value={pricing.lamination_a3 || ''}
                          onChange={(e) => updatePrice('lamination_a3', e.target.value)}
                          placeholder="₹60"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Save Button */}
            <div className="flex justify-end gap-3">
              <Button variant="outline" onClick={fetchPricing} disabled={loading}>
                <RefreshCw className="w-4 h-4 mr-2" />
                Reset
              </Button>
              <Button onClick={handleSave} disabled={loading} className="bg-indigo-600">
                <Save className="w-4 h-4 mr-2" />
                Save Pricing
              </Button>
            </div>
          </>
        )}
      </div>

      <Footer />
    </div>
  );
};

export default VendorPricingPage;
