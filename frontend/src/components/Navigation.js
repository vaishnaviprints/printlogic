import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Printer, Upload, MapPin, FileText, Phone, Info, DollarSign, Scale, User } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

const Navigation = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  return (
    <header className="border-b bg-white/95 backdrop-blur-sm sticky top-0 z-50 shadow-sm">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-3 hover:opacity-80 transition-opacity">
            <div className="w-10 h-10 rounded-lg bg-indigo-600 flex items-center justify-center">
              <Printer className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
                Vaishnavi Printers
              </h1>
              <p className="text-xs text-gray-500">Quality Printing, Fast Delivery</p>
            </div>
          </Link>

          {/* Main Navigation */}
          <nav className="hidden md:flex items-center gap-6">
            <Link to="/print" className="flex items-center gap-2 text-gray-700 hover:text-indigo-600 transition-colors" data-testid="nav-print">
              <Upload className="w-4 h-4" />
              <span className="font-medium">Upload & Print</span>
            </Link>
            <Link to="/track" className="flex items-center gap-2 text-gray-700 hover:text-indigo-600 transition-colors" data-testid="nav-track">
              <MapPin className="w-4 h-4" />
              Track Order
            </Link>
            <Link to="/pricing" className="text-gray-700 hover:text-indigo-600 transition-colors" data-testid="nav-pricing">
              Pricing
            </Link>
            <Link to="/about" className="text-gray-700 hover:text-indigo-600 transition-colors" data-testid="nav-about">
              About
            </Link>
            <Link to="/contact" className="text-gray-700 hover:text-indigo-600 transition-colors" data-testid="nav-contact">
              Contact
            </Link>
          </nav>

          {/* Auth Buttons */}
          <div className="flex items-center gap-3">
            {user ? (
              <>
                <Button variant="ghost" onClick={() => navigate('/my-orders')} data-testid="nav-my-orders">
                  <User className="w-4 h-4 mr-2" />
                  My Orders
                </Button>
              </>
            ) : (
              <>
                <Button variant="ghost" onClick={() => navigate('/login')} data-testid="nav-login">
                  Login
                </Button>
                <Button onClick={() => navigate('/register')} className="bg-indigo-600 hover:bg-indigo-700" data-testid="nav-register">
                  Register
                </Button>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default Navigation;
