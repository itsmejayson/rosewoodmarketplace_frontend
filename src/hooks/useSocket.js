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

    // Single source of truth for store updates — specific events only show toasts
    socket.on('notification', (notification) => {
      addNotification(notification);
      toast({ title: notification.title, description: notification.message });
    });

    // Seller: new order placed — toast only (notification event handles store)
    socket.on('newOrder', ({ orderNumber }) => {
      toast({ title: '🛒 New order received!', description: `Order #${orderNumber}` });
    });

    // Seller: buyer submitted GCash receipt — toast only
    socket.on('receiptSubmitted', ({ orderNumber }) => {
      toast({ title: '📱 GCash receipt submitted', description: `Order #${orderNumber} — please verify` });
    });

    // Buyer: payment approved — toast only
    socket.on('paymentApproved', ({ orderNumber }) => {
      toast({ title: '✅ Payment Confirmed!', description: `Order #${orderNumber} is now paid.` });
    });

    // Buyer: payment rejected — toast only
    socket.on('paymentRejected', ({ reason }) => {
      toast({ title: '❌ Payment Rejected', description: reason || 'Please re-upload your receipt.', variant: 'destructive' });
    });

    // Buyer: pickup order is ready — toast only
    socket.on('readyForPickup', ({ orderNumber }) => {
      toast({ title: '🛍️ Ready for Pickup!', description: `Order #${orderNumber} — please come to the store.` });
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
