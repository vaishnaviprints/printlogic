import React, { useEffect, useState } from 'react';
import axios from 'axios';
import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const PricingPage = () => {
  const [priceRule, setPriceRule] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPricing();
  }, []);

  const fetchPricing = async () => {
    try {
      const response = await axios.get(`${API}/price-rules/active`);
      setPriceRule(response.data);
    } catch (error) {
      console.error('Failed to fetch pricing:', error);
      toast.error('Failed to load pricing information');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      
      <div className="max-w-6xl mx-auto px-4 py-12" data-testid="pricing-page">
        <h1 className="text-4xl font-bold text-gray-900 mb-2" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
          Pricing
        </h1>
        <p className="text-gray-600 mb-8">Transparent, competitive rates with no hidden charges</p>

        {loading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
          </div>
        ) : priceRule ? (
          <div className="space-y-8">
            {/* Paper Types */}
            <div className="bg-white rounded-lg shadow-sm p-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-6" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
                Paper Types & Rates
              </h2>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b-2 border-gray-200">
                      <th className="text-left py-3 px-4 font-semibold text-gray-700">Paper Type</th>
                      <th className="text-right py-3 px-4 font-semibold text-gray-700">B&W (per page)</th>
                      <th className="text-right py-3 px-4 font-semibold text-gray-700">Color (per page)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {priceRule.paperTypes.map((pt) => (
                      <tr key={pt.id} className="border-b border-gray-100 hover:bg-gray-50">
                        <td className="py-3 px-4 font-medium">{pt.name}</td>
                        <td className="text-right py-3 px-4">₹{pt.perPage_bw.toFixed(2)}</td>
                        <td className="text-right py-3 px-4">₹{pt.perPage_color.toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Additional Services */}
            <div className="grid md:grid-cols-2 gap-6">
              {/* Lamination */}
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h3 className="text-xl font-bold text-gray-900 mb-4" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
                  Lamination
                </h3>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-700">Per Sheet</span>
                    <span className="font-semibold">₹{priceRule.lamination.perSheet.toFixed(2)}</span>
                  </div>
                </div>
              </div>

              {/* Binding */}
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h3 className="text-xl font-bold text-gray-900 mb-4" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
                  Binding Options
                </h3>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-700">Spiral Binding</span>
                    <span className="font-semibold">₹{priceRule.binding.spiral.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-700">Hardcover Binding</span>
                    <span className="font-semibold">₹{priceRule.binding.hardcover.toFixed(2)}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Delivery Charges */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h3 className="text-xl font-bold text-gray-900 mb-4" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
                Delivery Charges
              </h3>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-700">Base Rate</span>
                  <span className="font-semibold">₹{priceRule.deliveryCharge.baseRate.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-700">Per Kilometer</span>
                  <span className="font-semibold">₹{priceRule.deliveryCharge.perKmRate.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-700">Free Delivery Above</span>
                  <span className="font-semibold text-green-600">₹{priceRule.deliveryCharge.freeAbove.toFixed(2)}</span>
                </div>
              </div>
            </div>

            {/* Note */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
              <p className="text-sm text-gray-700">
                <strong>Note:</strong> Prices are effective from {new Date(priceRule.effectiveFrom).toLocaleDateString()}. 
                All prices are in Indian Rupees (INR) and inclusive of GST. Get instant estimates by uploading your files!
              </p>
            </div>
          </div>
        ) : (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
            <p className="text-yellow-800">No active pricing rule found. Please contact support.</p>
          </div>
        )}
      </div>
      
      <Footer />
    </div>
  );
};

export default PricingPage;
