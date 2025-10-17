import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { RefreshCw, MapPin, Phone, Mail } from 'lucide-react';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const VendorsPage = () => {
  const [vendors, setVendors] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchVendors();
  }, []);

  const fetchVendors = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`${API}/vendors`);
      setVendors(response.data);
    } catch (error) {
      console.error('Failed to fetch vendors:', error);
      toast.error('Failed to load vendors');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div data-testid="vendors-page">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
          Vendors & Stores
        </h2>
        <Button onClick={fetchVendors} disabled={loading} variant="outline" data-testid="refresh-vendors-btn">
          <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {vendors.map((vendor) => (
          <div
            key={vendor.id}
            className="bg-white rounded-lg shadow p-6 border border-gray-100"
            data-testid={`vendor-card-${vendor.id}`}
          >
            <div className="flex items-start justify-between mb-4">
              <div>
                <h3 className="text-lg font-semibold">{vendor.name}</h3>
                <p className="text-sm text-gray-500">
                  {vendor.is_active ? (
                    <span className="text-green-600 font-medium">Active</span>
                  ) : (
                    <span className="text-red-600 font-medium">Inactive</span>
                  )}
                </p>
              </div>
            </div>

            <div className="space-y-2 text-sm">
              <div className="flex items-start gap-2">
                <MapPin className="w-4 h-4 text-gray-400 mt-0.5" />
                <div>
                  <div>{vendor.location.address}</div>
                  <div className="text-gray-500">{vendor.location.city}, {vendor.location.pincode}</div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Phone className="w-4 h-4 text-gray-400" />
                <span>{vendor.contact_phone}</span>
              </div>
              <div className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-gray-400" />
                <span>{vendor.contact_email}</span>
              </div>
              <div className="mt-3 pt-3 border-t">
                <span className="text-gray-600">Auto-accept radius:</span>
                <span className="font-medium ml-2">{vendor.autoAcceptRadiusKm} km</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default VendorsPage;
