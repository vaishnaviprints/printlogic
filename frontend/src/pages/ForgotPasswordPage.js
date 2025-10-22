import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { Printer, ArrowLeft, Mail, Lock, CheckCircle } from 'lucide-react';
import axios from 'axios';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const ForgotPasswordPage = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(1); // 1: Email, 2: OTP, 3: New Password
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSendOTP = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      await axios.post(`${API}/auth/forgot-password`, { email });
      toast.success('OTP sent to your email!');
      setStep(2);
    } catch (error) {
      console.error('Failed to send OTP:', error);
      toast.error(error.response?.data?.detail || 'Failed to send OTP. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOTP = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      await axios.post(`${API}/auth/verify-otp`, { email, otp });
      toast.success('OTP verified successfully!');
      setStep(3);
    } catch (error) {
      console.error('Failed to verify OTP:', error);
      toast.error(error.response?.data?.detail || 'Invalid OTP. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    
    if (newPassword !== confirmPassword) {
      toast.error('Passwords do not match!');
      return;
    }

    if (newPassword.length < 6) {
      toast.error('Password must be at least 6 characters!');
      return;
    }

    setLoading(true);
    
    try {
      await axios.post(`${API}/auth/reset-password`, { 
        email, 
        otp, 
        new_password: newPassword 
      });
      toast.success('Password reset successfully!');
      setTimeout(() => navigate('/login'), 2000);
    } catch (error) {
      console.error('Failed to reset password:', error);
      toast.error(error.response?.data?.detail || 'Failed to reset password. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-lg bg-indigo-600 flex items-center justify-center">
              <Printer className="w-7 h-7 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900">Vaishnavi Printers</h1>
          </div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Forgot Password?</h2>
          <p className="text-gray-600 text-sm">
            {step === 1 && "Enter your email to receive an OTP"}
            {step === 2 && "Enter the OTP sent to your email"}
            {step === 3 && "Create your new password"}
          </p>
        </div>

        <Card>
          <CardContent className="pt-6">
            {/* Step 1: Email */}
            {step === 1 && (
              <form onSubmit={handleSendOTP} className="space-y-4">
                <div>
                  <Label htmlFor="email">Email Address</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                    <Input
                      id="email"
                      type="email"
                      placeholder="your.email@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="pl-10"
                      required
                    />
                  </div>
                </div>
                <Button
                  type="submit"
                  className="w-full bg-indigo-600 hover:bg-indigo-700"
                  disabled={loading}
                >
                  {loading ? 'Sending...' : 'Send OTP'}
                </Button>
              </form>
            )}

            {/* Step 2: OTP */}
            {step === 2 && (
              <form onSubmit={handleVerifyOTP} className="space-y-4">
                <div>
                  <Label htmlFor="otp">Enter OTP</Label>
                  <Input
                    id="otp"
                    type="text"
                    placeholder="Enter 6-digit OTP"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value)}
                    maxLength={6}
                    required
                  />
                  <p className="text-xs text-gray-500 mt-2">
                    Check your email for the OTP code
                  </p>
                </div>
                <div className="flex gap-3">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setStep(1)}
                    className="flex-1"
                  >
                    Back
                  </Button>
                  <Button
                    type="submit"
                    className="flex-1 bg-indigo-600 hover:bg-indigo-700"
                    disabled={loading}
                  >
                    {loading ? 'Verifying...' : 'Verify OTP'}
                  </Button>
                </div>
                <Button
                  type="button"
                  variant="link"
                  onClick={handleSendOTP}
                  className="w-full text-sm"
                  disabled={loading}
                >
                  Resend OTP
                </Button>
              </form>
            )}

            {/* Step 3: New Password */}
            {step === 3 && (
              <form onSubmit={handleResetPassword} className="space-y-4">
                <div>
                  <Label htmlFor="newPassword">New Password</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                    <Input
                      id="newPassword"
                      type="password"
                      placeholder="Enter new password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className="pl-10"
                      required
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="confirmPassword">Confirm Password</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                    <Input
                      id="confirmPassword"
                      type="password"
                      placeholder="Confirm new password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="pl-10"
                      required
                    />
                  </div>
                  {newPassword && confirmPassword && newPassword !== confirmPassword && (
                    <p className="text-xs text-red-500 mt-1">Passwords do not match</p>
                  )}
                </div>
                <Button
                  type="submit"
                  className="w-full bg-indigo-600 hover:bg-indigo-700"
                  disabled={loading || newPassword !== confirmPassword}
                >
                  {loading ? 'Resetting...' : 'Reset Password'}
                </Button>
              </form>
            )}

            {/* Progress Indicator */}
            <div className="mt-6 flex items-center justify-center gap-2">
              <div className={`w-2 h-2 rounded-full ${step >= 1 ? 'bg-indigo-600' : 'bg-gray-300'}`} />
              <div className={`w-2 h-2 rounded-full ${step >= 2 ? 'bg-indigo-600' : 'bg-gray-300'}`} />
              <div className={`w-2 h-2 rounded-full ${step >= 3 ? 'bg-indigo-600' : 'bg-gray-300'}`} />
            </div>
          </CardContent>
        </Card>

        {/* Back to Login */}
        <div className="mt-6 text-center">
          <Button
            variant="link"
            onClick={() => navigate('/login')}
            className="text-indigo-600 hover:text-indigo-700"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Login
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ForgotPasswordPage;
