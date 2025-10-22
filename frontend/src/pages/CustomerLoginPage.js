import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import axios from 'axios';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const CustomerLoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [mobile, setMobile] = useState('');
  const [otp, setOtp] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleEmailLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const formData = new FormData();
      formData.append('email', email);
      formData.append('password', password);
      
      const response = await axios.post(`${API}/auth/customer/login`, formData);
      localStorage.setItem('auth_token', response.data.access_token);
      axios.defaults.headers.common['Authorization'] = `Bearer ${response.data.access_token}`;
      toast.success('Login successful!');
      navigate('/my-orders');
    } catch (error) {
      console.error('Login error:', error);
      toast.error(error.response?.data?.detail || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  const handleRequestOTP = async () => {
    if (!mobile) {
      toast.error('Please enter mobile number');
      return;
    }
    setLoading(true);
    try {
      const formData = new FormData();
      formData.append('mobile', mobile);
      
      const response = await axios.post(`${API}/auth/customer/request-otp`, formData);
      setOtpSent(true);
      toast.success('OTP sent to your mobile!');
      if (response.data.otp_debug) {
        toast.info(`Debug OTP: ${response.data.otp_debug}`, { duration: 10000 });
      }
    } catch (error) {
      console.error('OTP error:', error);
      toast.error(error.response?.data?.detail || 'Failed to send OTP');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOTP = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const formData = new FormData();
      formData.append('mobile', mobile);
      formData.append('otp', otp);
      
      const response = await axios.post(`${API}/auth/customer/verify-otp`, formData);
      localStorage.setItem('auth_token', response.data.access_token);
      axios.defaults.headers.common['Authorization'] = `Bearer ${response.data.access_token}`;
      toast.success('Login successful!');
      navigate('/my-orders');
    } catch (error) {
      console.error('OTP verification error:', error);
      toast.error(error.response?.data?.detail || 'Invalid OTP');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      
      <div className="max-w-md mx-auto px-4 py-12" data-testid="customer-login-page">
        <div className="bg-white rounded-lg shadow-sm p-8">
          <h1 className="text-2xl font-bold text-gray-900 mb-6" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
            Customer Login
          </h1>

          <Tabs defaultValue="email">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="email">Email</TabsTrigger>
              <TabsTrigger value="mobile">Mobile OTP</TabsTrigger>
            </TabsList>

            <TabsContent value="email">
              <form onSubmit={handleEmailLogin} className="space-y-4 mt-4">
                <div>
                  <Label>Email</Label>
                  <Input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="your@email.com"
                    required
                    data-testid="email-input"
                  />
                </div>
                <div>
                  <Label>Password</Label>
                  <Input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                    data-testid="password-input"
                  />
                </div>
                <div className="flex items-center justify-end">
                  <Button
                    type="button"
                    variant="link"
                    className="text-sm text-indigo-600 hover:text-indigo-700 p-0 h-auto"
                    onClick={() => navigate('/forgot-password')}
                  >
                    Forgot Password?
                  </Button>
                </div>
                <Button type="submit" className="w-full" disabled={loading} data-testid="email-login-btn">
                  {loading ? 'Logging in...' : 'Login'}
                </Button>
              </form>
            </TabsContent>

            <TabsContent value="mobile">
              {!otpSent ? (
                <div className="space-y-4 mt-4">
                  <div>
                    <Label>Mobile Number</Label>
                    <Input
                      type="tel"
                      value={mobile}
                      onChange={(e) => setMobile(e.target.value)}
                      placeholder="+919876543210"
                      required
                      data-testid="mobile-input"
                    />
                  </div>
                  <Button onClick={handleRequestOTP} className="w-full" disabled={loading} data-testid="request-otp-btn">
                    {loading ? 'Sending...' : 'Send OTP'}
                  </Button>
                </div>
              ) : (
                <form onSubmit={handleVerifyOTP} className="space-y-4 mt-4">
                  <div>
                    <Label>Enter OTP</Label>
                    <Input
                      type="text"
                      value={otp}
                      onChange={(e) => setOtp(e.target.value)}
                      placeholder="123456"
                      maxLength={6}
                      required
                      data-testid="otp-input"
                    />
                    <p className="text-sm text-gray-500 mt-1">OTP sent to {mobile}</p>
                  </div>
                  <Button type="submit" className="w-full" disabled={loading} data-testid="verify-otp-btn">
                    {loading ? 'Verifying...' : 'Verify OTP'}
                  </Button>
                  <Button type="button" variant="ghost" onClick={() => setOtpSent(false)} className="w-full">
                    Change Mobile
                  </Button>
                </form>
              )}
            </TabsContent>
          </Tabs>

          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600">
              Don't have an account?{' '}
              <Link to="/register" className="text-indigo-600 hover:text-indigo-700 font-medium">
                Register here
              </Link>
            </p>
          </div>
        </div>
      </div>
      
      <Footer />
    </div>
  );
};

export default CustomerLoginPage;
