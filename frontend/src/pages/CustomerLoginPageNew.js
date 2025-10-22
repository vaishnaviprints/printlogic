import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';
import axios from 'axios';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;
const FRONTEND_URL = window.location.origin;

const CustomerLoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [processingSession, setProcessingSession] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  // Check for existing session on mount
  useEffect(() => {
    checkExistingSession();
  }, []);

  // Process Google OAuth session_id from URL fragment
  useEffect(() => {
    const hash = window.location.hash;
    if (hash && hash.includes('session_id=')) {
      const sessionId = hash.split('session_id=')[1].split('&')[0];
      processGoogleSession(sessionId);
      // Clean URL
      window.history.replaceState(null, '', window.location.pathname);
    }
  }, []);

  const checkExistingSession = async () => {
    try {
      const response = await axios.get(`${API}/auth/session/verify`, { withCredentials: true });
      if (response.data.authenticated) {
        // Already logged in, redirect
        navigate('/my-orders');
      }
    } catch (error) {
      // Not logged in, show login page
    }
  };

  const processGoogleSession = async (sessionId) => {
    setProcessingSession(true);
    try {
      const response = await axios.post(
        `${API}/auth/google/session`,
        {},
        {
          headers: { 'X-Session-ID': sessionId },
          withCredentials: true
        }
      );

      if (response.data.success) {
        // Store token
        localStorage.setItem('auth_token', response.data.access_token);
        axios.defaults.headers.common['Authorization'] = `Bearer ${response.data.access_token}`;
        
        toast.success(`Welcome, ${response.data.user.name}!`);
        navigate('/my-orders');
      }
    } catch (error) {
      console.error('Google session error:', error);
      toast.error('Google login failed. Please try again.');
    } finally {
      setProcessingSession(false);
    }
  };

  const handleGoogleLogin = () => {
    const redirectUrl = `${FRONTEND_URL}/login`;
    const authUrl = `https://auth.emergentagent.com/?redirect=${encodeURIComponent(redirectUrl)}`;
    window.location.href = authUrl;
  };

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

  if (processingSession) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-indigo-50">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6 text-center">
            <Loader2 className="w-12 h-12 text-indigo-600 animate-spin mx-auto mb-4" />
            <p className="text-lg font-semibold text-gray-900">Completing Google Sign In...</p>
            <p className="text-sm text-gray-600 mt-2">Please wait</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      <Navigation />
      
      <div className="max-w-md mx-auto px-4 py-12">
        <Card>
          <CardHeader className="text-center">
            <CardTitle className="text-3xl font-bold">Customer Login</CardTitle>
            <CardDescription>Sign in to manage your printing orders</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Google Sign In Button */}
            <Button
              onClick={handleGoogleLogin}
              variant="outline"
              className="w-full h-12 text-base border-2 hover:bg-gray-50"
            >
              <svg className="w-5 h-5 mr-3" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              Sign in with Google
            </Button>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-4 bg-white text-gray-500">Or continue with email</span>
              </div>
            </div>

            {/* Email/Password Login */}
            <form onSubmit={handleEmailLogin} className="space-y-4">
              <div>
                <Label>Email</Label>
                <Input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="your.email@example.com"
                  required
                />
              </div>
              <div>
                <div className="flex justify-between items-center mb-2">
                  <Label>Password</Label>
                  <Link to="/forgot-password" className="text-sm text-indigo-600 hover:text-indigo-700">
                    Forgot Password?
                  </Link>
                </div>
                <Input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                />
              </div>
              <Button type="submit" className="w-full bg-indigo-600" disabled={loading}>
                {loading ? 'Signing in...' : 'Sign In'}
              </Button>
            </form>

            <div className="text-center text-sm">
              <span className="text-gray-600">Don't have an account? </span>
              <Link to="/register" className="text-indigo-600 font-semibold hover:text-indigo-700">
                Register Now
              </Link>
            </div>

            {/* Login Options Footer */}
            <div className="pt-6 border-t">
              <p className="text-sm text-gray-600 mb-3 text-center">Other Login Options:</p>
              <div className="flex justify-center gap-4">
                <Link to="/vendor/login" className="text-sm text-gray-700 hover:text-indigo-600 font-medium">
                  Vendor Login
                </Link>
                <span className="text-gray-400">•</span>
                <Link to="/system-admin-portal-2025/admin/login" className="text-sm text-gray-700 hover:text-indigo-600 font-medium">
                  Admin Login
                </Link>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Footer />
    </div>
  );
};

export default CustomerLoginPage;
