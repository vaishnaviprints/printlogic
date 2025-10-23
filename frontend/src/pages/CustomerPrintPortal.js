import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { toast } from 'sonner';
import { Printer, Upload, FileText, Image as ImageIcon, File, X, Eye, MapPin, Truck, Calculator, Settings, DollarSign, ChevronDown, ChevronUp } from 'lucide-react';
import axios from 'axios';
import QRCode from 'qrcode';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const CustomerPrintPortal = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(1);
  
  // Files with individual configurations
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [expandedFile, setExpandedFile] = useState(null);
  const [showLaminationWarning, setShowLaminationWarning] = useState(false);
  const [currentLaminationFile, setCurrentLaminationFile] = useState(null);
  
  // Delivery
  const [deliveryType, setDeliveryType] = useState('pickup'); // pickup or delivery
  const [deliveryAddress, setDeliveryAddress] = useState({
    street: '',
    city: '',
    pincode: '',
    phone: ''
  });
  
  // Payment method
  const [paymentMethod, setPaymentMethod] = useState('cash'); // cash or online
  
  // Pricing
  const [estimate, setEstimate] = useState(null);
  const [qrCodeUrl, setQrCodeUrl] = useState('');
  
  // A4 Pricing (70 GSM B/W, 100 GSM Color)
  const A4_PRICES = {
    'bw_single': 3,
    'bw_double': 4,
    'color_below_5_single': 15,
    'color_below_5_double': 25,
    'color_5_to_10_single': 12,
    'color_5_to_10_double': 20,
    'color_11_plus_single': 10,
    'color_11_plus_double': 20
  };
  
  // A3 Color Pricing
  const A3_COLOR_PRICES = {
    'below_10_single': 30,
    'below_10_double': 40,
    'above_10_single': 25,
    'above_10_double': 35
  };
  
  // A3 B/W Pricing
  const A3_BW_PRICES = {
    'below_10_single': 8,
    'below_10_double': 12,
    'above_10_single': 6,
    'above_10_double': 10
  };
  
  const DELIVERY_CHARGES = 50;

  // Generate QR Code for in-store ordering
  useEffect(() => {
    const generateQR = async () => {
      try {
        const url = window.location.href;
        const qr = await QRCode.toDataURL(url, {
          width: 300,
          margin: 2,
          color: {
            dark: '#4F46E5',
            light: '#FFFFFF'
          }
        });
        setQrCodeUrl(qr);
      } catch (err) {
        console.error('QR generation failed:', err);
      }
    };
    generateQR();
  }, []);

  // Simple PDF page counting
  const countPdfPages = async (file) => {
    return new Promise((resolve) => {
      const fileReader = new FileReader();
      
      fileReader.onload = function() {
        try {
          const text = this.result;
          const matches = text.match(/\/Type\s*\/Page[^s]/g);
          if (matches) {
            const pageCount = matches.length;
            console.log(`PDF ${file.name}: ${pageCount} pages`);
            resolve(pageCount);
          } else {
            const estimatedPages = Math.max(1, Math.ceil(file.size / 100000));
            console.log(`PDF ${file.name}: ~${estimatedPages} pages (estimated)`);
            resolve(estimatedPages);
          }
        } catch (error) {
          console.error('PDF parsing error:', error);
          resolve(1);
        }
      };
      
      fileReader.onerror = function() {
        console.error('File reading error');
        resolve(1);
      };
      
      fileReader.readAsText(file);
    });
  };

  // Auto-detect if image/PDF has color
  const detectColor = async (file) => {
    // Simple heuristic: for now, default to black_white
    // In production, you'd use canvas to analyze pixel data
    return 'black_white';
  };

  const handleFileUpload = async (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;
    
    setLoading(true);
    
    try {
      const newFiles = [];
      
      for (const file of files) {
        const fileType = file.type;
        let pageCount = 1;
        
        // Calculate pages based on file type
        if (fileType === 'application/pdf') {
          try {
            pageCount = await countPdfPages(file);
          } catch (error) {
            console.error('Error counting PDF pages:', error);
            pageCount = 1;
          }
        } else if (fileType.startsWith('image/')) {
          pageCount = 1;
        } else {
          pageCount = 1;
        }
        
        const colorType = await detectColor(file);
        
        newFiles.push({
          id: Date.now() + Math.random(),
          file: file,
          name: file.name,
          type: fileType,
          size: file.size,
          totalPages: pageCount,
          preview: URL.createObjectURL(file),
          // Individual file configuration
          config: {
            pageRanges: `1-${pageCount}`, // Default: all pages
            selectedPages: pageCount, // Calculated from page ranges
            paperSize: 'A4',
            colorType: colorType,
            autoDetectColor: false, // Default: unchecked
            sides: 'single',
            copies: 1,
            binding: 'none',
            lamination: 'none'
          }
        });
      }
      
      setUploadedFiles([...uploadedFiles, ...newFiles]);
      toast.success(`Added ${files.length} file(s)`);
    } catch (error) {
      console.error('File upload error:', error);
      toast.error('Failed to process files');
    } finally {
      setLoading(false);
    }
  };
  
  const removeFile = (fileId) => {
    setUploadedFiles(uploadedFiles.filter(f => f.id !== fileId));
    toast.info('File removed');
  };
  
  // Parse page ranges like "1-5,10-20,35" and return count
  const parsePageRanges = (rangeString, totalPages) => {
    try {
      const ranges = rangeString.split(',').map(r => r.trim());
      const selectedPages = new Set();
      
      for (const range of ranges) {
        if (range.includes('-')) {
          const [start, end] = range.split('-').map(n => parseInt(n.trim()));
          if (isNaN(start) || isNaN(end) || start < 1 || end > totalPages || start > end) {
            throw new Error('Invalid range');
          }
          for (let i = start; i <= end; i++) {
            selectedPages.add(i);
          }
        } else {
          const pageNum = parseInt(range);
          if (isNaN(pageNum) || pageNum < 1 || pageNum > totalPages) {
            throw new Error('Invalid page number');
          }
          selectedPages.add(pageNum);
        }
      }
      
      return selectedPages.size;
    } catch (error) {
      console.error('Page range parse error:', error);
      return totalPages; // Fallback to all pages
    }
  };
  
  const updateFileConfig = (fileId, configUpdate) => {
    // Check if lamination is being selected (changed from 'none' to A4/A3)
    if (configUpdate.lamination && configUpdate.lamination !== 'none') {
      const file = uploadedFiles.find(f => f.id === fileId);
      if (file && file.config.lamination === 'none') {
        // Show warning before applying
        setCurrentLaminationFile({ fileId, configUpdate });
        setShowLaminationWarning(true);
        return;
      }
    }
    
    applyFileConfigUpdate(fileId, configUpdate);
  };
  
  const applyFileConfigUpdate = (fileId, configUpdate) => {
    setUploadedFiles(uploadedFiles.map(f => {
      if (f.id === fileId) {
        const newConfig = { ...f.config, ...configUpdate };
        
        // Recalculate selected pages if page ranges changed
        if (configUpdate.pageRanges !== undefined) {
          newConfig.selectedPages = parsePageRanges(configUpdate.pageRanges, f.totalPages);
        }
        
        return { ...f, config: newConfig };
      }
      return f;
    }));
  };
  
  const handleLaminationConfirm = () => {
    if (currentLaminationFile) {
      applyFileConfigUpdate(currentLaminationFile.fileId, currentLaminationFile.configUpdate);
    }
    setShowLaminationWarning(false);
    setCurrentLaminationFile(null);
  };
  
  const handleLaminationCancel = () => {
    setShowLaminationWarning(false);
    setCurrentLaminationFile(null);
  };
  
  // Calculate spiral binding cost
  const calculateSpiralBindingCost = (pages, isDoubleSided) => {
    const sheets = isDoubleSided ? Math.ceil(pages / 2) : pages;
    const baseCost = 50; // Up to 50 pages
    
    if (sheets <= 50) {
      return baseCost;
    }
    
    // Every 50 pages add ₹20
    const additionalSheets = sheets - 50;
    const additionalCost = Math.ceil(additionalSheets / 50) * 20;
    
    return baseCost + additionalCost;
  };
  
  // Calculate estimate for a single file
  const calculateFileEstimate = (fileObj) => {
    const config = fileObj.config;
    const selectedPages = config.selectedPages;
    const copies = config.copies;
    
    let printingCost = 0;
    
    // Calculate printing cost based on paper size and color
    if (config.paperSize === 'A4') {
      const totalPagesWithCopies = selectedPages * copies;
      let pricePerPage;
      
      if (config.colorType === 'black_white') {
        pricePerPage = config.sides === 'single' ? A4_PRICES.bw_single : A4_PRICES.bw_double;
      } else {
        // Color tiered pricing
        if (totalPagesWithCopies < 5) {
          pricePerPage = config.sides === 'single' ? A4_PRICES.color_below_5_single : A4_PRICES.color_below_5_double;
        } else if (totalPagesWithCopies <= 10) {
          pricePerPage = config.sides === 'single' ? A4_PRICES.color_5_to_10_single : A4_PRICES.color_5_to_10_double;
        } else {
          pricePerPage = config.sides === 'single' ? A4_PRICES.color_11_plus_single : A4_PRICES.color_11_plus_double;
        }
      }
      
      const sheetsNeeded = config.sides === 'double' ? Math.ceil(selectedPages / 2) : selectedPages;
      printingCost = sheetsNeeded * pricePerPage * copies;
      
    } else if (config.paperSize === 'A3') {
      // A3 pricing (Color or B/W)
      const totalCopies = copies;
      let pricePerPage;
      
      if (config.colorType === 'black_white') {
        // A3 B/W
        if (totalCopies <= 10) {
          pricePerPage = config.sides === 'single' ? A3_BW_PRICES.below_10_single : A3_BW_PRICES.below_10_double;
        } else {
          pricePerPage = config.sides === 'single' ? A3_BW_PRICES.above_10_single : A3_BW_PRICES.above_10_double;
        }
      } else {
        // A3 Color
        if (totalCopies <= 10) {
          pricePerPage = config.sides === 'single' ? A3_COLOR_PRICES.below_10_single : A3_COLOR_PRICES.below_10_double;
        } else {
          pricePerPage = config.sides === 'single' ? A3_COLOR_PRICES.above_10_single : A3_COLOR_PRICES.above_10_double;
        }
      }
      
      const sheetsNeeded = config.sides === 'double' ? Math.ceil(selectedPages / 2) : selectedPages;
      printingCost = sheetsNeeded * pricePerPage * copies;
    }
    
    // Binding cost
    let bindingCost = 0;
    if (config.binding === 'spiral') {
      const totalPagesForBinding = selectedPages * copies;
      bindingCost = calculateSpiralBindingCost(totalPagesForBinding, config.sides === 'double');
    }
    
    // Lamination cost - PER PAGE/SHEET (for certificates)
    let laminationCost = 0;
    if (config.lamination === 'A4') {
      // A4: ₹40 per sheet
      const sheetsForLamination = config.sides === 'double' 
        ? Math.ceil(selectedPages / 2)  // Double side: half the sheets
        : selectedPages;                 // Single side: all pages
      laminationCost = sheetsForLamination * 40 * copies;
    } else if (config.lamination === 'A3') {
      // A3: ₹60 per sheet
      const sheetsForLamination = config.sides === 'double' 
        ? Math.ceil(selectedPages / 2)
        : selectedPages;
      laminationCost = sheetsForLamination * 60 * copies;
    }
    
    return {
      printingCost,
      bindingCost,
      laminationCost,
      total: printingCost + bindingCost + laminationCost
    };
  };
  
  const calculateTotalEstimate = () => {
    let totalPrintingCost = 0;
    let totalBindingCost = 0;
    let totalLaminationCost = 0;
    
    const fileBreakdown = uploadedFiles.map(fileObj => {
      const fileEst = calculateFileEstimate(fileObj);
      totalPrintingCost += fileEst.printingCost;
      totalBindingCost += fileEst.bindingCost;
      totalLaminationCost += fileEst.laminationCost;
      
      return {
        fileName: fileObj.name,
        ...fileEst
      };
    });
    
    const subtotal = totalPrintingCost + totalBindingCost + totalLaminationCost;
    const deliveryCost = deliveryType === 'delivery' ? DELIVERY_CHARGES : 0;
    const total = subtotal + deliveryCost;
    
    return {
      fileBreakdown,
      printingCost: totalPrintingCost,
      bindingCost: totalBindingCost,
      laminationCost: totalLaminationCost,
      subtotal,
      deliveryCost,
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
      const est = calculateTotalEstimate();
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
      
      // Add files with their configurations
      uploadedFiles.forEach((fileObj, index) => {
        formData.append(`files`, fileObj.file);
        formData.append(`file_configs`, JSON.stringify({
          file_name: fileObj.name,  // Required field
          page_ranges: fileObj.config.pageRanges || "all",  // Required field
          selected_pages: fileObj.config.totalPages || 1,  // Required field
          paper_size: fileObj.config.paperSize || "A4",
          color_type: fileObj.config.colorType || "black_white",
          sides: fileObj.config.sides || "single",
          copies: fileObj.config.copies || 1,
          binding: fileObj.config.binding || "none",
          lamination: fileObj.config.lamination || "none"
        }));
      });
      
      // Add order data
      const orderData = {
        deliveryType,
        deliveryAddress: deliveryType === 'delivery' ? deliveryAddress : null,
        paymentMethod,
        estimate,
        paymentStatus: paymentMethod === 'cash' ? 'pending' : 'paid'
      };
      
      formData.append('order_data', JSON.stringify(orderData));
      
      const token = localStorage.getItem('auth_token');
      const response = await axios.post(`${API}/orders/create-instore`, formData, {
        headers: {
          'Authorization': token ? `Bearer ${token}` : undefined,
          'Content-Type': 'multipart/form-data'
        }
      });
      
      if (paymentMethod === 'cash') {
        toast.success('Order placed successfully!');
        navigate(`/order-success/${response.data.order_id}?payment=cash`);
      } else {
        toast.success('Redirecting to payment...');
        navigate(`/order-success/${response.data.order_id}?payment=online`);
      }
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

      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* QR Code for In-Store (Show at top for easy scanning) */}
        {qrCodeUrl && (
          <Card className="mb-6 bg-gradient-to-r from-indigo-50 to-blue-50 border-indigo-200">
            <CardContent className="p-6 flex items-center gap-6">
              <img src={qrCodeUrl} alt="QR Code" className="w-32 h-32 border-4 border-white rounded-lg shadow-lg" />
              <div className="flex-1">
                <h3 className="text-xl font-bold text-indigo-900 mb-2">🏪 In-Store Ordering</h3>
                <p className="text-gray-700 mb-1">Scan this QR code to place orders from our shop</p>
                <p className="text-sm text-gray-600">Quick, easy, and secure ordering for walk-in customers</p>
              </div>
            </CardContent>
          </Card>
        )}

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
                Upload Files & Configure
              </CardTitle>
              <CardDescription>Upload files and set individual preferences for each file</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Upload Area */}
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-indigo-500 transition-colors">
                <Input
                  type="file"
                  multiple
                  accept=".pdf,.jpg,.jpeg,.png"
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

              {/* Uploaded Files List with Individual Settings */}
              {uploadedFiles.length > 0 && (
                <div className="space-y-4">
                  <h3 className="font-semibold text-lg">Uploaded Files ({uploadedFiles.length})</h3>
                  {uploadedFiles.map((fileObj) => (
                    <Card key={fileObj.id} className="border-2 border-indigo-100">
                      <CardHeader className="pb-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            {fileObj.type === 'application/pdf' ? (
                              <FileText className="w-8 h-8 text-red-500" />
                            ) : fileObj.type.startsWith('image/') ? (
                              <ImageIcon className="w-8 h-8 text-blue-500" />
                            ) : (
                              <File className="w-8 h-8 text-gray-500" />
                            )}
                            <div>
                              <p className="font-medium">{fileObj.name}</p>
                              <p className="text-sm text-gray-500">
                                {fileObj.totalPages} pages · {(fileObj.size / 1024).toFixed(1)} KB
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              onClick={() => setExpandedFile(expandedFile === fileObj.id ? null : fileObj.id)}
                            >
                              <Settings className="w-4 h-4 mr-1" />
                              Configure
                              {expandedFile === fileObj.id ? <ChevronUp className="w-4 h-4 ml-1" /> : <ChevronDown className="w-4 h-4 ml-1" />}
                            </Button>
                            <Button variant="ghost" size="sm" onClick={() => removeFile(fileObj.id)}>
                              <X className="w-4 h-4 text-red-500" />
                            </Button>
                          </div>
                        </div>
                      </CardHeader>
                      
                      {expandedFile === fileObj.id && (
                        <CardContent className="border-t bg-gray-50 space-y-4">
                          {/* Page Range Selection */}
                          <div>
                            <Label className="mb-2 block">Page Range</Label>
                            <Input
                              value={fileObj.config.pageRanges}
                              onChange={(e) => updateFileConfig(fileObj.id, { pageRanges: e.target.value })}
                              placeholder="e.g., 1-5,10-20,35"
                            />
                            <p className="text-xs text-gray-500 mt-1">
                              Format: "1-5,10-20,35" | Selected: {fileObj.config.selectedPages} pages
                            </p>
                          </div>
                          
                          <div className="grid md:grid-cols-2 gap-4">
                            {/* Paper Size */}
                            <div>
                              <Label className="mb-2 block">Paper Size</Label>
                              <RadioGroup 
                                value={fileObj.config.paperSize} 
                                onValueChange={(v) => updateFileConfig(fileObj.id, { paperSize: v })}
                              >
                                <div className="flex items-center space-x-2">
                                  <RadioGroupItem value="A4" id={`a4-${fileObj.id}`} />
                                  <Label htmlFor={`a4-${fileObj.id}`}>A4</Label>
                                </div>
                                <div className="flex items-center space-x-2">
                                  <RadioGroupItem value="A3" id={`a3-${fileObj.id}`} />
                                  <Label htmlFor={`a3-${fileObj.id}`}>A3</Label>
                                </div>
                              </RadioGroup>
                            </div>

                            {/* Color Type */}
                            <div>
                              <Label className="mb-2 block">Color Type</Label>
                              <RadioGroup 
                                value={fileObj.config.colorType} 
                                onValueChange={(v) => updateFileConfig(fileObj.id, { colorType: v })}
                              >
                                <div className="flex items-center space-x-2">
                                  <RadioGroupItem value="black_white" id={`bw-${fileObj.id}`} />
                                  <Label htmlFor={`bw-${fileObj.id}`}>Black & White</Label>
                                </div>
                                <div className="flex items-center space-x-2">
                                  <RadioGroupItem value="color" id={`color-${fileObj.id}`} />
                                  <Label htmlFor={`color-${fileObj.id}`}>Color</Label>
                                </div>
                              </RadioGroup>
                              <div className="flex items-center space-x-2 mt-2">
                                <Checkbox
                                  id={`auto-${fileObj.id}`}
                                  checked={fileObj.config.autoDetectColor}
                                  onCheckedChange={(checked) => updateFileConfig(fileObj.id, { autoDetectColor: checked })}
                                />
                                <Label htmlFor={`auto-${fileObj.id}`} className="text-sm text-gray-600">
                                  Auto-detect color
                                </Label>
                              </div>
                            </div>

                            {/* Print Sides */}
                            <div>
                              <Label className="mb-2 block">Print Sides</Label>
                              <RadioGroup 
                                value={fileObj.config.sides} 
                                onValueChange={(v) => updateFileConfig(fileObj.id, { sides: v })}
                              >
                                <div className="flex items-center space-x-2">
                                  <RadioGroupItem value="single" id={`single-${fileObj.id}`} />
                                  <Label htmlFor={`single-${fileObj.id}`}>Single Sided</Label>
                                </div>
                                <div className="flex items-center space-x-2">
                                  <RadioGroupItem value="double" id={`double-${fileObj.id}`} />
                                  <Label htmlFor={`double-${fileObj.id}`}>Double Sided</Label>
                                </div>
                              </RadioGroup>
                            </div>

                            {/* Copies */}
                            <div>
                              <Label className="mb-2 block">Number of Copies</Label>
                              <Input
                                type="number"
                                min="1"
                                value={fileObj.config.copies}
                                onChange={(e) => updateFileConfig(fileObj.id, { copies: parseInt(e.target.value) || 1 })}
                              />
                            </div>

                            {/* Binding */}
                            <div>
                              <Label className="mb-2 block">Binding</Label>
                              <RadioGroup 
                                value={fileObj.config.binding} 
                                onValueChange={(v) => updateFileConfig(fileObj.id, { binding: v })}
                              >
                                <div className="flex items-center space-x-2">
                                  <RadioGroupItem value="none" id={`nobind-${fileObj.id}`} />
                                  <Label htmlFor={`nobind-${fileObj.id}`}>None</Label>
                                </div>
                                <div className="flex items-center space-x-2">
                                  <RadioGroupItem value="spiral" id={`spiral-${fileObj.id}`} />
                                  <Label htmlFor={`spiral-${fileObj.id}`}>Spiral Binding</Label>
                                </div>
                              </RadioGroup>
                            </div>

                            {/* Lamination */}
                            <div>
                              <Label className="mb-2 block">Lamination</Label>
                              <RadioGroup 
                                value={fileObj.config.lamination} 
                                onValueChange={(v) => updateFileConfig(fileObj.id, { lamination: v })}
                              >
                                <div className="flex items-center space-x-2">
                                  <RadioGroupItem value="none" id={`nolam-${fileObj.id}`} />
                                  <Label htmlFor={`nolam-${fileObj.id}`}>None</Label>
                                </div>
                                <div className="flex items-center space-x-2">
                                  <RadioGroupItem value="A4" id={`a4lam-${fileObj.id}`} />
                                  <Label htmlFor={`a4lam-${fileObj.id}`}>A4 (₹40)</Label>
                                </div>
                                <div className="flex items-center space-x-2">
                                  <RadioGroupItem value="A3" id={`a3lam-${fileObj.id}`} />
                                  <Label htmlFor={`a3lam-${fileObj.id}`}>A3 (₹60)</Label>
                                </div>
                              </RadioGroup>
                            </div>
                          </div>

                          {/* File Estimate */}
                          <div className="p-3 bg-indigo-50 rounded-lg border border-indigo-200 space-y-2">
                            <div className="flex justify-between items-center">
                              <p className="text-sm font-medium text-indigo-900">
                                Estimate for this file:
                              </p>
                              <p className="text-lg font-bold text-indigo-600">
                                ₹{calculateFileEstimate(fileObj).total.toLocaleString()}
                              </p>
                            </div>
                            {fileObj.config.lamination !== 'none' && (
                              <div className="text-xs bg-amber-100 text-amber-800 p-2 rounded border border-amber-300">
                                <p className="font-semibold">⚠️ Lamination Cost Included:</p>
                                <p>
                                  {fileObj.config.sides === 'double' 
                                    ? `${Math.ceil(fileObj.config.selectedPages / 2)} sheets`
                                    : `${fileObj.config.selectedPages} pages`
                                  } × ₹{fileObj.config.lamination === 'A4' ? '40' : '60'} × {fileObj.config.copies} copies = ₹{calculateFileEstimate(fileObj).laminationCost.toLocaleString()}
                                </p>
                              </div>
                            )}
                          </div>
                        </CardContent>
                      )}
                    </Card>
                  ))}
                </div>
              )}

              <Button onClick={handleNext} className="w-full bg-indigo-600" disabled={uploadedFiles.length === 0}>
                Next: Review & Delivery
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Step 2: Delivery & Payment */}
        {step === 2 && (
          <Card>
            <CardHeader>
              <CardTitle>Delivery & Payment</CardTitle>
              <CardDescription>Choose delivery method and payment option</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Delivery Type */}
              <div>
                <Label className="mb-3 block text-lg font-semibold">Delivery Type</Label>
                <RadioGroup value={deliveryType} onValueChange={setDeliveryType}>
                  <div className="flex items-start space-x-3 p-4 border rounded-lg cursor-pointer hover:bg-gray-50">
                    <RadioGroupItem value="pickup" id="pickup" className="mt-1" />
                    <Label htmlFor="pickup" className="cursor-pointer flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <MapPin className="w-5 h-5 text-indigo-600" />
                        <span className="font-semibold">Store Pickup</span>
                        <Badge variant="outline" className="ml-auto">FREE</Badge>
                      </div>
                      <p className="text-sm text-gray-600">Pick up from Vaishnavi Printers</p>
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
                  <div className="space-y-4 p-4 border rounded-lg bg-gray-50 mt-4">
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
                          placeholder="Hyderabad"
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
              </div>

              {/* Payment Method */}
              <div>
                <Label className="mb-3 block text-lg font-semibold">Payment Method</Label>
                <RadioGroup value={paymentMethod} onValueChange={setPaymentMethod}>
                  <div className="flex items-start space-x-3 p-4 border rounded-lg cursor-pointer hover:bg-gray-50">
                    <RadioGroupItem value="cash" id="cash" className="mt-1" />
                    <Label htmlFor="cash" className="cursor-pointer flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <DollarSign className="w-5 h-5 text-green-600" />
                        <span className="font-semibold">Cash Payment at Store</span>
                        <Badge variant="outline" className="ml-auto bg-green-50 text-green-700 border-green-300">
                          Recommended
                        </Badge>
                      </div>
                      <p className="text-sm text-gray-600">Pay when you collect/receive prints</p>
                    </Label>
                  </div>

                  <div className="flex items-start space-x-3 p-4 border rounded-lg cursor-pointer hover:bg-gray-50">
                    <RadioGroupItem value="online" id="online" className="mt-1" />
                    <Label htmlFor="online" className="cursor-pointer flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <FileText className="w-5 h-5 text-indigo-600" />
                        <span className="font-semibold">Online Payment</span>
                        <Badge variant="outline" className="ml-auto">UPI / Card</Badge>
                      </div>
                      <p className="text-sm text-gray-600">Pay now, prints start immediately</p>
                    </Label>
                  </div>
                </RadioGroup>
              </div>

              <div className="flex gap-3">
                <Button variant="outline" onClick={() => setStep(1)} className="flex-1">Back</Button>
                <Button onClick={handleNext} className="flex-1 bg-indigo-600">Next: Review Order</Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Step 3: Order Review & Confirmation */}
        {step === 3 && estimate && (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calculator className="w-5 h-5 text-indigo-600" />
                  Order Summary
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* File Breakdown */}
                <div className="space-y-3">
                  <h4 className="font-semibold">Files:</h4>
                  {estimate.fileBreakdown.map((file, idx) => (
                    <div key={idx} className="p-3 bg-gray-50 rounded-lg">
                      <div className="flex justify-between items-start">
                        <span className="font-medium text-sm">{file.fileName}</span>
                        <span className="font-bold text-indigo-600">₹{file.total}</span>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Cost Breakdown */}
                <div className="space-y-2 border-t pt-4">
                  <div className="flex justify-between">
                    <span>Printing Cost</span>
                    <span className="font-medium">₹{estimate.printingCost}</span>
                  </div>
                  {estimate.bindingCost > 0 && (
                    <div className="flex justify-between">
                      <span>Binding Cost</span>
                      <span className="font-medium">₹{estimate.bindingCost}</span>
                    </div>
                  )}
                  {estimate.laminationCost > 0 && (
                    <div className="flex justify-between">
                      <span>Lamination Cost</span>
                      <span className="font-medium">₹{estimate.laminationCost}</span>
                    </div>
                  )}
                  <div className="flex justify-between pt-2 border-t">
                    <span className="font-medium">Subtotal</span>
                    <span className="font-medium">₹{estimate.subtotal}</span>
                  </div>
                  {estimate.deliveryCost > 0 && (
                    <div className="flex justify-between">
                      <span>Delivery Charges</span>
                      <span className="font-medium">₹{estimate.deliveryCost}</span>
                    </div>
                  )}
                  <div className="flex justify-between items-center p-4 bg-indigo-50 rounded-lg border-2 border-indigo-200 mt-4">
                    <span className="text-lg font-semibold">Total Amount</span>
                    <span className="text-3xl font-bold text-indigo-600">₹{estimate.total}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="flex gap-3">
              <Button variant="outline" onClick={() => setStep(2)} className="flex-1">Back</Button>
              <Button onClick={handleSubmitOrder} className="flex-1 bg-indigo-600" disabled={loading}>
                {loading ? 'Processing...' : paymentMethod === 'cash' ? 'Place Order (Pay Later)' : 'Proceed to Payment'}
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Lamination Warning Dialog */}
      <AlertDialog open={showLaminationWarning} onOpenChange={setShowLaminationWarning}>
        <AlertDialogContent className="max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-orange-600">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              Important: Lamination Pricing
            </AlertDialogTitle>
            <AlertDialogDescription className="space-y-3 text-base">
              <p className="font-semibold text-gray-900">
                Lamination is charged PER PAGE/SHEET - typically used for certificates and important documents.
              </p>
              
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 space-y-2">
                <p className="font-medium text-blue-900">Pricing:</p>
                <ul className="text-sm text-blue-800 space-y-1 list-disc list-inside">
                  <li><strong>A4:</strong> ₹40 per sheet</li>
                  <li><strong>A3:</strong> ₹60 per sheet</li>
                </ul>
              </div>

              <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 space-y-2">
                <p className="font-medium text-amber-900">Calculation:</p>
                <ul className="text-sm text-amber-800 space-y-1 list-disc list-inside">
                  <li><strong>Single Side:</strong> Total pages × Rate × Copies</li>
                  <li><strong>Double Side:</strong> (Total pages ÷ 2) × Rate × Copies</li>
                </ul>
              </div>

              <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                <p className="text-sm text-red-800">
                  <strong>Example:</strong> 100 pages, single side, A4 = 100 × ₹40 = ₹4,000
                </p>
                <p className="text-sm text-red-800 mt-1">
                  <strong>Note:</strong> Lamination can be expensive for multiple pages!
                </p>
              </div>

              <p className="text-sm text-gray-600 italic">
                Only select lamination if you need professional certificate-quality protection for each page.
              </p>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={handleLaminationCancel}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction onClick={handleLaminationConfirm} className="bg-indigo-600 hover:bg-indigo-700">
              Yes, Add Lamination
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default CustomerPrintPortal;
