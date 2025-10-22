import React, { useEffect, useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, Printer, MapPin, DollarSign, Clock, QrCode } from 'lucide-react';
import QRCode from 'qrcode';

const OrderSuccessPage = () => {
  const navigate = useNavigate();
  const { orderId } = useParams();
  const [searchParams] = useSearchParams();
  const paymentType = searchParams.get('payment');
  const [qrCode, setQrCode] = useState('');

  useEffect(() => {
    // Generate QR code for order ID
    QRCode.toDataURL(orderId, { width: 200 })
      .then(url => setQrCode(url))
      .catch(err => console.error(err));
  }, [orderId]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      <header className="border-b bg-white/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => navigate('/')}>
            <div className="w-10 h-10 rounded-lg bg-indigo-600 flex items-center justify-center">
              <Printer className="w-6 h-6 text-white" />
            </div>
            <h1 className="text-xl font-bold">Vaishnavi Printers</h1>
          </div>
        </div>
      </header>

      <div className="max-w-3xl mx-auto px-4 py-12">
        <div className="text-center mb-8">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="w-12 h-12 text-green-600" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            {paymentType === 'cash' ? 'Order Placed Successfully!' : 'Payment Successful!'}
          </h1>
          <p className="text-gray-600">
            {paymentType === 'cash' 
              ? 'Your order has been received. Please pay at the counter when collecting your prints.'
              : 'Your payment is confirmed. Your prints are being prepared.'}
          </p>
        </div>

        <Card className="mb-6">
          <CardHeader className="text-center border-b bg-gray-50">
            <CardTitle className="text-2xl">Order ID</CardTitle>
            <div className="text-4xl font-bold text-indigo-600 mt-2 tracking-wider">{orderId}</div>
            <Badge className="mt-3" variant={paymentType === 'cash' ? 'outline' : 'default'}>
              {paymentType === 'cash' ? 'Payment Pending' : 'Payment Completed'}
            </Badge>
          </CardHeader>
          <CardContent className="pt-6">
            {qrCode && (
              <div className="text-center mb-6">
                <p className="text-sm text-gray-600 mb-3">Show this QR code at the counter</p>
                <img src={qrCode} alt="Order QR Code" className="mx-auto border-4 border-gray-200 rounded-lg" />
              </div>
            )}

            {paymentType === 'cash' ? (
              <div className="space-y-4">
                <div className="flex items-start gap-3 p-4 bg-blue-50 rounded-lg border border-blue-200">
                  <Clock className="w-5 h-5 text-blue-600 mt-0.5" />
                  <div>
                    <h3 className="font-semibold text-blue-900">Next Steps:</h3>
                    <ol className="text-sm text-blue-800 mt-2 space-y-1 list-decimal list-inside">
                      <li>Visit the store and show this Order ID or QR code</li>
                      <li>Staff will verify and start printing</li>
                      <li>Pay the amount after checking your prints</li>
                      <li>Collect your prints!</li>
                    </ol>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-4 bg-green-50 rounded-lg border border-green-200">
                  <DollarSign className="w-5 h-5 text-green-600 mt-0.5" />
                  <div>
                    <h3 className="font-semibold text-green-900">Payment Options at Counter:</h3>
                    <p className="text-sm text-green-800 mt-1">Cash • UPI • Card</p>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-4 bg-gray-50 rounded-lg border">
                  <MapPin className="w-5 h-5 text-gray-600 mt-0.5" />
                  <div>
                    <h3 className="font-semibold">Visit Our Stores:</h3>
                    <div className="text-sm text-gray-600 mt-2 space-y-2">
                      <div>
                        <p className="font-medium">Vaishnavi Central</p>
                        <p>2-49, Taranagar, Serilingampally, Hyderabad - 500019</p>
                      </div>
                      <div>
                        <p className="font-medium">Kukatpally Branch</p>
                        <p>Kukatpally, Hyderabad - 500072</p>
                      </div>
                      <div>
                        <p className="font-medium">Madhapur Branch</p>
                        <p>Madhapur, Hyderabad - 500081</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex items-start gap-3 p-4 bg-green-50 rounded-lg border border-green-200">
                  <CheckCircle className="w-5 h-5 text-green-600 mt-0.5" />
                  <div>
                    <h3 className="font-semibold text-green-900">Payment Confirmed!</h3>
                    <p className="text-sm text-green-800 mt-1">Your order is being processed with priority. You'll receive a notification when ready.</p>
                  </div>
                </div>

                <div className="text-center p-4 bg-indigo-50 rounded-lg">
                  <p className="text-sm text-gray-600 mb-2">Expected completion:</p>
                  <p className="text-lg font-semibold text-indigo-600">Within 30 minutes</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <div className="flex gap-3">
          <Button variant="outline" onClick={() => navigate('/track')} className="flex-1">
            Track Order
          </Button>
          <Button onClick={() => navigate('/print')} className="flex-1 bg-indigo-600">
            Place Another Order
          </Button>
        </div>

        <div className="text-center mt-6">
          <p className="text-sm text-gray-500">
            Need help? Call us at <a href="tel:+919618667700" className="text-indigo-600 font-medium">+91 96186 67700</a>
          </p>
        </div>
      </div>
    </div>
  );
};

export default OrderSuccessPage;
