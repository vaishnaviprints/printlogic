import React from 'react';
import { Link } from 'react-router-dom';
import { Mail, Phone, MapPin } from 'lucide-react';

const Footer = () => {
  return (
    <footer className="bg-gray-900 text-gray-300 mt-20">
      <div className="max-w-7xl mx-auto px-4 py-12">
        <div className="grid md:grid-cols-4 gap-8">
          {/* Company Info */}
          <div>
            <h3 className="text-white font-bold text-lg mb-4" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
              Vaishnavi Printers
            </h3>
            <p className="text-sm text-gray-400 mb-4">
              Professional printing services with fast turnaround and quality guarantee.
            </p>
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm">
                <Phone className="w-4 h-4" />
                +91 98765 43210
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Mail className="w-4 h-4" />
                support@vaishnavi.com
              </div>
              <div className="flex items-center gap-2 text-sm">
                <MapPin className="w-4 h-4" />
                2-49, Taranagar, Serilingampally, Hyderabad - 500019
              </div>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-white font-semibold mb-4">Quick Links</h4>
            <ul className="space-y-2 text-sm">
              <li><Link to="/about" className="hover:text-white transition-colors">About Us</Link></li>
              <li><Link to="/pricing" className="hover:text-white transition-colors">Pricing</Link></li>
              <li><Link to="/track" className="hover:text-white transition-colors">Track Order</Link></li>
              <li><Link to="/contact" className="hover:text-white transition-colors">Contact Us</Link></li>
            </ul>
          </div>

          {/* Services */}
          <div>
            <h4 className="text-white font-semibold mb-4">Services</h4>
            <ul className="space-y-2 text-sm">
              <li><span className="text-gray-400">Document Printing</span></li>
              <li><span className="text-gray-400">Photo Printing</span></li>
              <li><span className="text-gray-400">Spiral Binding</span></li>
              <li><span className="text-gray-400">Lamination</span></li>
              <li><span className="text-gray-400">Home Delivery</span></li>
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h4 className="text-white font-semibold mb-4">Legal & Support</h4>
            <ul className="space-y-2 text-sm">
              <li><Link to="/terms/customer" className="hover:text-white transition-colors">Terms & Conditions</Link></li>
              <li><Link to="/privacy" className="hover:text-white transition-colors">Privacy Policy</Link></li>
              <li><Link to="/contact" className="hover:text-white transition-colors">Contact Support</Link></li>
              <li><Link to="/vendor/login" className="hover:text-white transition-colors">Vendor Portal</Link></li>
            </ul>
          </div>
        </div>

        <div className="border-t border-gray-800 mt-8 pt-8 text-center text-sm text-gray-500">
          <p>&copy; 2025 Vaishnavi Printers. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
