import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Printer, Clock, Shield, Zap, MapPin, Phone, Mail } from 'lucide-react';

const HomePage = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      {/* Header with Full Navigation */}
      <header className="border-b bg-white/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3 cursor-pointer" onClick={() => navigate('/')}>
              <div className="w-10 h-10 rounded-lg bg-indigo-600 flex items-center justify-center">
                <Printer className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">Vaishnavi Printers</h1>
                <p className="text-xs text-gray-500">Quality Printing, Fast Delivery</p>
              </div>
            </div>
            
            {/* Navigation Links */}
            <nav className="hidden md:flex items-center gap-6">
              <button onClick={() => navigate('/')} className="text-gray-700 hover:text-indigo-600 font-medium transition-colors">
                Home
              </button>
              <button onClick={() => navigate('/about')} className="text-gray-700 hover:text-indigo-600 font-medium transition-colors">
                About Us
              </button>
              <button onClick={() => navigate('/pricing')} className="text-gray-700 hover:text-indigo-600 font-medium transition-colors">
                Pricing
              </button>
              <button onClick={() => navigate('/track')} className="text-gray-700 hover:text-indigo-600 font-medium transition-colors">
                Track Order
              </button>
              <button onClick={() => navigate('/contact')} className="text-gray-700 hover:text-indigo-600 font-medium transition-colors">
                Contact
              </button>
            </nav>

            {/* Auth Buttons */}
            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                onClick={() => navigate('/login')}
                data-testid="customer-login-btn"
              >
                Login
              </Button>
              <Button
                className="bg-indigo-600 hover:bg-indigo-700"
                onClick={() => navigate('/register')}
                data-testid="customer-register-btn"
              >
                Sign Up
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="max-w-7xl mx-auto px-4 py-20">
        <div className="text-center max-w-3xl mx-auto">
          <h2 className="text-5xl md:text-6xl font-bold text-gray-900 mb-6" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
            Professional Printing
            <span className="block text-indigo-600 mt-2">Made Simple</span>
          </h2>
          <p className="text-lg text-gray-600 mb-8" style={{ fontFamily: 'Inter, sans-serif' }}>
            Upload your documents, get instant estimates, and choose pickup or delivery.
            Fast, reliable, and affordable printing services at your fingertips.
          </p>
          <Button
            size="lg"
            className="bg-indigo-600 hover:bg-indigo-700 text-white px-8 py-6 text-lg rounded-full shadow-lg hover:shadow-xl transition-all"
            onClick={() => navigate('/print')}
            data-testid="get-started-btn"
          >
            Get Started
          </Button>
        </div>
      </section>

      {/* Features */}
      <section className="max-w-7xl mx-auto px-4 py-16">
        <div className="grid md:grid-cols-4 gap-8">
          <FeatureCard
            icon={<Zap className="w-8 h-8 text-indigo-600" />}
            title="Instant Estimates"
            description="Get real-time pricing as you upload your documents"
          />
          <FeatureCard
            icon={<Clock className="w-8 h-8 text-indigo-600" />}
            title="Fast Turnaround"
            description="Same-day printing for urgent orders"
          />
          <FeatureCard
            icon={<Shield className="w-8 h-8 text-indigo-600" />}
            title="Secure Upload"
            description="Your documents are encrypted and protected"
          />
          <FeatureCard
            icon={<Printer className="w-8 h-8 text-indigo-600" />}
            title="Multiple Options"
            description="Choose from various paper types, binding, and finishing"
          />
        </div>
      </section>

      {/* CTA Section */}
      <section className="max-w-7xl mx-auto px-4 py-20">
        <div className="bg-gradient-to-r from-indigo-600 to-blue-600 rounded-3xl p-12 text-center text-white">
          <h3 className="text-3xl font-bold mb-4" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
            Ready to Print?
          </h3>
          <p className="text-lg mb-8 text-indigo-100">
            Start your order now and get your documents printed today
          </p>
          <Button
            size="lg"
            className="bg-white text-indigo-600 hover:bg-gray-100 px-8 py-6 text-lg rounded-full"
            onClick={() => navigate('/print')}
            data-testid="start-order-btn"
          >
            Start Order
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t bg-gray-900 text-white mt-20">
        <div className="max-w-7xl mx-auto px-4 py-12">
          <div className="grid md:grid-cols-4 gap-8">
            {/* Company Info */}
            <div>
              <div className="flex items-center gap-2 mb-4">
                <Printer className="w-6 h-6" />
                <span className="font-bold text-lg">Vaishnavi Printers</span>
              </div>
              <p className="text-gray-400 text-sm">
                Professional printing services with fast delivery across Hyderabad
              </p>
            </div>

            {/* Quick Links */}
            <div>
              <h4 className="font-semibold mb-4">Quick Links</h4>
              <ul className="space-y-2 text-sm text-gray-400">
                <li><button onClick={() => navigate('/')} className="hover:text-white transition-colors">Home</button></li>
                <li><button onClick={() => navigate('/about')} className="hover:text-white transition-colors">About Us</button></li>
                <li><button onClick={() => navigate('/pricing')} className="hover:text-white transition-colors">Pricing</button></li>
                <li><button onClick={() => navigate('/track')} className="hover:text-white transition-colors">Track Order</button></li>
              </ul>
            </div>

            {/* Services */}
            <div>
              <h4 className="font-semibold mb-4">Services</h4>
              <ul className="space-y-2 text-sm text-gray-400">
                <li>Document Printing</li>
                <li>Binding & Lamination</li>
                <li>Color Printing</li>
                <li>Same Day Delivery</li>
              </ul>
            </div>

            {/* Contact */}
            <div>
              <h4 className="font-semibold mb-4">Contact Us</h4>
              <ul className="space-y-3 text-sm text-gray-400">
                <li className="flex items-center gap-2">
                  <Phone className="w-4 h-4" />
                  <div>
                    <div>+91 96186 67700</div>
                    <div className="text-xs">Vendor Registration / Issues</div>
                    <div className="text-xs">Customer Care</div>
                  </div>
                </li>
                <li className="flex items-center gap-2">
                  <Mail className="w-4 h-4" />
                  <span>info@vaishnaviprinters.com</span>
                </li>
                <li className="flex items-start gap-2">
                  <MapPin className="w-4 h-4 mt-0.5" />
                  <span>Hyderabad, Telangana, India</span>
                </li>
              </ul>
            </div>
          </div>

          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-sm text-gray-400">
            <p>&copy; 2025 Vaishnavi Printers. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

const FeatureCard = ({ icon, title, description }) => (
  <div className="bg-white p-6 rounded-xl shadow-sm hover:shadow-md transition-all border border-gray-100">
    <div className="mb-4">{icon}</div>
    <h4 className="text-lg font-semibold text-gray-900 mb-2" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
      {title}
    </h4>
    <p className="text-sm text-gray-600" style={{ fontFamily: 'Inter, sans-serif' }}>
      {description}
    </p>
  </div>
);

export default HomePage;
