import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { RefreshCw, Save, AlertCircle } from 'lucide-react';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const PricingPage = () => {
  const [loading, setLoading] = useState(false);
  const [rules, setRules] = useState([]);
  const [activeRule, setActiveRule] = useState(null);
  const [editForm, setEditForm] = useState({
    id: '',
    name: '',
    active: true,
    paperTypes: [],
    binding: {},
    lamination: {},
    deliveryCharge: {}
  });

  useEffect(() => {
    fetchRules();
  }, []);

  const fetchRules = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`${API}/price-rules`);
      setRules(response.data);
      
      // Find active rule
      const active = response.data.find(r => r.active);
      if (active) {
        setActiveRule(active);
        setEditForm(JSON.parse(JSON.stringify(active))); // Deep copy
      }
    } catch (error) {
      console.error('Failed to fetch rules:', error);
      toast.error('Failed to load pricing rules');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!editForm.id) {
      toast.error('No pricing rule selected');
      return;
    }

    setLoading(true);
    try {
      const token = localStorage.getItem('admin_token');
      await axios.put(
        `${API}/admin/pricing/${editForm.id}`,
        editForm,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      toast.success('Global pricing updated successfully! ✅');
      fetchRules();
    } catch (error) {
      console.error('Failed to save pricing:', error);
      toast.error('Failed to save pricing');
    } finally {
      setLoading(false);
    }
  };

  const updatePaperType = (index, field, value) => {
    const newPaperTypes = [...editForm.paperTypes];
    if (field === 'name') {
      newPaperTypes[index][field] = value;
    } else {
      newPaperTypes[index][field] = parseFloat(value) || 0;
    }
    setEditForm({ ...editForm, paperTypes: newPaperTypes });
  };

  const addPaperType = () => {
    const newPaperTypes = [
      ...editForm.paperTypes,
      {
        id: `paper_${Date.now()}`,
        name: 'New Paper Type',
        perPage_bw: 0,
        perPage_color: 0
      }
    ];
    setEditForm({ ...editForm, paperTypes: newPaperTypes });
  };

  const removePaperType = (index) => {
    if (editForm.paperTypes.length <= 1) {
      toast.error('Cannot remove last paper type');
      return;
    }
    const newPaperTypes = editForm.paperTypes.filter((_, i) => i !== index);
    setEditForm({ ...editForm, paperTypes: newPaperTypes });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Global Pricing Management</h2>
          <p className="text-gray-600">
            Set default prices for all orders. Vendors can override these for their stores.
          </p>
        </div>
        <div className="flex gap-2">
          <Button onClick={fetchRules} disabled={loading} variant="outline">
            <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button onClick={handleSave} disabled={loading || !editForm.id} className="bg-indigo-600">
            <Save className="w-4 h-4 mr-2" />
            Save Global Pricing
          </Button>
        </div>
      </div>

      {/* Global Pricing Notice */}
      <Card className="border-2 border-blue-200 bg-blue-50">
        <CardContent className="pt-4">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-blue-600 mt-0.5" />
            <div>
              <h4 className="font-semibold text-blue-900 mb-1">Global Pricing</h4>
              <p className="text-sm text-blue-800">
                These prices apply to ALL customers and vendors by default. 
                Individual vendors can override these prices for their specific store.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {!activeRule ? (
        <Card>
          <CardContent className="text-center py-8">
            <p className="text-gray-600">Loading pricing...</p>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* A4 Pricing */}
          <Card>
            <CardHeader>
              <CardTitle>A4 Pricing (₹ per page)</CardTitle>
              <p className="text-sm text-gray-600">Standard A4 size paper pricing</p>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 gap-6">
                {/* B&W */}
                <div className="space-y-4">
                  <h4 className="font-semibold text-lg">Black & White (70 GSM)</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Single Side</Label>
                      <Input
                        type="number"
                        step="0.5"
                        value={editForm.paperTypes[0]?.perPage_bw || 0}
                        onChange={(e) => updatePaperType(0, 'perPage_bw', e.target.value)}
                        className="font-semibold"
                      />
                      <p className="text-xs text-gray-500 mt-1">Default: ₹3</p>
                    </div>
                    <div>
                      <Label>Double Side</Label>
                      <Input
                        type="number"
                        step="0.5"
                        value={editForm.paperTypes[1]?.perPage_bw || 0}
                        onChange={(e) => updatePaperType(1, 'perPage_bw', e.target.value)}
                        className="font-semibold"
                      />
                      <p className="text-xs text-gray-500 mt-1">Default: ₹4</p>
                    </div>
                  </div>
                </div>

                {/* Color - Tiered */}
                <div className="space-y-4">
                  <h4 className="font-semibold text-lg">Color (100 GSM) - Tiered Pricing</h4>
                  
                  {/* Below 5 pages */}
                  <div className="bg-orange-50 p-3 rounded-lg border border-orange-200">
                    <p className="text-xs font-semibold text-orange-800 mb-2">Below 5 Pages</p>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <Label className="text-xs">Single</Label>
                        <Input
                          type="number"
                          step="0.5"
                          value={15} // Hardcoded for now, add to paperTypes if needed
                          className="font-semibold"
                          placeholder="₹15"
                        />
                      </div>
                      <div>
                        <Label className="text-xs">Double</Label>
                        <Input
                          type="number"
                          step="0.5"
                          value={25}
                          className="font-semibold"
                          placeholder="₹25"
                        />
                      </div>
                    </div>
                  </div>

                  {/* 5-10 pages */}
                  <div className="bg-yellow-50 p-3 rounded-lg border border-yellow-200">
                    <p className="text-xs font-semibold text-yellow-800 mb-2">5-10 Pages</p>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <Label className="text-xs">Single</Label>
                        <Input
                          type="number"
                          step="0.5"
                          value={12}
                          className="font-semibold"
                          placeholder="₹12"
                        />
                      </div>
                      <div>
                        <Label className="text-xs">Double</Label>
                        <Input
                          type="number"
                          step="0.5"
                          value={20}
                          className="font-semibold"
                          placeholder="₹20"
                        />
                      </div>
                    </div>
                  </div>

                  {/* 11+ pages */}
                  <div className="bg-green-50 p-3 rounded-lg border border-green-200">
                    <p className="text-xs font-semibold text-green-800 mb-2">11+ Pages</p>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <Label className="text-xs">Single</Label>
                        <Input
                          type="number"
                          step="0.5"
                          value={editForm.paperTypes[0]?.perPage_color || 0}
                          onChange={(e) => updatePaperType(0, 'perPage_color', e.target.value)}
                          className="font-semibold"
                        />
                        <p className="text-xs text-gray-500">Default: ₹10</p>
                      </div>
                      <div>
                        <Label className="text-xs">Double</Label>
                        <Input
                          type="number"
                          step="0.5"
                          value={editForm.paperTypes[1]?.perPage_color || 0}
                          onChange={(e) => updatePaperType(1, 'perPage_color', e.target.value)}
                          className="font-semibold"
                        />
                        <p className="text-xs text-gray-500">Default: ₹20</p>
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
              <p className="text-sm text-gray-600">Large format A3 size pricing</p>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 gap-6">
                {/* A3 B&W */}
                <div className="space-y-4">
                  <h4 className="font-semibold text-lg">Black & White</h4>
                  
                  <div className="bg-blue-50 p-3 rounded-lg border border-blue-200">
                    <p className="text-xs font-semibold text-blue-800 mb-2">≤10 Pages</p>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <Label className="text-xs">Single</Label>
                        <Input
                          type="number"
                          step="0.5"
                          defaultValue={8}
                          className="font-semibold"
                        />
                        <p className="text-xs text-gray-500">₹8</p>
                      </div>
                      <div>
                        <Label className="text-xs">Double</Label>
                        <Input
                          type="number"
                          step="0.5"
                          defaultValue={12}
                          className="font-semibold"
                        />
                        <p className="text-xs text-gray-500">₹12</p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-green-50 p-3 rounded-lg border border-green-200">
                    <p className="text-xs font-semibold text-green-800 mb-2">>10 Pages</p>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <Label className="text-xs">Single</Label>
                        <Input
                          type="number"
                          step="0.5"
                          defaultValue={6}
                          className="font-semibold"
                        />
                        <p className="text-xs text-gray-500">₹6</p>
                      </div>
                      <div>
                        <Label className="text-xs">Double</Label>
                        <Input
                          type="number"
                          step="0.5"
                          defaultValue={10}
                          className="font-semibold"
                        />
                        <p className="text-xs text-gray-500">₹10</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* A3 Color */}
                <div className="space-y-4">
                  <h4 className="font-semibold text-lg">Color</h4>
                  
                  <div className="bg-purple-50 p-3 rounded-lg border border-purple-200">
                    <p className="text-xs font-semibold text-purple-800 mb-2">≤10 Pages</p>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <Label className="text-xs">Single</Label>
                        <Input
                          type="number"
                          step="0.5"
                          defaultValue={30}
                          className="font-semibold"
                        />
                        <p className="text-xs text-gray-500">₹30</p>
                      </div>
                      <div>
                        <Label className="text-xs">Double</Label>
                        <Input
                          type="number"
                          step="0.5"
                          defaultValue={40}
                          className="font-semibold"
                        />
                        <p className="text-xs text-gray-500">₹40</p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-indigo-50 p-3 rounded-lg border border-indigo-200">
                    <p className="text-xs font-semibold text-indigo-800 mb-2">>10 Pages</p>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <Label className="text-xs">Single</Label>
                        <Input
                          type="number"
                          step="0.5"
                          defaultValue={25}
                          className="font-semibold"
                        />
                        <p className="text-xs text-gray-500">₹25</p>
                      </div>
                      <div>
                        <Label className="text-xs">Double</Label>
                        <Input
                          type="number"
                          step="0.5"
                          defaultValue={35}
                          className="font-semibold"
                        />
                        <p className="text-xs text-gray-500">₹35</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Binding */}
          <Card>
            <CardHeader>
              <CardTitle>Binding Prices (₹)</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-3 gap-4">
                <div>
                  <Label>Spiral Binding</Label>
                  <Input
                    type="number"
                    step="1"
                    value={editForm.binding?.spiral || 0}
                    onChange={(e) => setEditForm({
                      ...editForm,
                      binding: { ...editForm.binding, spiral: parseFloat(e.target.value) || 0 }
                    })}
                    className="font-semibold text-lg"
                  />
                  <p className="text-xs text-gray-500 mt-1">Base: ₹50 (up to 50 pages) + ₹20 per 50 pages</p>
                </div>
                <div>
                  <Label>Hard Binding</Label>
                  <Input
                    type="number"
                    step="1"
                    value={editForm.binding?.hardcover || 0}
                    onChange={(e) => setEditForm({
                      ...editForm,
                      binding: { ...editForm.binding, hardcover: parseFloat(e.target.value) || 0 }
                    })}
                    className="font-semibold text-lg"
                  />
                  <p className="text-xs text-gray-500 mt-1">Default: ₹250</p>
                </div>
                <div>
                  <Label>No Binding</Label>
                  <Input
                    type="number"
                    value={0}
                    disabled
                    className="font-semibold text-lg"
                  />
                  <p className="text-xs text-gray-500 mt-1">Always ₹0</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Lamination */}
          <Card>
            <CardHeader>
              <CardTitle>Lamination (₹ per sheet)</CardTitle>
              <p className="text-sm text-gray-600">Certificate-quality lamination pricing</p>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <Label>A4 Lamination</Label>
                  <Input
                    type="number"
                    step="1"
                    value={40}
                    className="font-semibold text-lg"
                  />
                  <p className="text-xs text-gray-500 mt-1">₹40 per sheet</p>
                </div>
                <div>
                  <Label>A3 Lamination</Label>
                  <Input
                    type="number"
                    step="1"
                    value={60}
                    className="font-semibold text-lg"
                  />
                  <p className="text-xs text-gray-500 mt-1">₹60 per sheet</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Delivery */}
          <Card>
            <CardHeader>
              <CardTitle>Delivery Charges (₹)</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-3 gap-4">
                <div>
                  <Label>Base Rate</Label>
                  <Input
                    type="number"
                    step="1"
                    value={editForm.deliveryCharge?.baseRate || 0}
                    onChange={(e) => setEditForm({
                      ...editForm,
                      deliveryCharge: { ...editForm.deliveryCharge, baseRate: parseFloat(e.target.value) || 0 }
                    })}
                    className="font-semibold text-lg"
                  />
                  <p className="text-xs text-gray-500 mt-1">Flat delivery fee</p>
                </div>
                <div>
                  <Label>Per KM Rate</Label>
                  <Input
                    type="number"
                    step="1"
                    value={editForm.deliveryCharge?.perKmRate || 0}
                    onChange={(e) => setEditForm({
                      ...editForm,
                      deliveryCharge: { ...editForm.deliveryCharge, perKmRate: parseFloat(e.target.value) || 0 }
                    })}
                    className="font-semibold text-lg"
                  />
                  <p className="text-xs text-gray-500 mt-1">Additional per km</p>
                </div>
                <div>
                  <Label>Free Above</Label>
                  <Input
                    type="number"
                    step="1"
                    value={editForm.deliveryCharge?.freeAbove || 0}
                    onChange={(e) => setEditForm({
                      ...editForm,
                      deliveryCharge: { ...editForm.deliveryCharge, freeAbove: parseFloat(e.target.value) || 0 }
                    })}
                    className="font-semibold text-lg"
                  />
                  <p className="text-xs text-gray-500 mt-1">Free if order above this</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Save Button */}
          <div className="flex justify-end gap-3 pt-4">
            <Button variant="outline" onClick={fetchRules} disabled={loading}>
              <RefreshCw className="w-4 h-4 mr-2" />
              Reset to Current
            </Button>
            <Button onClick={handleSave} disabled={loading} className="bg-indigo-600 text-lg px-8 py-6">
              <Save className="w-5 h-5 mr-2" />
              Save Global Pricing
            </Button>
          </div>
        </>
      )}
    </div>
  );
};

export default PricingPage;
