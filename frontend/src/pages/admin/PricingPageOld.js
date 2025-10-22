import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { RefreshCw, Edit } from 'lucide-react';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const PricingPage = () => {
  const [rules, setRules] = useState([]);
  const [loading, setLoading] = useState(false);
  const [editingRule, setEditingRule] = useState(null);

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

  return (
    <div data-testid="pricing-page">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
          Pricing Rules
        </h2>
        <Button onClick={fetchRules} disabled={loading} variant="outline" data-testid="refresh-pricing-btn">
          <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      <div className="space-y-6">
        {rules.map((rule) => (
          <div key={rule.id} className="bg-white rounded-lg shadow p-6" data-testid={`price-rule-${rule.id}`}>
            <div className="flex items-start justify-between mb-4">
              <div>
                <h3 className="text-lg font-semibold">{rule.name}</h3>
                <p className="text-sm text-gray-500">
                  {rule.active ? (
                    <span className="text-green-600 font-medium">Active</span>
                  ) : (
                    <span className="text-gray-400">Inactive</span>
                  )}
                </p>
              </div>
              <Button variant="outline" size="sm" data-testid={`edit-rule-${rule.id}`}>
                <Edit className="w-4 h-4 mr-2" />
                Edit
              </Button>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <h4 className="font-medium mb-2">Paper Types</h4>
                <div className="space-y-2">
                  {rule.paperTypes.map((pt) => (
                    <div key={pt.id} className="text-sm bg-gray-50 p-2 rounded">
                      <div className="font-medium">{pt.name}</div>
                      <div className="text-gray-600">
                        B&W: ₹{pt.perPage_bw} | Color: ₹{pt.perPage_color}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <h4 className="font-medium mb-2">Additional Services</h4>
                <div className="space-y-2 text-sm">
                  <div className="bg-gray-50 p-2 rounded">
                    <span className="font-medium">Lamination:</span> ₹{rule.lamination.perSheet}/sheet
                  </div>
                  <div className="bg-gray-50 p-2 rounded">
                    <span className="font-medium">Spiral Binding:</span> ₹{rule.binding.spiral}
                  </div>
                  <div className="bg-gray-50 p-2 rounded">
                    <span className="font-medium">Hardcover:</span> ₹{rule.binding.hardcover}
                  </div>
                  <div className="bg-gray-50 p-2 rounded">
                    <span className="font-medium">Delivery Base:</span> ₹{rule.deliveryCharge.baseRate}
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default PricingPage;
