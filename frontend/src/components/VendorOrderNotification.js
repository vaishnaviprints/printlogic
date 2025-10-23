import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Bell, CheckCircle, XCircle, Clock, Package } from 'lucide-react';

/**
 * Vendor Order Notification Popup
 * Displays a small on-screen notification (3:4 aspect ratio) when a new order is received
 * Features:
 * - Accept/Decline buttons
 * - Decline confirmation dialog
 * - Auto-dismiss after 60 seconds
 * - Sound notification
 * - System notification permission
 */

const VendorOrderNotification = ({ order, onAccept, onDecline, onDismiss }) => {
  const [showDeclineConfirm, setShowDeclineConfirm] = useState(false);
  const [remainingTime, setRemainingTime] = useState(60);

  useEffect(() => {
    if (!order) return;

    // Play notification sound
    playNotificationSound();

    // Request browser notification permission
    if (Notification.permission === 'default') {
      Notification.requestPermission();
    }

    // Show browser notification
    if (Notification.permission === 'granted') {
      new Notification('🔔 New Order Received!', {
        body: `Order #${order.id}\nAmount: ₹${order.total_amount}\nClick to view details`,
        icon: '/logo.png',
        tag: 'vendor-order',
        requireInteraction: true
      });
    }

    // Auto-dismiss after 60 seconds
    const timer = setInterval(() => {
      setRemainingTime((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          if (onDismiss) onDismiss();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [order, onDismiss]);

  const playNotificationSound = () => {
    // Create a more prominent sound
    const audioContext = new (window.AudioContext || window.webkitAudioContext)();
    
    // First beep
    const oscillator1 = audioContext.createOscillator();
    const gainNode1 = audioContext.createGain();
    oscillator1.connect(gainNode1);
    gainNode1.connect(audioContext.destination);
    oscillator1.frequency.value = 880;
    oscillator1.type = 'sine';
    gainNode1.gain.setValueAtTime(0.3, audioContext.currentTime);
    gainNode1.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);
    oscillator1.start(audioContext.currentTime);
    oscillator1.stop(audioContext.currentTime + 0.3);

    // Second beep
    const oscillator2 = audioContext.createOscillator();
    const gainNode2 = audioContext.createGain();
    oscillator2.connect(gainNode2);
    gainNode2.connect(audioContext.destination);
    oscillator2.frequency.value = 1100;
    oscillator2.type = 'sine';
    gainNode2.gain.setValueAtTime(0.3, audioContext.currentTime + 0.4);
    gainNode2.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.7);
    oscillator2.start(audioContext.currentTime + 0.4);
    oscillator2.stop(audioContext.currentTime + 0.7);
  };

  const handleAccept = () => {
    if (onAccept) onAccept(order.id);
  };

  const handleDeclineClick = () => {
    setShowDeclineConfirm(true);
  };

  const handleDeclineConfirm = () => {
    setShowDeclineConfirm(false);
    if (onDecline) onDecline(order.id);
  };

  if (!order) return null;

  return (
    <>
      {/* On-screen popup notification - 3:4 aspect ratio (300px x 400px) */}
      <div 
        className="fixed bottom-6 right-6 z-50 animate-bounce-in shadow-2xl"
        style={{
          width: '300px',
          animation: 'slideInRight 0.5s ease-out'
        }}
      >
        <Card className="border-4 border-orange-500 bg-gradient-to-br from-orange-50 to-yellow-50">
          <CardContent className="p-4">
            {/* Header with bell icon */}
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="w-10 h-10 rounded-full bg-orange-500 flex items-center justify-center animate-pulse">
                  <Bell className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="font-bold text-lg text-orange-900">New Order!</h3>
                  <p className="text-xs text-orange-700">Order Received</p>
                </div>
              </div>
              <Badge variant="destructive" className="animate-pulse">
                {remainingTime}s
              </Badge>
            </div>

            {/* Order details */}
            <div className="bg-white rounded-lg p-3 mb-3 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Order ID:</span>
                <span className="font-semibold text-gray-900">#{order.id?.substring(0, 8)}</span>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Amount:</span>
                <span className="font-bold text-green-600 text-lg">₹{order.total_amount}</span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Items:</span>
                <span className="font-semibold text-gray-900">
                  {order.files?.length || 1} file(s)
                </span>
              </div>

              {order.delivery_type && (
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Delivery:</span>
                  <Badge variant="outline">{order.delivery_type}</Badge>
                </div>
              )}
            </div>

            {/* Action buttons */}
            <div className="flex gap-2">
              <Button 
                onClick={handleAccept}
                className="flex-1 bg-green-600 hover:bg-green-700 text-white font-bold"
                size="lg"
              >
                <CheckCircle className="w-5 h-5 mr-2" />
                Accept
              </Button>
              <Button 
                onClick={handleDeclineClick}
                variant="destructive"
                className="flex-1 font-bold"
                size="lg"
              >
                <XCircle className="w-5 h-5 mr-2" />
                Decline
              </Button>
            </div>

            {/* Auto-dismiss note */}
            <p className="text-xs text-center text-gray-500 mt-2">
              Auto-dismiss in {remainingTime} seconds
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Decline Confirmation Dialog */}
      <AlertDialog open={showDeclineConfirm} onOpenChange={setShowDeclineConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-red-600">
              <XCircle className="w-6 h-6" />
              Decline Order Confirmation
            </AlertDialogTitle>
            <AlertDialogDescription className="text-base">
              Are you sure you want to decline this order?
              <div className="mt-3 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                <p className="font-semibold text-gray-900">Order Details:</p>
                <p className="text-sm text-gray-700">Order ID: #{order.id?.substring(0, 8)}</p>
                <p className="text-sm text-gray-700">Amount: ₹{order.total_amount}</p>
              </div>
              <p className="mt-3 text-red-600 font-semibold">
                ⚠️ This action cannot be undone. The order will be reassigned to another vendor.
              </p>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="font-semibold">
              No, Keep Order
            </AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDeclineConfirm}
              className="bg-red-600 hover:bg-red-700 font-semibold"
            >
              Yes, Decline Order
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <style jsx>{`
        @keyframes slideInRight {
          from {
            transform: translateX(400px);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }

        @keyframes bounce-in {
          0% {
            transform: scale(0.8);
            opacity: 0;
          }
          50% {
            transform: scale(1.05);
          }
          100% {
            transform: scale(1);
            opacity: 1;
          }
        }
      `}</style>
    </>
  );
};

export default VendorOrderNotification;
