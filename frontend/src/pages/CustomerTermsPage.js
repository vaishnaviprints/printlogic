import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Printer, ArrowLeft } from 'lucide-react';
import Footer from '@/components/Footer';

const CustomerTermsPage = () => {
  const navigate = useNavigate();

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
          <Button variant="outline" onClick={() => navigate(-1)}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 py-12">
        <Card>
          <CardHeader>
            <CardTitle className="text-3xl font-bold text-center text-indigo-900">
              Customer Terms & Conditions
            </CardTitle>
            <p className="text-center text-gray-600 mt-2">Last Updated: January 2025</p>
          </CardHeader>
          <CardContent className="prose prose-sm max-w-none">
            <section className="mb-6">
              <h2 className="text-xl font-bold text-gray-900 mb-3">1. Acceptance of Terms</h2>
              <p className="text-gray-700">
                By placing an order with Vaishnavi Printers, you accept these Terms & Conditions.
              </p>
            </section>

            <section className="mb-6">
              <h2 className="text-xl font-bold text-gray-900 mb-3">2. Printing Services</h2>
              <ul className="list-disc pl-6 text-gray-700 space-y-2">
                <li>We provide professional printing services including documents, photos, and materials</li>
                <li>Services are provided at our Hyderabad locations</li>
                <li>Orders are processed on a first-come, first-served basis unless priority service is purchased</li>
              </ul>
            </section>

            <section className="mb-6">
              <h2 className="text-xl font-bold text-gray-900 mb-3">3. Orders & Pricing</h2>
              <ul className="list-disc pl-6 text-gray-700 space-y-2">
                <li>All prices are in Indian Rupees (INR)</li>
                <li>Prices displayed are inclusive of applicable GST</li>
                <li>Final pricing is confirmed before payment/order confirmation</li>
                <li>Bulk discounts may apply for large orders</li>
              </ul>
            </section>

            <section className="mb-6">
              <h2 className="text-xl font-bold text-gray-900 mb-3">4. Payment</h2>
              <ul className="list-disc pl-6 text-gray-700 space-y-2">
                <li>We accept Cash, UPI, Cards, and Net Banking</li>
                <li>For Cash orders: Payment required at time of collection</li>
                <li>For Online orders: Payment processed through secure gateway</li>
              </ul>
            </section>

            <section className="mb-6 bg-red-50 border-2 border-red-200 rounded-lg p-4">
              <h2 className="text-xl font-bold text-red-900 mb-3">5. ⚠️ NO RETURNS OR REFUNDS AFTER PRINTING</h2>
              <p className="text-red-800 font-semibold mb-3">
                IMPORTANT: Once printing is completed, NO RETURNS or REFUNDS are provided
              </p>
              <p className="text-gray-700 mb-2">It is customer's responsibility to verify:</p>
              <ul className="list-disc pl-6 text-gray-700 space-y-1">
                <li>File correctness</li>
                <li>Print specifications (size, color, sides)</li>
                <li>Quantity and copies</li>
              </ul>
              <p className="text-gray-700 mt-3">
                Customers are encouraged to review proof/sample before bulk printing
              </p>
            </section>

            <section className="mb-6">
              <h2 className="text-xl font-bold text-gray-900 mb-3">6. Print Quality Standards</h2>
              <ul className="list-disc pl-6 text-gray-700 space-y-2">
                <li>We maintain high print quality standards</li>
                <li>Quality depends on source file quality</li>
                <li>Low-resolution files may result in lower print quality</li>
              </ul>
            </section>

            <section className="mb-6">
              <h2 className="text-xl font-bold text-gray-900 mb-3">7. Customer Complaints & Reprints</h2>
              <ul className="list-disc pl-6 text-gray-700 space-y-2">
                <li>Valid complaints must be raised within 24 hours of collection</li>
                <li>For quality issues, customers MUST provide:
                  <ul className="list-circle pl-6 mt-1">
                    <li>Clear photos of the print defect</li>
                    <li>Proof of file quality (screenshot/original file)</li>
                    <li>Order number and collection receipt</li>
                  </ul>
                </li>
                <li>We reserve the right to inspect prints before approving reprint</li>
                <li>False/frivolous complaints may result in service denial</li>
              </ul>
            </section>

            <section className="mb-6">
              <h2 className="text-xl font-bold text-gray-900 mb-3">8. Reprint & Cancellation Policy</h2>
              <div className="bg-green-50 border border-green-200 rounded-lg p-3 mb-3">
                <p className="font-semibold text-green-900 mb-2">Reprints approved ONLY if:</p>
                <ul className="list-disc pl-6 text-green-800 space-y-1">
                  <li>Printing error on our part (wrong settings, machine defect)</li>
                  <li>Damaged during printing process</li>
                </ul>
              </div>
              <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                <p className="font-semibold text-red-900 mb-2">NO reprint for:</p>
                <ul className="list-disc pl-6 text-red-800 space-y-1">
                  <li>Customer's incorrect file</li>
                  <li>Customer-approved specifications</li>
                  <li>Changes in customer preference after printing</li>
                </ul>
              </div>
              <p className="text-gray-700 mt-3">
                Cancellations allowed only BEFORE printing starts
              </p>
            </section>

            <section className="mb-6">
              <h2 className="text-xl font-bold text-gray-900 mb-3">9. Delivery & Collection</h2>
              <ul className="list-disc pl-6 text-gray-700 space-y-2">
                <li>Pickup orders: Must be collected within 7 days</li>
                <li>Home delivery: ₹50 charges apply</li>
                <li>Uncollected orders may incur storage charges after 7 days</li>
              </ul>
            </section>

            <section className="mb-6 bg-indigo-50 border-2 border-indigo-200 rounded-lg p-4">
              <h2 className="text-xl font-bold text-indigo-900 mb-3">10. 🏛️ FINAL AUTHORITY</h2>
              <p className="text-indigo-800 font-semibold">
                All decisions regarding complaints, refunds, and reprints rest solely with Vaishnavi Printers and Admin
              </p>
              <ul className="list-disc pl-6 text-gray-700 space-y-1 mt-2">
                <li>Management's decision is final and binding</li>
                <li>In case of disputes, Hyderabad jurisdiction applies</li>
              </ul>
            </section>

            <section className="mb-6">
              <h2 className="text-xl font-bold text-gray-900 mb-3">11. Liability</h2>
              <ul className="list-disc pl-6 text-gray-700 space-y-2">
                <li>We are not liable for delays due to technical issues, power failures, or circumstances beyond our control</li>
                <li>Maximum liability limited to order value</li>
              </ul>
            </section>

            <section className="mb-6">
              <h2 className="text-xl font-bold text-gray-900 mb-3">12. Privacy</h2>
              <ul className="list-disc pl-6 text-gray-700 space-y-2">
                <li>Customer files are confidential and deleted after order completion</li>
                <li>Personal data used only for order processing</li>
              </ul>
            </section>

            <section className="mb-6">
              <h2 className="text-xl font-bold text-gray-900 mb-3">13. Contact</h2>
              <div className="bg-gray-100 rounded-lg p-4">
                <p className="font-semibold text-gray-900">Vaishnavi Printers</p>
                <p className="text-gray-700">2-49, Taranagar, Serilingampally, Hyderabad - 500019</p>
                <p className="text-gray-700">Phone: +91 9618667700</p>
                <p className="text-gray-700">Email: support@vaishnaviprinters.com</p>
              </div>
            </section>

            <div className="border-t-2 border-gray-300 pt-6 mt-8 text-center">
              <p className="text-gray-900 font-semibold text-lg">
                By using our services, you agree to these terms.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Footer />
    </div>
  );
};

export default CustomerTermsPage;
