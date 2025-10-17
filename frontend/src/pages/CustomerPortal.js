import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { toast } from 'sonner';
import { Upload, Calculator, CreditCard, Printer, MapPin, Package } from 'lucide-react';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const CustomerPortal = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('upload');
  const [priceRule, setPriceRule] = useState(null);
  
  // Form states
  const [customerName, setCustomerName] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [files, setFiles] = useState([]);
  const [fulfillmentType, setFulfillmentType] = useState('Pickup');
  const [estimate, setEstimate] = useState(null);
  const [orderId, setOrderId] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchPriceRule();
  }, []);

  const fetchPriceRule = async () => {
    try {
      const response = await axios.get(`${API}/price-rules/active`);
      setPriceRule(response.data);
    } catch (error) {
      console.error('Failed to fetch price rule:', error);
      toast.error('Failed to load pricing');
    }
  };

  const handleFileChange = (e) => {
    const selectedFiles = Array.from(e.target.files);
    const newFiles = selectedFiles.map(file => ({
      file,
      name: file.name,
      numPages: 10, // Would be extracted from PDF in real implementation
      numCopies: 1,
      paperType: 'a4_70gsm',
      isColor: false,
      laminationSheets: 0,
      bindingType: 'none'
    }));
    setFiles([...files, ...newFiles]);
    toast.success(`${selectedFiles.length} file(s) added`);
  };

  const updateFile = (index, field, value) => {
    const updated = [...files];
    updated[index][field] = value;
    setFiles(updated);
  };

  const removeFile = (index) => {
    const updated = files.filter((_, i) => i !== index);
    setFiles(updated);
    toast.info('File removed');
  };

  const calculateEstimate = async () => {
    if (files.length === 0) {
      toast.error('Please upload at least one file');
      return;
    }

    if (!customerName || !customerEmail || !customerPhone) {
      toast.error('Please fill in your contact information');
      return;
    }

    setLoading(true);
    try {
      const items = files.map(f => ({
        file_url: `simulated://${f.name}`,
        file_name: f.name,
        num_pages: f.numPages,
        num_copies: f.numCopies,
        paper_type_id: f.paperType,
        is_color: f.isColor,
        lamination_sheets: f.laminationSheets,
        binding_type: f.bindingType,
        perPagePriceApplied: 0,
        itemSubtotal: 0
      }));

      const payload = {
        items,
        fulfillment_type: fulfillmentType,
        customer_location: fulfillmentType === 'Delivery' ? {
          latitude: 12.9716,
          longitude: 77.5946,
          address: 'Customer Address',
          city: 'Bangalore',
          pincode: '560001'
        } : null
      };

      const response = await axios.post(`${API}/calculate-estimate`, payload);
      setEstimate(response.data);
      
      // Auto-navigate to Estimation tab
      setActiveTab('estimate');
      toast.success('Estimate calculated!');
    } catch (error) {
      console.error('Estimate calculation error:', error);
      toast.error('Failed to calculate estimate');
    } finally {
      setLoading(false);
    }
  };

  const createOrder = async () => {
    if (!estimate) {
      toast.error('Please calculate estimate first');
      return;
    }

    setLoading(true);
    try {
      const items = files.map((f, idx) => ({
        file_url: `simulated://${f.name}`,
        file_name: f.name,
        num_pages: f.numPages,
        num_copies: f.numCopies,
        paper_type_id: f.paperType,
        is_color: f.isColor,
        lamination_sheets: f.laminationSheets,
        binding_type: f.bindingType,
        perPagePriceApplied: estimate.breakdown[idx]?.per_page_price || 0,
        itemSubtotal: estimate.breakdown[idx]?.subtotal || 0
      }));

      const payload = {
        customer_email: customerEmail,
        customer_phone: customerPhone,
        customer_name: customerName,
        items,
        fulfillment_type: fulfillmentType,
        customer_location: fulfillmentType === 'Delivery' ? {
          latitude: 12.9716,
          longitude: 77.5946,
          address: 'Customer Address',
          city: 'Bangalore',
          pincode: '560001'
        } : null
      };

      const response = await axios.post(`${API}/orders`, payload);
      setOrderId(response.data.id);
      
      // Navigate to payment tab
      setActiveTab('payment');
      toast.success('Order created!');
    } catch (error) {
      console.error('Order creation error:', error);
      toast.error('Failed to create order');
    } finally {
      setLoading(false);
    }
  };

  const proceedToPayment = async () => {
    if (!orderId) {
      toast.error('No order created');
      return;
    }

    setLoading(true);
    try {
      const response = await axios.post(`${API}/payments/create-session?order_id=${orderId}`);
      const session = response.data;
      
      if (session.payment_url) {
        // In SIMULATED mode, show success directly
        toast.success('Payment session created (SIMULATED)');
        
        // Simulate payment webhook
        setTimeout(async () => {
          await axios.post(`${API}/webhooks/payment/${session.gateway}`, {
            order_id: orderId,
            payment_id: session.gateway_session_id,
            amount: estimate.total,
            status: 'captured'
          }, {
            headers: { 'X-Signature': 'simulated' }
          });
          
          toast.success('Payment confirmed! Redirecting to tracking...');
          setTimeout(() => {
            navigate(`/track/${orderId}`);
          }, 1500);
        }, 2000);
      }
    } catch (error) {
      console.error('Payment error:', error);
      toast.error('Failed to create payment session');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      {/* Header */}
      <header className="border-b bg-white/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => navigate('/')}>
            <div className="w-10 h-10 rounded-lg bg-indigo-600 flex items-center justify-center">
              <Printer className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">Vaishnavi Printers</h1>
              <p className="text-xs text-gray-500">Print Order Portal</p>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-5xl mx-auto px-4 py-8" data-testid="customer-portal">
        {/* Customer Info */}
        <div className="bg-white rounded-xl shadow-sm p-6 mb-6 border border-gray-100">
          <h2 className="text-lg font-semibold mb-4" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
            Contact Information
          </h2>
          <div className="grid md:grid-cols-3 gap-4">
            <div>
              <Label>Name</Label>
              <Input
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                placeholder="Your name"
                data-testid="customer-name-input"
              />
            </div>
            <div>
              <Label>Email</Label>
              <Input
                type="email"
                value={customerEmail}
                onChange={(e) => setCustomerEmail(e.target.value)}
                placeholder="your@email.com"
                data-testid="customer-email-input"
              />
            </div>
            <div>
              <Label>Phone</Label>
              <Input
                value={customerPhone}
                onChange={(e) => setCustomerPhone(e.target.value)}
                placeholder="+91 98765 43210"
                data-testid="customer-phone-input"
              />
            </div>
          </div>
        </div>

        {/* Main Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="upload" data-testid="upload-tab">
              <Upload className="w-4 h-4 mr-2" />
              Upload
            </TabsTrigger>
            <TabsTrigger value="estimate" data-testid="estimate-tab">
              <Calculator className="w-4 h-4 mr-2" />
              Estimate
            </TabsTrigger>
            <TabsTrigger value="payment" data-testid="payment-tab">
              <CreditCard className="w-4 h-4 mr-2" />
              Payment
            </TabsTrigger>
          </TabsList>

          {/* Upload Tab */}
          <TabsContent value="upload">
            <UploadTab
              files={files}
              priceRule={priceRule}
              onFileChange={handleFileChange}
              onUpdateFile={updateFile}
              onRemoveFile={removeFile}
              fulfillmentType={fulfillmentType}
              onFulfillmentChange={setFulfillmentType}
              onCalculate={calculateEstimate}
              loading={loading}
            />
          </TabsContent>

          {/* Estimate Tab */}
          <TabsContent value="estimate">
            <EstimateTab
              estimate={estimate}
              onConfirm={createOrder}
              loading={loading}
            />
          </TabsContent>

          {/* Payment Tab */}
          <TabsContent value="payment">
            <PaymentTab
              estimate={estimate}
              orderId={orderId}
              onProceed={proceedToPayment}
              loading={loading}
            />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

// Upload Tab Component
const UploadTab = ({ files, priceRule, onFileChange, onUpdateFile, onRemoveFile, fulfillmentType, onFulfillmentChange, onCalculate, loading }) => (
  <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
    <div className="mb-6">
      <Label htmlFor="file-upload" className="block mb-2">Upload Documents</Label>
      <input
        id="file-upload"
        type="file"
        multiple
        accept=".pdf,.doc,.docx"
        onChange={onFileChange}
        className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"
        data-testid="file-upload-input"
      />
    </div>

    {files.length > 0 && (
      <div className="space-y-4 mb-6">
        {files.map((file, idx) => (
          <FileConfigCard
            key={idx}
            file={file}
            index={idx}
            priceRule={priceRule}
            onUpdate={onUpdateFile}
            onRemove={onRemoveFile}
          />
        ))}
      </div>
    )}

    <div className="mb-6">
      <Label className="block mb-2">Fulfillment Type</Label>
      <RadioGroup value={fulfillmentType} onValueChange={onFulfillmentChange}>
        <div className="flex items-center space-x-2">
          <RadioGroupItem value="Pickup" id="pickup" data-testid="fulfillment-pickup" />
          <Label htmlFor="pickup" className="flex items-center gap-2 cursor-pointer">
            <Package className="w-4 h-4" />
            Store Pickup
          </Label>
        </div>
        <div className="flex items-center space-x-2">
          <RadioGroupItem value="Delivery" id="delivery" data-testid="fulfillment-delivery" />
          <Label htmlFor="delivery" className="flex items-center gap-2 cursor-pointer">
            <MapPin className="w-4 h-4" />
            Home Delivery
          </Label>
        </div>
      </RadioGroup>
    </div>

    <Button
      onClick={onCalculate}
      disabled={loading || files.length === 0}
      className="w-full bg-indigo-600 hover:bg-indigo-700 text-white"
      data-testid="calculate-estimate-btn"
    >
      {loading ? 'Calculating...' : 'Calculate Estimate'}
    </Button>
  </div>
);

const FileConfigCard = ({ file, index, priceRule, onUpdate, onRemove }) => (
  <div className="border rounded-lg p-4 space-y-3" data-testid={`file-card-${index}`}>
    <div className="flex items-center justify-between">
      <span className="font-medium text-sm">{file.name}</span>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => onRemove(index)}
        className="text-red-600 hover:text-red-700"
        data-testid={`remove-file-${index}`}
      >
        Remove
      </Button>
    </div>

    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
      <div>
        <Label className="text-xs">Pages</Label>
        <Input
          type="number"
          value={file.numPages}
          onChange={(e) => onUpdate(index, 'numPages', parseInt(e.target.value))}
          min="1"
          data-testid={`pages-input-${index}`}
        />
      </div>
      <div>
        <Label className="text-xs">Copies</Label>
        <Input
          type="number"
          value={file.numCopies}
          onChange={(e) => onUpdate(index, 'numCopies', parseInt(e.target.value))}
          min="1"
          data-testid={`copies-input-${index}`}
        />
      </div>
      <div>
        <Label className="text-xs">Paper Type</Label>
        <Select value={file.paperType} onValueChange={(val) => onUpdate(index, 'paperType', val)}>
          <SelectTrigger data-testid={`paper-type-select-${index}`}>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {priceRule?.paperTypes.map(pt => (
              <SelectItem key={pt.id} value={pt.id}>{pt.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div>
        <Label className="text-xs">Color</Label>
        <Select value={file.isColor ? 'color' : 'bw'} onValueChange={(val) => onUpdate(index, 'isColor', val === 'color')}>
          <SelectTrigger data-testid={`color-select-${index}`}>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="bw">B&W</SelectItem>
            <SelectItem value="color">Color</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  </div>
);

const EstimateTab = ({ estimate, onConfirm, loading }) => (
  <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
    {estimate ? (
      <>
        <h3 className="text-lg font-semibold mb-4" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
          Order Estimate
        </h3>
        <div className="space-y-3 mb-6">
          {estimate.breakdown.map((item, idx) => (
            <div key={idx} className="flex justify-between text-sm py-2 border-b">
              <span>{item.file_name} ({item.pages} pages × {item.copies} copies, {item.color})</span>
              <span className="font-medium">₹{item.subtotal.toFixed(2)}</span>
            </div>
          ))}
          <div className="flex justify-between text-sm py-2">
            <span>Delivery Charge</span>
            <span className="font-medium">₹{estimate.delivery_charge.toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-lg font-bold py-2 border-t-2">
            <span>Total</span>
            <span className="text-indigo-600">₹{estimate.total.toFixed(2)}</span>
          </div>
        </div>
        <Button
          onClick={onConfirm}
          disabled={loading}
          className="w-full bg-indigo-600 hover:bg-indigo-700 text-white"
          data-testid="confirm-order-btn"
        >
          {loading ? 'Creating Order...' : 'Confirm Order'}
        </Button>
      </>
    ) : (
      <p className="text-center text-gray-500 py-8">No estimate calculated yet</p>
    )}
  </div>
);

const PaymentTab = ({ estimate, orderId, onProceed, loading }) => (
  <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
    {orderId ? (
      <>
        <h3 className="text-lg font-semibold mb-4" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
          Payment
        </h3>
        <div className="bg-blue-50 rounded-lg p-4 mb-6">
          <p className="text-sm text-gray-700">
            <strong>Order ID:</strong> {orderId}
          </p>
          <p className="text-sm text-gray-700 mt-1">
            <strong>Amount:</strong> ₹{estimate?.total.toFixed(2)}
          </p>
        </div>
        <Button
          onClick={onProceed}
          disabled={loading}
          className="w-full bg-indigo-600 hover:bg-indigo-700 text-white"
          data-testid="proceed-payment-btn"
        >
          {loading ? 'Processing...' : 'Proceed to Payment'}
        </Button>
      </>
    ) : (
      <p className="text-center text-gray-500 py-8">Please create an order first</p>
    )}
  </div>
);

export default CustomerPortal;
