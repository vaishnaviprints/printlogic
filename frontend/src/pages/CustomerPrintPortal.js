import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { Printer, Upload, FileText, Image as ImageIcon, File, X, Eye, MapPin, Truck, Calculator } from 'lucide-react';
import axios from 'axios';
import * as pdfjsLib from 'pdfjs-dist';

// Configure PDF.js worker
pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const CustomerPrintPortal = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(1); // 1: Upload, 2: Configure, 3: Estimate
  
  // Files
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [totalPages, setTotalPages] = useState(0);
  
  // Print configuration
  const [printConfig, setPrintConfig] = useState({
    paperType: 'A4',
    paperSize: 'A4',
    colorType: 'black_white',
    sides: 'single',
    binding: 'none',
    lamination: 'none',
    copies: 1
  });
  
  // Delivery
  const [deliveryType, setDeliveryType] = useState('pickup'); // pickup or delivery
  const [deliveryAddress, setDeliveryAddress] = useState({
    street: '',
    city: '',
    pincode: '',
    phone: ''
  });
  
  // Pricing
  const [estimate, setEstimate] = useState(null);
  
  const PAPER_PRICES = {
    'A4_black_white_single': 2,
    'A4_black_white_double': 3,
    'A4_color_single': 10,
    'A4_color_double': 15,
    'A3_black_white_single': 5,
    'A3_black_white_double': 8,
    'A3_color_single': 20,
    'A3_color_double': 30
  };
  
  const BINDING_PRICES = {
    'none': 0,
    'staple': 5,
    'spiral': 25,
    'tape': 15
  };
  
  const LAMINATION_PRICES = {
    'none': 0,
    'single': 10,
    'both': 15
  };
  
  const DELIVERY_CHARGES = 50; // ₹50 for home delivery

  const handleFileUpload = async (e) => {
    const files = Array.from(e.target.files);
    setLoading(true);
    
    try {
      const newFiles = [];
      let totalPageCount = 0;
      
      for (const file of files) {
        const fileType = file.type;
        let pageCount = 1;
        
        // Calculate pages based on file type
        if (fileType === 'application/pdf') {
          // For PDF, we'll need to parse it - simplified for now
          // In real implementation, use PDF.js to count pages
          pageCount = await countPdfPages(file);
        } else if (fileType.startsWith('image/')) {
          pageCount = 1; // Each image = 1 page
        } else {
          pageCount = 1; // Other files default to 1 page
        }
        
        newFiles.push({
          id: Date.now() + Math.random(),
          file: file,
          name: file.name,
          type: fileType,
          size: file.size,
          pages: pageCount,
          preview: URL.createObjectURL(file)
        });
        
        totalPageCount += pageCount;
      }
      
      setUploadedFiles([...uploadedFiles, ...newFiles]);
      setTotalPages(totalPages + totalPageCount);
      toast.success(`Added ${files.length} file(s) with ${totalPageCount} pages`);
    } catch (error) {
      console.error('File upload error:', error);
      toast.error('Failed to process files');
    } finally {
      setLoading(false);
    }
  };
  
  const countPdfPages = async (file) => {
    // Simplified PDF page counting - in production use PDF.js
    // For now, estimate based on file size (rough approximation)
    const estimatedPages = Math.ceil(file.size / 50000); // ~50KB per page estimate
    return Math.max(1, Math.min(estimatedPages, 500)); // Cap at 500 pages
  };
  
  const removeFile = (fileId) => {
    const fileToRemove = uploadedFiles.find(f => f.id === fileId);
    setUploadedFiles(uploadedFiles.filter(f => f.id !== fileId));
    setTotalPages(totalPages - (fileToRemove?.pages || 0));
    toast.info('File removed');
  };
  
  const calculateEstimate = () => {
    const priceKey = `${printConfig.paperSize}_${printConfig.colorType}_${printConfig.sides}`;
    const pricePerPage = PAPER_PRICES[priceKey] || 2;
    
    const printingCost = totalPages * pricePerPage * printConfig.copies;
    const bindingCost = BINDING_PRICES[printConfig.binding] || 0;
    const laminationCost = LAMINATION_PRICES[printConfig.lamination] || 0;
    const deliveryCost = deliveryType === 'delivery' ? DELIVERY_CHARGES : 0;
    
    const subtotal = printingCost + bindingCost + laminationCost;
    const total = subtotal + deliveryCost;
    
    return {
      pages: totalPages,
      copies: printConfig.copies,
      totalSheets: totalPages * printConfig.copies,
      pricePerPage,
      printingCost,
      bindingCost,
      laminationCost,
      deliveryCost,
      subtotal,
      total
    };
  };
  
  const handleNext = () => {
    if (step === 1) {
      if (uploadedFiles.length === 0) {
        toast.error('Please upload at least one file');
        return;
      }
      setStep(2);
    } else if (step === 2) {
      const est = calculateEstimate();
      setEstimate(est);
      setStep(3);
    }
  };
  
  const handleSubmitOrder = async () => {
    if (deliveryType === 'delivery') {
      if (!deliveryAddress.street || !deliveryAddress.city || !deliveryAddress.pincode || !deliveryAddress.phone) {
        toast.error('Please fill delivery address details');
        return;
      }
    }
    
    setLoading(true);
    try {
      const formData = new FormData();
      
      // Add files
      uploadedFiles.forEach((fileObj, index) => {
        formData.append(`files`, fileObj.file);
      });
      
      // Add configuration
      formData.append('config', JSON.stringify({
        ...printConfig,
        deliveryType,
        deliveryAddress: deliveryType === 'delivery' ? deliveryAddress : null,
        totalPages,
        estimate
      }));
      
      const token = localStorage.getItem('auth_token');
      const response = await axios.post(`${API}/orders/create`, formData, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'multipart/form-data'
        }
      });
      
      toast.success('Order created successfully!');
      navigate(`/track/${response.data.order_id}`);
    } catch (error) {
      console.error('Order creation failed:', error);
      toast.error(error.response?.data?.detail || 'Failed to create order');
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
            <h1 className="text-xl font-bold">Vaishnavi Printers</h1>
          </div>
          <Button variant="outline" onClick={() => navigate('/my-orders')}>My Orders</Button>
        </div>
      </header>

      <div className="max-w-5xl mx-auto px-4 py-12">
        {/* Progress Steps */}
        <div className="flex items-center justify-center mb-8">
          {[1, 2, 3].map((s) => (
            <div key={s} className="flex items-center">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold ${
                step >= s ? 'bg-indigo-600 text-white' : 'bg-gray-200 text-gray-500'
              }`}>
                {s}
              </div>
              {s < 3 && <div className={`w-20 h-1 ${step > s ? 'bg-indigo-600' : 'bg-gray-200'}`} />}
            </div>
          ))}
        </div>

        {/* Step 1: Upload Files */}
        {step === 1 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Upload className="w-5 h-5 text-indigo-600" />
                Upload Files
              </CardTitle>
              <CardDescription>Upload PDFs, images, or multiple files - they will be combined automatically</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Upload Area */}
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-indigo-500 transition-colors">
                <Input
                  type="file"
                  multiple
                  accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                  onChange={handleFileUpload}
                  className="hidden"
                  id="file-upload"
                />
                <label htmlFor="file-upload" className="cursor-pointer">
                  <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-lg font-medium mb-2">Click to upload files</p>
                  <p className="text-sm text-gray-500">PDF, JPG, PNG (max 50MB per file)</p>
                </label>
              </div>

              {/* Uploaded Files List */}
              {uploadedFiles.length > 0 && (
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-semibold">Uploaded Files ({uploadedFiles.length})</h3>
                    <Badge variant="outline" className="text-lg">
                      Total: {totalPages} pages
                    </Badge>
                  </div>
                  <div className="space-y-2">
                    {uploadedFiles.map((fileObj) => (
                      <div key={fileObj.id} className="flex items-center justify-between p-3 border rounded-lg bg-white">
                        <div className="flex items-center gap-3">
                          {fileObj.type === 'application/pdf' ? (
                            <FileText className="w-8 h-8 text-red-500" />
                          ) : fileObj.type.startsWith('image/') ? (
                            <ImageIcon className="w-8 h-8 text-blue-500" />
                          ) : (
                            <File className="w-8 h-8 text-gray-500" />
                          )}
                          <div>
                            <p className="font-medium text-sm">{fileObj.name}</p>
                            <p className="text-xs text-gray-500">
                              {fileObj.pages} page(s) · {(fileObj.size / 1024).toFixed(1)} KB
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button variant="ghost" size="sm" onClick={() => window.open(fileObj.preview)}>
                            <Eye className="w-4 h-4" />
                          </Button>
                          <Button variant="ghost" size="sm" onClick={() => removeFile(fileObj.id)}>
                            <X className="w-4 h-4 text-red-500" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <Button onClick={handleNext} className="w-full bg-indigo-600" disabled={uploadedFiles.length === 0}>
                Next: Configure Print Settings
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Step 2: Configure Print */}
        {step === 2 && (
          <Card>
            <CardHeader>
              <CardTitle>Print Configuration</CardTitle>
              <CardDescription>Configure how you want your documents printed</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <Label>Paper Size</Label>
                  <RadioGroup value={printConfig.paperSize} onValueChange={(v) => setPrintConfig({...printConfig, paperSize: v})}>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="A4" id="a4" />
                      <Label htmlFor="a4">A4 (Standard)</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="A3" id="a3" />
                      <Label htmlFor="a3">A3 (Large)</Label>
                    </div>
                  </RadioGroup>
                </div>

                <div>
                  <Label>Color Type</Label>
                  <RadioGroup value={printConfig.colorType} onValueChange={(v) => setPrintConfig({...printConfig, colorType: v})}>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="black_white" id="bw" />
                      <Label htmlFor="bw">Black & White</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="color" id="color" />
                      <Label htmlFor="color">Color</Label>
                    </div>
                  </RadioGroup>
                </div>

                <div>
                  <Label>Print Sides</Label>
                  <RadioGroup value={printConfig.sides} onValueChange={(v) => setPrintConfig({...printConfig, sides: v})}>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="single" id="single" />
                      <Label htmlFor="single">Single Sided</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="double" id="double" />
                      <Label htmlFor="double">Double Sided</Label>
                    </div>
                  </RadioGroup>
                </div>

                <div>
                  <Label>Binding</Label>
                  <RadioGroup value={printConfig.binding} onValueChange={(v) => setPrintConfig({...printConfig, binding: v})}>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="none" id="nobind" />
                      <Label htmlFor="nobind">No Binding</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="staple" id="staple" />
                      <Label htmlFor="staple">Staple (₹5)</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="spiral" id="spiral" />
                      <Label htmlFor="spiral">Spiral (₹25)</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="tape" id="tape" />
                      <Label htmlFor="tape">Tape (₹15)</Label>
                    </div>
                  </RadioGroup>
                </div>

                <div>
                  <Label>Lamination</Label>
                  <RadioGroup value={printConfig.lamination} onValueChange={(v) => setPrintConfig({...printConfig, lamination: v})}>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="none" id="nolam" />
                      <Label htmlFor="nolam">No Lamination</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="single" id="singlelam" />
                      <Label htmlFor="singlelam">Single Side (₹10)</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="both" id="bothlam" />
                      <Label htmlFor="bothlam">Both Sides (₹15)</Label>
                    </div>
                  </RadioGroup>
                </div>

                <div>
                  <Label>Number of Copies</Label>
                  <Input
                    type="number"
                    min="1"
                    value={printConfig.copies}
                    onChange={(e) => setPrintConfig({...printConfig, copies: parseInt(e.target.value) || 1})}
                  />
                </div>
              </div>

              <div className="flex gap-3">
                <Button variant="outline" onClick={() => setStep(1)} className="flex-1">Back</Button>
                <Button onClick={handleNext} className="flex-1 bg-indigo-600">Next: Review & Estimate</Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Step 3: Estimate & Delivery */}
        {step === 3 && estimate && (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calculator className="w-5 h-5 text-indigo-600" />
                  Order Estimate
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid md:grid-cols-2 gap-4 p-4 bg-gray-50 rounded-lg">
                  <div>
                    <p className="text-sm text-gray-600">Total Pages</p>
                    <p className="text-2xl font-bold">{estimate.pages}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Copies</p>
                    <p className="text-2xl font-bold">{estimate.copies}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Total Sheets to Print</p>
                    <p className="text-2xl font-bold">{estimate.totalSheets}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Price per Page</p>
                    <p className="text-2xl font-bold">₹{estimate.pricePerPage}</p>
                  </div>
                </div>

                <div className="space-y-2 border-t pt-4">
                  <div className="flex justify-between">
                    <span>Printing Cost ({estimate.totalSheets} sheets × ₹{estimate.pricePerPage})</span>
                    <span className="font-medium">₹{estimate.printingCost}</span>
                  </div>
                  {estimate.bindingCost > 0 && (
                    <div className="flex justify-between">
                      <span>Binding ({printConfig.binding})</span>
                      <span className="font-medium">₹{estimate.bindingCost}</span>
                    </div>
                  )}
                  {estimate.laminationCost > 0 && (
                    <div className="flex justify-between">
                      <span>Lamination ({printConfig.lamination})</span>
                      <span className="font-medium">₹{estimate.laminationCost}</span>
                    </div>
                  )}
                  <div className="flex justify-between pt-2 border-t">
                    <span className="font-medium">Subtotal</span>
                    <span className="font-medium">₹{estimate.subtotal}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Delivery Type</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <RadioGroup value={deliveryType} onValueChange={setDeliveryType}>
                  <div className="flex items-start space-x-3 p-4 border rounded-lg cursor-pointer hover:bg-gray-50">
                    <RadioGroupItem value="pickup" id="pickup" className="mt-1" />
                    <Label htmlFor="pickup" className="cursor-pointer flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <MapPin className="w-5 h-5 text-indigo-600" />
                        <span className="font-semibold">Store Pickup</span>
                        <Badge variant="outline" className="ml-auto">FREE</Badge>
                      </div>
                      <p className="text-sm text-gray-600">Pick up from nearest Vaishnavi Printers location</p>
                    </Label>
                  </div>

                  <div className="flex items-start space-x-3 p-4 border rounded-lg cursor-pointer hover:bg-gray-50">
                    <RadioGroupItem value="delivery" id="delivery" className="mt-1" />
                    <Label htmlFor="delivery" className="cursor-pointer flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <Truck className="w-5 h-5 text-indigo-600" />
                        <span className="font-semibold">Home Delivery</span>
                        <Badge variant="outline" className="ml-auto">₹{DELIVERY_CHARGES}</Badge>
                      </div>
                      <p className="text-sm text-gray-600">Get it delivered to your doorstep</p>
                    </Label>
                  </div>
                </RadioGroup>

                {deliveryType === 'delivery' && (
                  <div className="space-y-4 p-4 border rounded-lg bg-gray-50">
                    <h4 className="font-semibold">Delivery Address</h4>
                    <div className="grid md:grid-cols-2 gap-4">
                      <div className="md:col-span-2">
                        <Label>Street Address *</Label>
                        <Input
                          value={deliveryAddress.street}
                          onChange={(e) => setDeliveryAddress({...deliveryAddress, street: e.target.value})}
                          placeholder="Street address"
                        />
                      </div>
                      <div>
                        <Label>City *</Label>
                        <Input
                          value={deliveryAddress.city}
                          onChange={(e) => setDeliveryAddress({...deliveryAddress, city: e.target.value})}
                          placeholder="Bangalore"
                        />
                      </div>
                      <div>
                        <Label>Pincode *</Label>
                        <Input
                          value={deliveryAddress.pincode}
                          onChange={(e) => setDeliveryAddress({...deliveryAddress, pincode: e.target.value})}
                          placeholder="560001"
                        />
                      </div>
                      <div className="md:col-span-2">
                        <Label>Phone Number *</Label>
                        <Input
                          type="tel"
                          value={deliveryAddress.phone}
                          onChange={(e) => setDeliveryAddress({...deliveryAddress, phone: e.target.value})}
                          placeholder="+91 9618667700"
                        />
                      </div>
                    </div>
                  </div>
                )}

                <div className="flex justify-between items-center p-4 bg-indigo-50 rounded-lg border-2 border-indigo-200">
                  <span className="text-lg font-semibold">Total Amount</span>
                  <span className="text-3xl font-bold text-indigo-600">
                    ₹{estimate.subtotal + (deliveryType === 'delivery' ? DELIVERY_CHARGES : 0)}
                  </span>
                </div>

                <div className="flex gap-3">
                  <Button variant="outline" onClick={() => setStep(2)} className="flex-1">Back</Button>
                  <Button onClick={handleSubmitOrder} className="flex-1 bg-indigo-600" disabled={loading}>
                    {loading ? 'Creating Order...' : 'Confirm Order'}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
};

export default CustomerPrintPortal;
