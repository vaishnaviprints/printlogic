import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { RefreshCw, Edit, Plus, Trash2, Save } from 'lucide-react';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const PricingPage = () => {
  const [rules, setRules] = useState([]);
  const [loading, setLoading] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editingRule, setEditingRule] = useState(null);
  const [editForm, setEditForm] = useState({});

  useEffect(() => {
    fetchRules();
  }, []);

  const fetchRules = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`${API}/price-rules`);
      setRules(response.data);
    } catch (error) {
      console.error('Failed to fetch rules:', error);
      toast.error('Failed to load pricing rules');
    } finally {
      setLoading(false);
    }
  };

  const handleEditClick = (rule) => {
    setEditingRule(rule);
    setEditForm(JSON.parse(JSON.stringify(rule))); // Deep copy
    setEditDialogOpen(true);
  };

  const handleSaveRule = async () => {
    try {
      const token = localStorage.getItem('admin_token');
      await axios.put(
        `${API}/admin/pricing/${editForm.id}`,
        editForm,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      toast.success('Pricing updated successfully');
      setEditDialogOpen(false);
      fetchRules();
    } catch (error) {
      console.error('Failed to update pricing:', error);
      toast.error('Failed to update pricing');
    }
  };

  const updatePaperType = (index, field, value) => {
    const newPaperTypes = [...editForm.paperTypes];
    newPaperTypes[index][field] = parseFloat(value) || 0;
    setEditForm({ ...editForm, paperTypes: newPaperTypes });
  };

  const addPaperType = () => {
    const newPaperTypes = [
      ...editForm.paperTypes,
      {
        id: `custom_${Date.now()}`,
        name: 'New Paper Type',
        perPage_bw: 0,
        perPage_color: 0
      }
    ];
    setEditForm({ ...editForm, paperTypes: newPaperTypes });
  };

  const removePaperType = (index) => {
    const newPaperTypes = editForm.paperTypes.filter((_, i) => i !== index);
    setEditForm({ ...editForm, paperTypes: newPaperTypes });
  };

  const updateBinding = (key, value) => {
    setEditForm({
      ...editForm,
      binding: {
        ...editForm.binding,
        [key]: parseFloat(value) || 0
      }
    });
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold">Pricing Rules</h2>
          <p className="text-gray-600">Manage pricing for printing services</p>
        </div>
        <Button onClick={fetchRules} disabled={loading} variant="outline">
          <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      <div className="space-y-6">
        {rules.map((rule) => (
          <Card key={rule.id}>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle>{rule.name}</CardTitle>
                  <p className="text-sm text-gray-500 mt-1">
                    {rule.active ? (
                      <span className="text-green-600 font-medium">✓ Active</span>
                    ) : (
                      <span className="text-gray-400">Inactive</span>
                    )}
                  </p>
                </div>
                <Button onClick={() => handleEditClick(rule)} size="sm" className="bg-indigo-600">
                  <Edit className="w-4 h-4 mr-2" />
                  Edit Pricing
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-medium mb-3">Paper Types</h4>
                  <div className="space-y-2">
                    {rule.paperTypes.map((pt) => (
                      <div key={pt.id} className="text-sm bg-gray-50 p-3 rounded">
                        <div className="font-medium text-gray-900">{pt.name}</div>
                        <div className="text-gray-600 mt-1">
                          B&W: <span className="font-semibold text-gray-900">₹{pt.perPage_bw}</span> | 
                          Color: <span className="font-semibold text-gray-900">₹{pt.perPage_color}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <h4 className="font-medium mb-3">Additional Services</h4>
                  <div className="space-y-2 text-sm">
                    <div className="bg-gray-50 p-3 rounded">
                      <span className="font-medium">Lamination:</span> 
                      <span className="ml-2 font-semibold text-gray-900">₹{rule.lamination.perSheet}/sheet</span>
                    </div>
                    <div className="bg-gray-50 p-3 rounded">
                      <span className="font-medium">Spiral Binding:</span> 
                      <span className="ml-2 font-semibold text-gray-900">₹{rule.binding.spiral}</span>
                    </div>
                    <div className="bg-gray-50 p-3 rounded">
                      <span className="font-medium">Hardcover:</span> 
                      <span className="ml-2 font-semibold text-gray-900">₹{rule.binding.hardcover}</span>
                    </div>
                    <div className="bg-gray-50 p-3 rounded">
                      <span className="font-medium">Delivery Base:</span> 
                      <span className="ml-2 font-semibold text-gray-900">₹{rule.deliveryCharge.baseRate}</span>
                    </div>
                    <div className="bg-gray-50 p-3 rounded">
                      <span className="font-medium">Per KM:</span> 
                      <span className="ml-2 font-semibold text-gray-900">₹{rule.deliveryCharge.perKmRate}/km</span>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Edit Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Pricing Rule</DialogTitle>
          </DialogHeader>
          {editForm.paperTypes && (
            <div className="space-y-6">
              {/* Paper Types */}
              <div>
                <div className="flex justify-between items-center mb-3">
                  <h4 className="font-semibold">Paper Types</h4>
                  <Button onClick={addPaperType} size="sm" variant="outline">
                    <Plus className="w-4 h-4 mr-1" />
                    Add Paper Type
                  </Button>
                </div>
                <div className="space-y-3">
                  {editForm.paperTypes.map((pt, index) => (
                    <Card key={index}>
                      <CardContent className="pt-4">
                        <div className="flex gap-3 items-start">
                          <div className="flex-1 grid grid-cols-3 gap-3">
                            <div>
                              <Label className="text-xs">Name</Label>
                              <Input
                                value={pt.name}
                                onChange={(e) => {
                                  const newPaperTypes = [...editForm.paperTypes];
                                  newPaperTypes[index].name = e.target.value;
                                  setEditForm({ ...editForm, paperTypes: newPaperTypes });
                                }}
                                placeholder="Paper name"
                              />
                            </div>
                            <div>
                              <Label className="text-xs">B&W Price (₹)</Label>
                              <Input
                                type="number"
                                step="0.1"
                                value={pt.perPage_bw}
                                onChange={(e) => updatePaperType(index, 'perPage_bw', e.target.value)}
                              />
                            </div>
                            <div>
                              <Label className="text-xs">Color Price (₹)</Label>
                              <Input
                                type="number"
                                step="0.1"
                                value={pt.perPage_color}
                                onChange={(e) => updatePaperType(index, 'perPage_color', e.target.value)}
                              />
                            </div>
                          </div>
                          <Button
                            onClick={() => removePaperType(index)}
                            size="sm"
                            variant="ghost"
                            className="text-red-600 mt-5"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>

              {/* Binding */}
              <div>
                <h4 className="font-semibold mb-3">Binding Prices</h4>
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <Label>Spiral Binding (₹)</Label>
                    <Input
                      type="number"
                      step="1"
                      value={editForm.binding?.spiral || 0}
                      onChange={(e) => updateBinding('spiral', e.target.value)}
                    />
                  </div>
                  <div>
                    <Label>Hardcover (₹)</Label>
                    <Input
                      type="number"
                      step="1"
                      value={editForm.binding?.hardcover || 0}
                      onChange={(e) => updateBinding('hardcover', e.target.value)}
                    />
                  </div>
                  <div>
                    <Label>No Binding (₹)</Label>
                    <Input
                      type="number"
                      step="1"
                      value={editForm.binding?.none || 0}
                      disabled
                    />
                  </div>
                </div>
              </div>

              {/* Lamination */}
              <div>
                <h4 className="font-semibold mb-3">Lamination</h4>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label>Per Sheet (₹)</Label>
                    <Input
                      type="number"
                      step="1"
                      value={editForm.lamination?.perSheet || 0}
                      onChange={(e) => setEditForm({
                        ...editForm,
                        lamination: { perSheet: parseFloat(e.target.value) || 0 }
                      })}
                    />
                  </div>
                </div>
              </div>

              {/* Delivery */}
              <div>
                <h4 className="font-semibold mb-3">Delivery Charges</h4>
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <Label>Base Rate (₹)</Label>
                    <Input
                      type="number"
                      step="1"
                      value={editForm.deliveryCharge?.baseRate || 0}
                      onChange={(e) => setEditForm({
                        ...editForm,
                        deliveryCharge: {
                          ...editForm.deliveryCharge,
                          baseRate: parseFloat(e.target.value) || 0
                        }
                      })}
                    />
                  </div>
                  <div>
                    <Label>Per KM (₹)</Label>
                    <Input
                      type="number"
                      step="1"
                      value={editForm.deliveryCharge?.perKmRate || 0}
                      onChange={(e) => setEditForm({
                        ...editForm,
                        deliveryCharge: {
                          ...editForm.deliveryCharge,
                          perKmRate: parseFloat(e.target.value) || 0
                        }
                      })}
                    />
                  </div>
                  <div>
                    <Label>Free Above (₹)</Label>
                    <Input
                      type="number"
                      step="1"
                      value={editForm.deliveryCharge?.freeAbove || 0}
                      onChange={(e) => setEditForm({
                        ...editForm,
                        deliveryCharge: {
                          ...editForm.deliveryCharge,
                          freeAbove: parseFloat(e.target.value) || 0
                        }
                      })}
                    />
                  </div>
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleSaveRule} className="bg-indigo-600">
              <Save className="w-4 h-4 mr-2" />
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default PricingPage;
