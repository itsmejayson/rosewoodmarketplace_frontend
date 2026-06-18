import { useEffect } from 'react';
import { io } from 'socket.io-client';
import useAuthStore from '../store/authStore';
import useNotificationStore from '../store/notificationStore';
import { toast } from '../components/ui/toast';

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000';

// Module-level singleton — prevents duplicate connections when hook is called from multiple components
let socket = null;
let isInitialized = false;

export const useSocket = () => {
  const { user } = useAuthStore();
  const addNotification = useNotificationStore((s) => s.addNotification);

  useEffect(() => {
    if (!user || isInitialized) return;
    isInitialized = true;

    socket = io(SOCKET_URL, { withCredentials: true, transports: ['websocket', 'polling'] });

    socket.on('connect', () => {
      socket.emit('join', user.id);
      socket.emit('registerPresence', {
        id: user.id,
        fullName: user.fullName,
        email: user.email,
        role: user.role,
      });
      if (user.role === 'SELLER') socket.emit('joinSeller', user.id);
      if (user.role === 'ADMIN') socket.emit('joinAdmin');
    });

    socket.on('notification', (notification) => {
      addNotification(notification);
    });

    // Seller: new order placed
    socket.on('newOrder', ({ orderNumber }) => {
      addNotification({
        id: Date.now().toString(),
        type: 'ORDER_PLACED',
        title: 'New Order',
        message: `New order #${orderNumber} received!`,
        isRead: false,
        createdAt: new Date().toISOString(),
      });
      toast({ title: '🛒 New order received!', description: `Order #${orderNumber}` });
    });

    // Seller: buyer submitted GCash receipt
    socket.on('receiptSubmitted', ({ orderNumber }) => {
      addNotification({
        id: Date.now().toString(),
        type: 'PAYMENT_VERIFICATION',
        title: 'Receipt Submitted',
        message: `Buyer submitted GCash receipt for #${orderNumber}`,
        isRead: false,
        createdAt: new Date().toISOString(),
      });
      toast({ title: '📱 GCash receipt submitted', description: `Order #${orderNumber} — please verify` });
    });

    // Buyer: payment approved
    socket.on('paymentApproved', ({ orderNumber }) => {
      toast({ title: '✅ Payment Confirmed!', description: `Order #${orderNumber} is now paid.` });
    });

    // Buyer: payment rejected
    socket.on('paymentRejected', ({ reason }) => {
      toast({ title: '❌ Payment Rejected', description: reason || 'Please re-upload your receipt.', variant: 'destructive' });
    });

    return () => {
      socket?.disconnect();
      socket = null;
      isInitialized = false;
    };
  }, [user?.id]);

  return socket;
};

export const getSocket = () => socket;
