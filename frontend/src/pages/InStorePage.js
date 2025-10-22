import React from 'react';
import SystemTrayPopup from '@/components/SystemTrayPopup';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Store } from 'lucide-react';

const InStorePage = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 p-8">
      <div className="max-w-4xl mx-auto">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-3">
              <Store className="w-8 h-8 text-indigo-600" />
              In-Store Management System
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <p className="text-gray-700">
                This page is for store staff to manage in-store orders. The notification tray on the bottom-right 
                will show all pending cash payments and active print jobs.
              </p>
              
              <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-4">
                <h3 className="font-semibold text-indigo-900 mb-2">How to use:</h3>
                <ul className="list-disc list-inside space-y-1 text-sm text-indigo-800">
                  <li>Keep this page open during store hours</li>
                  <li>The notification tray updates automatically every 10 seconds</li>
                  <li>Approve cash payments when customer pays at counter</li>
                  <li>Monitor active print jobs in real-time</li>
                  <li>You can minimize the tray when not needed</li>
                </ul>
              </div>

              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <h3 className="font-semibold text-green-900 mb-2">Order Flow:</h3>
                <ol className="list-decimal list-inside space-y-1 text-sm text-green-800">
                  <li>Customer scans QR code and uploads files</li>
                  <li>If payment method is "Cash" → Order appears in "Awaiting Cash Payment"</li>
                  <li>Staff clicks "Approve" after receiving cash</li>
                  <li>Order moves to "Active Orders" and sent to print queue</li>
                  <li>Print client picks up job and prints automatically</li>
                </ol>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* System Tray Popup */}
      <SystemTrayPopup />
    </div>
  );
};

export default InStorePage;
